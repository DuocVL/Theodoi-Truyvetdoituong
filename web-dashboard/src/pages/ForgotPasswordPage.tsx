/**
 * @file ForgotPasswordPage.tsx
 * @description
 * Trang này cho phép người dùng yêu cầu khôi phục mật khẩu.
 * Người dùng nhập địa chỉ email của họ, và nếu email tồn tại trong hệ thống,
 * một email chứa liên kết để đặt lại mật khẩu sẽ được gửi đến họ.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { forgotPassword } from '../services/api';
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
`;

const Container = styled.div`
    background: #fff;
    padding: 2rem 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 420px;
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
    font-size: 1.8rem;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    /* ... */
`;

const Button = styled.button`
    /* ... */
`;

// Component để hiển thị thông báo thành công (đã gửi email).
const Message = styled.p`
    color: #28a745;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    text-align: center;
`;

// Component để hiển thị thông báo lỗi.
const Error = styled.p`
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    text-align: center;
`;

const BackLink = styled(Link)`
    /* ... */
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const ForgotPasswordPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); // State cho thông báo thành công.
    const [error, setError] = useState(''); // State cho thông báo lỗi.
    const [loading, setLoading] = useState(false); // State cho trạng thái đang gửi yêu cầu.

    /**
     * Xử lý sự kiện submit form.
     * @param {React.FormEvent} e - Sự kiện submit.
     */
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault(); // Ngăn trang tải lại.
        
        if (!email) {
            setError('Vui lòng nhập địa chỉ email của bạn.');
            return;
        }

        // Reset state trước khi gửi yêu cầu mới.
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Gọi API `forgotPassword`.
            const response = await forgotPassword(email);
            // Hiển thị thông báo thành công từ server.
            setMessage(response.message || 'Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.');
        } catch (err: any) {
            // Hiển thị thông báo lỗi từ server.
            const errorMessage = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            // Dừng trạng thái loading.
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <Container>
                <Title>Quên mật khẩu</Title>
                <Form onSubmit={handleForgotPassword}>
                    <Input 
                        type="email" 
                        placeholder="Nhập email của bạn" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        // Vô hiệu hóa input khi đang tải hoặc đã gửi thành công để tránh người dùng thao tác thừa.
                        disabled={loading || !!message} 
                    />
                    
                    {message && <Message>{message}</Message>}
                    {error && <Error>{error}</Error>}
                    
                    <Button type="submit" disabled={loading || !!message}>
                        {loading ? <Spinner size={20} /> : 'Gửi email khôi phục'}
                    </Button>
                </Form>
                <BackLink to="/login">Quay lại trang Đăng nhập</BackLink>
            </Container>
        </PageContainer>
    );
};

export default ForgotPasswordPage;
