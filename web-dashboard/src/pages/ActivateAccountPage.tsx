/**
 * @file ActivateAccountPage.tsx
 * @description
 * Trang này xử lý việc kích hoạt cho cả User (tự động) và Subject (yêu cầu điền form).
 * Nó xác định loại kích hoạt dựa trên URL.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { activateAccount, activateSubjectAccount } from '../services/api';
import styled from 'styled-components';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    padding: 1rem;
`;

const Container = styled.div`
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 480px;
    text-align: center;
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
`;

const Message = styled.p<{ status: 'idle' | 'loading' | 'success' | 'error' }>`
    font-size: 1.1rem;
    color: ${props => (props.status === 'success' ? '#28a745' : props.status === 'error' ? '#dc3545' : '#6c757d')};
    margin: 1.5rem 0;
    line-height: 1.6;
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

const Form = styled.form`
    margin-top: 1.5rem;
`;

const InputGroup = styled.div`
    margin-bottom: 1.25rem;
    text-align: left;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #4a5568;
`;

const Input = styled.input`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 1px #4299e1;
    }
`;

const Button = styled.button`
    width: 100%;
    padding: 0.85rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
        background-color: #0056b3;
    }

    &:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
    }
`;

const FormDescription = styled.p`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #6c757d;
`;

// ==================================================================
// ACTIVATION PAGE COMPONENT
// ==================================================================

const ActivateAccountPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const hasRun = useRef(false);

    // --- STATE --- 
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    // State cho form của Subject
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const token = searchParams.get('token');
    const isSubjectActivation = location.pathname.includes('/subjects');

    // --- SIDE EFFECTS --- 
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Đường dẫn không hợp lệ hoặc thiếu mã kích hoạt.');
            return;
        }

        // Quy trình cho USER: tự động kích hoạt
        if (!isSubjectActivation) {
            if (hasRun.current) return;
            hasRun.current = true;

            setStatus('loading');
            setMessage('Đang kích hoạt tài khoản của bạn, vui lòng chờ...');

            const processUserActivation = async () => {
                try {
                    const response = await activateAccount(token);
                    setStatus('success');
                    setMessage(response.message || 'Tài khoản đã được kích hoạt thành công!');
                } catch (err: any) {
                    setStatus('error');
                    setMessage(err.response?.data?.message || 'Kích hoạt thất bại. Mã có thể đã hết hạn.');
                }
            };
            processUserActivation();
        }
        // Quy trình cho SUBJECT: không làm gì, chỉ chờ người dùng điền form

    }, [token, isSubjectActivation]);

    // --- HANDLERS ---
    const handleSubjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Mật khẩu xác nhận không khớp.');
            return;
        }
        if (!token) return;

        setStatus('loading');
        setMessage('');

        try {
            const response = await activateSubjectAccount({ token, username, password });
            setStatus('success');
            setMessage(response.message || 'Tài khoản đã được kích hoạt thành công!');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Kích hoạt thất bại. Vui lòng thử lại.');
        }
    };

    // --- RENDER LOGIC ---
    const renderContent = () => {
        // 1. Quá trình thành công (cho cả User và Subject)
        if (status === 'success') {
            return <>
                <Message status="success">{message}</Message>
                <BackLink to="/login">Đến trang Đăng nhập</BackLink>
            </>;
        }

        // 2. Kích hoạt Subject: Hiển thị form
        if (isSubjectActivation) {
            return (
                <Form onSubmit={handleSubjectSubmit}>
                    <FormDescription>Hoàn tất thông tin dưới đây để kích hoạt tài khoản giám sát của bạn.</FormDescription>
                    <InputGroup>
                        <Label>Tên đăng nhập</Label>
                        <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Chọn tên đăng nhập" />
                    </InputGroup>
                    <InputGroup>
                        <Label>Mật khẩu</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tối thiểu 8 ký tự" />
                    </InputGroup>
                    <InputGroup>
                        <Label>Xác nhận mật khẩu</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Nhập lại mật khẩu của bạn" />
                    </InputGroup>
                    {status === 'error' && message && <Message status="error">{message}</Message>}
                    <Button type="submit" disabled={status === 'loading'}>
                        {status === 'loading' ? <Spinner size={24} /> : 'Kích hoạt tài khoản'}
                    </Button>
                </Form>
            );
        }

        // 3. Kích hoạt User: Hiển thị trạng thái tự động
        return <>
            {status === 'loading' && <Spinner size={50} />}
            <Message status={status}>{message}</Message>
            {status !== 'loading' && <BackLink to="/login">Quay về trang Đăng nhập</BackLink>}
        </>;
    };

    return (
        <PageContainer>
            <Container>
                <Title>Kích hoạt tài khoản</Title>
                {renderContent()}
            </Container>
        </PageContainer>
    );
};

export default ActivateAccountPage;
