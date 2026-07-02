import { prisma } from '../configs/prisma';
import { Account , Prisma, AccountStatus } from '../../generated/prisma/client';


//tạo account
export const create = async (data: Prisma.AccountCreateInput): Promise<Account> => {
    return await prisma.account.create({ data });
};

//tìm theo id dùng cho kiểm tra acesstoken
export const findById = async (id: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { id } });
};

//tìm kiếm theo username
export const findByUsername = async (username: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { username } });
};

//tỉm kiếm theo email
export const findByEmail = async (email: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { email } });
};

//cập nhật mật khẩu
export const updatePassword = async (id: string, password: string): Promise<Account> => {
    return await prisma.account.update({
        where: { id },
        data: { password },
    });
};

//cập nhật trạng thái 
export const updateStatus = async (id: string, status: AccountStatus): Promise<Account> => {
    return await prisma.account.update({
        where: { id },
        data: { status },
    });
};

//tìm kiếm danh sách tài khoản linh hoạt
export const findMany = async (where?: Prisma.AccountWhereInput, include?: Prisma.AccountInclude): Promise<Account[]> => {
    return await prisma.account.findMany({
        where,
        include
    });
};

//Tìm kiếm bản ghi đầu tiên thỏa mãn điều kiện
export const findFirst = async (where: Prisma.AccountWhereInput): Promise<Account | null> => {
    return await prisma.account.findFirst({ where });
};

//cập nhật thông tin tài khảon
export const update = async (id: string, data: Prisma.AccountUpdateInput): Promise<Account> => {
    return await prisma.account.update({
        where: { id },
        data
    });
};

//Truy vấn thông tin tài khoản đi kèm với hồ sơ thông tin chi tiết dánh cho user/subject
export const findByIdWithUserProfile = async (id: string): Promise<any> => {
    return await prisma.account.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    status: true,
                    avatar_id: true,
                    created_at: true,
                    update_at: true,
                    role: true, 
                }
            },
            subject: {
                select: {
                    id: true,
                    full_name: true,
                    dob: true,
                    gender: true,
                    id_number: true,
                    address: true,
                    phone: true,
                    avatar_id:true,
                }
            }
        }
    });
};
