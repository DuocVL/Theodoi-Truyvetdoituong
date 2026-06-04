import { prisma } from '../configs/prisma';
import { HttpException } from '../exceptions/http-exception';
import { createSubjectSchema, activateAccountSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import crypto from 'crypto';
import { hashData } from '../utils/hash';
import EmailService from './email.service';
import Zod from 'zod';


type CreateSubjectData = Zod.infer<typeof createSubjectSchema>;
type UpdateSubjectData = Zod.infer<typeof updateSubjectSchema>;
type ActivateAccountData = Zod.infer<typeof activateAccountSchema>;

class SubjectService {
  private emailService = new EmailService();

  public async createSubjectAndInvite(subjectData: CreateSubjectData, createdByUserId: string): Promise<any> {
    // Check for existing username or email
    const existingAccount = await prisma.account.findFirst({
      where: {
        OR: [{ username: subjectData.username }, { email: subjectData.email }],
      },
    });

    if (existingAccount) {
      throw new HttpException(409, `Account with this username or email already exists.`);
    }

    // Use a transaction to ensure all or nothing
    return prisma.$transaction(async (tx) => {
      // 1. Create Account
      const account = await tx.account.create({
        data: {
          username: subjectData.username,
          email: subjectData.email,
          type: 'SUBJECT',
          // Password is null until activated
        },
      });

      // 2. Create Subject profile
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

      // 3. Create Activation Token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      await tx.activationToken.create({
        data: {
          account_id: account.id,
          token: token,
          expires_at: expiresAt,
        },
      });

      // 4. Send invitation email (mock)
      // In a real app, the CLIENT_URL should come from config
      const activationLink = `http://localhost:3000/auth/activate?token=${token}`;
      await this.emailService.sendActivationEmail(account.email, subject.full_name, activationLink);

      return { subject, account };
    });
  }

  public async activateAccount(data: ActivateAccountData): Promise<void> {
    return prisma.$transaction(async (tx) => {
        // 1. Find the token and the associated account
        const activationToken = await tx.activationToken.findUnique({
            where: { token: data.token },
            include: { account: true },
        });

        if (!activationToken || !activationToken.account) {
            throw new HttpException(404, 'Invalid or expired activation token.');
        }

        if (new Date() > activationToken.expires_at) {
            // Here you might add logic to resend the invitation
            await tx.activationToken.delete({ where: { id: activationToken.id }});
            throw new HttpException(410, 'Token has expired.');
        }

        if (activationToken.account.status === 'ACTIVE') {
            throw new HttpException(400, 'Account is already active.');
        }

        // 2. Hash the new password
        const hashedPassword = await hashData(data.password);

        // 3. Update the account
        await tx.account.update({
            where: { id: activationToken.account_id },
            data: {
                password: hashedPassword,
                status: 'ACTIVE',
            },
        });

        // 4. Delete the used token
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
                  username: true
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
              account: true, // include all account details
              checkin: { // include recent checkin history
                  orderBy: {
                      checkin_time: 'desc'
                  },
                  take: 10
              },
              creator: {
                  select: {
                      id: true,
                      username: true,
                      email: true
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
      // We should use a transaction to delete the subject and their account together
      return prisma.$transaction(async (tx) => {
          const subject = await tx.subject.findUnique({ where: { id: subjectId } });
          if (!subject) {
              throw new HttpException(404, 'Subject not found');
          }

          // Delete related records first (checkins, etc.) if schema requires it
          await tx.checkin.deleteMany({ where: { subject_id: subjectId } });
          
          // Finally delete the account (which will cascade to subject due to relation)
          await tx.account.delete({ where: { id: subject.account_id } });

          return { message: "Subject and associated account deleted successfully." };
      });
  }

}

export default SubjectService;
