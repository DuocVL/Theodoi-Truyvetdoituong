/*
  Warnings:

  - The primary key for the `checkins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `event_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `system_log` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "checkins" DROP CONSTRAINT "checkins_pkey",
ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "confidence" DROP NOT NULL,
ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "checkins_id_seq";

-- AlterTable
ALTER TABLE "event_logs" DROP CONSTRAINT "event_logs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "event_logs_id_seq";

-- AlterTable
ALTER TABLE "system_log" DROP CONSTRAINT "system_log_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "system_log_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "system_log_id_seq";

-- CreateIndex
CREATE INDEX "alerts_location_idx" ON "alerts" USING GIST ("location");

-- CreateIndex
CREATE INDEX "checkins_location_idx" ON "checkins" USING GIST ("location");
