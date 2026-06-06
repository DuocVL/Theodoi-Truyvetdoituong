import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { getSubjects } from '../services/api';
import Spinner from '../components/Spinner'; // Import Spinner

// Styled Components (giữ nguyên)
const DashboardContainer = styled.div`
    padding: 2rem;
    color: #fff;
`;

const WelcomeMessage = styled.h1`
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
`;

const StatCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-5px);
    }
`;

const CardTitle = styled.h3`
    margin-top: 0;
    font-size: 1.2rem;
    color: #eee;
`;

const CardValue = styled.p`
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0.5rem 0 0 0;
    color: #fff;
`;

const RecentList = styled.div`
    margin-top: 3rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 12px;
`;

const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.8rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    &:last-child {
        border-bottom: none;
    }
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
  createdAt: string;
}

const DashboardPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getSubjects();
                // API có thể trả về null nếu có lỗi, cần kiểm tra
                if (data && data.subjects) {
                    setSubjects(data.subjects);
                } else {
                    // Trường hợp API trả về cấu trúc không mong muốn
                    setSubjects([]);
                }
            } catch (error) {
                console.error("Failed to load subjects for dashboard:", error);
                setError("Không thể tải dữ liệu cho dashboard. Vui lòng kiểm tra kết nối và thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllSubjects();
    }, []);

    const stats = useMemo(() => {
        const total = subjects.length;
        const tracking = subjects.filter(s => s.status === 'Đang theo dõi').length;
        const paused = subjects.filter(s => s.status === 'Tạm dừng').length;
        const finished = subjects.filter(s => s.status === 'Đã hoàn thành').length;
        
        // Sắp xếp an toàn hơn, phòng trường hợp createdAt không hợp lệ
        const recent = [...subjects]
            .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))
            .slice(0, 5);

        return { total, tracking, paused, finished, recent };
    }, [subjects]);

    // Cải thiện UI cho trạng thái loading và error
    if (loading) {
        return (
            <DashboardContainer style={{ textAlign: 'center', paddingTop: '5rem' }}>
                <Spinner size={60} />
                <p>Đang tải dữ liệu...</p>
            </DashboardContainer>
        );
    }

    if (error) {
        return (
            <DashboardContainer>
                 <WelcomeMessage>Chào mừng trở lại!</WelcomeMessage>
                 <Error>{error}</Error>
            </DashboardContainer>
        );
    }

    return (
        <DashboardContainer>
            <WelcomeMessage>Chào mừng trở lại!</WelcomeMessage>

            <StatsGrid>
                <StatCard><CardTitle>Tổng số Đối tượng</CardTitle><CardValue>{stats.total}</CardValue></StatCard>
                <StatCard><CardTitle>Đang Theo dõi</CardTitle><CardValue>{stats.tracking}</CardValue></StatCard>
                 <StatCard><CardTitle>Tạm dừng</CardTitle><CardValue>{stats.paused}</CardValue></StatCard>
                <StatCard><CardTitle>Đã Hoàn thành</CardTitle><CardValue>{stats.finished}</CardValue></StatCard>
            </StatsGrid>

            <RecentList>
                <h2 style={{marginTop: 0}}>Được thêm gần đây</h2>
                {stats.recent.length > 0 ? stats.recent.map(s => (
                     <ListItem key={s._id}>
                        <span>{s.fullName}</span>
                        <span style={{opacity: 0.7}}>{s.identifier}</span>
                    </ListItem>
                )) : <p>Chưa có đối tượng nào được thêm gần đây.</p>}
            </RecentList>

        </DashboardContainer>
    );
};

export default DashboardPage;
