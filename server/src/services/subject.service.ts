import { HttpException } from '@exceptions/http.exception';
import { Account, Prisma, PrismaClient, Subject } from '@prisma/client';
import { isEmpty } from '@utils/util';
import { CreateSubjectDto } from '@dtos/subjects.dto';

class SubjectService {
  public subjects = new PrismaClient().subject;
  public accounts = new PrismaClient().account;
  public prisma = new PrismaClient();

  public async findAllSubjects(): Promise<Subject[]> {
    const allSubjects: Subject[] = await this.subjects.findMany();
    return allSubjects;
  }

  public async findSubjectById(subjectId: string): Promise<Subject> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject: Subject = await this.subjects.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    return findSubject;
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

  public async updateSubject(subjectId: string, subjectData: CreateSubjectDto): Promise<Subject> {
    if (isEmpty(subjectData)) throw new HttpException(400, "subjectData is empty");

    const findSubject: Subject = await this.subjects.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    const updateSubjectData = await this.subjects.update({ where: { id: subjectId }, data: { ...subjectData } });
    return updateSubjectData;
  }

  // FIX: Sửa lại logic xóa để đảm bảo thứ tự đúng
  public async deleteSubject(subjectId: string): Promise<Subject> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject: Subject = await this.subjects.findUnique({ where: { id: subjectId } });
    if (!findSubject) throw new HttpException(409, "Subject doesn't exist");

    // Sử dụng transaction để đảm bảo cả hai hành động cùng thành công hoặc thất bại
    const deletedSubject = await this.prisma.$transaction(async (prisma) => {
        // 1. Xóa bản ghi Subject trước
        const deleted = await prisma.subject.delete({ where: { id: subjectId } });

        // 2. Sau đó mới xóa Account liên quan
        // findSubject.account_id chứa id của account cần xóa
        await prisma.account.delete({ where: { id: findSubject.account_id } });

        return deleted;
    });

    return deletedSubject;
  }
}

export default SubjectService;
