import * as repo from '../repositories/alert.repository';

export const getAlertsService = async (user: any, filter: any, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  let query: any = {};

  if (user.role === 'ADMIN') {
    // Admin lấy tất cả, có thể lọc theo subject_id nếu có
    if (filter.subject_id) query.subject_id = filter.subject_id;
  } else if (user.role === 'USER') {
    // Chỉ lấy alert của các subject mà user này quản lý
    query.subject = { owner_id: user.id }; 
  } else if (user.role === 'SUBJECT') {
    // Subject chỉ lấy alert của chính nó
    query.subject_id = user.id;
  }

  const [data, total] = await Promise.all([
    repo.findAlerts(query, skip, limit),
    repo.countAlerts(query)
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

export const createAlertService = async (data: any) => {
  return await repo.createAlert(data);
};