/**
 * @file SubjectListPage.tsx
 * @description
 * Trang quản lý đối tượng với danh sách rút gọn và xem chi tiết bằng Modal.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject, type Subject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from 'react-icons/fa';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem 2rem;
  margin-top: 1.5rem;
  overflow-x: auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #1a202c;
  margin: 0;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: #2b6cb0; }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: #f7fafc;
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #edf2f7;
  cursor: pointer; // Thêm con trỏ để báo hiệu có thể nhấn vào
  &:hover {
    background-color: #f7fafc;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: middle;
  color: #2d3748;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #718096;
  font-size: 1.1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  &:hover:not(:disabled) {
    background-color: #edf2f7;
    color: #2d3748;
  }
  &[title="Sửa"]:hover { color: #3182ce; }
  &[title="Xóa"]:hover { color: #e53e3e; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const statusColors: { [key: string]: { bg: string; text: string } } = {
  ACTIVE: { bg: '#c6f6d5', text: '#2f855a' },
  INACTIVE: { bg: '#fed7d7', text: '#c53030' },
  COMPLETED: { bg: '#e2e8f0', text: '#4a5568' },
};

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: ${({ status }) => statusColors[status.toUpperCase()]?.bg || '#e2e8f0'};
  color: ${({ status }) => statusColors[status.toUpperCase()]?.text || '#4a5568'};
  white-space: nowrap;
`;

const CenteredMessage = styled.div`
  padding: 4rem 1rem;
  text-align: center;
  color: #718096;
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
`;

const Notification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

// --- Modal Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 2rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  label {
    font-size: 0.875rem;
    color: #718096;
    font-weight: 600;
  }

  span {
    font-size: 1rem;
    color: #2d3748;
  }
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const SubjectListPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const data = await getSubjects();
        setSubjects(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Không thể tải danh sách đối tượng.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (successMessage) {
      window.history.replaceState({}, document.title);
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
      } catch (err) {
        alert('Xóa đối tượng thất bại.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {successMessage && <Notification>{successMessage}</Notification>}

      <PageHeader>
        <PageTitle>Quản lý Đối tượng</PageTitle>
        <AddButton onClick={() => navigate('/subjects/add')}>
          <FaPlus />
          <span>Thêm Mới</span>
        </AddButton>
      </PageHeader>

      <Card>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Tìm kiếm theo tên hoặc CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {loading ? (
          <CenteredMessage><Spinner size={50} /></CenteredMessage>
        ) : error ? (
          <CenteredMessage style={{ color: '#e53e3e' }}>{error}</CenteredMessage>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <th style={{width: '5%'}}>STT</th>
                <th style={{width: '35%'}}>Họ và Tên</th>
                <th style={{width: '25%'}}>CCCD</th>
                <th style={{width: '15%'}}>Trạng thái</th>
                <th style={{width: '20%', textAlign: 'right'}}>Hành động</th>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredSubjects.length > 0 ? filteredSubjects.map((s, index) => (
                <TableRow key={s._id} onClick={() => setSelectedSubject(s)}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>{s.idNumber || '-'}</TableCell>
                  <TableCell><StatusBadge status={s.status}>{s.status}</StatusBadge></TableCell>
                  <TableCell onClick={handleActionClick}>
                    <ActionButtons>
                      <IconButton onClick={() => navigate(`/subjects/edit/${s._id}`)} disabled={deletingId === s._id} title="Sửa">
                        <FaEdit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(s._id)} disabled={deletingId === s._id} title="Xóa">
                        {deletingId === s._id ? <Spinner size={18} /> : <FaTrash />}
                      </IconButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <CenteredMessage>Không có đối tượng nào.</CenteredMessage>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {selectedSubject && (
        <ModalOverlay onClick={() => setSelectedSubject(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Thông tin chi tiết</h2>
              <IconButton onClick={() => setSelectedSubject(null)} title="Đóng"><FaTimes /></IconButton>
            </ModalHeader>
            <ModalBody>
                <DetailItem><label>Họ và Tên</label><span>{selectedSubject.fullName}</span></DetailItem>
                <DetailItem><label>Email</label><span>{selectedSubject.email}</span></DetailItem>
                <DetailItem><label>CCCD</label><span>{selectedSubject.idNumber || '-'}</span></DetailItem>
                <DetailItem><label>Tên đăng nhập</label><span>{selectedSubject.username || '-'}</span></DetailItem>
                <DetailItem><label>Ngày sinh</label><span>{selectedSubject.dob || '-'}</span></DetailItem>
                <DetailItem><label>Giới tính</label><span>{selectedSubject.gender || '-'}</span></DetailItem>
                <DetailItem><label>Số điện thoại</label><span>{selectedSubject.phone || '-'}</span></DetailItem>
                <DetailItem><label>Trạng thái</label><span><StatusBadge status={selectedSubject.status}>{selectedSubject.status}</StatusBadge></span></DetailItem>
                <DetailItem style={{ gridColumn: '1 / -1'}}><label>Địa chỉ</label><span>{selectedSubject.address || '-'}</span></DetailItem>
                <DetailItem><label>Bắt đầu theo dõi</label><span>{selectedSubject.monitoringStart ? new Date(selectedSubject.monitoringStart).toLocaleDateString() : '-'}</span></DetailItem>
                <DetailItem><label>Kết thúc theo dõi</label><span>{selectedSubject.monitoringEnd ? new Date(selectedSubject.monitoringEnd).toLocaleDateString() : '-'}</span></DetailItem>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default SubjectListPage;
