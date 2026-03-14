#!/bin/bash
# =============================================================================
# scripts/rds-port-forward.sh
#
# 一時 EC2 bastion を起動して本番 RDS へ SSM port-forward するスクリプト。
#
# 仕組み:
#   ローカル:LOCAL_PORT ──SSM Tunnel──▶ EC2 bastion ──▶ RDS:5432
#   (Ctrl+C で EC2 を自動終了)
#
# 前提条件:
#   1. AWS CLI v2 インストール済み
#   2. Session Manager Plugin インストール済み
#      macOS: brew install --cask session-manager-plugin
#
# 使い方:
#   ./scripts/rds-port-forward.sh
#
# 環境変数でカスタマイズ可能:
#   LOCAL_PORT=15432  (デフォルト)
#   REGION=ap-northeast-1  (デフォルト)
# =============================================================================

set -euo pipefail

PROJECT="${PROJECT:-next-project}"
REGION="${REGION:-ap-northeast-1}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
RDS_PORT="5432"
BASTION_ROLE_NAME="${PROJECT}-ssm-bastion-role"
BASTION_PROFILE_NAME="${PROJECT}-ssm-bastion-profile"
INSTANCE_ID=""

# ─── ヘルパー ────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] $*"; }
err() { echo "[ERROR] $*" >&2; exit 1; }

# ─── 終了時クリーンアップ（Ctrl+C でも必ず実行）────────────────────────────
cleanup() {
  echo ""
  log "クリーンアップ中..."
  if [ -n "${INSTANCE_ID}" ]; then
    log "EC2 インスタンスを終了: ${INSTANCE_ID}"
    aws ec2 terminate-instances --instance-ids "${INSTANCE_ID}" --region "${REGION}" > /dev/null 2>&1 || true
    log "✅ EC2 終了リクエスト送信済み"
  fi
}
trap cleanup EXIT

# ─── 依存チェック ────────────────────────────────────────────────────────────
command -v aws               > /dev/null 2>&1 || err "aws CLI が見つかりません"
command -v session-manager-plugin > /dev/null 2>&1 || {
  echo ""
  echo "⚠️  Session Manager Plugin が未インストールです"
  echo "   macOS: brew install --cask session-manager-plugin"
  exit 1
}

log "プロジェクト: ${PROJECT} / リージョン: ${REGION} / ローカルポート: ${LOCAL_PORT}"

# ─── CloudFormation から情報取得 ─────────────────────────────────────────────
log "インフラ情報を取得中..."
STACK_OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "${PROJECT}-base" \
  --region "${REGION}" \
  --query 'Stacks[0].Outputs' \
  --output json 2>/dev/null) || err "スタック '${PROJECT}-base' が見つかりません。make infra-start で起動してください。"

get_output() {
  echo "${STACK_OUTPUTS}" | python3 -c "
import sys, json
key = '$1'
outputs = json.load(sys.stdin)
val = next((o['OutputValue'] for o in outputs if o['OutputKey'] == key), '')
print(val)
"
}

RDS_ENDPOINT=$(get_output "RDSEndpoint")
PUBLIC_SUBNET=$(get_output "PublicSubnetId")
FARGATE_SG=$(get_output "FargateSecurityGroupId")

[ -z "${RDS_ENDPOINT}" ]  && err "RDSEndpoint を取得できませんでした"
[ -z "${PUBLIC_SUBNET}" ] && err "PublicSubnetId を取得できませんでした"
[ -z "${FARGATE_SG}" ]    && err "FargateSecurityGroupId を取得できませんでした"
log "RDS: ${RDS_ENDPOINT} / Subnet: ${PUBLIC_SUBNET} / SG: ${FARGATE_SG}"

# ─── SSM Bastion 用 IAM ロール（なければ作成）───────────────────────────────
log "IAM ロールを確認中..."
if ! aws iam get-role --role-name "${BASTION_ROLE_NAME}" --region "${REGION}" > /dev/null 2>&1; then
  log "IAM ロール '${BASTION_ROLE_NAME}' を作成中..."
  aws iam create-role \
    --role-name "${BASTION_ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "ec2.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }]
    }' \
    --region "${REGION}" > /dev/null
  aws iam attach-role-policy \
    --role-name "${BASTION_ROLE_NAME}" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" \
    --region "${REGION}"
  log "✅ IAM ロール作成済み"
