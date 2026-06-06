import axios from 'axios';

// ==================================================================
// TYPE DEFINITIONS
// Nơi định nghĩa các kiểu dữ liệu dùng chung cho toàn bộ service
// ==================================================================

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
}

export interface Subject {
  _id: string;
  fullName: string;
  identifier: string;
  dateOfBirth?: string;
  status: string;
  notes?: string;
  imageUrl?: string;
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
  token: string;
  refreshToken: string;
  user: User;
}

// ==================================================================
// API CLIENT CONFIGURATION
// Cấu hình Axios, interceptors
// ==================================================================

// Sửa lỗi biến môi trường: Dùng import.meta.env cho Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor để tự động đính kèm token vào mỗi request
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

// Interceptor để xử lý lỗi tập trung và chuẩn hóa lỗi
apiClient.interceptors.response.use(
  // Giữ nguyên response nếu thành công
  (response) => response,
  (error) => {
    // Log lỗi để debug
    console.error('API Error:', {
      message: error.message,
      url: error.config.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Xử lý lỗi 401 Unauthorized: token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
        // Có thể thêm logic gọi API refresh token ở đây trong tương lai
        // Hiện tại, chỉ cần xóa token cũ và reload lại trang để về trang login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // window.location.href = '/login';
    }
    
    // Quan trọng: Phải reject để logic `catch` ở nơi gọi API có thể hoạt động
    return Promise.reject(error);
  }
);

// ==================================================================
// API FUNCTIONS
// Các hàm gọi API, đã được "làm phẳng" để trả về dữ liệu thuần túy
// ==================================================================

// --- AUTH --- //

// Trả về: Toàn bộ object AuthResponse (vì UI cần cả token và user)
export const login = async (username: string, password: string, device_id: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', { username, password, device_id });
  return response.data;
};

// Trả về: Chỉ object User
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.data.user; // Bóc tách dữ liệu
};

// --- SUBJECTS --- //

// Trả về: Mảng các Subjects
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<{ subjects: Subject[] }>('/subjects');
  return response.data.subjects; // Bóc tách dữ liệu
};

// Trả về: Một object Subject duy nhất
export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get<{ subject: Subject }>(`/subjects/${id}`);
  return response.data.subject; // Bóc tách dữ liệu
};

// Trả về: Object Subject vừa được tạo
export const createSubject = async (subjectData: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>): Promise<Subject> => {
  const response = await apiClient.post<{ subject: Subject }>('/subjects', subjectData);
  return response.data.subject; // Bóc tách dữ liệu
};

// Trả về: Object Subject vừa được cập nhật
export const updateSubject = async (id: string, subjectData: Partial<Omit<Subject, '_id'>>): Promise<Subject> => {
  const response = await apiClient.put<{ subject: Subject }>(`/subjects/${id}`, subjectData);
  return response.data.subject; // Bóc tách dữ liệu
};

// Trả về: Tin nhắn xác nhận từ server
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

// --- TRACKING --- //

// Trả về: Mảng các TrackingPoint
export const getTrackingDataBySubjectId = async (subjectId: string): Promise<TrackingPoint[]> => {
    const response = await apiClient.get<{ trackingData: TrackingPoint[] }>(`/tracking/${subjectId}`);
    return response.data.trackingData; // Bóc tách dữ liệu
};
