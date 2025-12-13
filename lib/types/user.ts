import { z } from "zod";

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ユーザー作成用のzodスキーマ
export const createUserSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: z
    .string()
    .min(4, { message: "パスワードは4文字以上で入力してください" }),
  name: z.string().min(1, { message: "名前を入力してください" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export interface CreateUserResponse {
  user: Omit<User, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
}
