
import { PrismaClient, Checkin, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';

/**
 * Repository class for all database interactions related to Check-ins.
 */
export class CheckinRepository {
  private prisma = new PrismaClient();

  /**
   * Creates a new check-in record in the database using a raw SQL query within a transaction
   * to handle the PostGIS `location` field and ensure atomicity.
   * @param data The data for the new check-in.
   * @returns The newly created Checkin object.
   * @throws HttpException if the check-in cannot be retrieved after creation.
   */
  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    const { latitude, longitude, ...rest } = data;
    const point = `POINT(${longitude} ${latitude})`;
    const newCheckinId = uuidv4(); // Generate UUID in the application to prevent race conditions.

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "Checkin" (id, subject_id, notes, image_id, device_id, checkin_time, location)
        VALUES (${newCheckinId}, ${rest.subject_id}, ${rest.notes}, ${rest.image_id}, ${rest.device_id}, ${rest.checkin_time}::timestamp, ST_SetSRID(ST_GeomFromText(${point}), 4326))
      `;
      
      // Fetch the newly created record by its known ID to safely return it.
      const newCheckin = await tx.checkin.findUnique({ 
        where: { id: newCheckinId }
      });

      return newCheckin;
    });

    if (!result) {
      throw new HttpException(500, 'Could not create or retrieve the check-in.');
    }

    return result;
  }

  /**
   * Finds a single check-in by its unique ID.
   * @param id The UUID of the check-in.
   * @returns A Checkin object or null if not found.
   */
  public async findCheckinById(id: string): Promise<Checkin | null> {
    return this.prisma.checkin.findUnique({ where: { id } });
  }

  /**
   * Retrieves all check-ins associated with a specific subject.
   * @param subjectId The UUID of the subject.
   * @returns An array of Checkin objects.
   */
  public async findCheckinsBySubject(subjectId: string): Promise<Checkin[]> {
    return this.prisma.checkin.findMany({
      where: { subject_id: subjectId },
      orderBy: { checkin_time: 'desc' },
    });
  }

  /**
   * Updates an existing check-in.
   * @param id The UUID of the check-in to update.
   * @param data The data to update.
   * @returns The updated Checkin object.
   * @throws HttpException if the check-in with the given ID is not found.
   */
  public async updateCheckin(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    try {
      return await this.prisma.checkin.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException(404, 'Check-in not found.');
      }
      throw error;
    }
  }

  /**
   * Deletes a check-in from the database.
   * @param id The UUID of the check-in to delete.
   * @returns The deleted Checkin object.
   * @throws HttpException if the check-in with the given ID is not found.
   */
  public async deleteCheckin(id: string): Promise<Checkin> {
    try {
      return await this.prisma.checkin.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException(404, 'Check-in not found.');
      }
      throw error;
    }
  }
}
