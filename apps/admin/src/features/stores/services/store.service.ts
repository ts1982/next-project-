import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import { calculateIsPublic } from "@/lib/utils/publication";
import { convertToUTC, getDefaultTimezone } from "@/lib/utils/timezone";
import type { Store as PrismaStore } from "@prisma/client";
import type { Store, CreateStoreInput, UpdateStoreInput } from "../types/store.types";

/**
 * Prismaの店舗データをAPIレスポンス形式に変換
 * 日時をISO文字列に変換し、isPublicフィールドを計算
 */
function transformStoreToResponse(store: PrismaStore): Store {
  return {
    id: store.id,
    name: store.name,
    description: store.description,
    address: store.address,
    phone: store.phone,
    email: store.email,
    publishedAt: store.publishedAt ? store.publishedAt.toISOString() : null,
    unpublishedAt: store.unpublishedAt ? store.unpublishedAt.toISOString() : null,
    isPublic: calculateIsPublic(store.publishedAt, store.unpublishedAt),
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

export async function getStoreList(search: string = "", page: number = 1) {
  const offset = (page - 1) * PAGINATION.DEFAULT_LIMIT;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { id: "desc" },
      take: PAGINATION.DEFAULT_LIMIT,
      skip: offset,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    stores: stores.map(transformStoreToResponse),
    pagination: {
      total,
      page,
      pageSize: PAGINATION.DEFAULT_LIMIT,
      totalPages: Math.ceil(total / PAGINATION.DEFAULT_LIMIT),
    },
  };
}

export async function getStoreById(id: number): Promise<Store | null> {
  const store = await prisma.store.findUnique({
    where: { id },
  });

  return store ? transformStoreToResponse(store) : null;
}

export async function createStore(data: CreateStoreInput): Promise<Store> {
  // タイムゾーンとともに日時が提供された場合、UTCに変換
  const timezone = data.timezone || getDefaultTimezone();
  const publishedAt = data.publishedAt ? convertToUTC(data.publishedAt, timezone) : null;
  const unpublishedAt = data.unpublishedAt ? convertToUTC(data.unpublishedAt, timezone) : null;

  const store = await prisma.store.create({
    data: {
      name: data.name,
      description: data.description || null,
      address: data.address,
      phone: data.phone || null,
      email: data.email || null,
      publishedAt,
      unpublishedAt,
    },
  });

  return transformStoreToResponse(store);
}

export async function updateStore(id: number, data: UpdateStoreInput): Promise<Store> {
  // タイムゾーンとともに日時が提供された場合、UTCに変換
  const timezone = data.timezone || getDefaultTimezone();
  const publishedAt =
    data.publishedAt !== undefined
      ? data.publishedAt
        ? convertToUTC(data.publishedAt, timezone)
        : null
      : undefined;
  const unpublishedAt =
    data.unpublishedAt !== undefined
      ? data.unpublishedAt
        ? convertToUTC(data.unpublishedAt, timezone)
        : null
      : undefined;

  const store = await prisma.store.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(publishedAt !== undefined && { publishedAt }),
      ...(unpublishedAt !== undefined && { unpublishedAt }),
    },
  });

  return transformStoreToResponse(store);
}

export async function deleteStore(id: number): Promise<void> {
  await prisma.store.delete({
    where: { id },
  });
}
