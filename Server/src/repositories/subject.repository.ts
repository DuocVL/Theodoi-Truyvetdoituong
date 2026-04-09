import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma'

export async function create(data: Prisma.SubjectCreateInput) {
    return prisma.subject.create({
        data
    });
}

export async function update(id: string, data: Prisma.SubjectCreateInput) {
    return prisma.subject.update({
        where: { id },
        data
    });
}

export async function findById(id: string) {
    return prisma.subject.findUnique({
        where: { id }
    });
}

export async function findByFullName(full_name: string) {
    return prisma.subject.findMany({
        where: { full_name }
    });
}