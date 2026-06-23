import * as repo from '../repositories/alert.repository';


export const findAllAlerts = async (role: string, page: number, limit: number, userId?: string, subjectId? : string) => {
  let whereClause: any = {};

  // Phân quyền dựa trên role và ID
  if (role === 'USER') {
    // Chỉ lấy alert của các Subject do User này quản lý
    
    whereClause = { subject: { created_by: userId } };
  } else if (role === 'SUBJECT') {
    // Chỉ lấy alert của chính Subject đó
    whereClause = { subject_id: subjectId };
  }
  // Nếu là ADMIN, whereClause giữ nguyên {} -> lấy tất cả

  return await repo.getAlerts(page, limit, whereClause);
};

export const createAlert = async (data: any) => {
  return await repo.createAlert(data);
};