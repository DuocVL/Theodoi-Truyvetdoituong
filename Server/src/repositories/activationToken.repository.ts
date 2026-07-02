import { prisma } from '../configs/prisma';
import { Account, ActivationToken } from '../../generated/prisma/client';

//Tạo mã kích haotj tài khoản mới 
export const create = async (accountId: string, token: string, expiresAt: Date): Promise<ActivationToken> => {
    return await prisma.activationToken.create({
        data: {
            account_id: accountId,
            token: token,
            expires_at: expiresAt,
        },
    });
};

//tìm kiếm một mã kích hoạt dựa trên chuỗi token dùng cho activate tài khoản
export const findByToken = async (token: string): Promise<(ActivationToken & { account: Account}) | null> => {
    return await prisma.activationToken.findUnique({
        where: { token },
        include: { account: true },//join lấy thông tin acccount
    });
};

//xóa bỏ mã kích hoạt dựa vào id dùng token hết hạn,kích hoạt thành công
export const deleteById = async (id: string): Promise<ActivationToken> => {
    return await prisma.activationToken.delete({ where: { id } });
};
