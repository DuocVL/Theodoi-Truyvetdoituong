/*
  Warnings:

  - You are about to drop the `subject_zones` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subject_id` to the `zones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('RESTRICTED_ENTRY', 'MISSED_CHECKIN');

-- DropForeignKey
ALTER TABLE "subject_zones" DROP CONSTRAINT "subject_zones_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_zones" DROP CONSTRAINT "subject_zones_zone_id_fkey";

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "current_zone_id" TEXT,
ADD COLUMN     "grace_minutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "interval_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "last_checkin_at" TIMESTAMP(3),
ADD COLUMN     "last_notified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "grace_minutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "interval_minutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "subject_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "subject_zones";

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "checkin_id" TEXT,
    "type" "AlertType" NOT NULL,
    "message" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_subject_id_created_at_idx" ON "alerts"("subject_id", "created_at");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_current_zone_id_fkey" FOREIGN KEY ("current_zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
