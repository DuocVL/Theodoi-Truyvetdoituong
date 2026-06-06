import React from 'react';
import styled from 'styled-components';
import { type Subject } from '../services/api';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

// ==================================================================
// TYPE DEFINITIONS
// ==================================================================

export type SubjectFormData = Omit<Subject, '_id' | 'createdAt' | 'updatedAt';

interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  isSaving: boolean;
  submitButtonText: string;
  error: string | null;
}

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

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
      box-shadow: 0 0 0 1px #4299e1;
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
    justify-content: flex-end;
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
    &:disabled { background-color: #a0aec0; cursor: not-allowed; }
`;

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
// FORM COMPONENT
// ==================================================================

const SubjectForm: React.FC<SubjectFormProps> = ({ initialData, onSubmit, isSaving, submitButtonText, error }) => {

  const [formData, setFormData] = React.useState<Partial<SubjectFormData>>({
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
    ...initialData,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as SubjectFormData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormGrid>
        {/* Column 1 */}
        <FormGroup>
          <FormLabel htmlFor="fullName">Họ và tên (*)</FormLabel>
          <FormInput id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required disabled={isSaving} />
        </FormGroup>
        <FormGroup>
           <FormLabel htmlFor="username">Tên đăng nhập (*)</FormLabel>
          <FormInput id="username" name="username" type="text" value={formData.username} onChange={handleChange} required disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="email">Email (*)</FormLabel>
          <FormInput id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="phone">Số điện thoại</FormLabel>
          <FormInput id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="dob">Ngày sinh</FormLabel>
          <FormInput id="dob" name="dob" type="date" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="gender">Giới tính</FormLabel>
          <FormSelect id="gender" name="gender" value={formData.gender} onChange={handleChange} disabled={isSaving}>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </FormSelect>
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="idNumber">Số CCCD/CMND</FormLabel>
          <FormInput id="idNumber" name="idNumber" type="text" value={formData.idNumber} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="address">Địa chỉ</FormLabel>
          <FormInput id="address" name="address" type="text" value={formData.address} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
        <FormGroup>
            <FormLabel htmlFor="status">Trạng thái</FormLabel>
            <FormSelect id="status" name="status" value={formData.status} onChange={handleChange} disabled={isSaving}>
                <option value="Đang theo dõi">Đang theo dõi</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Đã hoàn thành">Đã hoàn thành</option>
            </FormSelect>
        </FormGroup>
        <FormGroup> {/* Empty group for alignment */}</FormGroup>
         <FormGroup>
          <FormLabel htmlFor="monitoringStart">Bắt đầu theo dõi</FormLabel>
          <FormInput id="monitoringStart" name="monitoringStart" type="datetime-local" value={formData.monitoringStart ? formData.monitoringStart.slice(0, 16) : ''} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="monitoringEnd">Kết thúc theo dõi</FormLabel>
          <FormInput id="monitoringEnd" name="monitoringEnd" type="datetime-local" value={formData.monitoringEnd ? formData.monitoringEnd.slice(0, 16) : ''} onChange={handleChange} disabled={isSaving} />
        </FormGroup>
      </FormGrid>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ButtonContainer>
          <CancelLink to="/subjects">Hủy</CancelLink>
          <SubmitButton type="submit" disabled={isSaving}>
              {isSaving ? <Spinner size={20} /> : submitButtonText}
          </SubmitButton>
      </ButtonContainer>
    </Form>
  );
};

export default SubjectForm;
