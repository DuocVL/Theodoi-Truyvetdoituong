/**
 * @file ForgotPasswordPage.tsx
 * @description
 * Trang này cho phép người dùng yêu cầu khôi phục mật khẩu.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { forgotPassword } from '../services/api';
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';

// ==================================================================
// STYLED COMPONENTS (Reusing styles from LoginPage for consistency)
// ==================================================================

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
`;

const Box = styled.div`
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

const BackLinkContainer = styled.div`
    margin-top: 1.5rem;
    font-size: 0.9rem;
`;

const BackLink = styled(Link)`
    color: #3182ce;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const ForgotPasswordPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError('Vui lòng nhập địa chỉ email của bạn.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await forgotPassword(email);
            setMessage(response.message || 'Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <Box>
                <Title>Quên mật khẩu</Title>
                
                {/* If a success message exists, just show that and the link back */}
                {message ? (
                    <>
                        <Success>{message}</Success>
                        <BackLinkContainer>
                            <BackLink to="/login">Quay lại trang Đăng nhập</BackLink>
                        </BackLinkContainer>
                    </>
                ) : (
                    <>
                        <Form onSubmit={handleForgotPassword}>
                            <Input 
                                type="email" 
                                placeholder="Nhập email của bạn" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                disabled={loading} 
                                required
                            />
                            
                            {error && <Error>{error}</Error>}
                            
                            <Button type="submit" disabled={loading}>
                                {loading ? <Spinner size={24} /> : 'Gửi email khôi phục'}
                            </Button>
                        </Form>
                        <BackLinkContainer>
                            <BackLink to="/login">Hủy</BackLink>
                        </BackLinkContainer>
                    </>
                )}
            </Box>
        </PageContainer>
    );
};

export default ForgotPasswordPage;
