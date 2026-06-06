import React, { useState } from 'react';
import styled from 'styled-components';
import { forgotPassword } from '../services/api'; // Sửa import
import Spinner from '../components/Spinner'; // Thêm Spinner
import { Link } from 'react-router-dom';

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
    padding: 0.8rem;
    margin-bottom: 1.2rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
`;

const Button = styled.button`
    padding: 0.8rem;
    background-color: #007bff;
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
        background-color: #0056b3;
    }
    
    &:disabled {
        background-color: #a0cff;
        cursor: not-allowed;
    }
`;

const Message = styled.p`
    color: #28a745; // Màu xanh lá cho thành công
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    text-align: center;
`;

const Error = styled.p`
    color: #721c24; // Màu đỏ đậm cho lỗi
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    text-align: center;
`;

const BackLink = styled(Link)`
    display: block;
    text-align: center;
    margin-top: 1.5rem;
    color: #007bff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Thêm state loading

    // Khai báo kiểu cho tham số event
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
            // Sử dụng hàm API mới
            const response = await forgotPassword(email);
            setMessage(response.message || 'Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                        disabled={loading || !!message} // Vô hiệu hóa nếu đang tải hoặc đã thành công
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
