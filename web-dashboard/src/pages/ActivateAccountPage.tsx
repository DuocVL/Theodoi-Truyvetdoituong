/**
 * @file ActivateAccountPage.tsx
 * @description
 * Trang này xử lý việc kích hoạt tài khoản người dùng.
 * Khi người dùng nhấn vào link kích hoạt được gửi qua email, họ sẽ được chuyển đến trang này.
 * Trang sẽ lấy mã token từ URL, gửi nó đến server để xác thực và kích hoạt tài khoản.
 * Sau đó, trang sẽ hiển thị thông báo thành công hoặc thất bại cho người dùng.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { activateAccount } from '../services/api';
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

// ==================================================================
// ACTIVATION PAGE COMPONENT
// ==================================================================

const ActivateAccountPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [searchParams] = useSearchParams(); // Hook để truy cập các tham số query trên URL (ví dụ: ?token=...).
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Đang kích hoạt tài khoản của bạn, vui lòng chờ...');

    // `useRef` được dùng để ngăn `useEffect` chạy 2 lần trong môi trường `StrictMode` của React.
    // Ở chế độ Strict, React sẽ mount, unmount, rồi mount lại component để tìm lỗi tiềm ẩn.
    // `hasRun.current` sẽ giữ nguyên giá trị `true` sau lần chạy đầu tiên, ngăn logic kích hoạt bị gọi lại.
    const hasRun = useRef(false);

    // --- SIDE EFFECTS ---
    useEffect(() => {
        // Lấy giá trị của tham số `token` từ URL.
        const token = searchParams.get('token');

        // 1. Kiểm tra sự tồn tại của token.
        if (!token) {
            setStatus('error');
            setMessage('Đường dẫn không hợp lệ hoặc thiếu mã kích hoạt.');
            return; // Dừng thực thi nếu không có token.
        }

        // 2. Chặn thực thi lại trong StrictMode.
        if (hasRun.current) return;
        hasRun.current = true; // Đánh dấu là đã chạy.

        // 3. Hàm xử lý logic kích hoạt.
        const processActivation = async () => {
            try {
                // Gọi API để kích hoạt tài khoản với token đã lấy.
                const response = await activateAccount(token);
                setStatus('success');
                setMessage(response.message || 'Tài khoản đã được kích hoạt thành công! Bạn có thể đăng nhập ngay bây giờ.');
            } catch (err: any) {
                setStatus('error');
                // Lấy thông báo lỗi từ response của API, nếu không có thì dùng thông báo mặc định.
                const errorMessage = err.response?.data?.message || 'Kích hoạt thất bại. Mã có thể không hợp lệ hoặc đã hết hạn.';
                setMessage(errorMessage);
            }
        };

        processActivation();
    }, [searchParams]); // Effect này sẽ chạy lại nếu `searchParams` thay đổi (thực tế chỉ chạy 1 lần khi trang tải).

    // --- RENDER LOGIC ---
    return (
        <PageContainer>
            <Container>
                <Title>Kích hoạt tài khoản</Title>
                
                {/* Hiển thị Spinner khi đang trong trạng thái loading */}
                {status === 'loading' && <Spinner size={50} />}
                
                {/* Hiển thị thông báo với màu sắc tương ứng */}
                <Message status={status}>{message}</Message>
                
                {/* Chỉ hiển thị link quay về khi quá trình đã hoàn tất (thành công hoặc lỗi) */}
                {status !== 'loading' && (
                    <BackLink to="/login">Quay về trang Đăng nhập</BackLink>
                )}
            </Container>
        </PageContainer>
    );
};

export default ActivateAccountPage;
