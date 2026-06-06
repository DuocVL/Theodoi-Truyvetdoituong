import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getSubjectById, updateSubject } from '../services/api';

// Sử dụng lại các styled-components từ AddSubjectPage
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
`;

const Error = styled.p`
    color: red;
    margin-bottom: 1rem;
    text-align: center;
`;

const EditSubjectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        identifier: '',
        status: 'Đang theo dõi',
        notes: '',
        imageUrl: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchSubject = async () => {
            try {
                const subject = await getSubjectById(id);
                // Định dạng lại ngày sinh cho input type="date"
                const formattedDate = subject.dateOfBirth ? new Date(subject.dateOfBirth).toISOString().split('T')[0] : '';
                setFormData({ ...subject, dateOfBirth: formattedDate });
            } catch (err) {
                setError('Không tìm thấy đối tượng.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubject();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        if (!formData.fullName || !formData.identifier) {
            setError('Họ và tên và Mã định danh là bắt buộc.');
            return;
        }

        try {
            await updateSubject(id, formData);
            alert('Cập nhật đối tượng thành công!');
            navigate('/subjects');
        } catch (err) {
            setError('Đã xảy ra lỗi khi cập nhật.');
            console.error(err);
        }
    };

    if (loading) return <Container><p>Loading...</p></Container>;
    if (error && !loading) return <Container><Error>{error}</Error></Container>;

    return (
        <Container>
            <Title>Chỉnh sửa Đối tượng</Title>
            <Form onSubmit={handleSubmit}>
                <Input name="fullName" type="text" placeholder="Họ và tên (*)" value={formData.fullName} onChange={handleChange} />
                <Input name="identifier" type="text" placeholder="Mã định danh (*)" value={formData.identifier} onChange={handleChange} />
                <Input name="dateOfBirth" type="date" placeholder="Ngày sinh" value={formData.dateOfBirth} onChange={handleChange} />
                <Select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                </Select>
                <Input name="imageUrl" type="text" placeholder="URL ảnh chân dung" value={formData.imageUrl} onChange={handleChange} />
                <TextArea name="notes" placeholder="Ghi chú thêm..." value={formData.notes} onChange={handleChange} />
                {error && <Error>{error}</Error>}
                <Button type="submit">Lưu thay đổi</Button>
            </Form>
        </Container>
    );
};

export default EditSubjectPage;
