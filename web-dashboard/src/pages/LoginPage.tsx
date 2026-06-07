/**
 * @file LoginPage.tsx
 * @description
 * Trang đăng nhập cho phép người dùng xác thực và truy cập vào các phần được bảo vệ của ứng dụng.
 * - Sử dụng `AuthContext` để thực hiện logic đăng nhập.
 * - Lấy thông tin đăng nhập từ người dùng (username, password).
 * - Xử lý trạng thái loading và hiển thị lỗi.
 * - Sau khi đăng nhập thành công, điều hướng người dùng đến trang họ muốn truy cập ban đầu hoặc trang dashboard.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

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
const StyledLink = styled(Link)`
    /* ... */
`;

// ==================================================================
// LOGIN PAGE COMPONENT
// ==================================================================

const LoginPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth(); // Lấy hàm `login` từ AuthContext.
    const navigate = useNavigate();
    const location = useLocation(); // Hook để truy cập thông tin về URL hiện tại.

    // Xác định trang cần điều hướng đến sau khi đăng nhập thành công.
    // Nếu người dùng bị chuyển hướng tới trang login từ một trang được bảo vệ,
    // `location.state.from` sẽ chứa đường dẫn của trang đó.
    // Nếu không, mặc định sẽ là '/dashboard'.
    const from = location.state?.from?.pathname || '/dashboard';

    // --- EVENT HANDLERS ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            // Tạo một deviceId giả lập. Trong ứng dụng thực tế, nên dùng một mã định danh duy nhất, ổn định hơn.
            const deviceId = window.navigator.userAgent + '-' + new Date().getTime();
            
            // Gọi hàm `login` từ context.
            await login(username, password, deviceId);
            
            // Điều hướng người dùng đến trang `from` sau khi đăng nhập thành công.
            // `replace: true` thay thế trang login trong lịch sử duyệt web, để người dùng không thể quay lại nó bằng nút back.
            navigate(from, { replace: true });

        } catch (err: any) {
            // Lấy thông báo lỗi từ server hoặc hiển thị thông báo mặc định.
            const errorMessage = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không hợp lệ.';
            setError(errorMessage);
        } finally {
            setLoading(false); 
        }
    };

    // --- RENDER LOGIC ---
    return (
        <Container>
            <Title>Đăng Nhập</Title>
            <Form onSubmit={handleLogin}>
                <Input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading} 
                />
                <Input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                {error && <Error>{error}</Error>}
                <Button type="submit" disabled={loading}> 
                    {loading ? <Spinner size={20} /> : 'Đăng Nhập'}
                </Button>
            </Form>
            <StyledLink to="/register">Chưa có tài khoản? Đăng ký</StyledLink>
            <StyledLink to="/forgot-password">Quên mật khẩu?</StyledLink>
        </Container>
    );
};

export default LoginPage;
