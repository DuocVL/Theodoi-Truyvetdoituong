
import { CheckinRepository } from '@/repositories/checkin.repository';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';
import { Checkin } from '@prisma/client';

export class CheckinService {
  // Service now depends on an abstraction, not a concrete implementation.
  constructor(private readonly checkinRepository: CheckinRepository) {}

  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    // Business logic can be expanded here. For example, validating if the subject is active.
    const newCheckin = await this.checkinRepository.createCheckin(data);
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
    // Logic for pagination or filtering can be added here if needed.
    const checkins = await this.checkinRepository.findCheckinsBySubject(subjectId);
    return checkins;
  }

  public async updateCheckin(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    // The existence check is now handled by the repository, 
    // so we can directly call the update method.
    const updatedCheckin = await this.checkinRepository.updateCheckin(id, data);
    return updatedCheckin;
  }

  public async deleteCheckin(id: string): Promise<Checkin> {
    // The existence check is also handled by the repository here.
    const deletedCheckin = await this.checkinRepository.deleteCheckin(id);
    return deletedCheckin;
  }
}
