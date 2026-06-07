/**
 * @file AuthContext.tsx
 * @description
 * File này định nghĩa "React Context" cho việc quản lý trạng thái xác thực (Authentication) trên toàn ứng dụng.
 * Nó cung cấp một `AuthProvider` component và một `useAuth` hook.
 * - `AuthProvider` bọc các phần của ứng dụng cần truy cập thông tin đăng nhập.
 * - `useAuth` là hook để các component con có thể lấy và thay đổi trạng thái xác thực.
 * Context giúp tránh việc phải truyền props về trạng thái đăng nhập qua nhiều cấp component (prop drilling).
 */

import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { login as apiLogin, getMe, type User } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// TYPE & CONTEXT DEFINITION
// ==================================================================

/**
 * `AuthContextType` định nghĩa cấu trúc của context.
 * Nó bao gồm trạng thái (isAuthenticated, user, loading) và các hàm để thay đổi trạng thái đó (login, logout).
 */
interface AuthContextType {
    isAuthenticated: boolean; // Cờ báo người dùng đã đăng nhập hay chưa.
    user: User | null; // Thông tin của người dùng đã đăng nhập, hoặc null.
    login: (username: string, password: string, deviceId: string) => Promise<void>; // Hàm xử lý logic đăng nhập.
    logout: () => void; // Hàm xử lý logic đăng xuất.
    loading: boolean; // Cờ báo trạng thái đang xác thực ban đầu (khi tải lại trang).
}

// Tạo một React Context với giá trị ban đầu là `undefined`.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================================================================
// CUSTOM HOOK - `useAuth`
// ==================================================================

/**
 * `useAuth` là một custom hook để đơn giản hóa việc sử dụng AuthContext.
 * Nó cung cấp một cách ngắn gọn để component con truy cập context.
 * @throws {Error} Nếu hook được sử dụng bên ngoài một `AuthProvider`.
 * @returns {AuthContextType} Giá trị của context.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Đảm bảo rằng component sử dụng hook này phải là con của AuthProvider.
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ==================================================================
// AUTH PROVIDER COMPONENT
// ==================================================================

/**
 * `AuthProvider` là component sẽ cung cấp giá trị context cho các component con của nó.
 * @param {{ children: ReactNode }} props - Props chứa các component con.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // --- STATE MANAGEMENT ---
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // `loading` state dùng để xử lý việc kiểm tra token lúc ban đầu.
    // Khi người dùng tải lại trang, ta cần thời gian để xác thực token từ localStorage.
    const [loading, setLoading] = useState(true);

    // --- SIDE EFFECTS (useEffect) ---
    // `useEffect` này chỉ chạy một lần khi component được mount lần đầu tiên.
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Nếu có token, gọi API `getMe` để lấy thông tin người dùng.
                    const currentUser = await getMe();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Nếu token không hợp lệ hoặc hết hạn, API sẽ báo lỗi.
                    console.error("Auth verification failed", error);
                    // Xóa token hỏng khỏi localStorage.
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setIsAuthenticated(false);
                }
            }
            // Dù có token hay không, quá trình xác thực ban đầu đã xong.
            setLoading(false);
        };
        verifyToken();
    }, []); // Mảng rỗng `[]` đảm bảo effect chỉ chạy 1 lần.

    // --- AUTHENTICATION LOGIC ---

    /**
     * Xử lý đăng nhập bằng cách gọi API, lưu token và cập nhật state.
     */
    const login = async (username: string, password: string, deviceId: string) => {
        // Gọi API login.
        const { accessToken, refreshToken } = await apiLogin(username, password, deviceId);
        
        // Lưu token vào localStorage để duy trì đăng nhập.
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        try {
            // Lấy thông tin người dùng ngay sau khi đăng nhập thành công.
            const currentUser = await getMe();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
            // Nếu có lỗi, xóa token và reset trạng thái.
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            // Ném lỗi ra ngoài để component gọi hàm login có thể xử lý (ví dụ: hiển thị thông báo lỗi).
            throw new Error("Failed to retrieve user details after login.");
        }
    };

    /**
     * Xử lý đăng xuất.
     */
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Chuyển hướng người dùng về trang đăng nhập. `window.location.href` sẽ làm trang tải lại hoàn toàn,
        // đảm bảo mọi state cũ đều được xóa sạch.
        window.location.href = '/login';
    };

    // --- RENDER LOGIC ---

    // Trong khi đang xác thực token ban đầu, hiển thị một spinner toàn màn hình.
    // Điều này ngăn người dùng thấy một trang được bảo vệ trong giây lát rồi bị đá về trang login.
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spinner size={60} />
            </div>
        );
    }

    // Tạo object `value` để truyền xuống cho các component con thông qua Provider.
    const value = { isAuthenticated, user, login, logout, loading: loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
