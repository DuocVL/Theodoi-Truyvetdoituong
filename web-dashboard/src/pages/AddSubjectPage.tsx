import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createSubject } from '../services/api';
import SubjectForm, { type SubjectFormData } from '../components/SubjectForm';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Container = styled.div`
  background: #fff;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 900px; /* Increased width for 2-column layout */
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

const AddSubjectPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: SubjectFormData) => {
    setError(null);
    setIsSaving(true);
    try {
      const newSubject = await createSubject(data);
      navigate('/subjects', { state: { successMessage: `Đã thêm thành công đối tượng: ${newSubject.fullName}` } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi thêm đối tượng. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

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
