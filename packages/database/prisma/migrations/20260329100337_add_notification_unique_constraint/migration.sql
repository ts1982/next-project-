/*
  Warnings:

  - A unique constraint covering the columns `[userId,adminNotificationId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_adminNotificationId_key" ON "notifications"("userId", "adminNotificationId");
