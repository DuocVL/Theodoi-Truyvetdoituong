/*
  Warnings:

  - A unique constraint covering the columns `[subject_id]` on the table `face_data` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "face_data_subject_id_key" ON "face_data"("subject_id");
