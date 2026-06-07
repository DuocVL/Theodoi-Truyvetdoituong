/**
 * @file EditSubjectPage.tsx
 * @description
 * Trang này cho phép người dùng chỉnh sửa thông tin của một đối tượng đã tồn tại.
 * - Đầu tiên, nó lấy `id` của đối tượng từ URL.
 * - Sau đó, nó gọi API để lấy dữ liệu hiện tại của đối tượng đó.
 * - Dữ liệu này được truyền vào `SubjectForm` dưới dạng `initialData` để điền vào các trường.
 * - Khi người dùng submit, trang sẽ gọi API để cập nhật thông tin.
 */

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
  /* ... */
`;
const Title = styled.h1`
  /* ... */
`;
const LoadingContainer = styled.div`
  /* ... */
`;
const ErrorContainer = styled.div`
  /* ... */
`;
const BackLink = styled(Link)`
  /* ... */
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const EditSubjectPage: React.FC = () => {
  // --- HOOKS & STATE ---
  const { id } = useParams<{ id: string }>(); // Lấy `id` từ URL, ví dụ: /subjects/edit/123 -> id là "123".
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null); // State để lưu dữ liệu đối tượng được fetch về.
  const [error, setError] = useState<string | null>(null); // State cho các lỗi (cả lúc fetch và lúc lưu).
  const [initialLoading, setInitialLoading] = useState(true); // State cho trạng thái tải dữ liệu ban đầu.
  const [isSaving, setIsSaving] = useState(false); // State cho trạng thái đang lưu sau khi submit.

  // --- DATA FETCHING (useEffect) ---
  useEffect(() => {
    if (!id) {
      // Nếu không có id trên URL, điều hướng về trang danh sách.
      navigate('/subjects');
      return;
    }

    const fetchSubject = async () => {
      try {
        // Gọi API để lấy thông tin chi tiết của đối tượng dựa trên id.
        const data = await getSubjectById(id);
        setSubject(data);
      } catch (err) {
        setError('Không thể tải thông tin đối tượng hoặc đối tượng không tồn tại.');
      } finally {
        setInitialLoading(false); // Dừng trạng thái tải ban đầu.
      }
    };

    fetchSubject();
  }, [id, navigate]); // Effect này sẽ chạy lại nếu `id` hoặc `navigate` thay đổi.

  // --- EVENT HANDLERS ---
  const handleSubmit = async (data: SubjectFormData) => {
    if (!id) return; // Bảo vệ trong trường hợp không có id.

    setIsSaving(true);
    setError(null); // Reset lỗi trước khi lưu.
    try {
      // Gọi API `updateSubject` để cập nhật thông tin.
      const updatedSubject = await updateSubject(id, data);
      // Điều hướng về trang danh sách với thông báo thành công.
      navigate('/subjects', { state: { successMessage: `Đã cập nhật thành công đối tượng: ${updatedSubject.fullName}` } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setIsSaving(false); // Dừng trạng thái lưu.
    }
  };

  // --- RENDER LOGIC ---

  // 1. Trạng thái tải dữ liệu ban đầu.
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

  // 2. Trạng thái lỗi khi không thể tải được dữ liệu đối tượng.
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

  // 3. Trạng thái thành công: hiển thị form với dữ liệu đã tải.
  return (
    <Container>
      <Title>Chỉnh sửa Đối tượng</Title>
      {subject && ( // Chỉ render form khi đã có dữ liệu `subject`.
        <SubjectForm
          initialData={subject} // Truyền dữ liệu ban đầu vào form.
          onSubmit={handleSubmit}
          isSaving={isSaving}
          submitButtonText="Lưu Thay đổi"
          error={error} // Lỗi này có thể là lỗi từ lúc submit.
        />
      )}
    </Container>
  );
};

export default EditSubjectPage;
