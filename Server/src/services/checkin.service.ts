
import { CheckinRepository } from '@/repositories/checkin.repository';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';
import { Checkin } from '@prisma/client';

export class CheckinService {
  private checkinRepository = new CheckinRepository();

  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    // Here you could add more business logic, 
    // e.g., check if the subject exists, if the location is within a valid zone, etc.
    const newCheckin = await this.checkinRepository.createCheckin(data);
    if (!newCheckin) {
      throw new HttpException(500, 'Could not create check-in');
    }
    return newCheckin;
  }

  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findCheckinById(id);
    if (!checkin) {
      throw new HttpException(404, 'Check-in not found');
    }
    return checkin;
  }

  public async getCheckinsBySubject(subjectId: string): Promise<Checkin[]> {
    // You might want to add pagination here for performance reasons
    const checkins = await this.checkinRepository.findCheckinsBySubject(subjectId);
    return checkins;
  }

  public async updateCheckin(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    const checkin = await this.getCheckinById(id); // Ensures check-in exists
    const updatedCheckin = await this.checkinRepository.updateCheckin(id, data);
    return updatedCheckin;
  }

  public async deleteCheckin(id: string): Promise<void> {
    const checkin = await this.getCheckinById(id); // Ensures check-in exists
    await this.checkinRepository.deleteCheckin(id);
  }
}
