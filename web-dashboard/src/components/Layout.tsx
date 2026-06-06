import React, { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { FaTachometerAlt, FaMapMarkedAlt, FaSignOutAlt, FaAddressBook } from 'react-icons/fa';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #001529;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;

const Logo = styled.div`
  padding: 0 20px 30px 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #ffffff20;
  margin-bottom: 20px;
`;

const Nav = styled.nav`
  flex-grow: 1;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 15px 25px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 16px;
  transition: background-color 0.2s, color 0.2s;

  &.active,
  &:hover {
    background-color: #1890ff;
    color: white;
  }

  svg {
    margin-right: 15px;
    font-size: 18px;
  }
`;

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
    background-color: #e84118;
    color: white;
  }

  svg {
    margin-right: 15px;
    font-size: 18px;
  }
`;

const Content = styled.main`
  flex-grow: 1;
  padding: 24px;
  overflow: auto;
`;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <LayoutContainer>
      <Sidebar>
        <Logo>Dashboard</Logo>
        <Nav>
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
        </Nav>
        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Đăng xuất</span>
        </LogoutButton>
      </Sidebar>
      <Content>{children}</Content>
    </LayoutContainer>
  );
};

export default Layout;