fi

if ! aws iam get-instance-profile --instance-profile-name "${BASTION_PROFILE_NAME}" --region "${REGION}" > /dev/null 2>&1; then
  log "インスタンスプロファイル '${BASTION_PROFILE_NAME}' を作成中..."
  aws iam create-instance-profile \
    --instance-profile-name "${BASTION_PROFILE_NAME}" \
    --region "${REGION}" > /dev/null
  aws iam add-role-to-instance-profile \
    --instance-profile-name "${BASTION_PROFILE_NAME}" \
    --role-name "${BASTION_ROLE_NAME}" \
    --region "${REGION}"
  log "✅ インスタンスプロファイル作成済み"
  log "⏳ プロファイルの伝播を待機 (10秒)..."
  sleep 10
fi

# ─── 最新の Amazon Linux 2 AMI を取得 ───────────────────────────────────────
log "最新の Amazon Linux 2 AMI を取得中..."
AMI_ID=$(aws ssm get-parameter \
  --name "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2" \
  --region "${REGION}" \
  --query "Parameter.Value" \
  --output text)
log "AMI: ${AMI_ID}"

# ─── EC2 bastion を起動 ──────────────────────────────────────────────────────
log "EC2 bastion を起動中 (t3.micro, Amazon Linux 2)..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "${AMI_ID}" \
  --instance-type "t3.micro" \
  --subnet-id "${PUBLIC_SUBNET}" \
  --security-group-ids "${FARGATE_SG}" \
  --associate-public-ip-address \
  --iam-instance-profile Name="${BASTION_PROFILE_NAME}" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT}-ssm-bastion},{Key=Project,Value=${PROJECT}},{Key=Temporary,Value=true}]" \
  --region "${REGION}" \
  --query "Instances[0].InstanceId" \
  --output text)
log "インスタンス ID: ${INSTANCE_ID}"

# ─── EC2 が起動するまで待機 ──────────────────────────────────────────────────
log "⏳ EC2 の起動を待機中..."
aws ec2 wait instance-running \
  --instance-ids "${INSTANCE_ID}" \
  --region "${REGION}"
log "✅ EC2 起動完了"

# ─── SSM エージェントが接続するまで待機 ──────────────────────────────────────
log "⏳ SSM エージェントの接続を待機中 (最大 3 分)..."
WAIT_SEC=0
while [ ${WAIT_SEC} -lt 180 ]; do
  STATUS=$(aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
    --region "${REGION}" \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || echo "NotFound")
  if [ "${STATUS}" = "Online" ]; then
    log "✅ SSM エージェント接続済み"
    break
  fi
  sleep 10
  WAIT_SEC=$((WAIT_SEC + 10))
  log "  SSM 状態: ${STATUS} (${WAIT_SEC}s 経過)"
done
[ "${STATUS}" != "Online" ] && err "SSM エージェントが ${WAIT_SEC} 秒以内に接続しませんでした"

# ─── SSM ポートフォワード開始 ────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  SSM ポートフォワード開始                                         ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
printf "║  ローカルポート : localhost:%-37s║\n" "${LOCAL_PORT}"
printf "║  転送先        : %-44s║\n" "${RDS_ENDPOINT}:${RDS_PORT}"
printf "║  EC2 bastion   : %-44s║\n" "${INSTANCE_ID}"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  別ターミナルで接続:                                               ║"
echo "║                                                                  ║"
printf "║  DATABASE_URL=\"postgresql://nextuser:<pw>@localhost:%s/nextdb\"\n" "${LOCAL_PORT}"
echo "║  cd packages/database                                            ║"
echo "║  npx tsx prisma/seed-notifications-tom.ts                        ║"
echo "║                                                                  ║"
echo "║  ※ psql で接続する場合:                                           ║"
printf "║  psql -h localhost -p %s -U nextuser -d nextdb           ║\n" "${LOCAL_PORT}"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Ctrl+C で終了 → EC2 が自動削除されます                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

aws ssm start-session \
  --region "${REGION}" \
  --target "${INSTANCE_ID}" \
  --document-name "AWS-StartPortForwardingSessionToRemoteHost" \
  --parameters "{\"host\":[\"${RDS_ENDPOINT}\"],\"portNumber\":[\"${RDS_PORT}\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
