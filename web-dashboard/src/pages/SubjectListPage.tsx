/**
 * @file SubjectListPage.tsx
 * @description Giao diện quản lý đối tượng cao cấp, đồng bộ tính năng chọn mốc thời gian và tải file nhị phân trực tiếp từ server.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject, exportCheckinsReportExcel, type Subject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaFileDownload, FaCalendarAlt, FaUser } from 'react-icons/fa';

// ==================================================================
// SYSTEM ANIMATIONS & DESIGN TOKENS
// ==================================================================
const scaleUp = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(4px); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
`;

// ==================================================================
// STYLED COMPONENTS (PREMIUM PALETTE)
// ==================================================================
const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.02);
  border: 1px solid #e2e8f0;
  padding: 1.75rem 2rem;
  margin-top: 1.5rem;
  overflow-x: auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a; /* Slate 900 */
  margin: 0;
  letter-spacing: -0.02em;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background-color: #4f46e5; /* Indigo 600 */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover { 
    background-color: #4338ca; /* Indigo 700 */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.25);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.5rem;
  border: 1px solid #cbd5e1; /* Slate 300 */
  border-radius: 8px;
  font-size: 0.95rem;
  color: #334155;
  box-sizing: border-box;
  background-color: #f8fafc;
  transition: all 0.15s ease-in-out;
  &:focus {
    outline: none;
    border-color: #6366f1; /* Indigo 500 */
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHead = styled.thead`
  background-color: #f8fafc; /* Slate 50 */
  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b; /* Slate 500 */
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #e2e8f0;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  &:hover {
    background-color: #f1f5f9; /* Slate 100 */
  }
  &:last-child td {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: middle;
  color: #334155; /* Slate 700 */
  font-size: 0.95rem;
  border-bottom: 1px solid #edf2f7;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #64748b;
  font-size: 1.05rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  &:hover:not(:disabled) {
    background-color: #e2e8f0;
  }
  &[title="Sửa"]:hover { color: #4f46e5; background-color: #eef2ff; }
  &[title="Xóa"]:hover { color: #ef4444; background-color: #fef2f2; }
  &[title="Xuất báo cáo"]:hover { color: #10b981; background-color: #ecfdf5; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const statusColors: { [key: string]: { bg: string; text: string } } = {
  ACTIVE: { bg: '#dcfce7', text: '#15803d' },      /* Emerald Soft */
  INACTIVE: { bg: '#fee2e2', text: '#b91c1c' },    /* Red Soft */
  COMPLETED: { bg: '#f1f5f9', text: '#475569' },   /* Slate Soft */
};

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  background-color: ${({ status }) => statusColors[status.toUpperCase()]?.bg || '#e2e8f0'};
  color: ${({ status }) => statusColors[status.toUpperCase()]?.text || '#4a5568'};
  white-space: nowrap;
`;

const CenteredMessage = styled.div`
  padding: 4rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
`;

const Notification = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1100;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: #065f46;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

// --- Modal Core Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45); /* Màn tối Slate đè nền */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${scaleUp} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;

  h2 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #0f172a;
  }
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label {
    font-size: 0.825rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  span {
    font-size: 0.975rem;
    color: #1e293b;
    font-weight: 500;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.25rem;
  margin-top: 1.5rem;
`;

// --- Components Cấu hình Xuất báo cáo ---
const SmallModalContent = styled(ModalContent)`
  max-width: 420px;
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    color: #334155;
    font-weight: 600;
  }

  input {
    padding: 0.625rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    color: #1e293b;
    box-sizing: border-box;
    width: 100%;
    background-color: #f8fafc;
    transition: border-color 0.15s, box-shadow 0.15s;
    &:focus {
      outline: none;
      border-color: #6366f1;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
    }
  }
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background-color: #10b981; /* Emerald 500 */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
  transition: all 0.2s ease;
  &:hover:not(:disabled) { 
    background-color: #059669; /* Emerald 600 */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  background-color: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  &:hover { background-color: #e2e8f0; }
`;

// ==================================================================
// MAIN PAGE COMPONENT
// ==================================================================
const SubjectListPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [exportSubject, setExportSubject] = useState<Subject | null>(null); 
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const data = await getSubjects();
        setSubjects(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Không thể tải danh sách đối tượng quản lý.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (successMessage) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredSubjects = useMemo(() => 
    subjects.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.idNumber && s.idNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [subjects, searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này?')) {
      setDeletingId(id);
      try {
        await deleteSubject(id);
        setSubjects(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert('Xóa đối tượng thất bại.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleOpenExportConfig = (subject: Subject) => {
    setExportSubject(subject);
    
    // Set thời gian mặc định là 30 ngày gần đây
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    setStartDate(pastDateStr);
    setEndDate(todayStr);
  };

  /**
   * HÀM XỬ LÝ REQUEST THỰC TẾ: Tải file nhị phân báo cáo từ Server
   */
  const handleExecuteExport = async () => {
    if (!exportSubject) return;
    if (!startDate || !endDate) {
      alert('Vui lòng điền đầy đủ khoảng thời gian.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Ngày bắt đầu không được vượt quá ngày kết thúc.');
      return;
    }

    setExporting(true);
    try {
      // 1. Gửi request thực tế lên server lấy mảng Buffer/Blob nhị phân dữ liệu
      const blobData = await exportCheckinsReportExcel(exportSubject._id, startDate, endDate);
      
      // 2. Chuyển đổi dữ liệu Blob thô thành một đường dẫn URL ảo tạm thời của Browser
      const fileUrl = window.URL.createObjectURL(new Blob([blobData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Định dạng Excel MIME chuẩn
      }));
      
      // 3. Tạo một thẻ <a> ẩn trong DOM để kích hoạt tiến trình tải xuống tự nhiên của trình duyệt
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      
      // Định dạng đặt tên file tải về tự động trực quan
      const cleanName = exportSubject.fullName.replace(/\s+/g, '_');
      downloadLink.setAttribute('download', `Bao_Cao_Lich_Trinh_${cleanName}_${startDate}_to_${endDate}.xlsx`);
      
      // 4. Đưa thẻ vào body, click kích hoạt tải và dọn dẹp bộ nhớ RAM vùng URL tạm thời
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.parentNode?.removeChild(downloadLink);
      window.URL.revokeObjectURL(fileUrl);
      
      setExportSubject(null); // Đóng cấu hình khi hoàn tất
    } catch (err) {
      console.error('[EXPORT_ERROR]', err);
      alert('Lỗi hệ thống: Server chưa khởi tạo endpoint xuất file hoặc lỗi luồng dữ liệu.');
    } finally {
      setExporting(false);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {successMessage && <Notification>{successMessage}</Notification>}

      <PageHeader>
        <PageTitle>Quản lý Đối tượng</PageTitle>
        <AddButton onClick={() => navigate('/subjects/add')}>
          <FaPlus style={{ fontSize: '0.85rem' }} />
          <span>Thêm Đối Tượng</span>
        </AddButton>
      </PageHeader>

      <Card>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Tìm kiếm theo tên hoặc CCCD đối tượng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {loading ? (
          <CenteredMessage><Spinner size={45} /></CenteredMessage>
        ) : error ? (
          <CenteredMessage style={{ color: '#ef4444' }}>{error}</CenteredMessage>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <th style={{width: '6%'}}>STT</th>
                <th style={{width: '34%'}}>Họ và Tên</th>
                <th style={{width: '23%'}}>CCCD / Số Định Danh</th>
                <th style={{width: '15%'}}>Trạng thái</th>
                <th style={{width: '22%', textAlign: 'right'}}>Hành động</th>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredSubjects.length > 0 ? filteredSubjects.map((s, index) => (
                <TableRow key={s._id} onClick={() => setSelectedSubject(s)}>
                  <TableCell style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</TableCell>
                  <TableCell style={{ fontWeight: 600, color: '#0f172a' }}>{s.fullName}</TableCell>
                  <TableCell>{s.idNumber || '—'}</TableCell>
                  <TableCell><StatusBadge status={s.status}>{s.status}</StatusBadge></TableCell>
                  <TableCell onClick={handleActionClick}>
                    <ActionButtons>
                      <IconButton onClick={() => handleOpenExportConfig(s)} title="Xuất báo cáo">
                        <FaFileDownload />
                      </IconButton>
                      <IconButton onClick={() => navigate(`/subjects/edit/${s._id}`)} disabled={deletingId === s._id} title="Sửa">
                        <FaEdit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(s._id)} disabled={deletingId === s._id} title="Xóa">
                        {deletingId === s._id ? <Spinner size={16} /> : <FaTrash />}
                      </IconButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <CenteredMessage>Không tìm thấy đối tượng nào trùng khớp với từ khóa.</CenteredMessage>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* MODAL 1: CHI TIẾT ĐỐI TƯỢNG */}
      {selectedSubject && (
        <ModalOverlay onClick={() => setSelectedSubject(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUser style={{ color: '#4f46e5', fontSize: '1.15rem' }} />
                Hồ sơ thông tin chi tiết
              </h2>
              <IconButton onClick={() => setSelectedSubject(null)} title="Đóng"><FaTimes /></IconButton>
            </ModalHeader>
            <ModalBody>
                <DetailItem><label>Họ và Tên</label><span>{selectedSubject.fullName}</span></DetailItem>
                <DetailItem><label>Email liên hệ</label><span>{selectedSubject.email}</span></DetailItem>
                <DetailItem><label>Số CCCD</label><span>{selectedSubject.idNumber || '—'}</span></DetailItem>
                <DetailItem><label>Tên tài khoản</label><span>{selectedSubject.username || '—'}</span></DetailItem>
                <DetailItem><label>Ngày tháng năm sinh</label><span>{selectedSubject.dob || '—'}</span></DetailItem>
                <DetailItem><label>Giới tính</label><span>{selectedSubject.gender || '—'}</span></DetailItem>
                <DetailItem><label>Số điện thoại</label><span>{selectedSubject.phone || '—'}</span></DetailItem>
                <DetailItem><label>Diện theo dõi</label><span><StatusBadge status={selectedSubject.status}>{selectedSubject.status}</StatusBadge></span></DetailItem>
                <DetailItem style={{ gridColumn: '1 / -1'}}><label>Địa chỉ thường trú / tạm trú</label><span>{selectedSubject.address || '—'}</span></DetailItem>
                <DetailItem><label>Thời gian bắt đầu giám sát</label><span>{selectedSubject.monitoringStart ? new Date(selectedSubject.monitoringStart).toLocaleDateString('vi-VN') : '—'}</span></DetailItem>
                <DetailItem><label>Thời gian kết thúc dự kiến</label><span>{selectedSubject.monitoringEnd ? new Date(selectedSubject.monitoringEnd).toLocaleDateString('vi-VN') : '—'}</span></DetailItem>
            </ModalBody>
            <ModalFooter>
              <ExportButton onClick={() => {
                const target = selectedSubject;
                setSelectedSubject(null);
                handleOpenExportConfig(target);
              }}>
                <FaFileDownload />
                <span>Xuất Báo Cáo Đối Tượng</span>
              </ExportButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL 2: TÙY CHỈNH THỜI GIAN & TẢI FILE THỰC TẾ */}
      {exportSubject && (
        <ModalOverlay onClick={() => !exporting && setExportSubject(null)}>
          <SmallModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <FaCalendarAlt style={{ color: '#10b981' }} />
                Phạm vi thời gian xuất file
              </h2>
              <IconButton onClick={() => !exporting && setExportSubject(null)} title="Đóng"><FaTimes /></IconButton>
            </ModalHeader>
            <div style={{ marginBottom: '1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Trích xuất dữ liệu hành trình di chuyển của đối tượng: <strong style={{ color: '#0f172a' }}>{exportSubject.fullName}</strong>
            </div>
            
            <ModalBody style={{ gridTemplateColumns: '1fr', gap: '1.25rem', overflowY: 'visible' }}>
              <DateInputGroup>
                <label>Từ ngày bắt đầu</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  disabled={exporting}
                />
              </DateInputGroup>
              
              <DateInputGroup>
                <label>Đến ngày kết thúc</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  disabled={exporting}
                />
              </DateInputGroup>
            </ModalBody>

            <ModalFooter style={{ marginTop: '2rem' }}>
              <CancelButton onClick={() => setExportSubject(null)} disabled={exporting}>
                Quay lại
              </CancelButton>
              <ExportButton onClick={handleExecuteExport} disabled={exporting}>
                {exporting ? <Spinner size={16} /> : <FaFileDownload />}
                <span>{exporting ? 'Đang tạo file...' : 'Tải Báo Cáo (.xlsx)'}</span>
              </ExportButton>
            </ModalFooter>
          </SmallModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default SubjectListPage;