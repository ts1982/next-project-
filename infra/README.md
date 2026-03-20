# AWS デプロイ手順書

## アーキテクチャ概要

```
Route53 (admin.studify.click / app.studify.click)
           ↓
     ALB (HTTPS :443) ← ACM ワイルドカード証明書
       ↙        ↘
 admin TG(:3000)  user TG(:3001) ← WS(/ws)も同一ポート同居
       ↓               ↓
 ECS Fargate       ECS Fargate
  (admin)           (user)
       ↘               ↙
    RDS PostgreSQL (Private Subnet)

  EventBridge(5min) → ECS RunTask (cron)
  Lambda(start)  → [RDS起動 → Edge Stack作成 → 5h後停止スケジュール登録]
  Lambda(stop)   → [スケジュール削除 → Edge Stack削除 → RDS停止]
```

## スタック構成

| スタック            | ファイル                   | 常設/一時      | 内容                                                       |
| ------------------- | -------------------------- | -------------- | ---------------------------------------------------------- |
| `next-project-base` | `base-stack.yaml`          | 常設           | VPC/Subnet/SG/ECR/ECS Cluster/RDS/IAM/ACM/Task Definition  |
| `next-project-edge` | `edge-stack.yaml`          | **起動時のみ** | ALB/TG/Listener/ECS Service/Route53 Alias/cron EventBridge |
| `next-project-ctrl` | `control-plane-stack.yaml` | 常設           | Lambda(start/stop)/Scheduler IAM Role                      |

## 初回セットアップ手順

### 前提条件

- AWS CLI 設定済み (`aws configure`)
- Docker インストール済み
- Route53 Hosted Zone 作成済み（既存ドメイン）

### Step 1: S3 バケット作成（テンプレート+Lambda zip 置き場）

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=ap-northeast-1
BUCKET="next-project-lambda-deploy"

aws s3 mb s3://${BUCKET} --region ${AWS_REGION}
```

### Step 2: Lambda コードを zip 化して S3 にアップロード

```bash
cd infra/lambda
zip start.zip start.py && zip stop.zip stop.py
aws s3 cp start.zip s3://${BUCKET}/lambda/start.zip
aws s3 cp stop.zip  s3://${BUCKET}/lambda/stop.zip

# Edge Stack テンプレートも S3 に配置
cd ..
aws s3 cp edge-stack.yaml s3://${BUCKET}/edge-stack.yaml
```

### Step 3: Route53 Hosted Zone ID 確認

```bash
aws route53 list-hosted-zones --query 'HostedZones[*].[Name,Id]' --output table
# /hostedzone/XXXXXX の XXXXXX 部分をメモ
```

### Step 4: Base Stack デプロイ

```bash
aws cloudformation deploy \
  --template-file infra/base-stack.yaml \
  --stack-name next-project-base \
  --region ap-northeast-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=next-project \
    DomainName=studify.click \
    HostedZoneId=ZXXXXXXXXXXXXX \
    DBMasterUsername=nextuser \
    DBMasterPassword=YourSecurePassword123
```

> **注意**: ACM 証明書の DNS 検証が完了するまで 5〜10 分かかります。  
> `aws acm describe-certificate --certificate-arn <ARN>` で `ISSUED` になるまで待機。

### Step 5: SSM Parameter Store に機密情報を登録

```bash
PROJECT=next-project
REGION=ap-northeast-1
RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name next-project-base \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSEndpoint`].OutputValue' \
  --output text)

# DB接続URL
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/DATABASE_URL" \
  --value "postgresql://nextuser:YourSecurePassword123@${RDS_ENDPOINT}:5432/nextdb"

# admin 認証
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/ADMIN_AUTH_SECRET" --value "$(openssl rand -base64 32)"

aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/ADMIN_AUTH_URL" --value "https://admin.studify.click"

# user 認証
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/USER_AUTH_SECRET" --value "$(openssl rand -base64 32)"

aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/NEXTAUTH_URL" --value "https://app.studify.click"

# 内部通信
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/INTERNAL_API_SECRET" --value "$(openssl rand -hex 16)"

aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/CRON_SECRET" --value "$(openssl rand -hex 16)"

aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/USER_APP_URL" --value "https://app.studify.click"

aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/ADMIN_URL" --value "https://admin.studify.click"

# VAPID (Web Push) — 先に생成
npx tsx apps/user/scripts/generate-vapid-keys.ts
# 出力されたキーを使用:
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/VAPID_PUBLIC_KEY"  --value "<PUBLIC_KEY>"
aws ssm put-parameter --region $REGION --type SecureString --overwrite \
  --name "/${PROJECT}/VAPID_PRIVATE_KEY" --value "<PRIVATE_KEY>"
```

