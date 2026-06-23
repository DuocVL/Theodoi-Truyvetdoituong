import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaUser, FaFileDownload, FaClock, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';
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

const AvatarContainer = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  margin-bottom: 1.5rem;
  img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #f1f5f9; }
  .placeholder { width: 100px; height: 100px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #94a3b8; }
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem; color: #4f46e5; border-bottom: 2px solid #eef2ff;
  padding-bottom: 0.3rem; margin: 1.5rem 0 0.8rem 0; grid-column: 1 / -1;
  display: flex; align-items: center; gap: 0.5rem;
`;

const SubjectDetailModal: React.FC<Props> = ({ subject, onClose, onTriggerExport }) => {
  const baseURL = 'http://localhost:3333'
  console.log(subject)
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2><FaUser /> Hồ sơ đối tượng</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>

        <AvatarContainer>
          {subject.avatar_url ? (
            <img src={`${baseURL}${subject.avatar_url}`} crossOrigin='anonymous' alt={subject.fullName} />
          ) : (
            <div className="placeholder"><FaUser /></div>
          )}
          <StatusBadge status={subject.status}>{subject.status}</StatusBadge>
        </AvatarContainer>

        <ModalBody>
          <SectionTitle><FaInfoCircle /> Thông tin cá nhân</SectionTitle>
          <DetailItem><label>Họ tên</label><span>{subject.fullName}</span></DetailItem>
          <DetailItem><label>Email</label><span>{subject.email}</span></DetailItem>
          <DetailItem><label>CCCD</label><span>{subject.idNumber || '—'}</span></DetailItem>
          <DetailItem><label>Số ĐT</label><span>{subject.phone || '—'}</span></DetailItem>
          <DetailItem style={{ gridColumn: '1 / -1' }}><label>Địa chỉ</label><span>{subject.address || '—'}</span></DetailItem>

          <SectionTitle><FaShieldAlt /> Cấu hình giám sát</SectionTitle>
          <DetailItem><label>Khoảng cách Check-in</label><span>{subject.interval_minutes} phút</span></DetailItem>
          <DetailItem><label>Thời gian chờ (Grace)</label><span>{subject.grace_minutes} phút</span></DetailItem>
          <DetailItem><label>Giờ hoạt động</label><span>{subject.active_start_time || '00:00'} - {subject.active_end_time || '23:59'}</span></DetailItem>
          <DetailItem><label>Zone hiện tại</label><span>{subject.current_zone_id || 'Mặc định'}</span></DetailItem>

          <SectionTitle><FaClock /> Trạng thái hệ thống</SectionTitle>
          <DetailItem><label>Check-in gần nhất</label><span>{subject.last_checkin_at ? new Date(subject.last_checkin_at).toLocaleString() : 'Chưa có'}</span></DetailItem>
          <DetailItem><label>Nhắc nhở gần nhất</label><span>{subject.last_notified_at ? new Date(subject.last_notified_at).toLocaleString() : 'Chưa có'}</span></DetailItem>
        </ModalBody>

        <ModalFooter>
          <ExportButton onClick={() => onTriggerExport(subject)}>
            <FaFileDownload /> <span>Xuất Báo Cáo</span>
          </ExportButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SubjectDetailModal;