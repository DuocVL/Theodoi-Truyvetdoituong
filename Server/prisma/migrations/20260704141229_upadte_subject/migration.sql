/*
  Warnings:

  - You are about to drop the column `updated_at` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `monitoring_end` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `monitoring_start` on the `subjects` table. All the data in the column will be lost.
  - Made the column `active_end_time` on table `subjects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active_start_time` on table `subjects` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "images" DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "monitoring_end",
DROP COLUMN "monitoring_start",
ALTER COLUMN "active_end_time" SET NOT NULL,
ALTER COLUMN "active_end_time" SET DEFAULT '22:00',
ALTER COLUMN "active_start_time" SET NOT NULL,
ALTER COLUMN "active_start_time" SET DEFAULT '07:00';
