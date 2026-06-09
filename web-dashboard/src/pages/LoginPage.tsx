/**
 * @file LoginPage.tsx
 * @description
 * Trang đăng nhập cho phép người dùng xác thực và truy cập vào các phần được bảo vệ của ứng dụng.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
`;

const LoginBox = styled.div`
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
`;

const Title = styled.h2`
    margin-bottom: 2rem;
    color: #2d3748;
    font-size: 1.75rem;
`;

const Form = styled.form`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem; /* Creates space between form elements */
`;

const Input = styled.input`
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 1rem;
    box-sizing: border-box; /* Ensures padding doesn't affect width */

    &:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 1px #4299e1;
    }

    &:disabled {
        background-color: #e2e8f0;
    }
`;

const Button = styled.button`
    width: 100%;
    padding: 0.85rem;
    border: none;
    border-radius: 6px;
    background-color: #3182ce;
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background-color: #2b6cb0;
    }

    &:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
    }
`;

const Error = styled.p`
    color: #e53e3e;
    background-color: #fed7d7;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    font-size: 0.9rem;
    margin: 0; /* Reset margin */
`;

const LinkContainer = styled.div`
    margin-top: 1.5rem;
    font-size: 0.9rem;
    display: flex;
    flex-direction: column; /* Stack links vertically */
    gap: 0.5rem; /* Space between links */
    align-items: center;
`;

const StyledLink = styled(Link)`
    color: #3182ce;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

// ==================================================================
// LOGIN PAGE COMPONENT
// ==================================================================

const LoginPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    // --- EVENT HANDLERS ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            const deviceId = window.navigator.userAgent + '-' + new Date().getTime();
            await login(username, password, deviceId);
            navigate(from, { replace: true });

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không hợp lệ.';
            setError(errorMessage);
        } finally {
            setLoading(false); 
        }
    };

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <LoginBox>
                <Title>Đăng Nhập</Title>
                <Form onSubmit={handleLogin}>
                    <Input
                        type="text"
                        placeholder="Tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading} 
                    />
                    <Input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    {error && <Error>{error}</Error>}
                    <Button type="submit" disabled={loading}> 
                        {loading ? <Spinner size={24} /> : 'Đăng Nhập'}
                    </Button>
                </Form>
                <LinkContainer>
                    <StyledLink to="/register">Chưa có tài khoản? Đăng ký</StyledLink>
                    <StyledLink to="/forgot-password">Quên mật khẩu?</StyledLink>
                </LinkContainer>
            </LoginBox>
        </PageContainer>
    );
};

export default LoginPage;
