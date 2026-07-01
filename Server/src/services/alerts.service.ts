import * as repo from '../repositories/alert.repository';

//Lấy danh sách cảnh báo có phân trang, phân quyền và bộ lọc
export const findAllAlerts = async (
  role: string,//quyền người dùng 
  page: number,
  limit: number,
  filters: { type?: string; startDate?: Date; endDate?: Date },//Bộ lọc 
  userId?: string, 
  subjectId?: string
) => {
  let whereClause: any = {};

  // Phân quyền
  if (role === 'USER') whereClause.subject = { created_by: userId };
  else if (role === 'SUBJECT') whereClause.subject_id = subjectId;

  // Áp dụng bộ lọc
  if (filters.type) whereClause.type = filters.type;//Kiểu cảnh báo checkin trễ/vào vùng cấm
  
  //Lọc thời gian start <=, <= end
  if (filters.startDate || filters.endDate) {
    whereClause.created_at = {};
    if (filters.startDate) whereClause.created_at.gte = filters.startDate;
    if (filters.endDate) whereClause.created_at.lte = filters.endDate;
  }

  return await repo.getAlerts(page, limit, whereClause);
};

//Lấy thông tin chi tiết cảnh báo theo ID
export const getAlertDetail= async (id: string) => {
    const alert = await repo.getById(id);
    if (!alert) {
      throw new Error('Không tìm thấy cảnh báo yêu cầu.');
    }
    return alert;
  };


//Tạo cảnh báo
export const createAlert = async (data: any) => {
  return await repo.createAlert(data);
};