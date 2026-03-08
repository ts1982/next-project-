## Tech Stack
- pnpm workspaces + Turborepo
- Next.js 16 / React 19 / TypeScript
- Prisma (`packages/database`) + PostgreSQL
- Tailwind CSS + shadcn/ui

## Monorepo Layout
- `apps/admin`: 管理画面（3000）
- `apps/user`: ユーザー向け画面 + custom server（3001 / WS 同一ポート）
- `packages/database`: Prisma schema / seed / client

## Commands
- `pnpm lint` - lint 実行
- `pnpm build` - build 実行
- `pnpm dev --filter=@repo/admin` - admin 起動
- `pnpm dev --filter=@repo/user` - user 起動
- `pnpm db:generate` - Prisma Client 生成
- `pnpm db:migrate` - migration 作成/適用（開発）
- `pnpm db:seed` - seed 実行

## Working Rules
- 最小差分で変更し、影響範囲外のリファクタを避ける。
- 新規 `any` 導入は避け、型安全を維持する。
- UI は既存コンポーネント（`components/ui`）を優先再利用する。
- DB 操作は Prisma Client 経由で実装する（直接 SQL を追加しない）。
- API では入力バリデーションと認可を先に確認する。

## Boundaries
- ✅ Always:
  - 指定範囲のみを編集
  - ワークスペース単位で lint/build を確認
  - Prisma 変更時に破壊的変更の有無を明示
- ⚠️ Ask first:
  - 依存関係追加
  - DB スキーマの破壊的変更（削除/型変更/必須化）
  - `docker-compose.yml` や root 設定の大幅変更
- 🚫 Never:
  - シークレットのハードコード/コミット
  - 本番想定の危険操作（reset 前提の操作）
  - 無関係ファイルの整形だけの変更
