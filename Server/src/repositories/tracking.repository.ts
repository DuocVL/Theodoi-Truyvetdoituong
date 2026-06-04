
import { PrismaClient } from '../../generated/prisma';

class TrackingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    return this.prisma.checkin.findMany({
      where: {
        subject_id: subjectId,
        checkin_time: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        checkin_time: 'asc',
      },
    });
  }

  async findLastCheckin(subjectId: string) {
    return this.prisma.checkin.findFirst({
      where: {
        subject_id: subjectId,
      },
      orderBy: {
        checkin_time: 'desc',
      },
    });
  }

  // New method to get all tracking logs
  async findAllLogs() {
    return this.prisma.tracking_log.findMany({
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        subject: true, // Include subject details
      },
    });
  }
}

export default new TrackingRepository();
