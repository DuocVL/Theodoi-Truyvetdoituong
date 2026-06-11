
import { CheckinRepository } from '@/repositories/checkin.repository';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';
import { Checkin } from '@prisma/client';

/**
 * Service class that encapsulates the business logic for the check-in module.
 */
export class CheckinService {
  /**
   * Injects the CheckinRepository dependency through the constructor.
   * @param checkinRepository An instance of CheckinRepository.
   */
  constructor(private readonly checkinRepository: CheckinRepository) {}

  /**
   * Handles the business logic for creating a new check-in.
   * @param data The validated data for creating a check-in.
   * @returns The newly created check-in.
   */
  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    // Future business logic can be added here, e.g., checking if the subject is allowed to check in.
    const newCheckin = await this.checkinRepository.createCheckin(data);
    return newCheckin;
  }

  /**
   * Retrieves a single check-in by its ID.
   * @param id The UUID of the check-in.
   * @returns The found Checkin object.
   * @throws HttpException if no check-in is found.
   */
  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findCheckinById(id);
    if (!checkin) {
      throw new HttpException(404, 'Check-in not found');
    }
    return checkin;
  }

  /**
   * Retrieves all check-ins for a given subject.
   * @param subjectId The UUID of the subject.
   * @returns An array of check-ins.
   */
  public async getCheckinsBySubject(subjectId: string): Promise<Checkin[]> {
    const checkins = await this.checkinRepository.findCheckinsBySubject(subjectId);
    return checkins;
  }

  /**
   * Handles the business logic for updating a check-in.
   * @param id The UUID of the check-in to update.
   * @param data The data to update.
   * @returns The updated check-in.
   */
  public async updateCheckin(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    // The repository handles the not-found error, so the service can be this simple.
    const updatedCheckin = await this.checkinRepository.updateCheckin(id, data);
    return updatedCheckin;
  }

  /**
   * Handles the business logic for deleting a check-in.
   * @param id The UUID of the check-in to delete.
   * @returns The deleted check-in data.
   */
  public async deleteCheckin(id: string): Promise<Checkin> {
    const deletedCheckin = await this.checkinRepository.deleteCheckin(id);
    return deletedCheckin;
  }
}
