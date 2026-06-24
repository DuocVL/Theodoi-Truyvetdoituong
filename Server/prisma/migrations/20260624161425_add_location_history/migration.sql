-- CreateTable
CREATE TABLE "location_histories" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_histories_subject_id_recorded_at_idx" ON "location_histories"("subject_id", "recorded_at" DESC);

-- AddForeignKey
ALTER TABLE "location_histories" ADD CONSTRAINT "location_histories_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
