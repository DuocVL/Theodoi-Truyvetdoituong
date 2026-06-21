/*
  Warnings:

  - You are about to drop the column `confidence` on the `checkins` table. All the data in the column will be lost.
  - Made the column `latitude` on table `checkins` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `checkins` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "confidence",
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;
