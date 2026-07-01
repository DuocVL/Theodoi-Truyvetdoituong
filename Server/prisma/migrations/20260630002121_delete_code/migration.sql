/*
  Warnings:

  - You are about to drop the column `code` on the `subjects` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "subjects_code_key";

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "code";
