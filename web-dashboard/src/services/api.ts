/**
 * @file api.ts
 * @description
 * Đây là file trung tâm để quản lý tất cả các tương tác với API backend.
 */

import axios from 'axios';

// ==================================================================
// TYPE DEFINITIONS
// ==================================================================

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'USER';
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

export interface Subject {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  dob?: string;
  gender?: string;
  idNumber?: string;
  address?: string;
  phone?: string;
  monitoringStart?: string;
  monitoringEnd?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinData {
  id: string;
  subject_id: string;
  notes: string;
  image_id: string;
  face_verified: boolean;
  confidence: number | null;
  latitude: number;
  longitude: number;
  status: string;
  checkin_time: string;
  subject: {
    full_name: string;
  };
  image?: {
    url: string;
  };
}

export interface TimeFilterParams {
  startDate?: string; // Định dạng YYYY-MM-DD
  endDate?: string;   // Định dạng YYYY-MM-DD
  startTime?: string; // Định dạng HH:mm
  endTime?: string;   // Định dạng HH:mm
}

// KHẮC PHỤC: Định nghĩa kiểu dữ liệu trả về mới, bao gồm cả điểm cho bản đồ và danh sách phân trang
export interface CheckinResponse {
  listForSidebar: CheckinData[];
  pointsForMap: CheckinData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

type ServerSubject = {
  id: string;
  account_id: string;
  code: string;
  full_name: string;
  dob: string | null;
  gender: string;
  id_number: string | null;
  address: string | null;
  phone: string | null;
  status: string;
  monitoring_start: string | null;
  monitoring_end: string | null;
  created_by: string;
  created_at: string;
  update_at: string;
  username?: string;
  email?: string;
  // BỔ SUNG: Định nghĩa object account trả về từ câu lệnh include/join của Prisma backend
  account?: {
    id: string;
    email: string;
    status: string;
    type: string;
  };
};

/** Hàm chuyển đổi dữ liệu từ server sang client */
const mapServerToClientSubject = (subject: ServerSubject): Subject => ({
  _id: subject.id,
  fullName: subject.full_name,
  idNumber: subject.id_number || '',
  monitoringStart: subject.monitoring_start || undefined,
  monitoringEnd: subject.monitoring_end || undefined,
  createdAt: subject.created_at,
  updatedAt: subject.update_at,
  username: subject.username || '',
  
  // SỬA TẠI ĐÂY: Lấy email ở ngoài, nếu không có thì bóc tách từ trong subject.account.email
  email: subject.email || subject.account?.email || '', 
  
  dob: subject.dob ? new Date(subject.dob).toISOString().split('T')[0] : undefined,
  gender: subject.gender,
  address: subject.address || '',
  phone: subject.phone || '',
  status: subject.status,
});

export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  zone?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

// Thêm vào src/services/api.ts của bạn
export interface CreateZonePayload {
  subject_id: string;
  zone_name: string;
  type: 'SAFE' | 'RESTRICTED';
  latitude: number;
  longitude: number;
  radius: number;
  interval_minutes?: number;
  grace_minutes?: number;
  description?: string;
}

export interface Zone {
  id: string;
  subject_id: string;
  zone_name: string;
  type: 'SAFE' | 'RESTRICTED';
  latitude: number;
  longitude: number;
  radius: number; // đơn vị: mét
  interval_minutes?: number;
  grace_minutes?: number;
  description?: string;
  is_active: boolean;
  createdAt?: string;
}

// ==================================================================
// API CLIENT CONFIGURATION
// ==================================================================

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

// --- Interceptors ---

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<(token: string) => void> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      (prom as any)(error);
    } else {
      prom(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response.data?.message === "Unauthorized: Token has expired" && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve) {
          failedQueue.push((token: string) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        logout();
        window.location.href = '/login'; 
        return Promise.reject(error);
      }

      try {
        const response = await apiClient.post<AuthResponse>('/auth/refresh-token', { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Refresh token failed', refreshError);
        processQueue(refreshError, null);
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================================================================
// API FUNCTIONS
// ==================================================================

export const login = async (username: string, password: string, device_id: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', { username, password, device_id });
  const { accessToken } = response.data;
  if (accessToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }
  return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
};

export const register = async (data: RegisterData): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const activateAccount = async (token: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/activate-account', { token });
  return response.data;
};

export const activateSubjectAccount = async (data: { token: string; username: string; password: string }): Promise<{ message: string }> => {
  const response = await apiClient.post('/subjects/activate', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data.user;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword: password });
  return response.data;
};

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<{ data: ServerSubject[] }>('/subjects');
  const serverSubjects = response.data.data;

  if (!Array.isArray(serverSubjects)) return [];

  return serverSubjects.map(mapServerToClientSubject);
};

export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get<{ data: ServerSubject }>(`/subjects/${id}`);
  return mapServerToClientSubject(response.data.data);
};

export const createSubject = async (subjectData: Partial<Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'status'>>): Promise<ApiResponse<Subject>> => {
  const response = await apiClient.post<ApiResponse<Subject>>('/subjects', subjectData);
  return response.data;
};

export const updateSubject = async (id: string, subjectData: Partial<Subject>): Promise<ApiResponse<Subject>> => {
  const serverData = {
    full_name: subjectData.fullName,
    id_number: subjectData.idNumber,
    monitoring_start: subjectData.monitoringStart,
    monitoring_end: subjectData.monitoringEnd,
    dob: subjectData.dob,
    gender: subjectData.gender,
    address: subjectData.address,
    phone: subjectData.phone,
    status: subjectData.status,
    email: subjectData.email
  };

  const response = await apiClient.put<ApiResponse<ServerSubject>>(`/subjects/${id}`, serverData);
  return {
    message: response.data.message,
    data: mapServerToClientSubject(response.data.data)
  };
};

export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

export const getTrackingDataBySubjectId = async (subjectId: string): Promise<TrackingPoint[]> => {
  const response = await apiClient.get<{ trackingData: TrackingPoint[] }>(`/tracking/${subjectId}`);
  return response.data.trackingData;
};

// KHẮC PHỤC: Cập nhật hàm để xử lý cấu trúc trả về mới của API
export const getUserManagedCheckins = async (filters?: TimeFilterParams): Promise<CheckinResponse> => {
    const hasTimeFilter = !!(filters?.startDate || filters?.endDate || filters?.startTime || filters?.endTime);
    const endpoint = hasTimeFilter ? '/checkins/user/time-filter' : '/checkins/user';

    const response = await apiClient.get(endpoint, {
      params: {
        limit: 100, // Có thể tăng giới hạn để lấy nhiều dữ liệu hơn cho trường hợp không lọc
        page: 1,
        startDate: filters?.startDate || undefined,
        endDate: filters?.endDate || undefined,
        startTime: filters?.startTime || undefined,
        endTime: filters?.endTime || undefined
      }
    });

    if (hasTimeFilter) {
      // API /time-filter trả về { data, allPoints, pagination }
      return {
        listForSidebar: response.data.data || [],
        pointsForMap: response.data.allPoints || [],
        pagination: response.data.pagination
      };
    } else {
      // API thông thường trả về { data, pagination }
      const checkins = response.data.data || [];
      // Sắp xếp tăng dần để vẽ polyline đúng chiều
      const sortedPoints = [...checkins].sort((a, b) => new Date(a.checkin_time).getTime() - new Date(b.checkin_time).getTime());
      return {
        listForSidebar: checkins,
        pointsForMap: sortedPoints,
        pagination: response.data.pagination
      };
    }
};

// KHẮC PHỤC: Cập nhật hàm để xử lý cấu trúc trả về mới của API
export const getCheckinsBySubject = async (subjectId: string, filters?: TimeFilterParams): Promise<CheckinResponse> => {
    const hasTimeFilter = !!(filters?.startDate || filters?.endDate || filters?.startTime || filters?.endTime);
    const endpoint = hasTimeFilter ? `/checkins/subject/${subjectId}/time-filter` : `/checkins/subject/${subjectId}`;

    const response = await apiClient.get(endpoint, {
      params: {
        limit: 100,
        page: 1,
        startDate: filters?.startDate || undefined,
        endDate: filters?.endDate || undefined,
        startTime: filters?.startTime || undefined,
        endTime: filters?.endTime || undefined
      }
    });
    
    if (hasTimeFilter) {
      // API /time-filter trả về { data, allPoints, pagination }
      return {
        listForSidebar: response.data.data || [],
        pointsForMap: response.data.allPoints || [],
        pagination: response.data.pagination
      };
    } else {
      // API thông thường trả về { data, pagination }
      const checkins = response.data.data || [];
       // Sắp xếp tăng dần để vẽ polyline đúng chiều
      const sortedPoints = [...checkins].sort((a, b) => new Date(a.checkin_time).getTime() - new Date(b.checkin_time).getTime());
      return {
        listForSidebar: checkins,
        pointsForMap: sortedPoints,
        pagination: response.data.pagination
      };
    }
};

export const getCheckinById = async (id: string): Promise<CheckinData> => {
    const response = await apiClient.get(`/checkins/${id}`);
    return response.data?.data;
};

// Thêm hàm export vào cuối file src/services/api.ts
export const exportCheckinsReportExcel = async (subjectId: string, startDate: string, endDate: string): Promise<Blob> => {
  const response = await apiClient.get('/checkins/export', {
    params: {
      startDate,
      endDate,
      subjectId
    },
    responseType: 'blob' // RẤT QUAN TRỌNG: Để nhận luồng dữ liệu nhị phân từ backend
  });
  return response.data;
};

// Lấy danh sách zone theo từng đối tượng cụ thể
export const getZonesBySubject = async (subjectId: string): Promise<Zone[]> => {
  // Đồng bộ query param 'subjectId' khớp với Controller: req.query.subjectId
  const response = await apiClient.get(`/zones?subjectId=${subjectId}`); 
  return response.data.data; // Sửa lỗi 'zones.map is not a function' bằng cách lấy đúng thuộc tính .data nội bộ
};

export const createZone = (
  data: Omit<Zone, "_id" | "createdAt" | "id"> & { subject_id: string }
) => {
  return apiClient.post('/zones', data);
};

// 2. Hàm cập nhật: body truyền lên cũng loại bỏ id
export const updateZone = (
  id: string, 
  data: Omit<Zone, "_id" | "createdAt" | "subject_id" | "id">
) => {
  return apiClient.put(`/zones/${id}`, data);
};

// Xóa vùng
export const deleteZone = async (id: string): Promise<void> => {
  await apiClient.delete(`/zones/${id}`);
};

export const getSystemLogs = async (params: { 
  page?: number; 
  limit?: number; 
  category?: string; 
  userId?: string; 
  subjectId?: string;
  startDate?: any;
  endDate?: any;
}): Promise<any> => {
  const response = await apiClient.get('/logs', { params });
  return response.data;
};

export const getDetailLog = async(id: string): Promise<any> => {
  const response = await apiClient.get(`/logs/${id}`);
  return response.data;
}

export const getAllUsersApi = async (fullName?: string, role?: string) : Promise<any> => {
  const reponse = await apiClient.get('/users', { params: {fullName, role} });
  return  reponse.data
}

export const deleteUserApi = async (id: string) : Promise<any> => {
  const reponse = await apiClient.get(`/users/${id}`);
  return  reponse.data
}


