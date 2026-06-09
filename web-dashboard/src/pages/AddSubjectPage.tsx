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
import { createSubject } from '../services/api';
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

const AddSubjectPage: React.FC = () => {
  // --- HOOKS & STATE ---
  const [error, setError] = useState<string | null>(null); // State để lưu thông báo lỗi từ server.
  const [isSaving, setIsSaving] = useState(false); // State để theo dõi quá trình lưu, dùng để vô hiệu hóa form và hiển thị spinner.
  const navigate = useNavigate(); // Hook từ React Router để thực hiện điều hướng chương trình.

  /**
   * Hàm được gọi khi người dùng submit form trong component `SubjectForm`.
   * @param {SubjectFormData} data - Dữ liệu từ form đã được `SubjectForm` thu thập.
   */
  const handleSubmit = async (data: Partial<SubjectFormData>) => {
    setError(null); // Reset lỗi trước mỗi lần submit.
    setIsSaving(true); // Bắt đầu quá trình lưu.
    try {
      // Gọi API `createSubject` với dữ liệu từ form.
      // API trả về một object có dạng { message: string, data: Subject }
      const response = await createSubject(data);
      
      // Lấy thông báo từ phản hồi của API để đảm bảo tính nhất quán
      const successMessage = response.message || `Đã thêm thành công đối tượng: ${response.data.full_name}`;

      // Điều hướng người dùng về trang danh sách đối tượng sau khi tạo thành công.
      // `navigate` cho phép truyền một `state` object. Ở đây, ta truyền một thông báo thành công
      // để trang danh sách có thể hiển thị nó.
      navigate('/subjects', { state: { successMessage } });

    } catch (err: any) {
      // Xử lý lỗi từ API.
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi thêm đối tượng. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);

    } finally {
      // Dù thành công hay thất bại, quá trình lưu đã kết thúc.
      setIsSaving(false);
    }
  };

  // --- RENDER LOGIC ---
  return (
    <Container>
      <Title>Tạo Đối tượng Mới</Title>
      {/* 
        Render component `SubjectForm` và truyền các props cần thiết:
        - `onSubmit`: Hàm xử lý logic khi form được submit.
        - `isSaving`: Trạng thái đang lưu để form có thể hiển thị spinner/vô hiệu hóa.
        - `submitButtonText`: Nhãn cho nút submit.
        - `error`: Thông báo lỗi để form hiển thị.
      */}
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
