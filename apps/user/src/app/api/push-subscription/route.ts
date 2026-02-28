import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { successResponse } from "@/lib/types/api.types";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/** Push サブスクリプションを登録 */
export const POST = withApiHandler(async (request) => {
  const { user } = await requireUser();
  const body = await request.json();
  const { endpoint, keys } = subscribeSchema.parse(body);

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json(successResponse({ subscribed: true }), {
    status: 201,
  });
});

/** Push サブスクリプションを解除 */
export const DELETE = withApiHandler(async (request) => {
  const { user } = await requireUser();
  const body = await request.json();
  const { endpoint } = unsubscribeSchema.parse(body);

  await prisma.pushSubscription.deleteMany({
    where: { userId: user.id, endpoint },
  });

  return NextResponse.json(successResponse({ subscribed: false }));
});
