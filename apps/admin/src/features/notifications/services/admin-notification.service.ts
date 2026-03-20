import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-scheduler";
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
  schedulerName: true,
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

  // 予約配信: EventBridge Scheduler に 1 件登録
  const schedulerName = await registerScheduler(notification.id, scheduledAtUTC);

  // Scheduler 作成成功後の DB 更新で失敗した場合に備え、補償処理を入れる
  try {
    await prisma.adminNotification.update({
      where: { id: notification.id },
      data: { schedulerName },
    });
  } catch (error) {
    // DB 更新に失敗した場合は、作成済みのスケジュールを削除して整合性を保つ
    try {
      await cancelScheduler(schedulerName);
    } catch (deleteError) {
      // すでに削除済みの場合は無視し、それ以外はログだけ残す
      if (!(deleteError instanceof ResourceNotFoundException)) {
        // eslint-disable-next-line no-console
        console.error("Failed to rollback scheduler creation", deleteError);
      }
    }

    throw error;
  }
  return {
    notification: { ...notification, schedulerName },
  };
}

export async function updateAdminNotification(
  id: string,
  input: UpdateAdminNotificationInput,
): Promise<UpdateAdminNotificationResponse> {
  const existing = await prisma.adminNotification.findUnique({
    where: { id },
    select: { deliveredAt: true, schedulerName: true },
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

  // scheduledAt が変更される場合は旧スケジューラ名を保持（DB 更新成功後にキャンセル）
  const oldSchedulerName = scheduledAt !== undefined ? existing.schedulerName : null;

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
        // schedulerName は調整後に更新（null クリアしてから再登録）
        ...(scheduledAt !== undefined && { schedulerName: null }),
      },
      select: NOTIFICATION_SELECT,
    });
  });

  // DB 更新成功後に旧スケジューラをキャンセル（先にキャンセルすると DB 更新失敗時に不整合が生じる）
  // キャンセル失敗時はログだけ残す（DB 側の schedulerName: null が正として扱う）
  if (oldSchedulerName) {
    try {
      await cancelScheduler(oldSchedulerName);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to cancel old scheduler after DB update", err);
    }
  }

  // 新しい scheduledAt があれば再登録
  if (scheduledAtUTC) {
    const newSchedulerName = await registerScheduler(id, scheduledAtUTC);
    try {
      await prisma.adminNotification.update({
        where: { id },
        data: { schedulerName: newSchedulerName },
      });
    } catch (error) {
      // DB 更新に失敗した場合は、作成済みのスケジュールを削除して整合性を保つ
      try {
        await cancelScheduler(newSchedulerName);
      } catch (deleteError) {
        if (!(deleteError instanceof ResourceNotFoundException)) {
          // eslint-disable-next-line no-console
          console.error("Failed to rollback scheduler creation", deleteError);
        }
      }
      throw error;
    }
    return {
      notification: { ...notification, schedulerName: newSchedulerName },
    };
  }

  return { notification };
}

