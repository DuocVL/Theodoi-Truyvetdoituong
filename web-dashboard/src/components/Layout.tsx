/**
 * @file Layout.tsx
 * @description
 * Component `Layout` định nghĩa cấu trúc giao diện chính cho các trang cần được xác thực.
 * Nó bao gồm một thanh điều hướng bên (Sidebar) và một vùng nội dung chính (Content).
 * Bất kỳ trang nào được bọc bởi `Layout` sẽ hiển thị trong cấu trúc này.
 */

import React, { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { FaTachometerAlt, FaMapMarkedAlt, FaSignOutAlt, FaAddressBook, FaShieldAlt, FaUserAlt, FaExclamationTriangle } from 'react-icons/fa';

// ==================================================================
// STYLED COMPONENTS
// Các component được style bằng thư viện styled-components để tạo giao diện.
// ==================================================================

// Container chính bao bọc toàn bộ layout, sử dụng flexbox để sắp xếp Sidebar và Content.
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh; /* Đảm bảo layout chiếm toàn bộ chiều cao màn hình */
  background-color: #f0f2f5; /* Màu nền chung cho khu vực nội dung */
`;

// Thanh điều hướng bên trái.
const Sidebar = styled.div`
  width: 250px;
  background-color: #001529; /* Màu nền tối đặc trưng của Ant Design */
  color: white;
  display: flex;
  flex-direction: column; /* Sắp xếp các mục theo chiều dọc */
  padding: 20px 0;
`;

// Phần logo ở đầu Sidebar.
const Logo = styled.div`
  padding: 0 20px 30px 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #ffffff20; /* Đường kẻ mờ phân tách logo */
  margin-bottom: 20px;
`;

// Vùng chứa các link điều hướng chính.
const Nav = styled.nav`
  flex-grow: 1; /* Cho phép vùng này chiếm hết không gian còn lại */
`;

// Style cho mỗi link điều hướng.
// Sử dụng `NavLink` của react-router-dom để tự động thêm class 'active' khi link được chọn.
const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 15px 25px;
  color: rgba(255, 255, 255, 0.65); /* Màu chữ mờ khi không active */
  text-decoration: none;
  font-size: 16px;
  transition: background-color 0.2s, color 0.2s;

  /* Style khi link đang active hoặc được hover */
  &.active,
  &:hover {
    background-color: #1890ff; /* Màu xanh dương làm điểm nhấn */
    color: white;
  }

  /* Style cho icon bên trong link */
  svg {
    margin-right: 15px;
    font-size: 18px;
  }
`;

// Nút đăng xuất ở cuối Sidebar.
const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 15px 25px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #e84118; /* Màu đỏ cảnh báo khi hover */
    color: white;
  }

  svg {
    margin-right: 15px;
    font-size: 18px;
  }
`;

// Vùng chứa nội dung chính của trang, nằm bên phải Sidebar.
const Content = styled.main`
  flex-grow: 1; /* Chiếm hết không gian còn lại */
  padding: 24px;
  overflow: auto; /* Cho phép cuộn nếu nội dung dài */
`;

// ==================================================================
// INTERFACE & COMPONENT
// ==================================================================

// Định nghĩa props cho component Layout.
interface LayoutProps {
  children: ReactNode; // `children` là bất kỳ yếu tố React nào được truyền vào.
}

/**
 * Component `Layout`.
 * @param {LayoutProps} props - Props của component, chứa `children`.
 * @returns {React.ReactElement}
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Lấy hàm `logout` từ AuthContext để xử lý đăng xuất.
  const { logout, user } = useAuth();

  // Lấy hàm `navigate` từ react-router-dom để chuyển hướng trang.
  const navigate = useNavigate();

  /**
   * Xử lý sự kiện khi người dùng nhấn nút Đăng xuất.
   * Gọi hàm `logout` từ context và chuyển hướng về trang đăng nhập.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <LayoutContainer>
      <Sidebar>
        <Logo>Dashboard</Logo>
        <Nav>
          {/* Các link điều hướng chính của ứng dụng */}
          <StyledNavLink to="/dashboard">
            <FaTachometerAlt />
            <span>Dashboard</span>
          </StyledNavLink>
          <StyledNavLink to="/subjects">
            <FaAddressBook />
            <span>Đối tượng</span>
          </StyledNavLink>
          <StyledNavLink to="/map">
            <FaMapMarkedAlt />
            <span>Bản đồ</span>
          </StyledNavLink>

          <StyledNavLink to="/alerts">
            <FaExclamationTriangle />
            <span>Cảnh báo</span>
          </StyledNavLink>

          {user?.role === "ADMIN" && (
            <StyledNavLink to="/admin/logs">
              <FaShieldAlt /> {/* Cần cài react-icons/fa */}
              <span>Logs Hệ thống</span>
            </StyledNavLink>)}
          {user?.role === "ADMIN" && (
            <StyledNavLink to="/admin/users">
              <FaUserAlt /> {/* Cần cài react-icons/fa */}
              <span>Quản lý User</span>
            </StyledNavLink>)}

        </Nav>
        {/* Nút đăng xuất ở cuối Sidebar */}
        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Đăng xuất</span>
        </LogoutButton>
      </Sidebar>
      {/* Vùng hiển thị nội dung của trang hiện tại */}
      <Content>{children}</Content>
    </LayoutContainer>
  );
};

export default Layout;
