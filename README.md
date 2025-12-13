# Next Project - User Management Application

Next.js 16 + Prisma + TypeScript を使用したユーザー管理アプリケーション

## 🚀 技術スタック

- **Next.js 16.0.3** - React framework（App Router）
- **React 19.2.0** - UI library
- **Prisma 6.19.0** - ORM
- **MySQL 8.0** - Database（Docker）
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **Zod** - Schema validation
- **bcryptjs** - Password hashing

## 📁 プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Route Group: ダッシュボード
│   │   ├── users/               # ユーザー管理
│   │   │   ├── page.tsx        # 一覧
│   │   │   └── create/
│   │   │       └── page.tsx    # 新規作成
│   │   └── layout.tsx          # ダッシュボードレイアウト
│   ├── api/                     # API Routes
│   │   └── users/
│   │       └── route.ts        # GET, POST /api/users
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # トップページ
│   └── globals.css             # Global styles
│
├── features/                    # Feature-based modules
│   └── users/
│       ├── components/          # ユーザー機能専用コンポーネント
│       │   ├── user-table.tsx
│       │   ├── user-search.tsx
│       │   └── user-create-form.tsx
│       ├── schemas/             # Zodバリデーションスキーマ
│       │   └── user.schema.ts
│       ├── services/            # ビジネスロジック
│       │   └── user.service.ts
│       ├── types/               # 型定義
│       │   └── user.types.ts
│       └── index.ts             # Public API
│
├── components/                  # 共通コンポーネント
│   ├── ui/                      # shadcn/ui components
│   ├── layouts/                 # レイアウトコンポーネント
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   └── common/                  # その他共通
│
└── lib/                         # ユーティリティ・設定
    ├── db/
    │   └── prisma.ts           # Prisma client
    ├── config/
    │   └── env.ts              # 環境変数（型安全）
    ├── validations/
    │   └── common.schema.ts    # 共通バリデーション
    ├── utils/
    │   ├── cn.ts               # classnames utility
    │   └── index.ts
    ├── hooks/                   # カスタムhooks
    ├── constants/               # 定数
    └── types/                   # 共通型定義

prisma/
├── schema.prisma               # データベーススキーマ
├── seed.ts                     # シードデータ
└── migrations/                 # マイグレーション履歴

scripts/
└── repl.ts                     # Prisma REPL
```

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成：

```env
DATABASE_URL="mysql://root:rootpassword@localhost:3306/nextdb"
NODE_ENV="development"
```

### 3. データベースの起動

```bash
make db-up
# または
docker-compose up -d
```

### 4. マイグレーションの実行

```bash
make prisma-migrate
# または
npx prisma migrate dev
```

### 5. シードデータの投入

```bash
make seed
# または
npm run db:seed
```

### 6. 開発サーバーの起動

```bash
make dev
# または
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセス

## 📝 使用可能なコマンド

### 開発
```bash
make dev              # 開発サーバー起動
make build            # プロダクションビルド
make start            # プロダクションサーバー起動
make lint             # ESLint実行
```

### データベース
```bash
make db-up            # MySQLコンテナ起動
make db-down          # MySQLコンテナ停止
make db-restart       # MySQLコンテナ再起動
make db-logs          # MySQLログ表示
make db-shell         # MySQLシェル起動
```

### Prisma
```bash
make prisma-migrate   # マイグレーション作成・適用
make prisma-reset     # データベースリセット
make prisma-studio    # Prisma Studio起動
make prisma-generate  # Prisma Client生成
make prisma-format    # スキーマファイルフォーマット
make repl             # Prisma REPL起動
make seed             # シードデータ投入
```

### ユーティリティ
```bash
make clean            # ビルド成果物削除
make install          # 依存関係インストール
make update           # 依存関係更新
```

## 🎯 主要機能

### ユーザー管理
- ✅ ユーザー一覧表示（ページネーション付き）
- ✅ ユーザー検索（名前・メールアドレス）
- ✅ ユーザー新規作成
  - メールアドレス検証
  - パスワード（4文字以上）
  - パスワードのbcryptハッシュ化
  - 重複メール検証

### API エンドポイント
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成

## 🔒 セキュリティ

- パスワードは bcryptjs でハッシュ化（salt rounds: 10）
- メールアドレスの一意性制約
- Zodによる入力バリデーション（クライアント・サーバー両方）
- 環境変数の型安全な管理

## 🧪 開発ツール

### Prisma REPL
データベースと対話的に操作できます：

```bash
make repl
# または
npm run repl
```

```javascript
prisma> await prisma.user.findMany()
prisma> await prisma.user.create({ data: { email: "test@example.com", name: "Test", password: "..." }})
```

### Prisma Studio
GUIでデータベースを管理：

```bash
make prisma-studio
```

## 📚 アーキテクチャ

### Feature-based Architecture
機能ごとにコードを整理し、高い凝集度と低い結合度を実現：

- 各機能（`features/users/`など）は独立したモジュール
- コンポーネント、スキーマ、サービス、型を機能内に集約
- `index.ts` でPublic APIを明示的にエクスポート

### Route Groups
Next.js Route Groupsでレイアウトを分離：

- `(dashboard)` - 認証済みユーザー向け
- URL構造に影響を与えずにレイアウトを切り替え可能

### 型安全性
- Prisma Client で型安全なDB操作
- Zod で実行時バリデーション + 型推論
- 環境変数の型チェック（`lib/config/env.ts`）

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

MIT

## 🔗 参考リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

