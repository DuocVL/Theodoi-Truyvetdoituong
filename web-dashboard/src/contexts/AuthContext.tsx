import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { login as apiLogin, getMe, type User } from '../services/api';
import Spinner from '../components/Spinner';

interface AuthContextType {
    isAuthenticated: boolean;
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const currentUser = await getMe();
                    setUser(currentUser); // SỬA LỖI: set trực tiếp đối tượng user
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Auth verification failed", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        verifyToken();
    }, []);

    const login = async (username: string, password: string, deviceId: string) => {
        const { accessToken, refreshToken } = await apiLogin(username, password, deviceId);
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        try {
            const currentUser = await getMe();
            setUser(currentUser); // SỬA LỖI: set trực tiếp đối tượng user
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            throw new Error("Failed to retrieve user details after login.");
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
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
