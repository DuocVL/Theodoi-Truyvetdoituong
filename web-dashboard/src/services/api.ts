/**
 * @file api.ts
 * @description
 * Đây là file trung tâm để quản lý tất cả các tương tác với API backend.
 * - Sử dụng `axios` để thực hiện các yêu cầu HTTP.
 * - Định nghĩa các TypeScript interface cho các đối tượng dữ liệu (User, Subject, ...).
 * - Cấu hình một `apiClient` của axios với baseURL và các interceptor.
 *   - Request Interceptor: Tự động đính kèm token xác thực vào header của mỗi yêu cầu.
 *   - Response Interceptor: Xử lý các lỗi API chung, đặc biệt là lỗi 401 (Unauthorized).
 * - Xuất (export) các hàm riêng biệt cho mỗi endpoint của API, giúp code ở các component sạch sẽ và dễ quản lý hơn.
 */

import axios from 'axios';

// ==================================================================
// TYPE DEFINITIONS (Định nghĩa kiểu dữ liệu)
// ==================================================================
// Giúp đảm bảo tính nhất quán và an toàn kiểu dữ liệu trong toàn bộ ứng dụng.

/** Thông tin người dùng cơ bản */
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
}

/** Dữ liệu cần thiết để đăng ký tài khoản mới */
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

/** 
 * Thông tin chi tiết về một đối tượng được theo dõi.
 * Interface này đã được cập nhật để khớp với schema mới từ backend. 
 */
export interface Subject {
  _id: string; // ID của đối tượng trong MongoDB
  username: string; // Tên tài khoản liên kết (nếu có)
  email: string;
  fullName: string;
  dob?: string; // Ngày sinh
  gender?: string;
  idNumber?: string; // Số CCCD/CMND
  address?: string;
  phone?: string;
  monitoringStart?: string; // Ngày bắt đầu theo dõi
  monitoringEnd?: string; // Ngày kết thúc theo dõi
  status: string; // Trạng thái theo dõi (ví dụ: 'Đang theo dõi', 'Tạm dừng')
  createdAt: string;
  updatedAt: string;
}

/** Dữ liệu của một điểm trên bản đồ */
export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  zone?: string; // Tên khu vực (nếu có)
}

/** Dữ liệu trả về sau khi đăng nhập thành công */
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// ==================================================================
// API CLIENT CONFIGURATION (Cấu hình Axios)
// ==================================================================

// Lấy URL của API từ biến môi trường, nếu không có thì dùng giá trị mặc định.
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1';

// Tạo một instance của axios với cấu hình cơ bản.
const apiClient = axios.create({
  baseURL: API_URL,
});

// --- Interceptors --- 
// Interceptors cho phép can thiệp vào các yêu cầu (request) trước khi chúng được gửi đi, 
// hoặc các phản hồi (response) trước khi chúng được trả về cho code gọi API.

// 1. Request Interceptor: Chạy trước mỗi yêu cầu.
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage.
    const token = localStorage.getItem('token');
    // Nếu có token, gắn nó vào header `Authorization`.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Trả về config đã được chỉnh sửa để axios tiếp tục gửi yêu cầu.
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Chạy sau khi nhận được phản hồi (và trước khi trả về cho hàm gọi).
apiClient.interceptors.response.use(
  (response) => response, // Nếu thành công (status 2xx), không làm gì cả, chỉ trả về response.
  (error) => {
    // Ghi log lỗi chi tiết ra console để dễ debug.
    console.error('API Error:',
      {
        message: error.message,
        url: error.config.url,
        status: error.response?.status,
        data: error.response?.data,
      });

    // Xử lý lỗi 401 Unauthorized (thường do token hết hạn hoặc không hợp lệ).
    if (error.response?.status === 401) {
        // Xóa token cũ khỏi localStorage để tránh các yêu cầu sau cũng bị lỗi.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // TODO: Có thể thêm logic tự động refresh token ở đây.
        // TODO: Hoặc điều hướng người dùng về trang đăng nhập.
        // window.location.href = '/login';
    }

    // Trả về lỗi để hàm gọi API (trong component) có thể bắt và xử lý tiếp (ví dụ: hiển thị thông báo cho người dùng).
    return Promise.reject(error);
  }
);

// ==================================================================
// API FUNCTIONS (Các hàm gọi API)
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

/** Lấy thông tin người dùng đang đăng nhập */
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', { token, password });
  return response.data;
};

// --- SUBJECTS (Đối tượng) --- //

/** Lấy danh sách tất cả đối tượng */
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<{ subjects: Subject[] }>('/subjects');
  return response.data.subjects;
};

/** Lấy thông tin chi tiết của một đối tượng theo ID */
export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get<{ subject: Subject }>(`/subjects/${id}`);
  return response.data.subject;
};

/** Tạo một đối tượng mới */
export const createSubject = async (subjectData: Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Subject> => {
  const response = await apiClient.post<{ subject: Subject }>('/subjects', subjectData);
  return response.data.subject;
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

/** Lấy lịch sử vị trí của một đối tượng theo ID của đối tượng */
export const getTrackingDataBySubjectId = async (subjectId: string): Promise<TrackingPoint[]> => {
    const response = await apiClient.get<{ trackingData: TrackingPoint[] }>(`/tracking/${subjectId}`);
    return response.data.trackingData;
};
