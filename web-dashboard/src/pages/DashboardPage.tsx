/**
 * @file DashboardPage.tsx
 * @description
 * Trang tổng quan (Dashboard) hiển thị các thông tin tóm tắt và quan trọng cho người dùng.
 * Bao gồm:
 * - Lời chào mừng người dùng.
 * - Các thẻ thống kê số lượng đối tượng theo trạng thái.
 * - Danh sách các đối tượng được thêm vào gần đây.
 * Trang này lấy dữ liệu từ API và tính toán các số liệu thống kê.
 */
import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { getSubjects, type Subject } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { FaUsers, FaExclamationTriangle, FaCheckCircle, FaPauseCircle } from 'react-icons/fa';

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

// Layout dạng lưới cho các thẻ thống kê, tự động điều chỉnh số cột.
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
    transform: translateY(-5px); // Hiệu ứng nhấc lên khi hover
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const IconWrapper = styled.div<{ color: string }>`
  font-size: 2rem;
  color: ${props => props.color};
  margin-right: 1.5rem;
  background-color: ${props => props.color}20; // Thêm 20% opacity vào màu chính
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardContent = styled.div`
  h3 { /* Tiêu đề thẻ (VD: Tổng số đối tượng) */
    margin: 0;
    font-size: 0.9rem;
    color: #4a5568;
    text-transform: uppercase;
    font-weight: 600;
  }
  p { /* Số liệu thống kê */
    margin: 0;
    font-size: 2rem;
    color: #1a202c;
    font-weight: 700;
  }
`;

const RecentSubjectsCard = styled.div`
  background: #fff; border-radius: 12px; padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-top: 1rem;
  th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 0.85rem; }
  td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 0.9rem; }
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
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSubjects().then(data => {
            setSubjects(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const stats = useMemo(() => {
        // Sắp xếp lấy 5 đối tượng mới nhất
        const recent = [...subjects]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        // Tính toán thông số chuẩn dựa trên enum
        return {
            total: subjects.length,
            active: subjects.filter(s => s.status === "ACTIVE").length,
            inactive: subjects.filter(s => s.status === "INACTIVE").length,
            completed: subjects.filter(s => s.status === "COMPLETED").length,
            recent
        };
    }, [subjects]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return { label: 'Đang hoạt động', color: '#16a34a' }; // Xanh lá
            case "INACTIVE":
                return { label: 'Tạm dừng', color: '#ea580c' }; // Cam
            case "COMPLETED":
                return { label: 'Hoàn thành', color: '#2563eb' }; // Xanh dương
            default:
                return { label: 'Khác', color: '#64748b' };
        }
    };

    if (loading) return <CenteredMessage><Spinner size={50} /></CenteredMessage>;

    return (
        <>
            <Header>
                <WelcomeTitle>Chào mừng trở lại, {user?.full_name || 'Admin'}!</WelcomeTitle>
                <WelcomeSubtitle>Tổng quan hệ thống giám sát đối tượng.</WelcomeSubtitle>
            </Header>

            <StatsGrid>
                <StatCard><IconWrapper color="#4f46e5"><FaUsers /></IconWrapper><CardContent><h3>Tổng số</h3><p>{stats.total}</p></CardContent></StatCard>
                <StatCard><IconWrapper color="#16a34a"><FaCheckCircle /></IconWrapper><CardContent><h3>Đang theo dõi</h3><p>{stats.active}</p></CardContent></StatCard>
                <StatCard><IconWrapper color="#ea580c"><FaPauseCircle /></IconWrapper><CardContent><h3>Tạm dừng</h3><p>{stats.inactive}</p></CardContent></StatCard>
            </StatsGrid>

            <RecentSubjectsCard>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Đối tượng thêm gần đây</h2>
                {stats.recent.length > 0 ? (
                    <Table>
                        <thead>
                            <tr><th>Tên đối tượng</th><th>Trạng thái</th><th>Ngày tạo</th></tr>
                        </thead>
                        <tbody>
                            {stats.recent.map(s => (
                                <tr key={s._id}>
                                    <td>{s.fullName}</td>
                                    <td>
                                        <span style={{
                                            color: getStatusConfig(s.status).color,
                                            fontWeight: 600,
                                            backgroundColor: `${getStatusConfig(s.status).color}15`,
                                            padding: '4px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {getStatusConfig(s.status).label}
                                        </span>
                                    </td>
                                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : <CenteredMessage>Chưa có dữ liệu đối tượng.</CenteredMessage>}
            </RecentSubjectsCard>
        </>
    );
};

export default DashboardPage
