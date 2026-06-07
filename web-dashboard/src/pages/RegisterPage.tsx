/**
 * @file RegisterPage.tsx
 * @description
 * Trang này cho phép người dùng mới đăng ký một tài khoản.
 * - Thu thập thông tin người dùng (tên đăng nhập, mật khẩu, email, họ và tên).
 * - Gọi API để thực hiện việc đăng ký.
 * - Xử lý và hiển thị thông báo thành công hoặc thất bại.
 * - Nếu đăng ký thành công, hiển thị thông báo và tự động chuyển hướng người dùng đến trang đăng nhập sau một khoảng thời gian ngắn.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { register as registerApi } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

// (Sử dụng lại các styled-components tương tự LoginPage để đảm bảo tính nhất quán)
const Container = styled.div`
    /* ... */
`;
const Title = styled.h2`
    /* ... */
`;
const Form = styled.form`
    /* ... */
`;
const Input = styled.input`
    /* ... */
`;
const Button = styled.button`
    /* ... */
`;
const Error = styled.p`
    /* ... */
`;
const Success = styled.p`
    color: green;
    margin-bottom: 1rem;
    text-align: center;
`;
const StyledLink = styled(Link)`
    /* ... */
`;

// ==================================================================
// REGISTER PAGE COMPONENT
// ==================================================================

const RegisterPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [full_name, setFullName] = useState(''); // Tên biến nhất quán với yêu cầu của API.
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null); // State cho thông báo đăng ký thành công.
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
            // Gọi API đăng ký.
            await registerApi({ username, password, email, full_name });
            // Thiết lập thông báo thành công.
            setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản. Bạn sẽ được chuyển đến trang đăng nhập sau giây lát...');
            
            // Tự động chuyển hướng đến trang đăng nhập sau 2 giây.
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            // Xử lý lỗi từ server.
            const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---
    return (
        <Container>
            <Title>Đăng Ký Tài Khoản</Title>
            <Form onSubmit={handleRegister}>
                <Input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
                <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                <Input type="text" placeholder="Họ và Tên" value={full_name} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
                
                {error && <Error>{error}</Error>}
                {success && <Success>{success}</Success>}

                {/* Vô hiệu hóa nút khi đang tải hoặc đã đăng ký thành công */}
                <Button type="submit" disabled={loading || !!success}>
                    {loading ? <Spinner size={20} /> : 'Đăng Ký'}
                </Button>
            </Form>
            <StyledLink to="/login">Đã có tài khoản? Đăng nhập</StyledLink>
        </Container>
    );
};

export default RegisterPage;
