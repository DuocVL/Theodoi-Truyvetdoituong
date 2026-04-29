
import trackingRepository from '../repositories/tracking.repository';

class TrackingService {
  async getCheckinHistory(subjectId: string, startTime: Date, endTime: Date) {
    const history = await trackingRepository.findCheckinHistory(
      subjectId,
      startTime,
      endTime
    );
    // In the future, we can add more business logic here, 
    // like enriching the data with address information from the coordinates.
    return history;
  }

  async getLastLocation(subjectId: string) {
    const lastCheckin = await trackingRepository.findLastCheckin(subjectId);
    return lastCheckin;
  }
}

export default new TrackingService();
