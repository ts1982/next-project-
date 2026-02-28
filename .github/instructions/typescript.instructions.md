---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript ルール

- 既存の型定義を優先し、重複する型を新規作成しない。
- 可能な限り戻り値型を推論に任せるが、公開 API は明示型を検討する。
- `unknown` を優先し、`any` はやむを得ない場合のみ使用する。
- エラーハンドリングでは `instanceof Error` などで安全に分岐する。

# import / export

- 既存の import 並び順とエイリアス運用に合わせる。
- `index.ts` がある feature は public API 経由の import を優先する。

# 変更粒度

- 依頼範囲に関係するファイルのみ編集する。
- 型エラー回避のための過剰な optional 化は行わない。
