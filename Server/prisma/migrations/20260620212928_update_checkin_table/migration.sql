/*
  Warnings:

  - You are about to drop the column `device_id` on the `checkins` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `checkins` table. All the data in the column will be lost.
  - You are about to drop the `alerts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_resolved_by_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_subject_id_fkey";

-- DropIndex
DROP INDEX "checkins_location_idx";

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "device_id",
DROP COLUMN "location",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- DropTable
DROP TABLE "alerts";
