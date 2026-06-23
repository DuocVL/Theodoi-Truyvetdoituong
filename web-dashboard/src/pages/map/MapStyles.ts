import styled from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
`;

export const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Label = styled.label`
  font-weight: 600;
  color: #343a40;
  font-size: 14px;
`;

export const Select = styled.select`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  background-color: #fff;
  font-size: 14px;
  color: #495057;
  outline: none;
  min-width: 220px;
  cursor: pointer;
  &:focus { border-color: #4dabf7; }
`;

export const DateInput = styled.input`
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-size: 14px;
  color: #495057;
  outline: none;
  &:focus { border-color: #4dabf7; }
`;

export const TimeInput = styled.input`
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-size: 14px;
  color: #495057;
  outline: none;
  width: 90px;
  &:focus { border-color: #4dabf7; }
`;

export const ClearButton = styled.button`
  padding: 8px 14px;
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover { background-color: #dee2e6; }
`;

export const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const SidebarList = styled.div`
  width: 380px; 
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

export const SidebarHeader = styled.div`
  padding: 14px 20px;
  background-color: #f1f3f5;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  letter-spacing: 0.5px;
`;

export const CheckinCard = styled.div<{ $isActive: boolean }>`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isActive ? '#e7f5ff' : 'transparent'};
  border-left: 4px solid ${props => props.$isActive ? '#228be6' : 'transparent'};
  &:hover { background-color: ${props => props.$isActive ? '#e7f5ff' : '#f8f9fa'}; }
`;

export const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #868e96;
`;

export const SubjectBadgeName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin: 4px 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  background-color: ${props => props.$status === 'ON_TIME' ? '#ebfbee' : '#fff5f5'};
  color: ${props => props.$status === 'ON_TIME' ? '#2b8a3e' : '#c92a2a'};
`;

export const CardNotes = styled.p`
  margin: 6px 0 0 0;
  font-size: 12.5px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MapWrapper = styled.div`
  flex: 1;
  height: 100%;
  z-index: 1;
`;

export const PopupDetails = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  color: #333;
  max-width: 240px;
  h4 { margin: 0 0 6px 0; color: #228be6; font-size: 14px; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; }
  p { margin: 5px 0; line-height: 1.4; }
  .img-container {
    margin-top: 10px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #dee2e6;
    background-color: #f1f3f5;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  img { width: 100%; height: auto; display: block; }
`;

export const TabContainer = styled.div`
  display: flex;
  background-color: #f1f3f5;
  border-bottom: 1px solid #e9ecef;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  border: none;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$active ? '#ffffff' : 'transparent'};
  color: ${props => props.$active ? '#228be6' : '#495057'};
  border-bottom: 2px solid ${props => props.$active ? '#228be6' : 'transparent'};

  &:hover {
    background-color: ${props => props.$active ? '#ffffff' : '#e9ecef'};
  }
`;

export const ZoneCard = styled.div<{ $isActive: boolean; $type: 'SAFE' | 'RESTRICTED' }>`
  padding: 14px 20px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Sửa tại đây */
  border-left: 4px solid ${props => props.$type === 'SAFE' ? '#10b981' : '#ef4444'};
  background-color: ${props => props.$isActive ? (props.$type === 'SAFE' ? '#f0fdf4' : '#fef2f2') : 'transparent'};

  &:hover {
    background-color: ${props => props.$type === 'SAFE' ? '#f0fdf4' : '#fef2f2'};
  }
`;

export const ZoneBadge = styled.span<{ $type: 'SAFE' | 'RESTRICTED' }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  /* Sửa tại đây */
  background-color: ${props => props.$type === 'SAFE' ? '#e6f4ea' : '#fce8e6'};
  color: ${props => props.$type === 'SAFE' ? '#137333' : '#c5221f'};
`;

export const ZoneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

export const ZoneName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #212529;
`;
