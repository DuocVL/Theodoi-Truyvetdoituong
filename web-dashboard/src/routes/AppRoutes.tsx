import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import SubjectListPage from '../pages/SubjectListPage';
import AddSubjectPage from '../pages/AddSubjectPage';
import EditSubjectPage from '../pages/EditSubjectPage'; // Import trang mới
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import MapPage from '../pages/MapPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/subjects"
          element={<ProtectedRoute><SubjectListPage /></ProtectedRoute>}
        />
        <Route
          path="/subjects/add"
          element={<ProtectedRoute><AddSubjectPage /></ProtectedRoute>}
        />
        <Route // Route cho trang sửa
          path="/subjects/edit/:id"
          element={<ProtectedRoute><EditSubjectPage /></ProtectedRoute>}
        />
         <Route
          path="/map"
          element={<ProtectedRoute><MapPage /></ProtectedRoute>}
        />

        {/* Redirect root path */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
