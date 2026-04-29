import React, { useState } from 'react';
import AuthService from '../services/AuthService';
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

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await AuthService.forgotPassword(email);
            setMessage(response.message);
            setError('');
        } catch (err) {
            setError('Failed to send reset email');
            setMessage('');
        }
    };

    return (
        <Container>
            <Title>Forgot Password</Title>
            <Form onSubmit={handleForgotPassword}>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {message && <Message>{message}</Message>}
                {error && <Error>{error}</Error>}
                <Button type="submit">Send Reset Email</Button>
            </Form>
        </Container>
    );
};

export default ForgotPasswordPage;
