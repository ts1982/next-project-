# プロジェクト概要

- このリポジトリは npm workspaces + Turborepo 構成です。
- フロントエンド/管理画面は Next.js 16 + React 19 + TypeScript。
- DB は `packages/database` の Prisma を単一ソースとして使用します。

# 主要ディレクトリ

- `apps/admin`: 管理画面（ポート 3000）
- `apps/user`: ユーザー向け画面 + カスタムサーバー（ポート 3001 / WS 3002）
- `packages/database`: Prisma schema / seed / client

# 基本方針

- 既存の設計（App Router、feature-based 構成、shadcn/ui）を尊重し、最小差分で変更する。
- 影響範囲外のリファクタや命名変更は行わない。
- 型安全を最優先し、`any` の新規導入は避ける。

# 実装ルール

- UI は既存の `components/ui` と Tailwind ユーティリティを再利用する。
- DB アクセスは Prisma Client 経由で実装し、直接 SQL は追加しない。
- バリデーションは既存の Zod パターンに合わせる。
- API 実装時は権限/認可と入力バリデーションを先に確認する。

# 変更時の確認

- 変更したワークスペース単位で lint/build を優先して確認する。
- 代表コマンド:
  - `npm run lint`
  - `npm run build`
  - `npm run dev --workspace=@repo/admin`
  - `npm run dev --workspace=@repo/user`

# Prisma 運用

- Prisma schema の変更は `packages/database/prisma/schema.prisma` を編集する。
- 生成・マイグレーションは `packages/database` 前提で扱う。
- 破壊的変更（カラム削除、型変更、reset 前提）は必ず明示する。

# 禁止事項

- シークレットや `.env` の値をハードコードしない。
- 本番を想定した危険操作（DB リセット等）を自動実行しない。
- 無関係ファイルの整形だけの変更を混ぜない。
