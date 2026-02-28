---
description: 認証・認可・入力検証・シークレット管理の観点でセキュリティ確認
agent: ask
---

次の対象を、このリポジトリ向けにセキュリティレビューしてください。

対象: ${input:target:例) apps/user/server.ts}

必須観点:

- 認証/認可（`next-auth`、内部 API の `INTERNAL_API_SECRET`）
- 入力検証（Zod / 受信 payload の検証）
- エラーレスポンス（情報漏えいの有無）
- シークレット/環境変数の扱い
- Prisma 経由のデータアクセス安全性

出力フォーマット:

1. リスク一覧（重大度: high / medium / low）
2. 再現条件
3. 最小差分の修正案
4. 追加で必要なテスト観点
