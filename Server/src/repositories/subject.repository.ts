import { prisma } from '../configs/prisma';
import { Subject, Prisma } from '../../generated/prisma/client';

//repository phục vụ yêu cầu làm việc với Subject trong csdl

//tạo Subject
export async function create(data: Prisma.SubjectCreateInput): Promise<Subject> {
    return prisma.subject.create({
        data
    });
}

//cập nhật thông tin
export async function update(id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    return prisma.subject.update({
        where: { id },
        data
    });
}

//tìm kiếm theo id
export async function findById(id: string): Promise<Subject | null> {
    return prisma.subject.findUnique({
        where: { id },
    });
}

//lấy subject theo accountId
export const getSubjectByAccountId = async (account_id: string): Promise<Subject | null> => {
  return await prisma.subject.findUnique({ where: { account_id } });
};

//tìm kiếm subject theo full_name
export async function findByFullName(full_name: string): Promise<Subject[]> {
    return prisma.subject.findMany({
        where: { 
            full_name: { contains: full_name, mode: 'insensitive' } //trong full_name bao gồm tham số tìm kiếm
        }
    });
}