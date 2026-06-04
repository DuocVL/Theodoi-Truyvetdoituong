
import { Prisma } from '../../generated/prisma';
import trackingRepository from '../repositories/tracking.repository';

class TrackingService {
  async getCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    const history: any[] = await trackingRepository.findCheckinHistory(
      subjectId,
      startTime,
      endTime
    ) as any[];
    return history.map(log => ({
      ...log,
      location: log.location ? JSON.parse(log.location) : null
    }));
  }

  async getLastLocation(subjectId: string) {
    const lastCheckin: any = await trackingRepository.findLastCheckin(subjectId);
    if (lastCheckin) {
      lastCheckin.location = lastCheckin.location ? JSON.parse(lastCheckin.location) : null;
    }
    return lastCheckin;
  }

  // New service method to get all logs and format them for the dashboard
  async getAllTrackingLogs() {
    const logs: any[] = await trackingRepository.findAllLogs() as any[];

    // Transform the data to the format expected by the frontend
    const formattedLogs = logs.map(log => {
      const parsedLocation = log.location ? JSON.parse(log.location) : null;
      return {
        id: log.id,
        subject_id: log.subject_id,
        subject_name: log.subject_name,
        timestamp: log.checkin_time,
        coordinates: parsedLocation ? parsedLocation.coordinates : [0, 0],
      };
    });

    return formattedLogs;
  }
}

export default new TrackingService();
