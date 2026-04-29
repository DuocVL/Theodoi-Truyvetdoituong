
import { PrismaClient } from '../../generated/prisma';
import { HttpException } from '../exceptions/HttpException';
import { createSubjectSchema, activateAccountSchema } from '../dtos/subjects.dto';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import EmailService from './email.service';

type CreateSubjectData = Zod.infer<typeof createSubjectSchema>;
type ActivateAccountData = Zod.infer<typeof activateAccountSchema>;

class SubjectService {
  private prisma = new PrismaClient();
  private emailService = new EmailService();

  public async createSubjectAndInvite(subjectData: CreateSubjectData, createdByUserId: string): Promise<any> {
    // Check for existing username or email
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        OR: [{ username: subjectData.username }, { email: subjectData.email }],
      },
    });

    if (existingAccount) {
      throw new HttpException(409, `Account with this username or email already exists.`);
    }

    // Use a transaction to ensure all or nothing
    return this.prisma.$transaction(async (tx) => {
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
    return this.prisma.$transaction(async (tx) => {
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
        const hashedPassword = await bcrypt.hash(data.password, 10);

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
}

export default SubjectService;
