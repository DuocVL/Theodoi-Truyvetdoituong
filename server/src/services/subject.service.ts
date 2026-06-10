import { HttpException } from '@exceptions/http.exception';
import { Account, Prisma, PrismaClient, Subject } from '@prisma/client';
import { isEmpty } from '@utils/util';
import { CreateSubjectDto } from '@dtos/subjects.dto';

class SubjectService {
  public subjects = new PrismaClient().subject;
  public accounts = new PrismaClient().account;
  public prisma = new PrismaClient();

  public async findAllSubjects(): Promise<Subject[]> {
    // Tối ưu hóa: chỉ lấy các trường cần thiết cho danh sách
    const allSubjects = await this.subjects.findMany({
      select: {
          id: true,
          full_name: true,
          id_number: true,
          status: true,
          // Các trường khác được ẩn đi để tối ưu
      },
      orderBy: {
        created_at: 'desc'
      }
    }) as any;
    return allSubjects;
  }

  // FIX: Tối ưu hóa và bảo mật hàm findSubjectById
  public async findSubjectById(subjectId: string): Promise<Partial<Subject & Account>> {
    if (isEmpty(subjectId)) throw new HttpException(400, "SubjectId is empty");

    const findSubject = await this.subjects.findUnique({
      where: { id: subjectId },
      // Chỉ chọn các trường cần thiết cho việc chỉnh sửa
      select: {
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
        // Lấy email từ account liên quan, không lấy các thông tin nhạy cảm khác
        account: {
          select: {
            email: true,
          }
        }
      }
    });

    if (!findSubject) throw new HttpException(404, "Subject doesn't exist");

    // "Làm phẳng" cấu trúc dữ liệu để frontend dễ sử dụng
    const flattenedSubject = {
        ...findSubject,
        email: findSubject.account?.email, // Gộp email vào object chính
    };
    delete (flattenedSubject as any).account; // Xóa object account lồng nhau

    return flattenedSubject;
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
