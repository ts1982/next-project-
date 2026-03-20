import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import type {
  AdminListResponse,
  CreateAdminResponse,
  UpdateAdminResponse,
} from "@/features/admins/types/admin.types";
import type { CreateAdminInput, UpdateAdminInput } from "@/features/admins/schemas/admin.schema";
import {
  createAdminSchema,
  updateAdminSchema,
  updateTimezoneSchema,
} from "@/features/admins/schemas/admin.schema";
import bcrypt from "bcryptjs";
import { env } from "@/lib/config/env";

/** パスワードを除外した共通 select フィールド */
const ADMIN_SELECT = {
  id: true,
  email: true,
  name: true,
  roleId: true,
  role: { select: { id: true, name: true } },
  timezone: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getAdminList = async (search: string, page: number): Promise<AdminListResponse> => {
  const limit = PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, admins] = await Promise.all([
    prisma.admin.count({ where }),
    prisma.admin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: ADMIN_SELECT,
    }),
  ]);

  return {
    admins,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createAdmin = async (input: CreateAdminInput): Promise<CreateAdminResponse> => {
  // zodでバリデーション
  const validated = createAdminSchema.parse(input);

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  // 管理者を作成
  const admin = await prisma.admin.create({
    data: {
      email: validated.email,
      name: validated.name,
      password: hashedPassword,
      roleId: validated.roleId,
      timezone: env.DEFAULT_TIMEZONE,
    },
    select: ADMIN_SELECT,
  });

  return {
    admin: {
      ...admin,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    },
  };
};

export const updateAdmin = async (
  id: string,
  input: UpdateAdminInput & { timezone?: string },
): Promise<UpdateAdminResponse> => {
  // timezone以外をバリデーション
  const { timezone, ...restInput } = input;

  let validated: UpdateAdminInput = {};
  // 空でない場合のみバリデーション
  if (Object.keys(restInput).length > 0) {
    validated = updateAdminSchema.parse(restInput);
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
    roleId: string;
    timezone: string;
  }> = {};
  if (validated.name) data.name = validated.name;
  if (validated.email) data.email = validated.email;
  if (validated.password) {
    data.password = await bcrypt.hash(validated.password, 10);
  }
  if (validated.roleId) data.roleId = validated.roleId;
  if (validatedTimezone !== undefined) data.timezone = validatedTimezone;

  const admin = await prisma.admin.update({
    where: { id },
    data,
    select: ADMIN_SELECT,
  });

  return {
    admin: {
      ...admin,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    },
  };
};
