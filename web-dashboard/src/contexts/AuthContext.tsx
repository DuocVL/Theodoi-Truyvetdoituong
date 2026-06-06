import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { v4 as uuidv4 } from 'uuid';

// Define a more specific user type in the future
type User = any;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean; // To indicate initial auth check
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // The api instance automatically adds the token to the header
          const { user } = await AuthService.getMe();
          setUser(user);
        } catch (error) {
          console.error('Authentication failed', error);
          // Token is invalid, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken'); // also clear refresh token
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (username, password) => {
    const device_id = localStorage.getItem('device_id') || uuidv4();
    localStorage.setItem('device_id', device_id);

    try {
      const data = await AuthService.login(username, password, device_id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
    } catch (error) {
      console.error('Login failed', error);
      // Re-throw the error to be caught by the UI component (e.g., LoginPage)
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    // Optional: redirect to login page
    // window.location.href = '/login';
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
