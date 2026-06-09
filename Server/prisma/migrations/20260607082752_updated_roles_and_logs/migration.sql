/*
  Warnings:

  - You are about to drop the column `verification_reason` on the `checkins` table. All the data in the column will be lost.
  - The `status` column on the `subjects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `auth_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserAccountRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "auth_images" DROP CONSTRAINT "auth_images_account_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "verification_reason";

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "status",
ADD COLUMN     "status" "SubjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserAccountRole" NOT NULL DEFAULT 'OPERATOR';

-- DropTable
DROP TABLE "auth_images";

-- DropTable
DROP TABLE "auth_log";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "user_roles";

-- CreateIndex
CREATE INDEX "subjects_status_idx" ON "subjects"("status");
