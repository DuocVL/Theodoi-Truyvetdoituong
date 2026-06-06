import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createSubject } from '../services/api';

// Các styled-components tương tự như LoginPage cho nhất quán
const Container = styled.div`
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px;
    margin: 2rem auto;
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

const Select = styled.select`
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
`;

const TextArea = styled.textarea`
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    min-height: 100px;
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

const Error = styled.p`
    color: red;
    margin-bottom: 1rem;
    text-align: center;
`;

const AddSubjectPage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState('Đang theo dõi');
    const [notes, setNotes] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName || !identifier) {
            setError('Họ và tên và Mã định danh là bắt buộc.');
            return;
        }

        try {
            await createSubject({ 
                fullName, 
                dateOfBirth, 
                identifier, 
                status, 
                notes, 
                imageUrl 
            });
            alert('Thêm đối tượng thành công!');
            navigate('/subjects'); // Chuyển về trang danh sách sau khi thêm
        } catch (err) {
            setError('Đã xảy ra lỗi khi thêm đối tượng. Vui lòng kiểm tra lại thông tin.');
            console.error(err);
        }
    };

    return (
        <Container>
            <Title>Thêm Đối tượng Mới</Title>
            <Form onSubmit={handleSubmit}>
                <Input
                    type="text"
                    placeholder="Họ và tên (*)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                    type="text"
                    placeholder="Mã định danh (CCCD, ...) (*)"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                />
                 <Input
                    type="date"
                    placeholder="Ngày sinh"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                </Select>
                 <Input
                    type="text"
                    placeholder="URL ảnh chân dung"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
                <TextArea
                    placeholder="Ghi chú thêm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                {error && <Error>{error}</Error>}
                <Button type="submit">Thêm Đối tượng</Button>
            </Form>
        </Container>
    );
};

export default AddSubjectPage;
