import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner'; // Import Spinner

// Styled components (giữ nguyên, thêm một số cho thông báo)
const Container = styled.div`
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: #fff;
  max-width: 1200px;
  margin: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  color: #fff;
`;

const AddButton = styled.button`
    padding: 0.6rem 1.2rem;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover { background-color: #0056b3; }
`;

const ActionButton = styled.button`
    padding: 0.3rem 0.6rem;
    margin-right: 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    &:disabled { cursor: not-allowed; opacity: 0.7; }
`;

const EditButton = styled(ActionButton)`
    background-color: #28a745;
    &:hover:not(:disabled) { background-color: #218838; }
`;

const DeleteButton = styled(ActionButton)`
    background-color: #dc3545;
    &:hover:not(:disabled) { background-color: #c82333; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td { padding: 0.75rem; text-align: left; }
  th { background: rgba(0,0,0,0.2); }
  tr:nth-child(even) { background: rgba(255,255,255,0.05); }
`;

const SearchInput = styled.input`
    padding: 0.6rem;
    font-size: 1rem;
    border: 1px solid #555;
    border-radius: 4px;
    background: rgba(255,255,255,0.2);
    color: #fff;
    width: 300px;

    &::placeholder { color: #ccc; }
`;

const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
`;

const Notification = styled.div`
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 5px;
    color: #fff;
    background-color: #28a745; // Màu xanh cho thành công
    animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

const Error = styled.p`
    color: #f8d7da;
    background-color: #721c24;
    padding: 1rem;
    border-radius: 5px;
    text-align: center;
`;

interface Subject {
  _id: string; 
  fullName: string;
  status: string;
  identifier: string;
}

const SubjectListPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State để biết đang xoá item nào
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // State cho thông báo thành công
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không thể tải danh sách đối tượng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Xử lý ẩn thông báo thành công sau một thời gian
  useEffect(() => {
    if (successMessage) {
        // Xóa message khỏi location state để không hiển thị lại khi refresh
        window.history.replaceState({}, document.title)
        
        const timer = setTimeout(() => {
            setSuccessMessage(null);
        }, 5000); // Tự động ẩn sau 5 giây

        return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredSubjects = useMemo(() => 
    subjects.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    ), [subjects, searchTerm]);

  const handleEdit = (id: string) => {
    navigate(`/subjects/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này? Hành động này không thể hoàn tác.')) {
      setDeletingId(id);
      try {
        await deleteSubject(id);
        // Thay vì alert, cập nhật trực tiếp state để UI phản hồi ngay lập tức
        setSubjects(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert('Xóa đối tượng thất bại. Vui lòng thử lại.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <Container>
        {successMessage && <Notification>{successMessage}</Notification>}

        <Header>
            <Title>Danh sách Đối tượng</Title>
            <AddButton onClick={() => navigate('/subjects/add')}>Thêm Mới</AddButton>
        </Header>

        <div style={{ marginBottom: '1rem' }}>
            <SearchInput
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã định danh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner size={50} /></div>
        ) : error ? (
            <Error>{error}</Error>
        ) : (
            <Table>
                <thead>
                    <tr>
                        <th>Họ tên</th>
                        <th>Mã định danh</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubjects.length > 0 ? filteredSubjects.map(s => (
                        <tr key={s._id}>
                            <td>{s.fullName}</td>
                            <td>{s.identifier}</td>
                            <td>{s.status}</td>
                            <td>
                                <EditButton onClick={() => handleEdit(s._id)} disabled={deletingId === s._id}>
                                    Sửa
                                </EditButton>
                                <DeleteButton onClick={() => handleDelete(s._id)} disabled={deletingId === s._id}>
                                    {deletingId === s._id ? <Spinner size={16} /> : 'Xóa'}
                                </DeleteButton>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center' }}>Không có đối tượng nào phù hợp.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        )}
    </Container>
  );
};

export default SubjectListPage;
