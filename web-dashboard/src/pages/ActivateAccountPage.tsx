import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { activateAccount } from '../services/api';
import styled from 'styled-components';
import Spinner from '../components/Spinner';

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
`;

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

const ActivateAccountPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Đang kích hoạt tài khoản của bạn, vui lòng chờ...');
    const hasRun = useRef(false); // Cờ để chặn chạy 2 lần trong StrictMode

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Đường dẫn không hợp lệ hoặc thiếu mã kích hoạt.');
            return;
        }

        // Nếu đã chạy rồi thì không chạy lại nữa
        if (hasRun.current) return;
        hasRun.current = true;

        const processActivation = async () => {
            try {
                const response = await activateAccount(token);
                setStatus('success');
                setMessage(response.message || 'Tài khoản đã được kích hoạt thành công! Bạn có thể đăng nhập ngay bây giờ.');
            } catch (err: any) {
                setStatus('error');
                const errorMessage = err.response?.data?.message || 'Kích hoạt thất bại. Mã có thể không hợp lệ hoặc đã hết hạn.';
                setMessage(errorMessage);
            }
        };

        processActivation();
    }, [searchParams]);

    return (
        <PageContainer>
            <Container>
                <Title>Kích hoạt tài khoản</Title>
                {status === 'loading' && <Spinner size={50} />}
                <Message status={status}>{message}</Message>
                {status !== 'loading' && (
                    <BackLink to="/login">Quay về trang Đăng nhập</BackLink>
                )}
            </Container>
        </PageContainer>
    );
};

export default ActivateAccountPage;
