/**
 * @file AddSubjectPage.tsx
 * @description
 * Trang này cho phép người dùng tạo một đối tượng (Subject) mới.
 * Nó sử dụng component `SubjectForm` có thể tái sử dụng để hiển thị các trường nhập liệu.
 * Trang này chịu trách nhiệm gọi API để tạo mới, xử lý trạng thái (loading, error) và điều hướng sau khi tạo thành công.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createSubject, type Subject } from '../services/api';
import SubjectForm, { type SubjectFormData } from '../components/SubjectForm';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

// Container chính cho trang, đặt ở giữa và có bóng đổ.
const Container = styled.div`
  background: #fff;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 900px; /* Tăng độ rộng để phù hợp với layout 2 cột của form */
  margin: 2rem auto;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #1a202c;
  margin: 0 0 2rem 0;
  text-align: center;
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

// Định nghĩa một kiểu dữ liệu cho dữ liệu đầu vào của hàm createSubject,
// trong đó fullName và email là bắt buộc.
// Các trường khác có thể có hoặc không.
type CreateSubjectPayload = Partial<Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'fullName' | 'email'>> & {
  fullName: string;
  email: string;
};


const AddSubjectPage: React.FC = () => {
  // --- HOOKS & STATE ---
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  /**
   * Hàm được gọi khi người dùng submit form trong component `SubjectForm`.
   * @param {Partial<SubjectFormData>} data - Dữ liệu từ form đã được `SubjectForm` thu thập.
   */
  const handleSubmit = async (data: Partial<SubjectFormData>) => {
    setError(null);
    setIsSaving(true);
    try {
      // Vì form đã có validation `required` cho fullName và email, 
      // ta có thể tự tin khẳng định với TypeScript rằng chúng tồn tại.
      const payload = data as CreateSubjectPayload;

      const response = await createSubject(payload);
      
      // Bây giờ response có kiểu { message: string, data: Subject }, nên có thể truy cập an toàn.
      const successMessage = response.message || `Đã thêm thành công đối tượng: ${response.data.fullName}`;

      navigate('/subjects', { state: { successMessage } });

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi thêm đối tượng. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);

    } finally {
      setIsSaving(false);
    }
  };  

  // --- RENDER LOGIC ---
  return (
    <Container>
      <Title>Tạo Đối tượng Mới</Title>
      <SubjectForm
        onSubmit={handleSubmit}
        isSaving={isSaving}
        submitButtonText="Thêm Đối tượng"
        error={error}
      />
    </Container>
  );
};

export default AddSubjectPage;