### Step 6: Docker イメージをビルドして ECR にプッシュ

> **ℹ️** 本プロジェクトは統一 `Dockerfile`（マルチステージ）を使用し、`--build-arg APP_NAME` と `--target` でアプリを切り替えます。

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin ${ECR_BASE}

# admin
docker build --build-arg APP_NAME=admin --target runner-admin \
  -t ${ECR_BASE}/next-project/admin:latest .
docker push ${ECR_BASE}/next-project/admin:latest

# user
docker build --build-arg APP_NAME=user --target runner-user \
  -t ${ECR_BASE}/next-project/user:latest .
docker push ${ECR_BASE}/next-project/user:latest

# notification-lambda
docker build -f Dockerfile.notification-lambda \
  -t ${ECR_BASE}/next-project/notification-lambda:latest .
docker push ${ECR_BASE}/next-project/notification-lambda:latest
```

> **Makefile の便利コマンド**: `make deploy-admin` / `make deploy-user` / `make deploy-lambda` / `make deploy-all` でも同じ操作ができます。

### Step 7: Control Plane Stack デプロイ

```bash
# Start Lambda の ARN は Step 5 後に取得できる
aws cloudformation deploy \
  --template-file infra/control-plane-stack.yaml \
  --stack-name next-project-ctrl \
  --region ap-northeast-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=next-project \
    EdgeTemplateS3URL="https://s3.${REGION}.amazonaws.com/${BUCKET}/edge-stack.yaml" \
    AutoStopHours=5
```

### Step 8: 初回起動（DB マイグレーション含む）

**① start Lambda を呼び出して RDS 起動 + Edge Stack 作成を開始する**

```bash
# AWS CLI v2 対応: --cli-binary-format raw-in-base64-out が必要
aws lambda invoke \
  --function-name next-project-start \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  --region ap-northeast-1 \
  /tmp/start-output.json

# 実行結果を確認（{"status":"ok"} が返れば成功）
cat /tmp/start-output.json
```

**② Edge Stack の作成状態を監視する（約 10〜15 分かかる）**

```bash
# 作成中は CREATE_IN_PROGRESS、完了すると CREATE_COMPLETE になる
watch -n 30 "aws cloudformation describe-stacks \
  --stack-name next-project-edge \
  --region ap-northeast-1 \
  --query 'Stacks[0].StackStatus' \
  --output text 2>&1"
