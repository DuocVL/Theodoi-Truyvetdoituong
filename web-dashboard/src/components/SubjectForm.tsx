/**
 * @file SubjectForm.tsx
 * @description
 * Đây là một component biểu mẫu (form) có thể tái sử dụng để **tạo mới** hoặc **chỉnh sửa** thông tin của một đối tượng (Subject).
 * Nó được thiết kế để trở nên linh hoạt thông qua việc nhận các props như `initialData`, `onSubmit`, `isSaving`.
 * Component này chỉ quản lý trạng thái và giao diện của form, logic xử lý submit được truyền từ bên ngoài vào.
 */

import React from 'react';
import styled from 'styled-components';
import { type Subject } from '../services/api';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

// ==================================================================
// TYPE DEFINITIONS - ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU
// ==================================================================

/**
 * `SubjectFormData` định nghĩa cấu trúc dữ liệu cho form.
 * Nó được tạo ra bằng cách loại bỏ các trường `_id`, `createdAt`, `updatedAt` từ kiểu `Subject` gốc.
 * Lý do: Các trường này thường do server quản lý, không phải do người dùng nhập vào form.
 * `Omit` là một Utility Type của TypeScript.
 */
export type SubjectFormData = Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * `SubjectFormProps` định nghĩa các props mà component `SubjectForm` sẽ nhận vào.
 */
interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>; // Dữ liệu ban đầu để điền vào form (dùng cho chức năng edit). `Partial` cho phép chỉ cần cung cấp một vài trường.
  onSubmit: (data: SubjectFormData) => Promise<void>; // Hàm sẽ được gọi khi form được submit. Đây là một hàm bất đồng bộ.
  isSaving: boolean; // Cờ báo hiệu form đang trong quá trình lưu, dùng để vô hiệu hóa input và hiển thị spinner.
  submitButtonText: string; // Nhãn cho nút submit (ví dụ: "Tạo mới" hoặc "Lưu thay đổi").
  error: string | null; // Thông điệp lỗi từ server (nếu có) để hiển thị trên giao diện.
}

// ==================================================================
// STYLED COMPONENTS - CÁC COMPONENT ĐƯỢC STYLE
// ==================================================================

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

// Sử dụng CSS Grid để tạo layout 2 cột cho form, giúp giao diện gọn gàng.
// Tự động chuyển về 1 cột trên màn hình nhỏ (mobile-first).
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Nhóm một cặp Label và Input lại với nhau.
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 600;
  color: #4a5568;
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 1px #4299e1; /* Hiệu ứng focus rõ ràng */
  }
`;

const FormSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
`;

const ErrorMessage = styled.p`
    color: #e53e3e;
    background-color: #fed7d7;
    padding: 1rem;
    border-radius: 6px;
    margin: 1.5rem 0 0 0;
    text-align: center;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end; /* Đẩy các nút về phía bên phải */
    gap: 1rem;
    margin-top: 2rem;
`;

const SubmitButton = styled.button`
    padding: 0.75rem 1.5rem;
    background-color: #3182ce;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;

    &:hover:not(:disabled) { background-color: #2b6cb0; }
    /* Style cho nút khi bị vô hiệu hóa */
    &:disabled { background-color: #a0aec0; cursor: not-allowed; }
`;

// Sử dụng `Link` từ react-router-dom nhưng được style như một nút bấm.
const CancelLink = styled(Link)`
    padding: 0.75rem 1.5rem;
    background-color: #718096;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    transition: background-color 0.2s;
    &:hover { background-color: #4a5568; }
`;

// ==================================================================
// FORM COMPONENT - COMPONENT BIỂU MẪU CHÍNH
// ==================================================================

