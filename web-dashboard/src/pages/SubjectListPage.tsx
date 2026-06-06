import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject, type Subject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: #1a202c;
  margin: 0;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background-color: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover { 
    background-color: #2b6cb0;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 350px;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem 0.75rem 2.5rem; // Make space for icon
  font-size: 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: #fff;
  color: #2d3748;
  width: 100%;
  box-sizing: border-box;

  &::placeholder { color: #a0aec0; }
  &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 1px #4299e1;
  }
`;

const SearchIcon = styled(FaSearch)`
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  th {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #e2e8f0;
    font-size: 0.8rem;
    color: #718096;
    text-transform: uppercase;
    font-weight: 600;
  }
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f7fafc;
  }
`;

const TableCell = styled.td`
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  vertical-align: middle;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 0.75rem;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    color: #718096;
    transition: color 0.2s;

    &:hover { color: #2d3748; }
    &:disabled { color: #cbd5e0; cursor: not-allowed; }
`;

const StatusBadge = styled.span<{ status: string }>`
    display: inline-block;
    padding: 0.25em 0.6em;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 9999px;
    color: ${props => {
        switch (props.status) {
            case 'Đang theo dõi': return '#2b6cb0';
            case 'Tạm dừng': return '#b7791f';
            case 'Đã hoàn thành': return '#2f855a';
            default: return '#4a5568';
        }
    }};
    background-color: ${props => {
         switch (props.status) {
            case 'Đang theo dõi': return '#bee3f8';
            case 'Tạm dừng': return '#f6e05e';
            case 'Đã hoàn thành': return '#c6f6d5';
            default: return '#e2e8f0';
        }
    }};
`;

const CenteredMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #718096;
`;

const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
`;

const Notification = styled.div`
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    color: #155724;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
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
  const navigate = useNavigate();
  const location = useLocation();

  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

  useEffect(() => {
    const fetchSubjects = async () => {
        setLoading(true);
        setError(null);
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
      (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [subjects, searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này? Hành động này không thể hoàn tác.')) {
      setDeletingId(id);
      try {
        await deleteSubject(id);
        setSubjects(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert('Xóa đối tượng thất bại. Vui lòng thử lại.');
      } finally {
        setDeletingId(null);
      }
    }
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
                    placeholder="Tìm kiếm theo tên hoặc username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </SearchContainer>

            {loading ? (
                <CenteredMessage><Spinner size={50} /></CenteredMessage>
            ) : error ? (
                <CenteredMessage style={{ color: 'red' }}>{error}</CenteredMessage>
            ) : (
                <Table>
                    <TableHead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Username</th>
                            <th>Trạng thái</th>
                            <th style={{textAlign: 'right'}}>Hành động</th>
                        </tr>
                    </TableHead>
                    <tbody>
                        {filteredSubjects.length > 0 ? filteredSubjects.map(s => (
                            <TableRow key={s._id}>
                                <TableCell>{s.fullName}</TableCell>
                                <TableCell>{s.username}</TableCell>
                                <TableCell><StatusBadge status={s.status}>{s.status}</StatusBadge></TableCell>
                                <TableCell style={{textAlign: 'right'}}>
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
                            <tr>
                                <td colSpan={4}>
                                    <CenteredMessage>Không có đối tượng nào.</CenteredMessage>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </Card>
    </>
  );
};

export default SubjectListPage;
