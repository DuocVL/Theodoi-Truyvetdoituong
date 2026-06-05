
import { prisma } from '../configs/prisma';

class TrackingRepository {
  async findCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    return prisma.$queryRaw`
      SELECT c.id::text, c.subject_id, ST_AsGeoJSON(c.location) as location, i.url as image_url, c.face_verified, c.confidence, c.status, c.checkin_time
      FROM checkins c
      LEFT JOIN images i ON c.image_id = i.id
      WHERE c.subject_id = ${subjectId}
        AND c.checkin_time >= ${startTime}
        AND c.checkin_time <= ${endTime}
      ORDER BY c.checkin_time ASC
    `;
  }

  async findLastCheckin(subjectId: string) {
    const records = await prisma.$queryRaw<any[]>`
      SELECT c.id::text, c.subject_id, ST_AsGeoJSON(c.location) as location, i.url as image_url, c.face_verified, c.confidence, c.status, c.checkin_time
      FROM checkins c
      LEFT JOIN images i ON c.image_id = i.id
      WHERE c.subject_id = ${subjectId}
      ORDER BY c.checkin_time DESC
      LIMIT 1
    `;
    return records[0] || null;
  }

  async findAllLogs() {
    return prisma.$queryRaw`
      SELECT c.id::text, c.subject_id, ST_AsGeoJSON(c.location) as location, c.checkin_time, s.full_name as subject_name
      FROM checkins c
      JOIN subjects s ON c.subject_id = s.id
      ORDER BY c.checkin_time ASC
    `;
  }
}

export default new TrackingRepository();
