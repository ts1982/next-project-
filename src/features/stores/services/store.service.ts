import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import type {
  Store,
  CreateStoreInput,
  UpdateStoreInput,
} from "../types/store.types";

export async function getStoreList(search: string = "", page: number = 1) {
  const offset = (page - 1) * PAGINATION.ITEMS_PER_PAGE;

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
      orderBy: { createdAt: "desc" },
      take: PAGINATION.ITEMS_PER_PAGE,
      skip: offset,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    stores,
    pagination: {
      total,
      page,
      pageSize: PAGINATION.ITEMS_PER_PAGE,
      totalPages: Math.ceil(total / PAGINATION.ITEMS_PER_PAGE),
    },
  };
}

export async function getStoreById(id: number): Promise<Store | null> {
  return prisma.store.findUnique({
    where: { id },
  });
}

export async function createStore(data: CreateStoreInput): Promise<Store> {
  return prisma.store.create({
    data: {
      name: data.name,
      description: data.description || null,
      address: data.address,
      phone: data.phone || null,
      email: data.email || null,
    },
  });
}

export async function updateStore(
  id: number,
  data: UpdateStoreInput,
): Promise<Store> {
  return prisma.store.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });
}

export async function deleteStore(id: number): Promise<void> {
  await prisma.store.delete({
    where: { id },
  });
}
