/**
 * @file RegisterPage.tsx
 * @description
 * Trang này cho phép người dùng mới đăng ký một tài khoản.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { register as registerApi } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS (Reusing styles from LoginPage for consistency)
// ==================================================================

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem 0;
    background-color: #f0f2f5;
`;

const RegisterBox = styled.div`
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 420px; /* Slightly wider for more fields */
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
    gap: 1.25rem;
`;

const Input = styled.input`
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 1rem;
    box-sizing: border-box;

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

const Message = styled.p`
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    font-size: 0.9rem;
    margin: 0;
`;

const Error = styled(Message)`
    color: #e53e3e;
    background-color: #fed7d7;
`;

const Success = styled(Message)`
    color: #2f855a;
    background-color: #c6f6d5;
`;

const LinkContainer = styled.div`
    margin-top: 1.5rem;
    font-size: 0.9rem;
`;

const StyledLink = styled(Link)`
    color: #3182ce;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

// ==================================================================
// REGISTER PAGE COMPONENT
// ==================================================================

const RegisterPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [full_name, setFullName] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- EVENT HANDLERS ---
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
            setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản. Sẽ tự động chuyển đến trang đăng nhập...');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <RegisterBox>
                <Title>Đăng Ký Tài Khoản</Title>

                {/* Show the form only if registration is not successful */}
                {!success && (
                    <Form onSubmit={handleRegister}>
                        <Input type="text" placeholder="Họ và Tên" value={full_name} onChange={(e) => setFullName(e.target.value)} disabled={loading} required />
                        <Input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} required />
                        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                        <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                        
                        {error && <Error>{error}</Error>}

                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner size={24} /> : 'Đăng Ký'}
                        </Button>
                    </Form>
                )}
                
                {success && <Success>{success}</Success>}

                <LinkContainer>
                    <StyledLink to="/login">Đã có tài khoản? Đăng nhập</StyledLink>
                </LinkContainer>
            </RegisterBox>
        </PageContainer>
    );
};

export default RegisterPage;
