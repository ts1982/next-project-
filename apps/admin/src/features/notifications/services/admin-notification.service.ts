import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import { convertToUTC } from "@/lib/utils/timezone";
import type {
  AdminNotificationListResponse,
  CreateAdminNotificationResponse,
  UpdateAdminNotificationResponse,
  DeliverNotificationsResponse,
} from "../types/admin-notification.types";
import type {
  CreateAdminNotificationInput,
  UpdateAdminNotificationInput,
} from "../schemas/admin-notification.schema";

export class ConflictError extends Error {
  constructor(message = "配信済みの通知は変更できません") {
    super(message);
    this.name = "ConflictError";
  }
}

const NOTIFICATION_SELECT = {
  id: true,
  createdByAdminId: true,
  title: true,
  body: true,
  type: true,
  targetType: true,
  scheduledAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  targets: {
    select: {
      id: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: {
    select: { notifications: true },
  },
} as const;

export async function getAdminNotificationList(
  page: number,
  limit: number = PAGINATION.DEFAULT_LIMIT,
): Promise<AdminNotificationListResponse> {
  const skip = (page - 1) * limit;

  const [total, notifications] = await Promise.all([
    prisma.adminNotification.count(),
    prisma.adminNotification.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: NOTIFICATION_SELECT,
    }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminNotificationById(
  id: string,
): Promise<AdminNotificationListResponse["notifications"][0]> {
  const notification = await prisma.adminNotification.findUnique({
    where: { id },
    select: NOTIFICATION_SELECT,
  });

  if (!notification) {
    throw new Error("通知が見つかりません");
  }

  return notification;
}

export async function createAdminNotification(
  input: CreateAdminNotificationInput,
  createdByAdminId: string,
): Promise<CreateAdminNotificationResponse> {
  const { targetUserIds, scheduledAt, timezone, ...rest } = input;

  // scheduledAt のUTC変換
  let scheduledAtUTC: Date | null = null;
  if (scheduledAt) {
    const tz = timezone || "Asia/Tokyo";
    scheduledAtUTC = convertToUTC(scheduledAt, tz);
  }

  const notification = await prisma.adminNotification.create({
    data: {
      ...rest,
      createdByAdminId,
      scheduledAt: scheduledAtUTC,
      targets:
        rest.targetType === "SPECIFIC" && targetUserIds?.length
          ? {
              create: targetUserIds.map((userId) => ({ userId })),
            }
          : undefined,
    },
    select: NOTIFICATION_SELECT,
  });

  // 即時配信（scheduledAt が null）
  if (!scheduledAtUTC) {
    await deliverNotification(notification.id);
    const delivered = await prisma.adminNotification.findUnique({
      where: { id: notification.id },
      select: NOTIFICATION_SELECT,
    });
    return { notification: delivered! };
  }

  return { notification };
}

export async function updateAdminNotification(
  id: string,
  input: UpdateAdminNotificationInput,
): Promise<UpdateAdminNotificationResponse> {
  const existing = await prisma.adminNotification.findUnique({
    where: { id },
    select: { deliveredAt: true },
  });

  if (!existing) {
    throw new Error("通知が見つかりません");
  }

  if (existing.deliveredAt) {
    throw new ConflictError();
  }

  const { targetUserIds, scheduledAt, timezone, ...rest } = input;

  let scheduledAtUTC: Date | null | undefined = undefined;
  if (scheduledAt !== undefined) {
    if (scheduledAt === null) {
      scheduledAtUTC = null;
    } else {
      const tz = timezone || "Asia/Tokyo";
      scheduledAtUTC = convertToUTC(scheduledAt, tz);
    }
  }

  const notification = await prisma.$transaction(async (tx) => {
    // SPECIFIC の targets を更新
    if (input.targetType === "SPECIFIC" && targetUserIds !== undefined) {
      await tx.adminNotificationTarget.deleteMany({
        where: { adminNotificationId: id },
      });
      if (targetUserIds.length > 0) {
        await tx.adminNotificationTarget.createMany({
          data: targetUserIds.map((userId) => ({
            adminNotificationId: id,
            userId,
          })),
        });
      }
    }

    return tx.adminNotification.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledAtUTC !== undefined && { scheduledAt: scheduledAtUTC }),
      },
      select: NOTIFICATION_SELECT,
    });
  });

  return { notification };
}

export async function deleteAdminNotification(id: string): Promise<void> {
  const existing = await prisma.adminNotification.findUnique({
    where: { id },
    select: { deliveredAt: true },
  });

  if (!existing) {
    throw new Error("通知が見つかりません");
  }

  if (existing.deliveredAt) {
    throw new ConflictError();
  }

  await prisma.adminNotification.delete({ where: { id } });
}

export async function deliverDueNotifications(): Promise<DeliverNotificationsResponse> {
  const now = new Date();

  const due = await prisma.adminNotification.findMany({
    where: {
      scheduledAt: { lte: now },
      deliveredAt: null,
    },
    select: { id: true },
  });

  for (const n of due) {
    await deliverNotification(n.id);
  }

  return { delivered: due.length };
}

/**
 * 単一 AdminNotification を配信する（transaction）
 */
async function deliverNotification(adminNotificationId: string): Promise<void> {
  const notification = await prisma.adminNotification.findUnique({
    where: { id: adminNotificationId },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      targetType: true,
      targets: { select: { userId: true } },
    },
  });

  if (!notification || notification.targetType === undefined) return;

  await prisma.$transaction(async (tx) => {
    let userIds: string[] = [];

    if (notification.targetType === "ALL") {
      const users = await tx.user.findMany({ select: { id: true } });
      userIds = users.map((u) => u.id);
    } else {
      userIds = notification.targets.map((t) => t.userId);
    }

    if (userIds.length > 0) {
      await tx.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          adminNotificationId: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
        })),
      });
    }

    await tx.adminNotification.update({
      where: { id: adminNotificationId },
      data: { deliveredAt: new Date() },
    });
  });
}
