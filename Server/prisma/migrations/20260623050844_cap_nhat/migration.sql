/*
  Warnings:

  - You are about to drop the column `is_read` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the `system_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "system_log" DROP CONSTRAINT "system_log_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "system_log" DROP CONSTRAINT "system_log_user_id_fkey";

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "is_read";

-- DropTable
DROP TABLE "system_log";

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "subject_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "duration_ms" INTEGER,
    "status_code" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_category_created_at_idx" ON "SystemLog"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SystemLog_user_id_created_at_idx" ON "SystemLog"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SystemLog_subject_id_created_at_idx" ON "SystemLog"("subject_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
