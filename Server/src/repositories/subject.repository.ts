import { prisma } from '../configs/prisma';
import { Subject, Prisma } from '../../generated/prisma/client';

export async function create(data: Prisma.SubjectCreateInput): Promise<Subject> {
    return prisma.subject.create({
        data
    });
}

export async function update(id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    return prisma.subject.update({
        where: { id },
        data
    });
}

export async function findById(id: string): Promise<Subject | null> {
    return prisma.subject.findUnique({
        where: { id },
        // Mặc định không include account để tránh rò rỉ username/password.
        // Nếu cần lấy thông tin liên quan, hãy sử dụng select cụ thể trong Service.
    });
}

export async function findByFullName(full_name: string): Promise<Subject[]> {
    return prisma.subject.findMany({
        where: { 
            full_name: { contains: full_name, mode: 'insensitive' } 
        }
    });
}