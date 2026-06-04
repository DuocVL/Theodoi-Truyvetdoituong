
import { PrismaClient } from '../../generated/prisma';

class TrackingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    return this.prisma.$queryRaw`
      SELECT id::text, subject_id, ST_AsGeoJSON(location) as location, image_url, face_verified, confidence, status, checkin_time
      FROM checkins
      WHERE subject_id = ${subjectId}
        AND checkin_time >= ${startTime}
        AND checkin_time <= ${endTime}
      ORDER BY checkin_time ASC
    `;
  }

  async findLastCheckin(subjectId: string) {
    const records = await this.prisma.$queryRaw<any[]>`
      SELECT id::text, subject_id, ST_AsGeoJSON(location) as location, image_url, face_verified, confidence, status, checkin_time
      FROM checkins
      WHERE subject_id = ${subjectId}
      ORDER BY checkin_time DESC
      LIMIT 1
    `;
    return records[0] || null;
  }

  async findAllLogs() {
    return this.prisma.$queryRaw`
      SELECT c.id::text, c.subject_id, ST_AsGeoJSON(c.location) as location, c.checkin_time, s.full_name as subject_name
      FROM checkins c
      JOIN subjects s ON c.subject_id = s.id
      ORDER BY c.checkin_time ASC
    `;
  }
}

export default new TrackingRepository();
