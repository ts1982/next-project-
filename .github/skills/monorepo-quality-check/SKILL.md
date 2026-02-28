---
name: monorepo-quality-check
description: Turborepo 構成で変更範囲に応じた検証を整理する
---

# Monorepo Quality Check Skill

## 使いどころ

- 変更後に、どこまで検証すべきかを短時間で決めたい時。

## 判定ルール

- `apps/admin` のみ変更: admin 中心に確認。
- `apps/user` のみ変更: user + ws 周辺を確認。
- `packages/database` 変更: 両アプリ影響を確認。
- 共有設定（root 設定）変更: 全体の lint/build を優先。

## 推奨コマンド

- `npm run lint`
- `npm run build`
- 必要に応じて
  - `npm run dev --workspace=@repo/admin`
  - `npm run dev --workspace=@repo/user`

## 出力フォーマット

- 変更範囲
- 必須検証
- 任意検証
- 未実施リスク
