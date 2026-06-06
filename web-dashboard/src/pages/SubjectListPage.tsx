import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, deleteSubject } from '../services/api';
import styled from 'styled-components';

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
`;

const EditButton = styled(ActionButton)`
    background-color: #28a745;
    &:hover { background-color: #218838; }
`;

const DeleteButton = styled(ActionButton)`
    background-color: #dc3545;
    &:hover { background-color: #c82333; }
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

    &::placeholder {
        color: #ccc;
    }
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
  const [searchTerm, setSearchTerm] = useState(''); // State cho ô tìm kiếm
  const navigate = useNavigate();

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data.subjects || []);
    } catch (e) {
      console.error('Failed to load subjects', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Lọc danh sách đối tượng dựa trên searchTerm
  const filteredSubjects = useMemo(() => 
    subjects.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    ), [subjects, searchTerm]);

  const handleEdit = (id: string) => {
    navigate(`/subjects/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này không?')) {
      try {
        await deleteSubject(id);
        alert('Xóa đối tượng thành công!');
        setLoading(true);
        fetchSubjects();
      } catch (err) {
        alert('Xóa đối tượng thất bại.');
        console.error(err);
      }
    }
  };

  if (loading) return <Container>Loading subjects…</Container>;

  return (
    <Container>
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
                <EditButton onClick={() => handleEdit(s._id)}>Sửa</EditButton>
                <DeleteButton onClick={() => handleDelete(s._id)}>Xóa</DeleteButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center' }}>Không có đối tượng nào phù hợp</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default SubjectListPage;
