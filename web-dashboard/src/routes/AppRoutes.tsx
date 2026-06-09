import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ActivateAccountPage from '../pages/ActivateAccountPage';
import SubjectListPage from '../pages/SubjectListPage';
import AddSubjectPage from '../pages/AddSubjectPage';
import EditSubjectPage from '../pages/EditSubjectPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import MapPage from '../pages/MapPage';
import Spinner from '../components/Spinner';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
            <Spinner size={60} />
            <p>Đang xác thực, vui lòng chờ...</p>
        </div>
    );
  }

  return (
      <Routes>
        {/* ============================================= */}
        {/* Public Routes - Accessible without login      */}
        {/* ============================================= */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
        
        {/* Activation routes for both User and Subject */}
        <Route path="/activate-account" element={<ActivateAccountPage />} />
        <Route path="/activate-account/subjects" element={<ActivateAccountPage />} />


        {/* ============================================= */}
        {/* Protected Routes - Require login            */}
        {/* ============================================= */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><SubjectListPage /></ProtectedRoute>} />
        <Route path="/subjects/add" element={<ProtectedRoute><AddSubjectPage /></ProtectedRoute>} />
        <Route path="/subjects/edit/:id" element={<ProtectedRoute><EditSubjectPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />


        {/* ============================================= */}
        {/* Default Redirect                            */}
        {/* ============================================= */}
        {/* If the URL does not match any route, redirect based on auth status */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
  );
};

export default AppRoutes;
