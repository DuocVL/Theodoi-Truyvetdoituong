
import { Prisma } from '../../generated/prisma';
import trackingRepository from '../repositories/tracking.repository';

class TrackingService {
  async getCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    const history = await trackingRepository.findCheckinHistory(
      subjectId,
      startTime,
      endTime
    );
    return history;
  }

  async getLastLocation(subjectId: string) {
    const lastCheckin = await trackingRepository.findLastCheckin(subjectId);
    return lastCheckin;
  }

  // New service method to get all logs and format them for the dashboard
  async getAllTrackingLogs() {
    const logs = await trackingRepository.findAllLogs();

    // Transform the data to the format expected by the frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      subject_id: log.subject_id,
      subject_name: `${log.subject.first_name} ${log.subject.last_name}`.trim(),
      timestamp: log.timestamp,
      // The location is a Prisma.JsonValue, we need to assert its type
      coordinates: (log.location as any).coordinates as [number, number],
    }));

    return formattedLogs;
  }
}

export default new TrackingService();
