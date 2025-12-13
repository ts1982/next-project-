import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({
      message: "DATABASE_URLが設定されていません",
    })
    .url("DATABASE_URLは有効なURLである必要があります"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"], {
      message:
        "NODE_ENVはdevelopment, production, testのいずれかである必要があります",
    })
    .default("development"),

  // Next.js Public URLs
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URLは有効なURLである必要があります")
    .optional(),

  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_BASE_URLは有効なURLである必要があります")
    .optional(),
});

// 環境変数をパースし、失敗時はエラーを詳細に表示
function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ 環境変数の検証に失敗しました:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("環境変数の検証に失敗しました");
  }

  return parsed.data;
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
