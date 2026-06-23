import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaCalendarAlt, FaFileDownload } from 'react-icons/fa';
import { type Subject } from '../../services/api';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000;
`;
const SmallModalContent = styled.div`
  background: #ffffff; padding: 2rem; border-radius: 12px; width: 90%; max-width: 420px;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;
  h2 { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
`;
const DateInputGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;
  label { font-size: 0.875rem; color: #334155; font-weight: 600; }
  input { padding: 0.625rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; width: 100%; }
`;
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;
`;
const ExportButton = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background-color: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const CancelButton = styled.button`
  padding: 0.625rem 1.25rem; background-color: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
`;

interface Props {
  subject: Subject;
  onClose: () => void;
  onExecuteExport: (subjectId: string, start: string, end: string) => Promise<void>;
}

const ExportConfigModal: React.FC<Props> = ({ subject, onClose, onExecuteExport }) => {
  const today = new Date().toISOString().split('T')[0];
  const past30Days = new Date();
  past30Days.setDate(past30Days.getDate() - 30);
  
  const [startDate, setStartDate] = useState(past30Days.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today);
  const [exporting, setExporting] = useState(false);

  const handleConfirm = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    setExporting(true);
    await onExecuteExport(subject._id, startDate, endDate);
    setExporting(false);
  };

  return (
    <ModalOverlay onClick={() => !exporting && onClose()}>
      <SmallModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCalendarAlt style={{ color: '#10b981' }} /> Phạm vi thời gian
          </h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={onClose} disabled={exporting}><FaTimes /></button>
        </ModalHeader>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#475569' }}>
          Trích xuất lịch trình của: <strong>{subject.fullName}</strong>
        </div>
        
        <DateInputGroup>
          <label>Từ ngày</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={exporting} />
        </DateInputGroup>
        <DateInputGroup>
          <label>Đến ngày</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={exporting} />
        </DateInputGroup>

        <ModalFooter>
          <CancelButton onClick={onClose} disabled={exporting}>Quay lại</CancelButton>
          <ExportButton onClick={handleConfirm} disabled={exporting}>
            <FaFileDownload /> {exporting ? 'Đang xuất...' : 'Tải File (.xlsx)'}
          </ExportButton>
        </ModalFooter>
      </SmallModalContent>
    </ModalOverlay>
  );
};

export default ExportConfigModal;