---
description: このモノレポ向けの実装PRレビュー（型安全・影響範囲・運用）
agent: ask
---

次の PR 差分をレビューしてください。

PR/差分: ${input:diff:PR URL または差分概要}

レビュー基準:

- 依頼範囲外の変更が混ざっていないか
- `apps/admin` / `apps/user` / `packages/database` の境界を守っているか
- 型安全（`any` 追加、unsafe cast）がないか
- バリデーション・認可の欠落がないか
- Prisma 変更時に migration 運用の説明があるか

出力フォーマット:

1. Blocking issues
2. Non-blocking suggestions
3. 影響範囲の整理
4. マージ前チェックリスト
