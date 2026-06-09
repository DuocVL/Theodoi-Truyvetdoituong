import * as logRepository from '../repositories/log.repository';

export async function getRequestLogs(page: number, limit: number) {
    return await logRepository.getRequestLogs({ page, limit });
}

export async function getSystemLogs(page: number, limit: number, userId?: string, entity?: string) {
    return await logRepository.getSystemLogs({ page, limit, userId, entity });
}
