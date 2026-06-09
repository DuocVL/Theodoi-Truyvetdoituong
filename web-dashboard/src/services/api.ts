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

// Định nghĩa một kiểu dữ liệu chung cho các phản hồi thành công từ API
// có chứa đối tượng dữ liệu chính và một tin nhắn.
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

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:',
      {
        message: error.message,
        url: error.config.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

// ==================================================================
// API FUNCTIONS
// ==================================================================

// --- AUTHENTICATION --- //

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

// --- SUBJECTS (Đối tượng) --- //

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<{ subjects: Subject[] }>('/subjects');
  return response.data.subjects;
};

export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get<{ subject: Subject }>(`/subjects/${id}`);
  return response.data.subject;
};

/** Tạo một đối tượng mới */
export const createSubject = async (subjectData: Partial<Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'status'>>): Promise<ApiResponse<Subject>> => {
  const response = await apiClient.post<ApiResponse<Subject>>('/subjects', subjectData);
  return response.data; // Trả về toàn bộ object { message, data }
};

/** Cập nhật thông tin một đối tượng */
export const updateSubject = async (id: string, subjectData: Partial<Omit<Subject, '_id'>>): Promise<Subject> => {
  const response = await apiClient.put<{ subject: Subject }>(`/subjects/${id}`, subjectData);
  return response.data.subject;
};

/** Xóa một đối tượng */
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

// --- TRACKING (Theo dõi vị trí) --- //

export const getTrackingDataBySubjectId = async (subjectId: string): Promise<TrackingPoint[]> => {
    const response = await apiClient.get<{ trackingData: TrackingPoint[] }>(`/tracking/${subjectId}`);
    return response.data.trackingData;
};
