import { HttpException } from '@exceptions/http.exception';
import { Account, Prisma, PrismaClient, Subject } from '@prisma/client';
import { isEmpty } from '@utils/util';
import { CreateSubjectDto } from '@dtos/subjects.dto';

/**
 * "Làm phẳng" cấu trúc subject, gộp email từ account vào.
 * @param subject - Đối tượng subject có chứa object account lồng nhau.
 * @returns Đối tượng subject đã được làm phẳng.
 */
const flattenSubject = (subject: any) => {
  if (!subject) return subject;
  const { account, ...rest } = subject;
  return {
    ...rest,
    email: account?.email,
  };
};

class SubjectService {
  public subjects = new PrismaClient().subject;
  public accounts = new PrismaClient().account;
  public prisma = new PrismaClient();

  // FIX: Sửa lại hàm findAll để trả về dữ liệu nhất quán
  public async findAllSubjects(): Promise<any[]> {
    const allSubjects = await this.subjects.findMany({
      orderBy: {
        created_at: 'desc'
      },
      include: {
        account: {
          select: { email: true }
        }
      }
    });
    // Áp dụng hàm flatten cho tất cả các đối tượng trong danh sách
    return allSubjects.map(flattenSubject);
  }

  // FIX: Sử dụng lại hàm flatten để đảm bảo nhất quán
  public async findSubjectById(subjectId: string): Promise<Partial<Subject & Account>> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject = await this.subjects.findUnique({
      where: { id: subjectId },
      include: {
        account: {
          select: { email: true }
        }
      }
    });

    if (!findSubject) throw new HttpException(404, "Subject doesn't exist");

    // Sử dụng hàm flatten chung
    return flattenSubject(findSubject);
  }

  public async createSubject(subjectData: CreateSubjectDto, createdBy: string): Promise<Subject> {
    if (isEmpty(subjectData)) throw new HttpException(400, "subjectData is empty");

    const findSubject: Subject = await this.subjects.findFirst({ where: { id_number: subjectData.id_number } });
    if (findSubject) throw new HttpException(409, `This id_number ${subjectData.id_number} already exists`);

    const newSubject = await this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.create({
        data: {
          email: subjectData.email,
          type: 'SUBJECT'
        }
      });

      const subject = await prisma.subject.create({
        data: {
          ...subjectData,
          account_id: account.id,
          created_by: createdBy
        }
      });
      return subject;
    });

    return newSubject;
  }

  public async updateSubject(subjectId: string, subjectData: Partial<CreateSubjectDto>): Promise<Subject> {
    if (isEmpty(subjectData)) throw new HttpException(400, "subjectData is empty");

    const findSubject: Subject = await this.subjects.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    const updateSubjectData = await this.subjects.update({ where: { id: subjectId }, data: { ...subjectData } });
    return updateSubjectData;
  }

  public async deleteSubject(subjectId: string): Promise<Subject> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject: Subject = await this.subjects.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    const deletedSubject = await this.prisma.$transaction(async (prisma) => {
        const deleted = await prisma.subject.delete({ where: { id: subjectId } });
        await prisma.account.delete({ where: { id: findSubject.account_id } });
        return deleted;
    });

    return deletedSubject;
  }
}

export default SubjectService;
