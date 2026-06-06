import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner'; // Import Spinner

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Sử dụng trực tiếp `isAuthenticated` và `loading` từ context
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Trong khi context đang xác thực token ban đầu, hiển thị spinner
  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner size={60} />
        </div>
    );
  }

  // Nếu không được xác thực, điều hướng đến trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã xác thực, hiển thị component con
  return children;
};

export default ProtectedRoute;