export async function deleteAdminNotification(id: string): Promise<void> {
  const existing = await prisma.adminNotification.findUnique({
    where: { id },
    select: { deliveredAt: true, schedulerName: true },
  });

  if (!existing) {
    throw new Error("通知が見つかりません");
  }

  if (existing.deliveredAt) {
    throw new ConflictError();
  }

  // EventBridge Scheduler のスケジュールを先に削除
  if (existing.schedulerName) {
    await cancelScheduler(existing.schedulerName);
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

// ---------------------------------------------------------------------------
// EventBridge Scheduler helpers
// ---------------------------------------------------------------------------

const schedulerClient = new SchedulerClient({
  region: process.env.AWS_DEFAULT_REGION ?? "ap-northeast-1",
});

/**
 * EventBridge Scheduler に通知配信スケジュールを 1 件登録し、スケジュール名を返す。
 * ActionAfterCompletion: DELETE により実行後に自動削除される。
 */
async function registerScheduler(notificationId: string, scheduledAt: Date): Promise<string> {
  const lambdaArn = process.env.NOTIFICATION_LAMBDA_ARN;
  const roleArn = process.env.SCHEDULER_EXECUTION_ROLE_ARN;

  if (!lambdaArn || !roleArn) {
    if (process.env.NODE_ENV !== "production") {
      const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
      // setTimeout の最大値 (約24.8日) を超えないようにクランプ
      const safeDelay = Math.min(delayMs, 2_147_483_647);
      console.warn(
        `[scheduler] ローカル開発環境: ${safeDelay}ms 後に配信を実行します (notificationId=${notificationId})`,
      );
      setTimeout(() => {
        deliverNotification(notificationId).catch((err) => {
          console.error("[scheduler] ローカル配信エラー:", err);
        });
      }, safeDelay);
      return `local-mock-${notificationId}`;
    }
    throw new Error("NOTIFICATION_LAMBDA_ARN / SCHEDULER_EXECUTION_ROLE_ARN が未設定です");
  }

  const scheduleName = `notification-${notificationId}`;
  // EventBridge Scheduler の at() 式は UTC の ISO8601（Zなし）形式
  const atExpression = `at(${scheduledAt.toISOString().slice(0, 19)})`;

  await schedulerClient.send(
    new CreateScheduleCommand({
      Name: scheduleName,
      ScheduleExpression: atExpression,
      ScheduleExpressionTimezone: "UTC",
      FlexibleTimeWindow: { Mode: "OFF" },
      Target: {
        Arn: lambdaArn,
        RoleArn: roleArn,
        Input: JSON.stringify({ notificationId }),
      },
      ActionAfterCompletion: "DELETE",
    }),
  );

  console.log(`[scheduler] Registered: ${scheduleName} at ${atExpression}`);
  return scheduleName;
}

/**
 * EventBridge Scheduler からスケジュールを削除する。
 * 配信後に自動削除済みの場合（ResourceNotFoundException）は無視する。
 */
async function cancelScheduler(schedulerName: string): Promise<void> {
  try {
    await schedulerClient.send(new DeleteScheduleCommand({ Name: schedulerName }));
    console.log(`[scheduler] Cancelled: ${schedulerName}`);
  } catch (err) {
    if (err instanceof ResourceNotFoundException) {
      // 既に配信・自動削除済みは正常
      return;
    }
    throw err;
  }
}

/**
 * Studify Click にリアルタイム通知をブロードキャストする
 */
async function broadcastToUserApp(
  userIds: string[],
  notification: { id: string; title: string; body: string; type: string },
): Promise<void> {
  const userAppUrl = process.env.USER_APP_URL || "http://localhost:3001";
  const secret = process.env.INTERNAL_API_SECRET || "dev-secret";

  const res = await fetch(`${userAppUrl}/api/internal/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ userIds, notification }),
  });

  if (!res.ok) {
    console.error(`[broadcast] Failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * 単一 AdminNotification を配信する（transaction）
 */
async function deliverNotification(adminNotificationId: string): Promise<void> {
  let deliveredUserIds: string[] = [];
  let notificationSnapshot: {
    id: string;
    title: string;
    body: string;
    type: string;
  } | null = null;

  await prisma.$transaction(async (tx) => {
    // トランザクション内で deliveredAt を確認し、二重配信を防ぐ
    const notification = await tx.adminNotification.findUnique({
      where: { id: adminNotificationId },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        targetType: true,
        deliveredAt: true,
        targets: { select: { userId: true } },
      },
    });

    if (!notification || notification.targetType === undefined) return;
    // 既に配信済みの場合はスキップ（cron 重複実行対策）
    if (notification.deliveredAt !== null) return;

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
        skipDuplicates: true,
      });
    }

    await tx.adminNotification.update({
      where: { id: adminNotificationId },
      data: { deliveredAt: new Date() },
    });

    deliveredUserIds = userIds;
    notificationSnapshot = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
    };
  });

  // トランザクション完了後にリアルタイム通知（失敗しても配信は成功扱い）
  if (deliveredUserIds.length > 0 && notificationSnapshot !== null) {
    broadcastToUserApp(deliveredUserIds, notificationSnapshot).catch((err) => {
      console.error("[broadcast] Error:", err);
    });
  }
}
