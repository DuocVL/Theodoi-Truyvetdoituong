import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { createSubject } from '../services/api';
import Spinner from '../components/Spinner'; // Import Spinner

// Styled Components (giữ nguyên, có thể tách ra file riêng nếu cần)
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
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background-color: #0056b3;
    }

    &:disabled {
        background-color: #a0cff;
        cursor: not-allowed;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
`;

const CancelLink = styled(Link)`
    display: inline-block;
    width: 100%;
    padding: 0.75rem;
    background-color: #6c757d; /* Màu xám */
    color: #fff;
    text-align: center;
    text-decoration: none;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: #5a6268;
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
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName || !identifier) {
            setError('Họ và tên và Mã định danh là bắt buộc.');
            return;
        }

        setLoading(true);
        try {
            await createSubject({ 
                fullName, 
                dateOfBirth,
                identifier, 
                status, 
                notes, 
                imageUrl 
            });
            // Thay thế alert bằng việc lưu trạng thái vào location state để trang danh sách có thể hiển thị thông báo
            navigate('/subjects', { state: { successMessage: `Đã thêm thành công đối tượng: ${fullName}` } });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi thêm đối tượng. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
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
                    disabled={loading}
                />
                <Input
                    type="text"
                    placeholder="Mã định danh (CCCD, ...) (*)"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                />
                <Input
                    type="date"
                    placeholder="Ngày sinh"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={loading}
                />
                <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                </Select>
                <Input
                    type="text"
                    placeholder="URL ảnh chân dung"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={loading}
                />
                <TextArea
                    placeholder="Ghi chú thêm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                />
                {error && <Error>{error}</Error>}
                <ButtonContainer>
                    <CancelLink to="/subjects">Hủy</CancelLink>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Spinner size={20} /> : 'Thêm Đối tượng'}
                    </Button>
                </ButtonContainer>
            </Form>
        </Container>
    );
};

export default AddSubjectPage;
