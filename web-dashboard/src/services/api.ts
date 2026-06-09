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

// 1. Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Đổi tên để rõ ràng hơn
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến để quản lý trạng thái làm mới token
let isRefreshing = false;
// Hàng đợi để lưu các yêu cầu bị lỗi trong khi chờ token mới
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom(Promise.reject(error));
    } else {
      prom(token!);
    }
  });
  failedQueue = [];
};

// 2. Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 và có thông điệp token hết hạn, và chưa có yêu cầu refresh nào đang chạy
    if (error.response?.status === 401 && error.response.data?.message === "Unauthorized: Token has expired" && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang có một yêu cầu refresh khác chạy, thêm yêu cầu hiện tại vào hàng đợi
        return new Promise(function(resolve, reject) {
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
        // Nếu không có refresh token, không thể làm gì, đăng xuất người dùng
        isRefreshing = false;
        // TODO: Có thể gọi hàm logout ở đây để dọn dẹp triệt để hơn
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; 
        return Promise.reject(error);
      }

      try {
        console.log('Access token expired. Refreshing token...');
        const response = await apiClient.post<AuthResponse>('/auth/refresh-token', { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Lưu token mới
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Cập nhật header cho axios instance và thực hiện lại yêu cầu ban đầu
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        // Thực hiện lại các yêu cầu trong hàng đợi với token mới
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng thất bại, đăng xuất người dùng
        console.error('Refresh token failed', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu không phải lỗi 401 do token hết hạn, chỉ trả về lỗi đó
    return Promise.reject(error);
  }
);

// ==================================================================
// API FUNCTIONS
// ==================================================================

export const login = async (username: string, password: string, device_id: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', { username, password, device_id });
  return response.data;
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

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<{ subjects: Subject[] }>('/subjects');
  return response.data.subjects;
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