const SubjectForm: React.FC<SubjectFormProps> = ({ initialData, onSubmit, isSaving, submitButtonText, error }) => {

  // --- STATE MANAGEMENT ---
  // Sử dụng `React.useState` để quản lý dữ liệu của form.
  // `formData` là một object chứa tất cả các giá trị người dùng nhập vào.
  const [formData, setFormData] = React.useState<Partial<SubjectFormData>>({
    // Các giá trị mặc định cho form tạo mới.
    username: '',
    email: '',
    fullName: '',
    dob: '',
    gender: 'Other',
    idNumber: '',
    address: '',
    phone: '',
    monitoringStart: '',
    monitoringEnd: '',
    status: 'Đang theo dõi',
    // ...initialData: Ghi đè các giá trị mặc định bằng `initialData` nếu được cung cấp.
    // Đây là cách form được điền sẵn dữ liệu trong chế độ "chỉnh sửa".
    ...initialData,
  });

  // --- EVENT HANDLERS ---

  /**
   * Hàm xử lý sự kiện `onChange` cho các input và select.
   * Nó cập nhật `formData` state một cách linh hoạt mỗi khi người dùng thay đổi giá trị.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Sự kiện thay đổi.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Cập nhật state: giữ lại các giá trị cũ (`...prev`) và ghi đè giá trị của trường đang thay đổi (`[name]: value`).
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Hàm xử lý sự kiện submit của form.
   * @param {React.FormEvent} e - Sự kiện submit.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt reload lại trang khi submit form.
    // Gọi hàm `onSubmit` được truyền từ component cha với dữ liệu hiện tại của form.
    // `formData` được ép kiểu thành `SubjectFormData` vì ta biết chắc chắn nó hợp lệ khi submit.
    onSubmit(formData as SubjectFormData);
  };

  // --- RENDER LOGIC ---

  return (
    <Form onSubmit={handleSubmit}>
      <FormGrid>
        {/* Mỗi FormGroup chứa một Label và một Input/Select */}
        <FormGroup>
          <FormLabel htmlFor="fullName">Họ và tên (*)</FormLabel>
          <FormInput id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required disabled={isSaving} />
        </FormGroup>
        <FormGroup>
           <FormLabel htmlFor="username">Tên đăng nhập (*)</FormLabel>
          <FormInput id="username" name="username" type="text" value={formData.username} onChange={handleChange} required disabled={isSaving} />
        </FormGroup>
        {/* ... các trường input khác ... */}
        {/* Xử lý định dạng ngày tháng: `value.split('T')[0]` để lấy phần YYYY-MM-DD cho input type="date" */}
        <FormGroup>
          <FormLabel htmlFor="dob">Ngày sinh</FormLabel>
          <FormInput id="dob" name="dob" type="date" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleChange} disabled={isSaving} />
        </FormGroup>

        {/* ... các trường input khác ... */}

        {/* Xử lý định dạng ngày giờ: `value.slice(0, 16)` để lấy phần YYYY-MM-DDTHH:mm cho input type="datetime-local" */}
        <FormGroup>
          <FormLabel htmlFor="monitoringStart">Bắt đầu theo dõi</FormLabel>
          <FormInput id="monitoringStart" name="monitoringStart" type="datetime-local" value={formData.monitoringStart ? formData.monitoringStart.slice(0, 16) : ''} onChange={handleChange} disabled={isSaving} />
        </FormGroup>

        {/* ... các trường input khác ... */}

      </FormGrid>

      {/* Hiển thị thông báo lỗi nếu có */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ButtonContainer>
          {/* Link "Hủy" sẽ điều hướng người dùng về trang danh sách */}
          <CancelLink to="/subjects">Hủy</CancelLink>
          {/* Nút Submit */}
          <SubmitButton type="submit" disabled={isSaving}>
              {/* 
                Logic hiển thị có điều kiện:
                - Nếu `isSaving` là true, hiển thị component Spinner.
                - Ngược lại, hiển thị văn bản của nút.
              */}
              {isSaving ? <Spinner size={20} /> : submitButtonText}
          </SubmitButton>
      </ButtonContainer>
    </Form>
  );
};

export default SubjectForm;
