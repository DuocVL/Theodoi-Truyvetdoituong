/*
  Warnings:

  - You are about to drop the column `accountId` on the `devices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_accountId_fkey";

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "accountId";

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
