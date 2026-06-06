import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho một đối tượng Subject
interface SubjectPayload {
  fullName: string;
  dateOfBirth?: string;
  identifier: string;
  status: string;
  notes?: string;
  imageUrl?: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor để đính kèm token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- AUTH --- //
export const login = async (username: string, password: string): Promise<any> => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

export const getMe = async (): Promise<any> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// --- SUBJECTS --- //
export const getSubjects = async (): Promise<any> => {
  const response = await apiClient.get('/subjects');
  return response.data;
};

export const getSubjectById = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/subjects/${id}`);
  return response.data;
};

export const createSubject = async (subjectData: SubjectPayload): Promise<any> => {
  const response = await apiClient.post('/subjects', subjectData);
  return response.data;
};

export const updateSubject = async (id: string, subjectData: Partial<SubjectPayload>): Promise<any> => {
  const response = await apiClient.put(`/subjects/${id}`, subjectData);
  return response.data;
};

export const deleteSubject = async (id: string): Promise<any> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

// --- TRACKING --- //
export const getTrackingDataBySubjectId = async (subjectId: string): Promise<any> => {
    const response = await apiClient.get(`/tracking/${subjectId}`);
    return response.data;
};
