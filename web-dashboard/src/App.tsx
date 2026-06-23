import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import GlobalStyles from './styles/GlobalStyles';

// Import trực tiếp từ node_modules (Nếu có cài qua npm)
import 'leaflet/dist/leaflet.css'; 

const App: React.FC = () => {
    return (
        <>
            <GlobalStyles />
            <Router>
               <AuthProvider>
                    <AppRoutes />
               </AuthProvider>
            </Router>
        </>
    );
};

export default App;