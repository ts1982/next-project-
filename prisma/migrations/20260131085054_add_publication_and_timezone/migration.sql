-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "unpublishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" VARCHAR(100);

-- CreateIndex
CREATE INDEX "stores_publishedAt_idx" ON "stores"("publishedAt");

-- CreateIndex
CREATE INDEX "stores_unpublishedAt_idx" ON "stores"("unpublishedAt");
