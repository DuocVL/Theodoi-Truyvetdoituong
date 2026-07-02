import { prisma } from '../configs/prisma';
import { RefreshToken, Prisma } from '../../generated/prisma/client';

//Tạo bản ghi refreshtoken 
export const create = async (data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> => {
    return await prisma.refreshToken.create({ 
        data: data
    });
};

//Tìm kiếm một bản ghi refreshtoken dúng mục đích xác thực token khi xin token mới
export const findByToken = async (token_hash: string): Promise<RefreshToken | null> => {
    return await prisma.refreshToken.findUnique({ where: { token_hash } });
};

//xóa bỏ token cũ khi logout, tạo token mới
export const deleteByToken = async (token_hash: string): Promise<RefreshToken> => {
    return await prisma.refreshToken.delete({ where: { token_hash } });
};

//Xóa bỏ các refreshtoken cũ liên kết với tài khoản này trên thiết bị đó xóa các phiên cũ
export const deleteByAccountIdAndDeviceId = async (accountId: string, deviceId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({
        where: {
            account_id: accountId,
            device_id: deviceId,
        },
    });
};
