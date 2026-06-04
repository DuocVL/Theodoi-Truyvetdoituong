import React, { useEffect, useState } from 'react';
import { getSubjects } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: #fff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td { padding: 0.75rem; text-align: left; }
  th { background: rgba(0,0,0,0.2); }
  tr:nth-child(even) { background: rgba(255,255,255,0.05); }
`;

interface Subject {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
}

const SubjectListPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (e) {
        console.error('Failed to load subjects', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Container>Loading subjects…</Container>;

  return (
    <Container>
      <h2>Subject List</h2>
      <Table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Status</th><th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.status}</td>
              <td>{s.lastSeen}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default SubjectListPage;
