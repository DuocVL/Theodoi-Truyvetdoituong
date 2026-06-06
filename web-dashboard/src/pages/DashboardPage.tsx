import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { getSubjects, type Subject } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { FaUsers, FaEye, FaPauseCircle, FaCheckCircle } from 'react-icons/fa';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Header = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  color: #1a202c;
  margin: 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1rem;
  color: #718096;
  margin-top: 0.25rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const IconWrapper = styled.div<{ color: string }>`
  font-size: 2rem;
  color: ${props => props.color};
  margin-right: 1.5rem;
  background-color: ${props => props.color}20; // Light tint of the color
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardContent = styled.div`
  h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #4a5568;
    text-transform: uppercase;
    font-weight: 600;
  }
  p {
    margin: 0;
    font-size: 2rem;
    color: #1a202c;
    font-weight: 700;
  }
`;

const RecentSubjectsCard = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    text-align: left;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  th {
    font-size: 0.8rem;
    color: #718096;
    text-transform: uppercase;
  }
  td {
    color: #2d3748;
  }
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
  padding: 2rem;
  color: #718096;
`;

// ==================================================================
// DASHBOARD PAGE COMPONENT
// ==================================================================

const DashboardPage: React.FC = () => {
    const { user } = useAuth(); // Get user for welcome message
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const subjectsArray = await getSubjects();
                if (Array.isArray(subjectsArray)) {
                    setSubjects(subjectsArray);
                } else {
                    setSubjects([]);
                    console.warn('API did not return a valid array for subjects.');
                }
            } catch (err) {
                console.error("Failed to load dashboard subjects:", err);
                setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllSubjects();
    }, []);

    const stats = useMemo(() => {
        const recent = [...subjects]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        return {
            total: subjects.length,
            tracking: subjects.filter(s => s.status === 'Đang theo dõi').length,
            paused: subjects.filter(s => s.status === 'Tạm dừng').length,
            finished: subjects.filter(s => s.status === 'Đã hoàn thành').length,
            recent
        };
    }, [subjects]);

    if (loading) {
        return <CenteredMessage><Spinner size={50} /><p>Đang tải dữ liệu...</p></CenteredMessage>;
    }

    if (error) {
        return <CenteredMessage><p style={{color: 'red'}}>{error}</p></CenteredMessage>;
    }

    return (
        <>
            <Header>
                <WelcomeTitle>Chào mừng trở lại, {user?.fullName || 'User'}!</WelcomeTitle>
                <WelcomeSubtitle>Đây là bức tranh tổng quan về các đối tượng của bạn.</WelcomeSubtitle>
            </Header>

            <StatsGrid>
                <StatCard>
                    <IconWrapper color="#4299e1"><FaUsers /></IconWrapper>
                    <CardContent><h3>Tổng số đối tượng</h3><p>{stats.total}</p></CardContent>
                </StatCard>
                <StatCard>
                    <IconWrapper color="#38b2ac"><FaEye /></IconWrapper>
                    <CardContent><h3>Đang theo dõi</h3><p>{stats.tracking}</p></CardContent>
                </StatCard>
                <StatCard>
                    <IconWrapper color="#f6ad55"><FaPauseCircle /></IconWrapper>
                    <CardContent><h3>Tạm dừng</h3><p>{stats.paused}</p></CardContent>
                </StatCard>
                <StatCard>
                    <IconWrapper color="#68d391"><FaCheckCircle /></IconWrapper>
                    <CardContent><h3>Đã hoàn thành</h3><p>{stats.finished}</p></CardContent>
                </StatCard>
            </StatsGrid>

            <RecentSubjectsCard>
                <h2 style={{marginTop: 0, color: '#2d3748'}}>Đối tượng được thêm gần đây</h2>
                {stats.recent.length > 0 ? (
                    <Table>
                        <thead>
                            <tr><th>Họ và tên</th><th>Username</th><th>Trạng thái</th><th>Ngày tạo</th></tr>
                        </thead>
                        <tbody>
                            {stats.recent.map(s => (
                                <tr key={s._id}>
                                    <td>{s.fullName}</td>
                                    <td>{s.username}</td>
                                    <td><StatusBadge status={s.status}>{s.status}</StatusBadge></td>
                                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <CenteredMessage>Chưa có đối tượng nào.</CenteredMessage>
                )}
            </RecentSubjectsCard>
        </>
    );
};

export default DashboardPage;
