
import { PrismaClient, Checkin } from '@prisma/client';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';

export class CheckinRepository {
  private prisma = new PrismaClient();

  public async createCheckin(data: CreateCheckinDto): Promise<Checkin> {
    const { latitude, longitude, ...rest } = data;
    const location = `POINT(${longitude} ${latitude})`;

    const newCheckin = await this.prisma.$executeRaw`
        INSERT INTO checkins (subject_id, notes, image_id, device_id, checkin_time, location) 
        VALUES (${rest.subject_id}, ${rest.notes}, ${rest.image_id}, ${rest.device_id}, ${rest.checkin_time}, ST_GeomFromText(${location}, 4326))
    `;
    //This is not ideal, but we have to do it because of the raw query
    const createdCheckin = await this.prisma.checkin.findFirst({
        orderBy: {
            checkin_time: 'desc'
        }
    })

    return createdCheckin as Checkin;
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
    return this.prisma.checkin.update({
      where: { id },
      data,
    });
  }

  public async deleteCheckin(id: string): Promise<Checkin> {
    return this.prisma.checkin.delete({ where: { id } });
  }
}
