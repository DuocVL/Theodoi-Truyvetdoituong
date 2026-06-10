/**
 * @file EditSubjectPage.tsx
 * @description Trang chỉnh sửa thông tin chi tiết của một đối tượng.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getSubjectById, updateSubject, type Subject } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS (Tương tự AddSubjectPage)
// ==================================================================

const FormContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1a202c;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #4a5568;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
`;

const ButtonContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &[type="submit"] {
    background-color: #3182ce;
    color: white;
    &:hover { background-color: #2b6cb0; }
  }

  &[type="button"] {
    background-color: #e2e8f0;
    color: #2d3748;
    &:hover { background-color: #cbd5e0; }
  }
`;

const CenteredMessage = styled.div`
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    color: #718096;
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const EditSubjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Dùng Partial<Subject> để khởi tạo rỗng, vì dữ liệu sẽ được fetch sau
  const [formData, setFormData] = useState<Partial<Subject>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
        setError("ID của đối tượng không tồn tại.");
        setLoading(false);
        return;
    }

    const fetchSubject = async () => {
      try {
        const subjectData = await getSubjectById(id);
        setFormData(subjectData);
      } catch (err) {
        setError('Không thể tải thông tin đối tượng. Vui lòng thử lại.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updateSubject(id, formData);
      // Chuyển về trang danh sách với thông báo thành công
      navigate('/subjects', { state: { successMessage: 'Cập nhật đối tượng thành công!' } });
    } catch (err) {
      console.error(err);
      alert('Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  if (loading) {
    return <CenteredMessage><Spinner size={50} /></CenteredMessage>;
  }

  if (error) {
    return <CenteredMessage style={{ color: 'red' }}>{error}</CenteredMessage>;
  }

  return (
    <FormContainer>
      <Title>Chỉnh sửa Đối tượng</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="fullName">Họ và Tên</Label>
          <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="idNumber">CCCD</Label>
          <Input id="idNumber" name="idNumber" value={formData.idNumber || ''} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} />
        </FormGroup>
         <FormGroup>
          <Label htmlFor="dob">Ngày sinh</Label>
          <Input id="dob" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="gender">Giới tính</Label>
          <Select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange}>
            <option value="">-- Chọn giới tính --</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </Select>
        </FormGroup>
        <FormGroup style={{ gridColumn: '1 / -1' }}>
          <Label htmlFor="address">Địa chỉ</Label>
          <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="monitoringStart">Ngày bắt đầu theo dõi</Label>
          <Input id="monitoringStart" name="monitoringStart" type="date" value={formData.monitoringStart ? new Date(formData.monitoringStart).toISOString().split('T')[0] : ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="monitoringEnd">Ngày kết thúc theo dõi</Label>
          <Input id="monitoringEnd" name="monitoringEnd" type="date" value={formData.monitoringEnd ? new Date(formData.monitoringEnd).toISOString().split('T')[0] : ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="status">Trạng thái</Label>
          <Select id="status" name="status" value={formData.status || ''} onChange={handleChange} required>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
          </Select>
        </FormGroup>

        <ButtonContainer>
          <Button type="button" onClick={() => navigate('/subjects')}>Hủy</Button>
          <Button type="submit">Cập nhật</Button>
        </ButtonContainer>
      </Form>
    </FormContainer>
  );
};

export default EditSubjectPage;
