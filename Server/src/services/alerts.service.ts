import * as repo from '../repositories/alert.repository';

export const findAllAlerts = async (
  role: string, 
  page: number, 
  limit: number, 
  filters: { type?: string; startDate?: Date; endDate?: Date },
  userId?: string, 
  subjectId?: string
) => {
  let whereClause: any = {};

  // Phân quyền
  if (role === 'USER') whereClause.subject = { created_by: userId };
  else if (role === 'SUBJECT') whereClause.subject_id = subjectId;

  // Áp dụng bộ lọc - Sửa logic check undefined
  if (filters.type) whereClause.type = filters.type;
  
  if (filters.startDate || filters.endDate) {
    whereClause.created_at = {};
    if (filters.startDate) whereClause.created_at.gte = filters.startDate;
    if (filters.endDate) whereClause.created_at.lte = filters.endDate;
  }

  return await repo.getAlerts(page, limit, whereClause);
};

export const getAlertDetail= async (id: string) => {
    const alert = await repo.getById(id);
    console.log(alert)
    if (!alert) {
      throw new Error('Không tìm thấy cảnh báo yêu cầu.');
    }
    return alert;
  };


export const createAlert = async (data: any) => {
  return await repo.createAlert(data);
};