/*
  Warnings:

  - You are about to drop the column `subject_id` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `refreshtokens` table. All the data in the column will be lost.
  - You are about to drop the `location_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_logs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[account_id,device_uuid]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `refreshtokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_id` to the `devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `device_id` to the `refreshtokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refreshtokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "location_logs" DROP CONSTRAINT "location_logs_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "system_logs" DROP CONSTRAINT "system_logs_user_id_fkey";

-- DropIndex
DROP INDEX "devices_subject_id_device_uuid_key";

-- DropIndex
DROP INDEX "refreshtokens_token_key";

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "subject_id",
ADD COLUMN     "account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refreshtokens" DROP COLUMN "token",
ADD COLUMN     "device_id" TEXT NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL;

-- DropTable
DROP TABLE "location_logs";

-- DropTable
DROP TABLE "system_logs";

-- CreateTable
CREATE TABLE "SystemLog" (
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

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
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

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthLog" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_user_id_idx" ON "SystemLog"("user_id");

-- CreateIndex
CREATE INDEX "SystemLog_entity_entity_id_idx" ON "SystemLog"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "SystemLog_created_at_idx" ON "SystemLog"("created_at");

-- CreateIndex
CREATE INDEX "RequestLog_user_id_idx" ON "RequestLog"("user_id");

-- CreateIndex
CREATE INDEX "RequestLog_created_at_idx" ON "RequestLog"("created_at");

-- CreateIndex
CREATE INDEX "AuthLog_account_id_idx" ON "AuthLog"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_account_id_device_uuid_key" ON "devices"("account_id", "device_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "refreshtokens_token_hash_key" ON "refreshtokens"("token_hash");

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
