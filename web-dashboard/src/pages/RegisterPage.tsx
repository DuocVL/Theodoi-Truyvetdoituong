import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { register as registerApi } from '../services/api'; // Sử dụng trực tiếp API
import Spinner from '../components/Spinner';

// Sử dụng lại các styled-components từ LoginPage để nhất quán
const Container = styled.div`
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
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
    background-color: #28a745; // Màu xanh lá cho hành động đăng ký
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background-color: #218838;
    }

    &:disabled {
        background-color: #a3d9b1;
        cursor: not-allowed;
    }
`;

const Error = styled.p`
    color: red;
    margin-bottom: 1rem;
    text-align: center;
`;

const Success = styled.p`
    color: green;
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

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [full_name, setFullName] = useState(''); // Nhất quán với API
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!username || !password || !email || !full_name) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        setLoading(true);
        try {
            await registerApi({ username, password, email, full_name });
            setSuccess('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập sau giây lát...');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Title>Đăng Ký Tài Khoản</Title>
            <Form onSubmit={handleRegister}>
                <Input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
                <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                <Input type="text" placeholder="Họ và Tên" value={full_name} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
                
                {error && <Error>{error}</Error>}
                {success && <Success>{success}</Success>}

                <Button type="submit" disabled={loading || !!success}>
                    {loading ? <Spinner size={20} /> : 'Đăng Ký'}
                </Button>
            </Form>
            <StyledLink to="/login">Đã có tài khoản? Đăng nhập</StyledLink>
        </Container>
    );
};

export default RegisterPage;
