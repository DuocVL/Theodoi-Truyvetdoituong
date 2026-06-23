import * as logRepository from '../repositories/log.repository';

// Dùng cho Dashboard: Truy vấn linh hoạt theo loại log (HTTP, AUDIT, SUBJECT_EVENT)
export async function getLogs(page: number, limit: number, filters: any) {
    return await logRepository.getSystemLogs({ page, limit, ...filters });
}

export async function getLogDetail(id: string) {
    return await logRepository.getLogDetail(id);
}