import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login as apiLogin, getMe, User } from '../services/api';
import Spinner from '../components/Spinner';

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
    user: User | null;
    // SỬA LỖI: Thêm deviceId vào định nghĩa hàm login
    login: (username: string, password: string, deviceId: string) => Promise<void>; 
    logout: () => void;
    loading: boolean;
}

// Tạo Context với giá trị mặc định
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook tùy chỉnh để sử dụng AuthContext dễ dàng hơn
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Component Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const currentUser = await getMe();
                    setUser(currentUser);
                } catch (error) {
                    console.error("Auth verification failed", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
            }
            setLoading(false);
        };
        verifyToken();
    }, []);

    // SỬA LỖI: Cập nhật hàm login để chấp nhận và sử dụng deviceId
    const login = async (username: string, password: string, deviceId: string) => {
        const { token, refreshToken, user: loggedInUser } = await apiLogin(username, password, deviceId);
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(loggedInUser);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spinner size={60} />
            </div>
        );
    }

    const value = { user, login, logout, loading: false };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
