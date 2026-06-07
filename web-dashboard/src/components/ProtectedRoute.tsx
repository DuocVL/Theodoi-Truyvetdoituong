/**
 * @file ProtectedRoute.tsx
 * @description
 * Đây là một component "Higher-Order Component" (HOC) dùng để bảo vệ các route (đường dẫn).
 * Nó kiểm tra xem người dùng đã được xác thực (đăng nhập) hay chưa.
 * - Nếu đã xác thực, nó sẽ render component con (children) bên trong một `Layout` chung.
 * - Nếu chưa xác thực, nó sẽ chuyển hướng người dùng về trang đăng nhập (`/login`).
 */

import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

// Định nghĩa kiểu cho props của component.
interface ProtectedRouteProps {
  children: ReactNode; // `children` là component/trang mà chúng ta muốn bảo vệ.
}

/**
 * Component `ProtectedRoute`.
 * @param {ProtectedRouteProps} props - Props của component, chứa `children`.
 * @returns {React.ReactElement}
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Sử dụng hook `useAuth` để lấy trạng thái xác thực từ context.
  const { isAuthenticated } = useAuth();

  // --- LUỒNG LOGIC CHÍNH ---
  // 1. Kiểm tra trạng thái `isAuthenticated`.
  if (!isAuthenticated) {
    // 2. Nếu `isAuthenticated` là `false`, người dùng chưa đăng nhập.
    //    Sử dụng component `Navigate` của react-router-dom để thực hiện chuyển hướng.
    //    - `to="/login"`: Chỉ định URL đích là trang đăng nhập.
    //    - `replace`: Thuộc tính này thay thế entry hiện tại trong lịch sử trình duyệt
    //      thay vì push một entry mới. Điều này ngăn người dùng nhấn nút "Back" 
    //      để quay lại trang được bảo vệ sau khi bị chuyển hướng.
    return <Navigate to="/login" replace />;
  }

  // 3. Nếu `isAuthenticated` là `true`, người dùng đã đăng nhập.
  //    Render các component con (`children`) bên trong component `Layout`.
  //    Điều này đảm bảo các trang được bảo vệ sẽ có giao diện chung (sidebar, header, ...).
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
