import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../configs/prisma";

export async function createRequestLog(data: Prisma.RequestLogCreateInput) {
    return await prisma.requestLog.create({
        data
    }); 
}

export async function createAuthLog(data: Prisma.AuthLogCreateInput) {
    return await prisma.authLog.create({
        data
    });
}

export async function createSystemLog(data: Prisma.SystemLogCreateInput) {
    return await prisma.systemLog.create({
        data
    })
}