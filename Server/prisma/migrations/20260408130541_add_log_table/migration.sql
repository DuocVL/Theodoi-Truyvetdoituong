/*
  Warnings:

  - You are about to drop the `AuthLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequestLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SystemLog" DROP CONSTRAINT "SystemLog_user_id_fkey";

-- DropTable
DROP TABLE "AuthLog";

-- DropTable
DROP TABLE "RequestLog";

-- DropTable
DROP TABLE "SystemLog";

-- CreateTable
CREATE TABLE "system_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "request_id" TEXT,
    "status" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "request_body" JSONB,
    "response_body" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_log" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_log_user_id_idx" ON "system_log"("user_id");

-- CreateIndex
CREATE INDEX "system_log_entity_entity_id_idx" ON "system_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "system_log_created_at_idx" ON "system_log"("created_at");

-- CreateIndex
CREATE INDEX "request_log_user_id_idx" ON "request_log"("user_id");

-- CreateIndex
CREATE INDEX "request_log_created_at_idx" ON "request_log"("created_at");

-- CreateIndex
CREATE INDEX "auth_log_account_id_idx" ON "auth_log"("account_id");

-- AddForeignKey
ALTER TABLE "system_log" ADD CONSTRAINT "system_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
