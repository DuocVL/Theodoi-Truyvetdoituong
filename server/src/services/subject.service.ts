import { HttpException } from '@exceptions/http.exception';
import { Account, PrismaClient, Subject } from '@prisma/client';
import { isEmpty } from '@utils/util';
import { CreateSubjectDto } from '@dtos/subjects.dto';

const flattenSubject = (subject: any) => {
  if (!subject) return subject;
  const { account, ...rest } = subject;
  return {
    ...rest,
    email: account?.email,
  };
};

class SubjectService {
  private prisma = new PrismaClient();

  // FIX: Dùng SELECT để chỉ lấy các trường cần thiết cho danh sách
  public async findAllSubjects(): Promise<any[]> {
    const allSubjects = await this.prisma.subject.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        id_number: true,
        status: true,
        account: {
          select: { email: true },
        },
      },
    });
    return allSubjects.map(flattenSubject);
  }

  // FIX: Dùng SELECT để whitelist các trường, ngăn rò rỉ dữ liệu nhạy cảm
  public async findSubjectById(subjectId: string): Promise<Partial<Subject & { email: string }>> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { // CHỈ LẤY CÁC TRƯỜNG SAU:
        id: true,
        full_name: true,
        dob: true,
        gender: true,
        id_number: true,
        address: true,
        phone: true,
        status: true,
        monitoring_start: true,
        monitoring_end: true,
        account: { // Và chỉ lấy email từ account
          select: {
            email: true,
          },
        },
        // Tất cả các trường khác (account_id, created_by, creator, checkin...) sẽ không được lấy
      },
    });

    if (!findSubject) throw new HttpException(404, "Subject doesn't exist");
    return flattenSubject(findSubject);
  }

  public async createSubject(subjectData: CreateSubjectDto, createdBy: string): Promise<Subject> {
    if (isEmpty(subjectData)) throw new HttpException(400, "subjectData is empty");

    const findSubject = await this.prisma.subject.findFirst({ where: { id_number: subjectData.id_number } });
    if (findSubject) throw new HttpException(409, `This id_number ${subjectData.id_number} already exists`);

    return this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.create({
        data: {
          email: subjectData.email,
          type: 'SUBJECT',
        },
      });

      return prisma.subject.create({
        data: {
          ...subjectData,
          account_id: account.id,
          created_by: createdBy,
        },
      });
    });
  }

  public async updateSubject(subjectId: string, subjectData: Partial<CreateSubjectDto>): Promise<any> {
    if (isEmpty(subjectData)) throw new HttpException(400, "subjectData is empty");

    const findSubject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    const { email, ...subjectInfo } = subjectData;

    await this.prisma.$transaction(async (prisma) => {
      await prisma.subject.update({
        where: { id: subjectId },
        data: { ...subjectInfo },
      });

      if (email && findSubject.account_id) {
        await prisma.account.update({
          where: { id: findSubject.account_id },
          data: { email: email },
        });
      }
    });
    
    return this.findSubjectById(subjectId);
  }

  public async deleteSubject(subjectId: string): Promise<Subject> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    if (!findSubject.account_id) {
        return await this.prisma.subject.delete({ where: { id: subjectId }});
    }

    return this.prisma.$transaction(async (prisma) => {
      const deletedSubject = await prisma.subject.delete({ where: { id: subjectId } });
      await prisma.account.delete({ where: { id: findSubject.account_id } });
      return deletedSubject;
    });
  }
}

export default SubjectService;
