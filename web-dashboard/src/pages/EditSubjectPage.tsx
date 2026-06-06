import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getSubjectById, updateSubject } from '../services/api';
import Spinner from '../components/Spinner';

// Styled Components (giữ nguyên)
const Container = styled.div`
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px;
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Title = styled.h2`
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
`;

const Form = styled.form`
    width: 100%;
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
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
`;

const CancelLink = styled(Link)`
    display: inline-block;
    width: 100%;
    padding: 0.75rem;
    background-color: #6c757d;
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
    const [initialLoading, setInitialLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) {
            navigate('/subjects');
            return;
        }

        const fetchSubject = async () => {
            setError(null);
            try {
                const subject = await getSubjectById(id);
                const formattedDate = subject.dateOfBirth ? new Date(subject.dateOfBirth).toISOString().split('T')[0] : '';
                
                // SỬA LỖI TẠI ĐÂY
                // Xây dựng một object mới khớp chính xác với cấu trúc của formData
                // và cung cấp giá trị mặc định cho các trường có thể là undefined.
                setFormData({
                    fullName: subject.fullName,
                    identifier: subject.identifier,
                    status: subject.status,
                    dateOfBirth: formattedDate,
                    notes: subject.notes ?? '',       // Sử dụng ?? để đảm bảo giá trị là string
                    imageUrl: subject.imageUrl ?? '' // Sử dụng ?? để đảm bảo giá trị là string
                });

            } catch (err) {
                setError('Không tìm thấy đối tượng hoặc đã có lỗi xảy ra.');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchSubject();
    }, [id, navigate]);

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

        setSubmitting(true);
        setError(null);
        try {
            await updateSubject(id, formData);
            navigate('/subjects', { state: { successMessage: `Đã cập nhật thành công đối tượng: ${formData.fullName}` } });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (initialLoading) {
        return (
            <Container>
                <Spinner size={50} />
                <p>Đang tải dữ liệu...</p>
            </Container>
        );
    }

    if (error && !formData.fullName) {
         return (
            <Container>
                <Error>{error}</Error>
                <CancelLink to="/subjects">Quay lại danh sách</CancelLink>
            </Container>
        );
    }

    return (
        <Container>
            <Title>Chỉnh sửa Đối tượng</Title>
            <Form onSubmit={handleSubmit}>
                <Input name="fullName" type="text" placeholder="Họ và tên (*)" value={formData.fullName} onChange={handleChange} disabled={submitting} />
                <Input name="identifier" type="text" placeholder="Mã định danh (*)" value={formData.identifier} onChange={handleChange} disabled={submitting} />
                <Input name="dateOfBirth" type="date" placeholder="Ngày sinh" value={formData.dateOfBirth} onChange={handleChange} disabled={submitting} />
                <Select name="status" value={formData.status} onChange={handleChange} disabled={submitting}>
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                </Select>
                <Input name="imageUrl" type="text" placeholder="URL ảnh chân dung" value={formData.imageUrl} onChange={handleChange} disabled={submitting} />
                <TextArea name="notes" placeholder="Ghi chú thêm..." value={formData.notes} onChange={handleChange} disabled={submitting} />
                
                {error && <Error>{error}</Error>}

                <ButtonContainer>
                    <CancelLink to="/subjects">Hủy</CancelLink>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? <Spinner size={20} /> : 'Lưu Thay đổi'}
                    </Button>
                </ButtonContainer>
            </Form>
        </Container>
    );
};

export default EditSubjectPage;
