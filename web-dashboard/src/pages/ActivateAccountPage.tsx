/**
 * @file ActivateAccountPage.tsx
 * @description
 * Trang này xử lý việc kích hoạt tài khoản người dùng.
 * Khi người dùng nhấn vào link kích hoạt được gửi qua email, họ sẽ được chuyển đến trang này.
 * Trang sẽ lấy mã token từ URL, gửi nó đến server để xác thực và kích hoạt tài khoản.
 * Sau đó, trang sẽ hiển thị thông báo thành công hoặc thất bại cho người dùng.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { activateSubjectAccount } from '../services/api';
import styled from 'styled-components';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

// Container bao bọc toàn bộ trang, căn giữa nội dung.
const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
`;

// Hộp chứa nội dung chính (tiêu đề, thông báo, link).
const Container = styled.div`
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 450px;
    text-align: center;
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
`;

// Component để hiển thị thông báo, có màu sắc thay đổi theo trạng thái (thành công, lỗi, ...).
const Message = styled.p<{ status: 'loading' | 'success' | 'error' }>`
    font-size: 1.1rem;
    color: ${props => (props.status === 'success' ? '#28a745' : props.status === 'error' ? '#dc3545' : '#6c757d')};
    margin: 1.5rem 0;
`;

const BackLink = styled(Link)`
    display: inline-block;
    margin-top: 1.5rem;
    color: #007bff;
    text-decoration: none;
    font-size: 1rem;

    &:hover {
        text-decoration: underline;
    }
`;

const ErrorMessage = styled.p`
    color: #e53e3e;
    font-size: 0.9rem;
    text-align: center;
`;

const SuccessMessage = styled.p`
    color: #2f855a;
    text-align: center;
    font-weight: 600;
    margin-bottom: 1rem;
`;

// ==================================================================
// ACTIVATION PAGE COMPONENT
// ==================================================================

const ActivateAccountPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // --- SIDE EFFECTS ---
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Đường dẫn không hợp lệ hoặc thiếu mã kích hoạt.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Mật khẩu xác nhận không khớp.');
            return;
        }
        
        setStatus('loading');
        try {
            const response = await activateSubjectAccount({ 
                token: token!, 
                username, 
                password 
            });
            setStatus('success');
            setMessage(response.message || 'Tài khoản đã được kích hoạt thành công!');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Kích hoạt thất bại. Vui lòng thử lại.');
        }
    };

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <Container>
                <Title>Kích hoạt tài khoản</Title>
                
                {status === 'success' ? (
                    <>
                        <SuccessMessage>{message}</SuccessMessage>
                        <BackLink to="/login" style={{display: 'block'}}>Đến trang Đăng nhập</BackLink>
                    </>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <InputGroup>
                            <Label>Tên đăng nhập mới</Label>
                            <Input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                                placeholder="Nhập tên đăng nhập"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Mật khẩu</Label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="Tối thiểu 8 ký tự"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Xác nhận mật khẩu</Label>
                            <Input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                            />
                        </InputGroup>

                        {status === 'error' && <ErrorMessage>{message}</ErrorMessage>}

                        <Button type="submit" disabled={status === 'loading' || !token}>
                            {status === 'loading' ? <Spinner size={20} /> : 'Kích hoạt ngay'}
                        </Button>
                    </Form>
                )}

                {!token && (
                     <BackLink to="/login" style={{display: 'block'}}>Quay về trang Đăng nhập</BackLink>
                )}
            </Container>
        </PageContainer>
    );
};

export default ActivateAccountPage;
