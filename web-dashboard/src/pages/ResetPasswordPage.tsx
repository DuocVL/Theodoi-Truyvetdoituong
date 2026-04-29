import React, { useState } from 'react';
import AuthService from '../services/AuthService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
`;

const Button = styled.button`
    padding: 0.75rem;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: #0056b3;
    }
`;

const Message = styled.p`
    color: green;
    margin-bottom: 1rem;
    text-align: center;
`;

const Error = styled.p`
    color: red;
    margin-bottom: 1rem;
    text-align: center;
`;

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!token) {
            setError('Invalid or missing token');
            return;
        }

        try {
            const response = await AuthService.resetPassword(token, password);
            setMessage(response.message);
            setError('');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('Failed to reset password');
            setMessage('');
        }
    };

    return (
        <Container>
            <Title>Reset Password</Title>
            <Form onSubmit={handleResetPassword}>
                <Input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {message && <Message>{message}</Message>}
                {error && <Error>{error}</Error>}
                <Button type="submit">Reset Password</Button>
            </Form>
        </Container>
    );
};

export default ResetPasswordPage;
