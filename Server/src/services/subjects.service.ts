import { prisma } from '../configs/prisma';
import { HttpException } from '../exceptions/http-exception';
import { createSubjectSchema, activateAccountSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import crypto from 'crypto';
import { hashData } from '../utils/hash';
import { emailService } from './email.service'; // Use the singleton instance
import Zod from 'zod';
import { env } from '../configs/env';

type CreateSubjectData = Zod.infer<typeof createSubjectSchema>;
type UpdateSubjectData = Zod.infer<typeof updateSubjectSchema>;
type ActivateAccountData = Zod.infer<typeof activateAccountSchema>;

class SubjectService {
  // No longer need: private emailService = new EmailService();

  public async createSubjectAndInvite(subjectData: CreateSubjectData, createdByUserId: string): Promise<any> {
    const existingAccount = await prisma.account.findFirst({
      where: {
        OR: [{ email: subjectData.email }],
      },
    });

    if (existingAccount) {
      throw new HttpException(409, `Tài khoản với email này đã tồn tại trong hệ thống.`);
    }

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
        },
      });

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tx.activationToken.create({
        data: {
          account_id: account.id,
          token: token,
          expires_at: expiresAt,
        },
      });

      if (!account.email) {
        throw new HttpException(400, 'Subject email is required to send activation invitation.');
      }

      // Use the correct frontend URL from env config
      const activationLink = `${env.FRONTEND_URL}/subjects/activate?token=${token}`;
      // Call the singleton service directly
      await emailService.sendActivationEmail(account.email, subject.full_name, activationLink);

      return { subject, account };
    });
  }

  public async activateAccount(data: ActivateAccountData): Promise<void> {
    return prisma.$transaction(async (tx) => {
        const activationToken = await tx.activationToken.findUnique({
            where: { token: data.token },
            include: { account: true },
        });

        if (!activationToken || !activationToken.account) {
            throw new HttpException(404, 'Mã kích hoạt không hợp lệ hoặc không tồn tại.');
        }

        if (new Date() > activationToken.expires_at) {
            await tx.activationToken.delete({ where: { id: activationToken.id }});
            throw new HttpException(410, 'Mã kích hoạt đã hết hạn.');
        }

        if (activationToken.account.status === 'ACTIVE') {
            throw new HttpException(400, 'Tài khoản này đã được kích hoạt trước đó.');
        }

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

        const hashedPassword = await hashData(data.password);

        await tx.account.update({
            where: { id: activationToken.account_id },
            data: {
                username: data.username, // Cập nhật tên đăng nhập do Subject tự chọn
                password: hashedPassword,
                status: 'ACTIVE',
            },
        });

        await tx.activationToken.delete({ where: { id: activationToken.id }});
    });
  }

  public async findAllSubjects(): Promise<any[]> {
    const subjects = await prisma.subject.findMany({
        include: {
            account: {
                select: {
                    username: true,
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
                      username: true,
                      email: true
                    }
                  }
                }
            }
        }
    });
    return subjects;
  }

  public async findSubjectById(subjectId: string): Promise<any> {
      const subject = await prisma.subject.findUnique({
          where: { id: subjectId },
          include: {
              account: true, 
              checkin: { 
                  orderBy: {
                      checkin_time: 'desc'
                  },
                  take: 10
              },
              creator: {
                  select: {
                      id: true,
                      full_name: true,
                      account: {
                        select: {
                          username: true,
                          email: true
                        }
                      }
                  }
              }
          }
      });

      if (!subject) {
          throw new HttpException(404, 'Subject not found');
      }

      return subject;
  }

  public async updateSubject(subjectId: string, subjectData: UpdateSubjectData): Promise<any> {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
          throw new HttpException(404, 'Subject not found');
      }

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

  public async deleteSubject(subjectId: string): Promise<any> {
      return prisma.$transaction(async (tx) => {
          const subject = await tx.subject.findUnique({ where: { id: subjectId } });
          if (!subject) {
              throw new HttpException(404, 'Subject not found');
          }

          await tx.account.delete({ where: { id: subject.account_id } });

          return { message: "Subject and associated account deleted successfully." };
      });
  }

}

export default SubjectService;
