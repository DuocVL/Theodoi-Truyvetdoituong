import React from 'react';
import GlobalStyles from './styles/GlobalStyles';
import MapPage from './pages/MapPage';

const App: React.FC = () => {
    return (
        <>
            <GlobalStyles />
            <MapPage />
        </>
    );
};

export default App;
