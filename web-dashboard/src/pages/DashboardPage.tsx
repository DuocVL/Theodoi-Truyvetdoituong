import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div>
            <h2>Dashboard</h2>
            <p>Welcome, {user?.username}!</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

export default DashboardPage;
