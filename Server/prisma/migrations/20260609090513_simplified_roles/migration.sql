/*
  Warnings:

  - The values [MANAGER,OPERATOR] on the enum `UserAccountRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserAccountRole_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserAccountRole_new" USING ("role"::text::"UserAccountRole_new");
ALTER TYPE "UserAccountRole" RENAME TO "UserAccountRole_old";
ALTER TYPE "UserAccountRole_new" RENAME TO "UserAccountRole";
DROP TYPE "public"."UserAccountRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
