/*
  Warnings:

  - Added the required column `file_name` to the `images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stored_name` to the `images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "images" ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "stored_name" TEXT NOT NULL;
