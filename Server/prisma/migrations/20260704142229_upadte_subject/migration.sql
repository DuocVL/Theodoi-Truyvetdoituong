-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "monitoring_end" TIMESTAMP(3),
ADD COLUMN     "monitoring_start" TIMESTAMP(3),
ALTER COLUMN "active_end_time" SET DEFAULT '17:00';
