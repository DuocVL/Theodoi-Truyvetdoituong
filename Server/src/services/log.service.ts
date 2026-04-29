import * as logRepository from '../repositories/log.repository';

export async function getRequestLogs(page: number, limit: number) {
    return await logRepository.getRequestLogs({ page, limit });
}

export async function getAuthLogs(page: number, limit: number, accountId?: string) {
    return await logRepository.getAuthLogs({ page, limit, accountId });
}

export async function getSystemLogs(page: number, limit: number, userId?: string, entity?: string) {
    return await logRepository.getSystemLogs({ page, limit, userId, entity });
}
