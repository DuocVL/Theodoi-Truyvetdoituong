/*
  Warnings:

  - The `status` column on the `checkins` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('ON_TIME', 'LATE', 'RESTRICTED_VIOLATION');

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "status",
ADD COLUMN     "status" "CheckinStatus" NOT NULL DEFAULT 'ON_TIME';

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "fcm_token" TEXT;
