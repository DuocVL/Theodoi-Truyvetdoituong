import { prisma } from '../configs/prisma';
import { HttpException } from '../exceptions/http-exception';
import { createSubjectSchema, activateAccountSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import crypto from 'crypto';
import { hashData } from '../utils/hash';
import { sendActivationEmail } from './email.service'; // Use the singleton instance
import Zod from 'zod';
import { env } from '../configs/env';
import { SubjectStatus } from '../../generated/prisma/enums';
import { getSubjectByAccountId } from '../repositories/subject.repository';
import { getUserByAccountId } from '../repositories/user.repository';

type CreateSubjectData = Zod.infer<typeof createSubjectSchema>;
type UpdateSubjectData = Zod.infer<typeof updateSubjectSchema>;
type ActivateAccountData = Zod.infer<typeof activateAccountSchema>;

//xử lý các nghiệp vụ liên quan đến dối tượng

class SubjectService {

  //tạo hồ sơ 
  public async createSubjectAndInvite(subjectData: CreateSubjectData, createdByUserId: string): Promise<any> {
    
    //kiểm tra email đã tồn tịa chưa
    const existingAccount = await prisma.account.findFirst({
      where: {
        OR: [{ email: subjectData.email }],
      },
    });
    if (existingAccount) throw new HttpException(409, `Tài khoản với email này đã tồn tại trong hệ thống.`);
    
    //thực hiện đồng thời việc tạo bản ghi account và subject
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          username: subjectData.email, // Sử dụng email làm username mặc định
          email: subjectData.email,
          type: 'SUBJECT',
        },
      });

      const subject = await tx.subject.create({
        data: {
          full_name: subjectData.fullName,
          account_id: account.id,
          created_by: createdByUserId,
          dob: subjectData.dob ? new Date(subjectData.dob) : undefined,
          gender: subjectData.gender,
          id_number: subjectData.idNumber,
          address: subjectData.address,
          phone: subjectData.phone,
          monitoring_start: subjectData.monitoringStart ? new Date(subjectData.monitoringStart) : undefined,
          monitoring_end: subjectData.monitoringEnd ? new Date(subjectData.monitoringEnd) : undefined,
          interval_minutes: subjectData.interval_minutes,
          grace_minutes: subjectData.grace_minutes,
          active_start_time: subjectData.active_start_time ? subjectData.active_start_time : undefined,
          active_end_time: subjectData.active_end_time ? subjectData.active_end_time : undefined,

        },
      });

      //tạo token dành cho active tài khoản
      const token = crypto.randomUUID();//UUID RFC 4122 36 kí tự
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await tx.activationToken.create({
        data: {
          account_id: account.id,
          token: token,
          expires_at: expiresAt,
        },
      });

      //gửi email active tài khoản
      if (!account.email) throw new HttpException(400, 'Subject email is required to send activation invitation.');
      const activationLink = `${env.FRONTEND_URL}/activate-account/subjects?token=${token}`;
      // Call the singleton service directly
      await sendActivationEmail(account.email, activationLink);

      return { subject, account };
    });
  }

  //active tài khoản
  public async activateAccount(data: ActivateAccountData): Promise<void> {

    return prisma.$transaction(async (tx) => {

      //kiểm tra token này có tồn tịa và có liên kết đến tài khoản nào không
      const activationToken = await tx.activationToken.findUnique({
        where: { token: data.token },
        include: { account: true },
      });
      if (!activationToken || !activationToken.account) throw new HttpException(404, 'Mã kích hoạt không hợp lệ hoặc không tồn tại.');

      //kiểm tra mã kích hoạt đã hết hạn chưa nếu hết hạn xóa yêu cầu người dùng gửi lại yêu cầu
      if (new Date() > activationToken.expires_at) {
        await tx.activationToken.delete({ where: { id: activationToken.id } });
        throw new HttpException(410, 'Mã kích hoạt đã hết hạn.');
      }

      //tài khoản đã kích hoạt -> lỗi
      if (activationToken.account.status === 'ACTIVE') throw new HttpException(400, 'Tài khoản này đã được kích hoạt trước đó.');

      // Kiểm tra xem username Subject chọn đã có ai sử dụng chưa
      const existingUsername = await tx.account.findFirst({
        where: {
          username: data.username,
          NOT: { id: activationToken.account_id }
        }
      });
      if (existingUsername) {
        throw new HttpException(409, 'Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
      }

      //hash pass và lưu dữ liệu account mới
      const hashedPassword = await hashData(data.password);
      await tx.account.update({
        where: { id: activationToken.account_id },
        data: {
          username: data.username, // Cập nhật tên đăng nhập do Subject tự chọn
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });

      // Cập nhật trạng thái của hồ sơ Subject tương ứng thành đã thiết lập nhưng NO_FACE
      await tx.subject.update({
        where: { account_id: activationToken.account_id },
        data: {
          status: SubjectStatus.NO_FACE,
        },
      });

      await tx.activationToken.delete({ where: { id: activationToken.id } });
    });
  }

  //lấy danh sách các đối tượng
  public async findAllSubjects(role: string, userId: string): Promise<any[]> {
    // Định nghĩa điều kiện lọc
    let whereCondition: any = {};

    // Nếu là USER, chỉ lấy những subject mà user đó tạo
    if (role === 'USER') {
      whereCondition = {
        created_by: userId
      };
    }

    //lấy danh sách đối tượng và join các thông tin cần thiết
    const subjects = await prisma.subject.findMany({
      where: whereCondition,
      include: {
        account: {
          select: {
            email: true,
            status: true
          }
        },
        creator: {
          select: {
            id: true,
            full_name: true,
            account: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    return subjects;
  }

  //lấy thông tin chi tiết 1 subject
  public async findSubjectById(subjectId: string, accountId: string, role: string): Promise<any> {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            status: true,
            type: true,
            
          }
        },
        avatar:{
          select:{
            url: true,
          }
        }
      }
    });
    if (!subject) throw new HttpException(404, 'Subject not found');

    //kiểm tra quyền truy cập
    if(role === "SUBJECT"){//nếu là subject chỉ lấy được thông tin của chính mình
      const subjectRequest = await getSubjectByAccountId(accountId);
      if(!subjectRequest || subjectRequest.id !== subjectId) throw new HttpException(403, "Không có quyền")
    }else if (role === "USER"){
      const user = await getUserByAccountId(accountId);
      if(!user || subject.created_by !== user.id) throw new HttpException(403, "Không có quyền")
    }

    return subject;
  }

  //cập nhật thông tin hồ sơ đối tượng
  public async updateSubject(subjectId: string, subjectData: UpdateSubjectData, accountId: string, role: string): Promise<any> {
    //kiểm tra subject có tồn tại không
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new HttpException(404, 'Subject not found');
    }

    //kiểm tra quyền
    if(role === "SUBJECT") throw new HttpException(403, 'Forbidden');//subject ko có quyền cập nhật hồ sơ
    else if(role === "USER"){//user có quyền cập nhật subject mình quản lý
      const user = await getUserByAccountId(accountId);
      if(!user) throw new HttpException(404, "User not found");
      if(user.id !== subject.created_by) throw new HttpException(403, 'Forbidden');
    }

    //cập nhật thông tin
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        full_name: subjectData.fullName,
        dob: subjectData.dob ? new Date(subjectData.dob) : undefined,
        gender: subjectData.gender,
        id_number: subjectData.idNumber,
        address: subjectData.address,
        phone: subjectData.phone,
        monitoring_start: subjectData.monitoringStart ? new Date(subjectData.monitoringStart) : undefined,
        monitoring_end: subjectData.monitoringEnd ? new Date(subjectData.monitoringEnd) : undefined,
      }
    });

    return updatedSubject;
  }

  //xóa đối tượng
  public async deleteSubject(subjectId: string, accountId: string, role: string): Promise<any> {
    //kiểm tra subject có tồn tại không
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new HttpException(404, 'Subject not found');
    }

    //kiểm tra quyền
    if(role === "SUBJECT") throw new HttpException(403, 'Forbidden');//subject ko có quyền cập nhật hồ sơ
    else if(role === "USER"){//user có quyền cập nhật subject mình quản lý
      const user = await getUserByAccountId(accountId);
      if(!user) throw new HttpException(404, "User not found");
      if(user.id !== subject.created_by) throw new HttpException(403, 'Forbidden');
    }

    // Lấy account_id ra trước khi thực hiện transaction
    const accountIdToDelete = subject.account_id;

    //xóa đầu tiên xóa subject sau đó xóa account
    return prisma.$transaction(async (tx) => {
      await tx.subject.delete({ where: { id: subjectId } });
      // Đảm bảo accountId tồn tại trước khi xóa
      if (accountIdToDelete) {
        await tx.account.delete({ where: { id: accountIdToDelete } });
      }

      return { message: "Subject and associated account deleted successfully." };
    });
  }

  public async updateToken(accountId: string, fcm_token: string): Promise<any> {
    try {
      //xác định subject
      const subject = await getSubjectByAccountId(accountId)
      if(!subject) throw new HttpException(404,'Unauthorized: Account ID not found');

      //cập nhật
      await prisma.subject.update({
        where: { id: subject.id },
        data: { fcm_token: fcm_token }
      })
    } catch (error) {
      throw new HttpException(500, 'Update error');
    }
  }

}

export default SubjectService;
