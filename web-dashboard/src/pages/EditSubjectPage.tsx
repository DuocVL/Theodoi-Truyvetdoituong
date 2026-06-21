/**
 * @file EditSubjectPage.tsx
 * @description Trang chỉnh sửa thông tin chi tiết của một đối tượng với giao diện đồng bộ dữ liệu API thực tế.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getSubjectById, updateSubject, type Subject } from '../services/api';
import Spinner from '../components/Spinner';

// ==================================================================
// STYLED COMPONENTS (Giữ nguyên giao diện Dark Theme chuyên nghiệp)
// ==================================================================
const PageWrapper = styled.div`
  padding: 1.5rem;
`;

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem;
  background-color: #1a202c; 
  color: #e2e8f0; 
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: #fff;
  margin-bottom: 2.5rem;
  text-align: center;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #a0aec0;
`;

const commonInputStyles = `
  padding: 0.8rem 1rem;
  border: 1px solid #4a5568;
  border-radius: 6px;
  font-size: 1rem;
  background-color: #2d3748; 
  color: #e2e8f0; 
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #63b3ed; 
    box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.5);
  }

  &::placeholder {
      color: #718096;
  }
`;

const Input = styled.input`
  ${commonInputStyles}
`;

const Select = styled.select`
  ${commonInputStyles}
  appearance: menulist;
`;

const ButtonContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &[type="submit"] {
    background-color: #3182ce;
    color: white;
    &:hover { background-color: #2b6cb0; transform: translateY(-2px); }
  }

  &[type="button"] {
    background-color: #4a5568;
    color: #e2e8f0;
    &:hover { background-color: #718096; transform: translateY(-2px); }
  }
`;

const CenteredMessage = styled.div`
    height: 50vh;
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

  const [formData, setFormData] = useState<Partial<Subject>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm chuyển đổi định dạng ngày tháng sang YYYY-MM-DD để nhét vừa thẻ <input type="date">
  const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  useEffect(() => {
    if (!id) {
        setError("ID của đối tượng không tồn tại.");
        setLoading(false);
        return;
    }

    const fetchSubject = async () => {
      try {
        const subjectData = await getSubjectById(id);
        
        // Khắc phục bóc tách dữ liệu nâng cao từ Server Response
        setFormData({
          ...subjectData,
          // Đảm bảo lấy được email kể cả khi lồng trong object `account` hay nằm ở ngoài
          email: subjectData.email || (subjectData as any).account?.email || '',
          // Ép định dạng ngày tháng đồng bộ để binding trực tiếp vào value
          dob: formatDateForInput(subjectData.dob),
          monitoringStart: formatDateForInput(subjectData.monitoringStart),
          monitoringEnd: formatDateForInput(subjectData.monitoringEnd),
          // Giữ nguyên trạng thái chữ in hoa (MALE / FEMALE) để khớp với value của select option
          gender: subjectData.gender ? subjectData.gender.toUpperCase() : '',
          status: subjectData.status || 'ACTIVE',
        });
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
      navigate('/subjects', { state: { successMessage: 'Cập nhật đối tượng thành công!' } });
    } catch (err) {
      console.error(err);
      alert('Cập nhật thất bại. Vui lòng kiểm tra lại thông tin cấu hình.');
    }
  };

  if (loading) {
    return <CenteredMessage><Spinner size={50} color="#e2e8f0" /></CenteredMessage>;
  }

  if (error) {
    return <CenteredMessage style={{ color: '#f56565' }}>{error}</CenteredMessage>;
  }

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Chỉnh sửa Đối tượng</Title>
        <Form onSubmit={handleSubmit}>
          
          <FormGroup>
            <Label htmlFor="fullName">Họ và Tên</Label>
            <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
          </FormGroup>

          <FormGroup>
              <Label htmlFor="email">Email Hệ thống</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="idNumber">Số CCCD</Label>
            <Input id="idNumber" name="idNumber" value={formData.idNumber || ''} onChange={handleChange} placeholder="Chưa cập nhật số CCCD" />
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
            {/* ĐỒNG BỘ VALUE: Chuyển đổi sang chữ hoa MALE, FEMALE, OTHER để khớp dữ liệu DB */}
            <Select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange}>
              <option value="">-- Chọn giới tính --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </Select>
          </FormGroup>

          <FormGroup style={{ gridColumn: '1 / -1' }}>
            <Label htmlFor="address">Địa chỉ thường trú</Label>
            <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="monitoringStart">Ngày bắt đầu giám sát</Label>
            <Input id="monitoringStart" name="monitoringStart" type="date" value={formData.monitoringStart || ''} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="monitoringEnd">Ngày kết thúc giám sát</Label>
            <Input id="monitoringEnd" name="monitoringEnd" type="date" value={formData.monitoringEnd || ''} onChange={handleChange} />
          </FormGroup>

          <FormGroup style={{ gridColumn: '1 / -1' }}>
            <Label htmlFor="status">Trạng thái quản lý</Label>
            <Select id="status" name="status" value={formData.status || 'ACTIVE'} onChange={handleChange} required>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Dừng hoạt động (INACTIVE)</option>
              <option value="COMPLETED">Hoàn thành theo dõi (COMPLETED)</option>
            </Select>
          </FormGroup>

          <ButtonContainer>
            <Button type="button" onClick={() => navigate('/subjects')}>Hủy</Button>
            <Button type="submit">Cập nhật dữ liệu</Button>
          </ButtonContainer>
        </Form>
      </FormContainer>
    </PageWrapper>
  );
};

export default EditSubjectPage;