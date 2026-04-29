import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any; // You can define a more specific user type
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const data = await AuthService.refreshToken(refreshToken);
                    localStorage.setItem('token', data.token);
                } catch (error) {
                    console.error('Failed to refresh token', error);
                    logout();
                }
            }
        }, 15 * 60 * 1000); // Refresh token every 15 minutes

        return () => clearInterval(interval);
    }, []);

    const login = async (username, password) => {
        const device_id = localStorage.getItem('device_id') || uuidv4();
        localStorage.setItem('device_id', device_id);

        try {
            const data = await AuthService.login(username, password, device_id);
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            setIsAuthenticated(true);
            setUser(data.user);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
