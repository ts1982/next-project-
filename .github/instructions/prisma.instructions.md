---
applyTo: "packages/database/prisma/schema.prisma"
---

# Prisma Schema ルール

- スキーマは `packages/database/prisma/schema.prisma` を正として編集する。
- モデル名・enum 名・relation は既存命名規約に合わせる。
- `@@map` / `@map` を崩さず、既存テーブル対応を維持する。

# マイグレーション運用

- 破壊的変更（削除・型変更・必須化）は影響範囲を明記する。
- 実装案には以下コマンドの実行順を含める。
  1. `npm run db:generate`
  2. `npm run db:migrate`
  3. 必要に応じて `npm run db:seed`

# 禁止事項

- 直接 SQL を追加して Prisma 管理外の差分を増やさない。
- 本番環境を想定した `migrate reset` を自動実行しない。
