/*
  Warnings:

  - You are about to drop the `SystemLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SystemLog" DROP CONSTRAINT "SystemLog_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "SystemLog" DROP CONSTRAINT "SystemLog_user_id_fkey";

-- DropTable
DROP TABLE "SystemLog";

-- CreateTable
CREATE TABLE "systemlog" (
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

    CONSTRAINT "systemlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "systemlog_category_created_at_idx" ON "systemlog"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "systemlog_user_id_created_at_idx" ON "systemlog"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "systemlog_subject_id_created_at_idx" ON "systemlog"("subject_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "location_histories_recorded_at_idx" ON "location_histories"("recorded_at");

-- AddForeignKey
ALTER TABLE "systemlog" ADD CONSTRAINT "systemlog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "systemlog" ADD CONSTRAINT "systemlog_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
