import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import SubjectListPage from '../pages/SubjectListPage';

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/dashboard" element={<ProtectedRoute />}> 
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Route>
                <Route path="/subjects" element={<ProtectedRoute />}> 
                    <Route path="/subjects" element={<SubjectListPage />} />
                </Route>
                <Route 
                    path="/"
                    element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
                />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
