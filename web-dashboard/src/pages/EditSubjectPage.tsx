import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getSubjectById, updateSubject, type Subject } from '../services/api';
import SubjectForm, { type SubjectFormData } from '../components/SubjectForm';
import Spinner from '../components/Spinner';

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

const LoadingContainer = styled.div`
    text-align: center;
    padding: 4rem;
`;

const ErrorContainer = styled.div`
    text-align: center;
    padding: 4rem;
    color: #e53e3e;
`;

const BackLink = styled(Link)`
    display: inline-block;
    margin-top: 1rem;
    color: #3182ce;
    text-decoration: none;
    &:hover { text-decoration: underline; }
`;


// ==================================================================
// PAGE COMPONENT
// ==================================================================

const EditSubjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/subjects');
      return;
    }

    const fetchSubject = async () => {
      try {
        const data = await getSubjectById(id);
        setSubject(data);
      } catch (err) {
        setError('Không thể tải thông tin đối tượng hoặc đối tượng không tồn tại.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSubject();
  }, [id, navigate]);

  const handleSubmit = async (data: SubjectFormData) => {
    if (!id) return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedSubject = await updateSubject(id, data);
      navigate('/subjects', { state: { successMessage: `Đã cập nhật thành công đối tượng: ${updatedSubject.fullName}` } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
        <Container>
            <LoadingContainer>
                <Spinner size={50} />
                <p>Đang tải dữ liệu...</p>
            </LoadingContainer>
        </Container>
    );
  }

  if (error && !subject) {
    return (
        <Container>
            <ErrorContainer>
                <p>{error}</p>
                <BackLink to="/subjects">Quay lại danh sách</BackLink>
            </ErrorContainer>
        </Container>
    );
  }

  return (
    <Container>
      <Title>Chỉnh sửa Đối tượng</Title>
      {subject && (
        <SubjectForm
          initialData={subject}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          submitButtonText="Lưu Thay đổi"
          error={error}
        />
      )}
    </Container>
  );
};

export default EditSubjectPage;
