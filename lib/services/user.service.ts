import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import type {
  UserListResponse,
  CreateUserInput,
  CreateUserResponse,
} from "@/lib/types/user";
import { createUserSchema } from "@/lib/types/user";
import bcrypt from "bcryptjs";

export const getUserList = async (
  search: string,
  page: number
): Promise<UserListResponse> => {
  const limit = PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createUser = async (
  input: CreateUserInput
): Promise<CreateUserResponse> => {
  // zodでバリデーション
  const validated = createUserSchema.parse(input);

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  // ユーザーを作成
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      password: hashedPassword,
    },
  });

  // レスポンスからpasswordを除外
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: {
      ...userWithoutPassword,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
};
