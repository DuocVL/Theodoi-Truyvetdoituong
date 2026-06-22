-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "zone_id" TEXT;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
