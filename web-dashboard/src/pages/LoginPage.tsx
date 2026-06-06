import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import Spinner from '../components/Spinner'; // Import Spinner

const Container = styled.div`
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    position: relative; // Cần cho việc đặt Spinner
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
`;

const Button = styled.button`
    padding: 0.75rem;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;

    &:hover:not(:disabled) {
        background-color: #0056b3;
    }

    &:disabled {
        background-color: #a0cff;
        cursor: not-allowed;
    }
`;

const Error = styled.p`
    color: red;
    margin-bottom: 1rem;
    text-align: center;
`;

const StyledLink = styled(Link)`
    display: block;
    text-align: center;
    margin-top: 1rem;
    color: #007bff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Thêm state loading
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            // Giai đoạn 1: Sửa lỗi thiếu device_id
            // Tạo một device_id giả lập. Trong một ứng dụng thực tế, đây nên là một mã định danh duy nhất và ổn định.
            const deviceId = window.navigator.userAgent + '-' + new Date().getTime();
            await login(username, password, deviceId);
            
            navigate(from, { replace: true });

        } catch (err: any) {
            // Giai đoạn 3: Cải thiện thông báo lỗi
            const errorMessage = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không hợp lệ.';
            setError(errorMessage);
        } finally {
            setLoading(false); 
        }
    };

    return (
        <Container>
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
                    {loading ? <Spinner size={20} /> : 'Đăng Nhập'}
                </Button>
            </Form>
            <StyledLink to="/register">Chưa có tài khoản? Đăng ký</StyledLink>
            <StyledLink to="/forgot-password">Quên mật khẩu?</StyledLink>
        </Container>
    );
};

export default LoginPage;
