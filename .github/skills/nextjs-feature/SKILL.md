---
name: nextjs-feature
description: apps/admin・apps/user に新機能を最小差分で追加する
---

# Next.js Feature Skill

## 使いどころ

- `apps/admin/src` または `apps/user/src` に機能追加する時。

## 実装ガイド

1. 変更対象を feature 単位で限定する。
2. UI は既存の `components/ui` と共通部品を再利用する。
3. バリデーションは既存の Zod パターンに合わせる。
4. API 追加時は認可と入力検証を先に実装する。
5. DB 参照は Prisma Client 経由で行う。

## 完了チェック

- `npm run lint`
- `npm run build`
- 必要に応じて対象ワークスペースの `dev` で画面/挙動確認
