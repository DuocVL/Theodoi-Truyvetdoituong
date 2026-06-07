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
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Table = styled.table`
  /* ... CSS cho bảng ... */
`;

// Badge để hiển thị trạng thái của đối tượng với màu sắc tương ứng.
const StatusBadge = styled.span<{ status: string }>`
    /* ... CSS cho badge ... */
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
    // --- HOOKS & STATE ---
    const { user } = useAuth(); // Lấy thông tin người dùng từ AuthContext để hiển thị lời chào.
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- DATA FETCHING (useEffect) ---
    useEffect(() => {
        const fetchAllSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                // Gọi API để lấy danh sách tất cả các đối tượng.
                const subjectsArray = await getSubjects();
                if (Array.isArray(subjectsArray)) {
                    setSubjects(subjectsArray);
                } else {
                    // Phòng trường hợp API trả về không phải là mảng.
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
    }, []); // Chạy 1 lần khi component mount.

    // --- DATA COMPUTATION (useMemo) ---
    // `useMemo` được sử dụng để tính toán các giá trị thống kê.
    // Hook này sẽ chỉ chạy lại khi `subjects` thay đổi, tránh việc tính toán lại không cần thiết mỗi lần render.
    const stats = useMemo(() => {
        // Sắp xếp các đối tượng theo ngày tạo mới nhất.
        const recent = [...subjects]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5); // Lấy 5 đối tượng gần đây nhất.
        
        // Trả về một object chứa tất cả các số liệu đã tính toán.
        return {
            total: subjects.length,
            tracking: subjects.filter(s => s.status === 'Đang theo dõi').length,
            paused: subjects.filter(s => s.status === 'Tạm dừng').length,
            finished: subjects.filter(s => s.status === 'Đã hoàn thành').length,
            recent
        };
    }, [subjects]); // Phụ thuộc vào `subjects`.

    // --- RENDER LOGIC ---

    // Hiển thị spinner khi đang tải dữ liệu.
    if (loading) {
        return <CenteredMessage><Spinner size={50} /><p>Đang tải dữ liệu...</p></CenteredMessage>;
    }

    // Hiển thị thông báo lỗi nếu có.
    if (error) {
        return <CenteredMessage><p style={{color: 'red'}}>{error}</p></CenteredMessage>;
    }

    return (
        <>
            {/* Phần Header */}
            <Header>
                <WelcomeTitle>Chào mừng trở lại, {user?.fullName || 'User'}!</WelcomeTitle>
                <WelcomeSubtitle>Đây là bức tranh tổng quan về các đối tượng của bạn.</WelcomeSubtitle>
            </Header>

            {/* Lưới các thẻ thống kê */}
            <StatsGrid>
                <StatCard>
                    <IconWrapper color="#4299e1"><FaUsers /></IconWrapper>
                    <CardContent><h3>Tổng số đối tượng</h3><p>{stats.total}</p></CardContent>
                </StatCard>
                {/* ... Các thẻ thống kê khác ... */}
            </StatsGrid>

            {/* Bảng các đối tượng gần đây */}
            <RecentSubjectsCard>
                <h2 style={{marginTop: 0, color: '#2d3748'}}>Đối tượng được thêm gần đây</h2>
                {stats.recent.length > 0 ? (
                    <Table>
                        {/* ... Render bảng ... */}
                    </Table>
                ) : (
                    <CenteredMessage>Chưa có đối tượng nào.</CenteredMessage>
                )}
            </RecentSubjectsCard>
        </>
    );
};

export default DashboardPage;
