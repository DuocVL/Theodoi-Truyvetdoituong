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
  fullName: string;
  role: 'admin' | 'user';
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

export interface Subject {
  _id: string; // Frontend đang dùng _id
  username: string;
  email: string;
  fullName: string; // Frontend đang dùng fullName
  dob?: string;
  gender?: string;
  idNumber?: string; // Frontend đang dùng idNumber
  address?: string;
  phone?: string;
  monitoringStart?: string;
  monitoringEnd?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword: password });
  return response.data;
};

// FIX: Cập nhật hàm getSubjects để xử lý đúng cấu trúc dữ liệu từ server
export const getSubjects = async (): Promise<Subject[]> => {
  // 1. Định nghĩa kiểu dữ liệu thô từ server (snake_case)
  type ServerSubject = {
    id: string;
    account_id: string;
    code: string;
    full_name: string;
    dob: string;
    gender: string;
    id_number: string;
    address: string;
    phone: string;
    status: string;
    monitoring_start: string;
    monitoring_end: string | null;
    created_by: string;
    created_at: string;
    update_at: string;
    username?: string; // username có thể không có nếu account chưa được kích hoạt
    email?: string; // email có thể không có
  };

  // 2. Gọi API và chỉ định kiểu trả về là { data: ServerSubject[] }
  const response = await apiClient.get<{ data: ServerSubject[] }>('/subjects');

  // 3. Lấy mảng dữ liệu thô từ `response.data.data`
  const serverSubjects = response.data.data;

  if (!Array.isArray(serverSubjects)) {
    return []; // Trả về mảng rỗng nếu API không trả về đúng định dạng
  }

  // 4. Dùng .map() để chuyển đổi từ cấu trúc server (snake_case) sang cấu trúc frontend (camelCase)
  const clientSubjects: Subject[] = serverSubjects.map(subject => ({
    _id: subject.id, // Ánh xạ id -> _id
    fullName: subject.full_name, // Ánh xạ full_name -> fullName
    idNumber: subject.id_number, // Ánh xạ id_number -> idNumber
    monitoringStart: subject.monitoring_start,
    monitoringEnd: subject.monitoring_end || undefined,
    createdAt: subject.created_at,
    updatedAt: subject.update_at,
    // Giữ nguyên các trường có tên giống nhau
    username: subject.username || '', // Đảm bảo username luôn là string
    email: subject.email || '', // Đảm bảo email luôn là string
    dob: subject.dob,
    gender: subject.gender,
    address: subject.address,
    phone: subject.phone,
    status: subject.status,
  }));

  return clientSubjects;
};

export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get<{ subject: Subject }>(`/subjects/${id}`);
  return response.data.subject;
};

export const createSubject = async (subjectData: Partial<Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'status'>>): Promise<ApiResponse<Subject>> => {
  const response = await apiClient.post<ApiResponse<Subject>>('/subjects', subjectData);
  return response.data;
};

export const updateSubject = async (id: string, subjectData: Partial<Omit<Subject, '_id'>>): Promise<Subject> => {
  const response = await apiClient.put<{ subject: Subject }>(`/subjects/${id}`, subjectData);
  return response.data.subject;
};

export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

export const getTrackingDataBySubjectId = async (subjectId: string): Promise<TrackingPoint[]> => {
  const response = await apiClient.get<{ trackingData: TrackingPoint[] }>(`/tracking/${subjectId}`);
  return response.data.trackingData;
};
