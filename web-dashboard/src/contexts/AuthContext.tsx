import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// Bỏ AuthService, import trực tiếp từ api với alias để tránh trùng tên
import { login as apiLogin, getMe as apiGetMe } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

// Định nghĩa một kiểu User cụ thể
interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Logic tạo device_id chỉ chạy 1 lần, đảm bảo tính nhất quán
const initializeDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};
const deviceId = initializeDeviceId();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Định nghĩa logout ở đây để có thể dùng trong useEffect và cả value của Provider
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Sử dụng apiGetMe trực tiếp
          // Giả định getMe sẽ được sửa để trả về user object trực tiếp
          const userData = await apiGetMe();
          setUser(userData);
        } catch (error) {
          console.error('Authentication failed, logging out.', error);
          // Khi xác thực thất bại, gọi logout để dọn dẹp state nhất quán
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  const login = async (username: string, password: string) => {
    setLoading(true); // Báo cho UI biết đang có thao tác bất đồng bộ
    try {
      // Sử dụng apiLogin trực tiếp, truyền vào deviceId đã được khởi tạo
      const data = await apiLogin(username, password, deviceId);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
    } catch (error) {
      console.error('Login failed', error);
      throw error; // Ném lỗi ra để component UI (LoginPage) có thể bắt và hiển thị
    } finally {
      setLoading(false); // Dù thành công hay thất bại cũng phải dừng loading
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
