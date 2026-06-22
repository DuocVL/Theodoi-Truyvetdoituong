/*
  Warnings:

  - You are about to drop the column `geom` on the `zones` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `zones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `zones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `radius` to the `zones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('SAFE', 'RESTRICTED');

-- DropIndex
DROP INDEX "zones_geom_idx";

-- AlterTable
ALTER TABLE "zones" DROP COLUMN "geom",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "radius" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" "ZoneType" NOT NULL DEFAULT 'SAFE';
