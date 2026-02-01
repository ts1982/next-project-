import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import type {
  UserListResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "@/features/users/types/user.types";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/features/users/schemas/user.schema";
import {
  createUserSchema,
  updateUserSchema,
  updateTimezoneSchema,
} from "@/features/users/schemas/user.schema";
import bcrypt from "bcryptjs";
import { env } from "@/lib/config/env";

export const getUserList = async (
  search: string,
  page: number,
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
  input: CreateUserInput,
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
      timezone: env.DEFAULT_TIMEZONE,
    },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
};

export const updateUser = async (
  id: string,
  input: UpdateUserInput & { timezone?: string },
): Promise<UpdateUserResponse> => {
  // timezone以外をバリデーション
  const { timezone, ...restInput } = input;

  let validated: UpdateUserInput = {};
  // 空でない場合のみバリデーション
  if (Object.keys(restInput).length > 0) {
    validated = updateUserSchema.parse(restInput);
  }

  // timezoneが指定されている場合はバリデーション
  let validatedTimezone: string | undefined;
  if (timezone !== undefined) {
    const timezoneResult = updateTimezoneSchema.parse({ timezone });
    validatedTimezone = timezoneResult.timezone;
  }

  const data: Partial<{
    name: string;
    email: string;
    password: string;
    timezone: string;
  }> = {};
  if (validated.name) data.name = validated.name;
  if (validated.email) data.email = validated.email;
  if (validated.password) {
    data.password = await bcrypt.hash(validated.password, 10);
  }
  if (validatedTimezone !== undefined) data.timezone = validatedTimezone;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
};
