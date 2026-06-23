import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getZonesBySubject, deleteZone, getSubjectById, type Zone, type Subject } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaArrowLeft, FaClock } from 'react-icons/fa';
import Spinner from '../components/Spinner';
import ZoneModal from '../components/zones/ZoneModal';

const PageContainer = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Grid = styled.div`
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:1.5rem;

  max-height:calc(100vh - 180px);
  overflow-y:auto;

  padding-right:8px;

  &::-webkit-scrollbar{
    width:6px;
  }

  &::-webkit-scrollbar-thumb{
    background:#cbd5e1;
    border-radius:8px;
  }
`;
const BackLink = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; font-weight: 600;
  margin-bottom: 1rem; font-size: 0.9rem; background: transparent; border: none; cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #4f46e5; }
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;

  display:flex;
  justify-content:space-between;
  align-items:center;

  margin-bottom:1.5rem;
  padding:1rem 0;

  background:#f8fafc;

  border-bottom:1px solid #e2e8f0;

  flex-wrap:wrap;
  gap:1rem;
`;

const TitleContainer = styled.div`
  h1 { font-size: 1.65rem; font-weight: 700; color: #0f172a; margin: 0; }
  p { font-size: 0.9rem; color: #64748b; margin-top: 0.25rem; word-break: break-all; }
`;

const CreateButton = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem;
  background-color: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  &:hover { background-color: #4338ca; transform: translateY(-1px); }
`;

const ZoneCard = styled.div`
  background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;
  word-break: break-word;
`;

const ZoneInfo = styled.div`
  h3 { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.4; }
  
  .description { 
    font-size: 0.875rem; color: #64748b; margin: 0.75rem 0; min-height: 40px; 
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
`;

const MetaItem = styled.div` 
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #475569; margin-bottom: 0.45rem; 
`;

const StatusBadge = styled.span<{ active: boolean }>`
  display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
  background: ${({ active }) => active ? '#dcfce7' : '#fee2e2'}; color: ${({ active }) => active ? '#15803d' : '#b91c1c'};
`;

const Actions = styled.div` 
  display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; 
  border-top: 1px solid #f1f5f9; padding-top: 0.75rem; 
`;

const ActionBtn = styled.button<{ danger?: boolean }>`
  padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; 
  display: inline-flex; align-items: center; gap: 0.35rem; border: none; cursor: pointer;
  background: ${({ danger }) => danger ? '#fee2e2' : '#f1f5f9'}; color: ${({ danger }) => danger ? '#b91c1c' : '#475569'};
  transition: background 0.2s;
  &:hover { background: ${({ danger }) => danger ? '#fca5a5' : '#e2e8f0'}; }
`;

const AlertToast = styled.div` 
  position: fixed; top: 24px; right: 24px; background: #ecfdf5; border: 1px solid #a7f3d0; 
  color: #065f46; padding: 1rem 1.5rem; border-radius: 8px; z-index: 1300; font-weight: 600; 
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
`;

const SubjectZoneManagementPage: React.FC = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const [zones, setZones] = useState<Zone[]>([]);
    const [subject, setSubject] = useState<Subject | null>(null); // State lưu thông tin đối tượng
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const fetchPageData = async () => {
        if (!subjectId) return;
        try {
            setLoading(true);

            // Gọi song song cả API lấy danh sách vùng lẫn chi tiết đối tượng để tối ưu tốc độ hiển thị UI
            const [zonesData, subjectData] = await Promise.all([
                getZonesBySubject(subjectId),
                getSubjectById ? getSubjectById(subjectId).catch(() => null) : Promise.resolve(null)
            ]);

            setZones(Array.isArray(zonesData) ? zonesData : []);
            if (subjectData) {
                setSubject(subjectData);
            }
        } catch (err) {
            alert('Không thể lấy danh sách vùng cho đối tượng này.');
            setZones([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPageData();
    }, [subjectId]);

    const triggerToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4000);
    };

    const handleDelete = async (zone: Zone) => {
        // Thử lấy tất cả các trường định danh có thể có từ Backend (snake_case hoặc mặc định)
        const id = zone.id

        if (!id) {
            alert(`Lỗi hệ thống: Vùng "${zone.zone_name}" không tìm thấy ID hợp lệ.`);
            // In toàn bộ object ra để bạn bấm vào mũi tên trong F12 kiểm tra chính xác tên trường
            console.error(">>> Cấu trúc chi tiết của Object Zone bị thiếu ID:", zone);
            return;
        }

        if (window.confirm(`Bạn chắc chắn muốn xóa vùng "${zone.zone_name}"?`)) {
            try {
                await deleteZone(id);
                // Xóa sạch ở local state bất kể dùng tên trường ID nào
                setZones(prev => prev.filter(z =>
                    z.id !== id &&
                    (z as any).id !== id &&
                    (z as any).zone_id !== id
                ));
                triggerToast('Xóa vùng giám sát thành công.');
            } catch (err) {
                alert('Không thể xóa vùng.');
            }
        }
    };

    const handleEditClick = (zone: Zone) => {
        setSelectedZone(zone);
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setSelectedZone(null);
        setIsModalOpen(true);
    };

    return (
        <PageContainer>
            {toastMsg && <AlertToast>{toastMsg}</AlertToast>}

            <BackLink onClick={() => navigate('/subjects')}>
                <FaArrowLeft /> Quay lại danh sách đối tượng
            </BackLink>

            <TopBar>
                <TitleContainer>
                    <h1>Vùng Giám Sát: {subject?.fullName || 'Đối Tượng'}</h1>
                    <p>Mã hệ thống: {subjectId}</p>
                </TitleContainer>
                <CreateButton onClick={handleCreateClick}>
                    <FaPlus /> Thêm Vùng Mới
                </CreateButton>
            </TopBar>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <Spinner size={50} />
                </div>
            ) : !Array.isArray(zones) || zones.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    Đối tượng này chưa cấu hình vùng giám sát nào. Hãy thêm vùng đầu tiên!
                </div>
            ) : (
                <Grid>
                    {zones.map((zone) => (
                        <ZoneCard key={zone.id}>
                            <ZoneInfo>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ color: '#1e293b' }}>{zone.zone_name}</h3>
                                    <StatusBadge active={zone.is_active}>
                                        {zone.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                    </StatusBadge>
                                </div>

                                <div style={{ marginTop: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px',
                                        backgroundColor: zone.type === 'SAFE' ? '#f0fdf4' : '#fef2f2',
                                        color: zone.type === 'SAFE' ? '#166534' : '#991b1b',
                                        border: `1px solid ${zone.type === 'SAFE' ? '#bbf7d0' : '#fecaca'}`
                                    }}>
                                        {zone.type === 'SAFE' ? '🟢 VÙNG AN TOÀN' : '🔴 VÙNG CẤM'}
                                    </span>
                                </div>

                                <p className="description" style={{ color: '#475569', fontSize: '0.9rem', marginTop: '1rem' }}>
                                    {zone.description || 'Chưa có mô tả'}
                                </p>
                            </ZoneInfo>

                            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.85rem' }}>
                                <MetaItem>🗺️ <b>Tọa độ:</b> {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</MetaItem>
                                <MetaItem>📏 <b>Bán kính:</b> {zone.radius} mét</MetaItem>
                                <MetaItem>⏱️ <b>Chu kỳ:</b> {zone.interval_minutes}p | <b>Chờ:</b> {zone.grace_minutes}p</MetaItem>
                                <MetaItem><FaClock /> <b>Giờ hoạt động:</b> {zone.active_start_time || '--:--'} - {zone.active_end_time || '--:--'}</MetaItem>
                            </div>

                            <Actions>
                                <ActionBtn onClick={() => handleEditClick(zone)}>
                                    <FaEdit /> Chỉnh sửa
                                </ActionBtn>
                                <ActionBtn danger onClick={() => handleDelete(zone)}>
                                    <FaTrash /> Xóa
                                </ActionBtn>
                            </Actions>
                        </ZoneCard>
                    ))}
                </Grid>
            )}

            {isModalOpen && (
                <ZoneModal
                    zoneToEdit={selectedZone}
                    // Truyền toàn bộ object subject, nếu chưa fetch xong sẽ tạo shell object tạm thời ép kiểu để vượt qua TS
                    subject={subject || ({ _id: subjectId!, fullName: 'Đối tượng giám sát' } as Subject)}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedZone(null);
                    }}
                    // Sửa đổi tên prop sang onSuccess và gán type string tường minh cho msg
                    onSuccess={(msg: string) => {
                        triggerToast(msg);
                        fetchPageData();
                    }}
                />
            )}
        </PageContainer>
    );
};

export default SubjectZoneManagementPage;