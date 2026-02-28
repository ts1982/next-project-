---
name: prisma-migration
description: Prisma スキーマ変更時の安全な差分設計と実行手順を支援
---

# Prisma Migration Skill

## 使いどころ

- `packages/database/prisma/schema.prisma` を変更する時。
- 既存データへの影響評価が必要な時。

## 実行手順

1. 変更意図と影響（追加/変更/削除）を整理する。
2. 破壊的変更の有無を明示する。
3. 以下を順に実行する。
   - `npm run db:generate`
   - `npm run db:migrate`
   - 必要に応じて `npm run db:seed`
4. `apps/admin` / `apps/user` の影響箇所を確認する。

## 出力フォーマット

- 変更サマリ
- 互換性（後方互換/破壊的）
- 実行コマンド
- ロールバック方針（必要な場合）
