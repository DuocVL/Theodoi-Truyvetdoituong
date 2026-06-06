import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { resetPassword as apiResetPassword } from '../services/api'; // Sửa import
import Spinner from '../components/Spinner'; // Thêm Spinner

// Layout và style nhất quán với các trang khác
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
    color: #28a745;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    text-align: center;
`;

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
    display: block;
    text-align: center;
    margin-top: 1.5rem;
    color: #007bff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Thêm loading state
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Hiển thị lỗi ngay khi load trang nếu không có token
    useEffect(() => {
        if (!token) {
            setError('Đường dẫn không hợp lệ hoặc thiếu mã token khôi phục.');
        }
    }, [token]);

    // Khai báo kiểu cho tham số sự kiện
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!password) {
            setError('Vui lòng nhập mật khẩu mới.');
            return;
        }

        if (!token) { // Kiểm tra lại token trước khi gửi
            setError('Không thể thực hiện. Mã token không tồn tại.');
            return;
        }
        
        setLoading(true);

        try {
            // Sử dụng hàm API mới
            const response = await apiResetPassword(token, password);
            setMessage(response.message || 'Mật khẩu của bạn đã được cập nhật thành công!');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Khôi phục mật khẩu thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Container>
                <Title>Tạo Mật Khẩu Mới</Title>
                <Form onSubmit={handleResetPassword}>
                    <Input 
                        type="password" 
                        placeholder="Nhập mật khẩu mới" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={loading || !!message || !token} // Vô hiệu hóa nếu đang tải, đã thành công, hoặc không có token
                    />
                    {message && <Message>{message}</Message>}
                    {error && <Error>{error}</Error>}
                    <Button type="submit" disabled={loading || !!message || !token}>
                        {loading ? <Spinner size={20} /> : 'Xác Nhận'}
                    </Button>
                </Form>
                 {message && <BackLink to="/login">Quay lại trang Đăng nhập</BackLink>}
            </Container>
        </PageContainer>
    );
};

export default ResetPasswordPage;
