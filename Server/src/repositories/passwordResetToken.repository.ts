import { prisma } from '../configs/prisma';
import { PasswordResetToken } from '../../generated/prisma/client';

//tạo bản ghi token đổi mật khẩu
export const create = async (accountId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> => {
    return await prisma.passwordResetToken.create({
        data: {
            account_id: accountId,
            token: token,
            expires_at: expiresAt,
        },
    });
};

//tìm kiếm tokenreset
export const findByToken = async (token: string): Promise<PasswordResetToken | null> => {
    return await prisma.passwordResetToken.findUnique({ where: { token } });
};

//xóa token
export const deleteByToken = async (token: string): Promise<PasswordResetToken> => {
    return await prisma.passwordResetToken.delete({ where: { token } });
};
