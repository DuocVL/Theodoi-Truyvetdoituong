/**
 * @file SubjectListPage.tsx
 * @description Giao diện quản lý đối tượng cao cấp, đồng bộ tính năng chọn mốc thời gian và tải file nhị phân trực tiếp từ server.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject, exportCheckinsReportExcel, type Subject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFileDownload, FaMapMarkedAlt } from 'react-icons/fa';

// Import các Modal độc lập
import SubjectDetailModal from '../components/subjects/SubjectDetailModal';
import ExportConfigModal from '../components/subjects/ExportConfigModal';

// ==================================================================
// SYSTEM ANIMATIONS & DESIGN TOKENS
// ==================================================================
const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(4px); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
`;

// ==================================================================
// STYLED COMPONENTS (PREMIUM PALETTE)
// ==================================================================
const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.02);
  border: 1px solid #e2e8f0;
  padding: 1.75rem 2rem;
  margin-top: 1.5rem;
  overflow-x: auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a; /* Slate 900 */
  margin: 0;
  letter-spacing: -0.02em;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background-color: #4f46e5; /* Indigo 600 */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover { 
    background-color: #4338ca; /* Indigo 700 */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.25);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.5rem;
  border: 1px solid #cbd5e1; /* Slate 300 */
  border-radius: 8px;
  font-size: 0.95rem;
  color: #334155;
  box-sizing: border-box;
  background-color: #f8fafc;
  transition: all 0.15s ease-in-out;
  &:focus {
    outline: none;
    border-color: #6366f1; /* Indigo 500 */
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHead = styled.thead`
  background-color: #f8fafc; /* Slate 50 */
  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b; /* Slate 500 */
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #e2e8f0;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  &:hover {
    background-color: #f1f5f9; /* Slate 100 */
  }
  &:last-child td {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: middle;
  color: #334155; /* Slate 700 */
  font-size: 0.95rem;
  border-bottom: 1px solid #edf2f7;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #64748b;
  font-size: 1.05rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  &:hover:not(:disabled) {
    background-color: #e2e8f0;
  }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const statusColors: { [key: string]: { bg: string; text: string } } = {
  ACTIVE: { bg: '#dcfce7', text: '#15803d' },      /* Emerald Soft */
  INACTIVE: { bg: '#fee2e2', text: '#b91c1c' },    /* Red Soft */
  COMPLETED: { bg: '#f1f5f9', text: '#475569' },   /* Slate Soft */
};

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  background-color: ${({ status }) => statusColors[status.toUpperCase()]?.bg || '#e2e8f0'};
  color: ${({ status }) => statusColors[status.toUpperCase()]?.text || '#4a5568'};
  white-space: nowrap;
`;

const CenteredMessage = styled.div`
  padding: 4rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
`;

// Đổi tên từ Notification thành ToastNotification để tránh xung đột với kiểu dữ liệu của Window API
const ToastNotification = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1100;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: #065f46;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

// ==================================================================
// MAIN PAGE COMPONENT
// ==================================================================
const SubjectListPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [exportSubject, setExportSubject] = useState<Subject | null>(null); 
  const [zoneTargetSubject, setZoneTargetSubject] = useState<Subject | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.successMessage || null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await getSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không thể tải danh sách đối tượng quản lý.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredSubjects = useMemo(() => 
    subjects.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.idNumber && s.idNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [subjects, searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này?')) {
      setDeletingId(id);
      try {
        await deleteSubject(id);
        setSubjects(prev => prev.filter(s => s._id !== id));
        setSuccessMessage('Xóa đối tượng thành công.');
      } catch (err) {
        alert('Xóa đối tượng thất bại.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const executeExcelExport = async (id: string, start: string, end: string) => {
    try {
      const blobData = await exportCheckinsReportExcel(id, start, end);
      const fileUrl = window.URL.createObjectURL(new Blob([blobData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      }));
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.setAttribute('download', `Bao_Cao_Lich_Trinh_${id}.xlsx`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(fileUrl);
      setExportSubject(null);
    } catch (err) {
      alert('Tải file báo cáo thất bại.');
    }
  };

  return (
    <>
      {successMessage && <ToastNotification>{successMessage}</ToastNotification>}

      <PageHeader>
        <PageTitle>Quản lý Đối tượng</PageTitle>
        <AddButton onClick={() => navigate('/subjects/add')}>
          <FaPlus style={{ fontSize: '0.85rem' }} />
          <span>Thêm Đối Tượng</span>
        </AddButton>
      </PageHeader>

      <Card>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Tìm kiếm theo tên hoặc CCCD đối tượng..."
            value={searchTerm}
            // Định nghĩa rõ kiểu Event cho tham số 'e' để tránh lỗi Implicit Any
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {loading ? (
          <CenteredMessage><Spinner size={45} /></CenteredMessage>
        ) : error ? (
          <CenteredMessage style={{ color: '#ef4444' }}>{error}</CenteredMessage>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <th style={{width: '6%'}}>STT</th>
                <th style={{width: '30%'}}>Họ và Tên</th>
                <th style={{width: '20%'}}>CCCD / Số Định Danh</th>
                <th style={{width: '14%'}}>Trạng thái</th>
                <th style={{width: '30%', textAlign: 'right'}}>Hành động</th>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredSubjects.length > 0 ? filteredSubjects.map((s, index) => (
                <TableRow key={s._id} onClick={() => setSelectedSubject(s)}>
                  <TableCell style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                  <TableCell style={{ fontWeight: 600, color: '#0f172a' }}>{s.fullName}</TableCell>
                  <TableCell>{s.idNumber || '—'}</TableCell>
                  <TableCell><StatusBadge status={s.status}>{s.status}</StatusBadge></TableCell>
                  <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <ActionButtons>
                      <IconButton 
                        onClick={() => navigate(`/subjects/${s._id}/zones`)} // Chuyển hướng sang trang quản lý Zone riêng biệt của Subject
                        title="Quản lý Vùng giám sát" 
                        style={{ color: '#4f46e5' }}
                      >
                        <FaMapMarkedAlt />
                      </IconButton>
                      <IconButton onClick={() => setExportSubject(s)} title="Xuất báo cáo" style={{ color: '#10b981' }}>
                        <FaFileDownload />
                      </IconButton>
                      <IconButton onClick={() => navigate(`/subjects/edit/${s._id}`)} disabled={deletingId === s._id} title="Sửa" style={{ color: '#4f46e5' }}>
                        <FaEdit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(s._id)} disabled={deletingId === s._id} title="Xóa" style={{ color: '#ef4444' }}>
                        <FaTrash />
                      </IconButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <CenteredMessage>Không tìm thấy đối tượng nào trùng khớp với từ khóa.</CenteredMessage>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {selectedSubject && (
        <SubjectDetailModal 
          subject={selectedSubject} 
          onClose={() => setSelectedSubject(null)} 
          onTriggerExport={(sub) => { setSelectedSubject(null); setExportSubject(sub); }} 
        />
      )}

      {exportSubject && (
        <ExportConfigModal 
          subject={exportSubject} 
          onClose={() => setExportSubject(null)} 
          onExecuteExport={executeExcelExport} 
        />
      )}
    </>
  );
};

export default SubjectListPage;