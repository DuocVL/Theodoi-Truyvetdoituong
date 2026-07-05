import * as logRepository from '../repositories/log.repository';

//lấy danh sách log
export async function getLogs(page: number, limit: number, filters: any) {
    return await logRepository.getSystemLogs({ page, limit, ...filters });
}

//lấy thông tin chi tiết 1 log
export async function getLogDetail(id: string) {
    return await logRepository.getLogDetail(id);
}