```

`CREATE_COMPLETE` が表示されたら Ctrl+C で抜ける。

**③ Prisma マイグレーションを実行する**

```bash
PUBLIC_SUBNET=$(aws cloudformation describe-stacks \
  --stack-name next-project-base \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnetId`].OutputValue' \
  --output text)
FARGATE_SG=$(aws cloudformation describe-stacks \
  --stack-name next-project-base \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`FargateSecurityGroupId`].OutputValue' \
  --output text)

aws ecs run-task \
  --cluster next-project-cluster \
  --task-definition next-project-admin \
  --launch-type FARGATE \
  --region ap-northeast-1 \
  --network-configuration "awsvpcConfiguration={subnets=[${PUBLIC_SUBNET}],securityGroups=[${FARGATE_SG}],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "admin",
      "command": ["npx", "prisma", "migrate", "deploy", "--schema=/app/packages/database/prisma/schema.prisma"]
    }]
  }'
```

### Step 9: 動作確認

```bash
# ヘルスチェック（HTTP 200 が返れば OK）
curl -s -o /dev/null -w "admin: %{http_code}\n" https://admin.studify.click/api/health
curl -s -o /dev/null -w "user:  %{http_code}\n" https://app.studify.click/api/health

# ログイン確認（session エンドポイントが 200 を返せば Auth.js 正常動作中）
curl -s https://app.studify.click/api/auth/session

# WebSocket (要 wscat: npm i -g wscat)
wscat -c wss://app.studify.click/ws
```

---

## 起動・停止方法

> **仕組みの概要**
>
> - **start Lambda**: RDS を起動（またはスナップショットから復元）→ SSM `DATABASE_URL` を新エンドポイントで更新 → Edge Stack（ALB + ECS Service）を作成 → 5 時間後に自動停止をスケジュール
> - **stop Lambda**: auto-stop スケジュールを削除 → Edge Stack を削除（ALB を消してコスト削減）→ RDS を**スナップショット保存後に完全削除**（7 日後自動起動を回避）
> - Edge Stack 作成に約 5〜10 分、RDS 起動/復元に約 5〜10 分かかる（合計 10〜20 分）

### 日常運用フロー（Quick Reference）

```
╒═══════════════════════════════════════════════════════════════════╕
│  日常の起動・利用・停止フロー                           │
│                                                                   │
│  1. make infra-start     ← RDS + Edge Stack 起動 (10〜20分)       │
│  2. make infra-status    ← RDS: available, Edge: CREATE_COMPLETE  │
│  3. ブラウザで admin/user を利用                                │
│  4. make infra-stop      ← 手動停止（または 5h 後に自動停止）       │
│                                                                   │
│  ※ コード変更時: git push → GitHub Actions が自動デプロイ       │
│  ※ ローカルからの push: make deploy-admin / make deploy-user     │
└───────────────────────────────────────────────────────────────────┘
```

> **重要**: `make infra-start` は「インフラ起動」のみを行います。Docker イメージのビルド・ push は含まれません。  
> イメージが ECR に push 済みであれば、`make infra-start` だけで起動からアクセス可能まで完結します。  
> 初回またはコード変更後は、先に `make deploy-all`（または `git push` で GitHub Actions）を実行してください。

### 手動起動

**① start Lambda を呼び出す**

```bash
aws lambda invoke \
  --function-name next-project-start \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  --region ap-northeast-1 \
  /tmp/start-output.json

# 実行結果を確認（{"status":"ok"} が返れば受付成功）
cat /tmp/start-output.json
```

**② Edge Stack の作成完了を待つ（約 5〜15 分）**

```bash
# ステータスが CREATE_COMPLETE になるまで繰り返し確認する
aws cloudformation describe-stacks \
  --stack-name next-project-edge \
  --region ap-northeast-1 \
  --query 'Stacks[0].StackStatus' \
  --output text
```

以下のステータス遷移が正常フローです:

1. `CREATE_IN_PROGRESS` → 作成中
2. `CREATE_COMPLETE` → 完了（ECS サービス + ALB が利用可能）

**③ サービスの起動確認**

```bash
# HTTP 200 が返れば起動完了
curl -s -o /dev/null -w "admin: %{http_code}\n" https://admin.studify.click/api/health
curl -s -o /dev/null -w "user:  %{http_code}\n" https://app.studify.click/api/health
```

起動から **5時間後** に自動停止します。延長する場合は stop → start を再実行。

---

### 手動停止（5時間前に止める場合）

**① stop Lambda を呼び出す**

```bash
aws lambda invoke \
  --function-name next-project-stop \
  --payload '{"source":"manual"}' \
  --cli-binary-format raw-in-base64-out \
  --region ap-northeast-1 \
  /tmp/stop-output.json

# 実行結果を確認
cat /tmp/stop-output.json
```

**② Edge Stack の削除完了を確認（約 5〜10 分）**

```bash
aws cloudformation describe-stacks \
  --stack-name next-project-edge \
  --region ap-northeast-1 \
  --query 'Stacks[0].StackStatus' \
  --output text 2>&1
# DELETE_IN_PROGRESS → 削除中
# スタックが存在しなくなると "does not exist" エラーが出れば完了
```

stop Lambda によって以下が順番に実行されます:

1. auto-stop EventBridge スケジュールを削除
2. Edge Stack（ALB + ECS Service + Route53 Alias）を削除
3. RDS をスナップショット保存後に完全削除（7 日後自動起動を回避）

> **停止から起動まで**: start Lambda がスナップショットから RDS を復元し、SSM `DATABASE_URL` を新エンドポイントで自動更新するため、手動での SSM 更新は不要です。

---

### トラブルシューティング

**Lambda 実行でエラーが出る場合**

```bash
# Lambda の実行ログを直近 1 分分確認する
aws logs tail /aws/lambda/next-project-start --region ap-northeast-1 --since 1m
aws logs tail /aws/lambda/next-project-stop  --region ap-northeast-1 --since 1m
```

**ECS サービスが起動しない場合**

```bash
# ECS サービスの状態確認
aws ecs describe-services \
  --cluster next-project-cluster \
  --services next-project-admin-svc next-project-user-svc \
  --region ap-northeast-1 \
  --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' \
  --output table

# ECS タスクのエラーログ確認（直近 10 分）
aws logs tail /ecs/next-project/user  --region ap-northeast-1 --since 10m
aws logs tail /ecs/next-project/admin --region ap-northeast-1 --since 10m
```

**ログインできない場合（Auth.js エラー）**

```bash
# UntrustedHost エラーが出ていないか確認
aws logs filter-log-events \
  --log-group-name /ecs/next-project/user \
  --region ap-northeast-1 \
  --start-time $(date -v-10M +%s)000 \
  --filter-pattern "UntrustedHost" \
  --query 'events[*].message' \
  --output text

# session エンドポイントが正常応答するか確認（{"user":null} または {"user":{...}} が返れば正常）
curl -s https://app.studify.click/api/auth/session
```

`UntrustedHost` が出ている場合は ECS タスク定義に `AUTH_URL` が設定されているか確認:

```bash
aws ecs describe-task-definition \
  --task-definition next-project-user \
  --region ap-northeast-1 \
  --query 'taskDefinition.containerDefinitions[0].secrets[*].name' \
  --output table
# AUTH_URL が含まれていなければ base-stack をデプロイして force-new-deployment する
```

---

## GitHub Actions の設定

GitHub リポジトリの Secrets に以下を登録:

| Secret                  | 内容                                      |
| ----------------------- | ----------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | デプロイ用 IAM ユーザーのアクセスキー     |
| `AWS_SECRET_ACCESS_KEY` | デプロイ用 IAM ユーザーのシークレットキー |

→ main ブランチへの push で自動ビルド & ECR プッシュ & ECS ローリングデプロイが実行されます。

---

## コスト目安（東京リージョン, 週末 40h/月）

| リソース                      | 稼働   | 月額          |
| ----------------------------- | ------ | ------------- |
| Route53 Hosted Zone           | 常時   | $0.50         |
| ACM                           | 常時   | $0.00         |
| ALB (稼働時のみ)              | 40h    | ~$0.97        |
| Fargate admin 0.25vCPU/0.5GB  | 40h    | ~$0.62        |
| Fargate user 0.25vCPU/0.5GB   | 40h    | ~$0.62        |
| Fargate cron RunTask          | ~8h    | ~$0.12        |
| RDS db.t4g.micro (稼働時のみ) | 40h    | ~$0.64        |
| RDS ストレージ 20GB           | 常時   | ~$2.43        |
| ECR 2GB                       | 常時   | ~$0.20        |
| CloudWatch Logs               | 稼働時 | ~$0.23        |
| Lambda                        | 微量   | $0.00         |
| **合計**                      |        | **~$6.33/月** |

> ALB が停止時削除されるため、常時稼働 ($23/月) と比較して大幅に削減。
