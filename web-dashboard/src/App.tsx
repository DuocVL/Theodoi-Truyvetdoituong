/**
 * @file App.tsx
 * @description
 * Đây là component gốc (root component) của toàn bộ ứng dụng.
 * Nó chịu trách nhiệm thiết lập các "provider" và hệ thống định tuyến (routing).
 * Cấu trúc của file này thường khá ổn định và ít khi cần chỉnh sửa.
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import GlobalStyles from './styles/GlobalStyles';

const App: React.FC = () => {
    return (
        // Sử dụng React.Fragment (<>) để nhóm các component mà không tạo thêm thẻ div thừa trong DOM.
        <>
            {/* 
              GlobalStyles: Một component đặc biệt từ styled-components để áp dụng CSS reset 
              và các kiểu dáng toàn cục cho toàn bộ ứng dụng. Điều này đảm bảo giao diện
              nhất quán trên các trình duyệt khác nhau.
            */}
            <GlobalStyles />

            {/*
              Router (BrowserRouter): Bọc toàn bộ ứng dụng để kích hoạt tính năng định tuyến phía client (client-side routing).
              Nó sử dụng History API của HTML5 để giữ cho giao diện người dùng đồng bộ với URL.
            */}
            <Router>
                {/*
                  AuthProvider: Cung cấp "context" về trạng thái xác thực (ví dụ: người dùng đã đăng nhập chưa, thông tin người dùng).
                  Bất kỳ component con nào bên trong AuthProvider đều có thể truy cập vào context này 
                  để biết trạng thái đăng nhập và thực hiện các hành vi tương ứng.
                */}
                <AuthProvider>
                    {/*
                      AppRoutes: Component này chứa tất cả các định nghĩa về route (đường dẫn) của ứng dụng.
                      Nó quyết định component nào sẽ được hiển thị tương ứng với URL hiện tại của trình duyệt.
                    */}
                    <AppRoutes />
                </AuthProvider>
            </Router>
        </>
    );
};

export default App;
