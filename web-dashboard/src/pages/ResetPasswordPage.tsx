/**
 * @file ResetPasswordPage.tsx
 * @description
 * Trang này cho phép người dùng đặt lại mật khẩu của họ sau khi đã nhận được email khôi phục.
 * - Trang này yêu cầu một `token` trong URL (dưới dạng query parameter), được gửi đến email của người dùng.
 * - Nếu không có token, trang sẽ hiển thị lỗi.
 * - Người dùng nhập mật khẩu mới và gửi đi.
 * - API được gọi với token và mật khẩu mới để xác thực và cập nhật.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { resetPassword as apiResetPassword } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const PageContainer = styled.div` /*...*/ `;
const Container = styled.div` /*...*/ `;
const Title = styled.h2` /*...*/ `;
const Form = styled.form` /*...*/ `;
const Input = styled.input` /*...*/ `;
const Button = styled.button` /*...*/ `;
const Message = styled.p` /*...*/ `;
const Error = styled.p` /*...*/ `;
const BackLink = styled(Link)` /*...*/ `;

// ==================================================================
// RESET PASSWORD PAGE COMPONENT
// ==================================================================

const ResetPasswordPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // Thông báo thành công.
    const [error, setError] = useState(''); // Thông báo lỗi.
    const [loading, setLoading] = useState(false);
    
    // `useSearchParams` hook để đọc các query parameter từ URL (ví dụ: ?token=...).
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Lấy token từ URL.
    const token = searchParams.get('token');

    // --- LOGIC & SIDE EFFECTS (useEffect) ---
    // Kiểm tra sự tồn tại của token ngay khi component được render.
    useEffect(() => {
        if (!token) {
            setError('Đường dẫn không hợp lệ hoặc thiếu mã token khôi phục.');
        }
    }, [token]);

    // --- EVENT HANDLERS ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!password) {
            setError('Vui lòng nhập mật khẩu mới.');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (!token) {
            setError('Không thể thực hiện. Mã token không tồn tại.');
            return;
        }
        
        setLoading(true);

        try {
            // Gọi API `resetPassword` với token và mật khẩu mới.
            const response = await apiResetPassword(token, password);
            setMessage(response.message || 'Mật khẩu của bạn đã được cập nhật thành công!');
            
            // Chuyển hướng người dùng về trang đăng nhập sau khi thành công.
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: unknown) {
            // Xử lý lỗi một cách an toàn.
            let errorMessage = 'Khôi phục mật khẩu thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
            if (err && typeof err === 'object' && 'response' in err) {
                errorMessage = (err as any).response?.data?.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---
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
                        // Vô hiệu hóa input nếu không có token, đang tải hoặc đã thành công.
                        disabled={loading || !!message || !token} 
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
