import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { login as apiLogin, getMe, type User } from '../services/api';
import Spinner from '../components/Spinner';

interface AuthContextType {
    isAuthenticated: boolean; // Thêm trạng thái xác thực rõ ràng
    user: User | null;
    login: (username: string, password: string, deviceId: string) => Promise<void>; 
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // State mới
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const currentUser = await getMe();
                    setUser(currentUser);
                    setIsAuthenticated(true); // Cập nhật trạng thái
                } catch (error) {
                    console.error("Auth verification failed", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setIsAuthenticated(false); // Cập nhật trạng thái
                }
            }
            setLoading(false);
        };
        verifyToken();
    }, []);

    const login = async (username: string, password: string, deviceId: string) => {
        // 1. Gọi API login để lấy token
        const { token, refreshToken } = await apiLogin(username, password, deviceId);
        
        // 2. Lưu token vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // 3. Gọi getMe() để lấy thông tin người dùng
        try {
            const currentUser = await getMe();
            setUser(currentUser);
            setIsAuthenticated(true); // 4. Cập nhật trạng thái
        } catch (error) {
            // Nếu getMe thất bại, xóa token và báo lỗi
            console.error("Failed to fetch user after login", error);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            // Ném lỗi ra ngoài để LoginPage có thể bắt và hiển thị
            throw new Error("Failed to retrieve user details after login.");
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false); // Cập nhật trạng thái
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

    const value = { isAuthenticated, user, login, logout, loading: loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
