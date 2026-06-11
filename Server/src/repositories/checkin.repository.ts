
import { PrismaClient, Checkin, Prisma } from '@prisma/client';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';

export class CheckinRepository {
  private prisma = new PrismaClient();

  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    const { latitude, longitude, ...rest } = data;
    const point = `POINT(${longitude} ${latitude})`;

    // Prisma does not yet have first-class support for PostGIS geography types in its ORM methods (like create).
    // Therefore, a raw query is necessary to use the ST_GeomFromText function.
    // The transaction ensures that the INSERT and the subsequent SELECT are atomic.
    const result = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            INSERT INTO checkins (id, subject_id, notes, image_id, device_id, checkin_time, location)
            VALUES (uuid_generate_v4(), ${rest.subject_id}, ${rest.notes}, ${rest.image_id}, ${rest.device_id}, ${rest.checkin_time}, ST_GeomFromText(${point}, 4326))
        `;
        const newCheckin = await tx.checkin.findFirst({ 
            orderBy: { checkin_time: 'desc' },
            where: { subject_id: rest.subject_id }
         });
        return newCheckin;
    });
    

    if (!result) {
        throw new HttpException(500, 'Could not retrieve the check-in after creating it.');
    }

    return result;
  }

  public async findCheckinById(id: string): Promise<Checkin | null> {
    return this.prisma.checkin.findUnique({ where: { id } });
  }

  public async findCheckinsBySubject(subjectId: string): Promise<Checkin[]> {
    return this.prisma.checkin.findMany({ 
        where: { subject_id: subjectId },
        orderBy: { checkin_time: 'desc' } 
    });
  }

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
