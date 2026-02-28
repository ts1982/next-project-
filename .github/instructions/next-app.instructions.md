---
applyTo: "apps/*/src/**/*.{ts,tsx}"
---

# Next.js / React 実装指針

- App Router の慣習（`app/` 配下の route, layout, page）を維持する。
- Server Component / Client Component の境界を崩さない。
- 既存の UI は `components/ui` と共通コンポーネントを再利用する。
- 新規 UI 追加時も Tailwind の既存トークンとユーティリティを使う。

# API / 認証

- Route Handler では先に入力検証と認可を行う。
- 例外時は既存のレスポンス形式に合わせる。
- `apps/user/server.ts` の内部 API は `INTERNAL_API_SECRET` 前提を崩さない。

# パフォーマンスと安全性

- 不要なクライアント化（`use client` 追加）を避ける。
- 非同期処理は `await` 漏れ・二重実行に注意する。
