/*
  Warnings:

  - You are about to drop the column `last_notified_at` on the `subjects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "last_notified_at",
ADD COLUMN     "last_alert_at" TIMESTAMP(3),
ADD COLUMN     "last_reminder_at" TIMESTAMP(3);
