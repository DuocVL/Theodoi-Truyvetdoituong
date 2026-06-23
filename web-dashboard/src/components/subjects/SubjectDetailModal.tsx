import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaUser, FaFileDownload } from 'react-icons/fa';
import { type Subject } from '../../services/api';

// Tái sử dụng các Styled Components Premium từ Palette của bạn
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
`;
const ModalContent = styled.div`
  background: #ffffff; padding: 2rem; border-radius: 12px;
  width: 90%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.25rem;
  h2 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
`;
const ModalBody = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2rem; overflow-y: auto;
`;
const DetailItem = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem;
  label { font-size: 0.825rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
  span { font-size: 0.975rem; color: #1e293b; font-weight: 500; }
`;
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem;
  border-top: 1px solid #f1f5f9; padding-top: 1.25rem; margin-top: 1.5rem;
`;
const ExportButton = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem;
  background-color: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
`;
const CloseButton = styled.button`
  background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;
`;
const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.775rem; font-weight: 600;
  background-color: ${props => props.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.status === 'ACTIVE' ? '#15803d' : '#b91c1c'};
`;

interface Props {
  subject: Subject;
  onClose: () => void;
  onTriggerExport: (subject: Subject) => void;
}

const SubjectDetailModal: React.FC<Props> = ({ subject, onClose, onTriggerExport }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser style={{ color: '#4f46e5' }} /> Hồ sơ thông tin chi tiết
          </h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailItem><label>Họ và Tên</label><span>{subject.fullName}</span></DetailItem>
          <DetailItem><label>Email liên hệ</label><span>{subject.email}</span></DetailItem>
          <DetailItem><label>Số CCCD</label><span>{subject.idNumber || '—'}</span></DetailItem>
          <DetailItem><label>Tên tài khoản</label><span>{subject.username || '—'}</span></DetailItem>
          <DetailItem><label>Ngày tháng năm sinh</label><span>{subject.dob || '—'}</span></DetailItem>
          <DetailItem><label>Giới tính</label><span>{subject.gender || '—'}</span></DetailItem>
          <DetailItem><label>Số điện thoại</label><span>{subject.phone || '—'}</span></DetailItem>
          <DetailItem><label>Diện theo dõi</label><span><StatusBadge status={subject.status}>{subject.status}</StatusBadge></span></DetailItem>
          <DetailItem style={{ gridColumn: '1 / -1' }}><label>Địa chỉ</label><span>{subject.address || '—'}</span></DetailItem>
        </ModalBody>
        <ModalFooter>
          <ExportButton onClick={() => onTriggerExport(subject)}>
            <FaFileDownload /> <span>Xuất Báo Cáo Đối Tượng</span>
          </ExportButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SubjectDetailModal;