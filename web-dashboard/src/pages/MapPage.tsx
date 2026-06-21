/**
 * @file MapPage.tsx
 * @description Bản đồ hành trình tích hợp Sidebar danh sách tương tác thời gian thực và bộ lọc khoảng thời gian chính xác (Ngày & Giờ).
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import styled from 'styled-components';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import services hệ thống
import type { Subject, CheckinData } from '../services/api';
import { getSubjects, getUserManagedCheckins, getCheckinsBySubject, getCheckinById } from '../services/api';

// --- FIX LỖI HIỂN THỊ ICON CỦA LEAFLET ---
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ==================================================================
// STYLED COMPONENTS (GIAO DIỆN CHUYÊN NGHIỆP)
// ==================================================================

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* Trừ đi chiều cao Header/Sidebar tổng thể */
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #343a40;
  font-size: 14px;
`;

const Select = styled.select`
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

const DateInput = styled.input`
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-size: 14px;
  color: #495057;
  outline: none;
  &:focus { border-color: #4dabf7; }
`;

const TimeInput = styled.input`
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-size: 14px;
  color: #495057;
  outline: none;
  width: 90px;
  &:focus { border-color: #4dabf7; }
`;

const ClearButton = styled.button`
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

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden; /* Ngăn chặn cuộn vỡ layout trang */
`;

const SidebarList = styled.div`
  width: 380px; 
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Kích hoạt cuộn mượt cho danh sách điểm */
`;

const SidebarHeader = styled.div`
  padding: 14px 20px;
  background-color: #f1f3f5;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  letter-spacing: 0.5px;
`;

const CheckinCard = styled.div<{ $isActive: boolean }>`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isActive ? '#e7f5ff' : 'transparent'};
  border-left: 4px solid ${props => props.$isActive ? '#228be6' : 'transparent'};

  &:hover {
    background-color: ${props => props.$isActive ? '#e7f5ff' : '#f8f9fa'};
  }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #868e96;
`;

const SubjectBadgeName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin: 4px 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  background-color: ${props => props.$status === 'ON_TIME' ? '#ebfbee' : '#fff5f5'};
  color: ${props => props.$status === 'ON_TIME' ? '#2b8a3e' : '#c92a2a'};
`;

const CardNotes = styled.p`
  margin: 6px 0 0 0;
  font-size: 12.5px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MapWrapper = styled.div`
  flex: 1;
  height: 100%;
  z-index: 1;
`;

const PopupDetails = styled.div`
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
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

// ==================================================================
// HỢP PHẦN BỔ TRỢ ĐIỀU KHIỂN BẢN ĐỒ (MAP CONTROLLER)
// ==================================================================
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        map.panTo(center);
    }, [center, map]);

    return null;
};

// ==================================================================
// MAIN PAGE COMPONENT
// ==================================================================
const MapPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    // KHẮC PHỤC: Tách state cho dữ liệu bản đồ và sidebar
    const [sidebarCheckins, setSidebarCheckins] = useState<CheckinData[]>([]);
    const [mapCheckins, setMapCheckins] = useState<CheckinData[]>([]);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedCheckin, setSelectedCheckin] = useState<CheckinData | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([20.974639, 105.8466543]);

    // 1. Khởi tạo danh sách đối tượng quản lý
    useEffect(() => {
        getSubjects()
            .then(data => setSubjects(data || []))
            .catch(err => console.error("Error fetching subjects:", err));
    }, []);

    // 2. Đồng bộ tải danh sách dữ liệu định vị tích hợp bộ lọc
    useEffect(() => {
        const loadCheckins = async () => {
            setLoading(true);
            try {
                const filterParams = { startDate, endDate, startTime, endTime };

                const response = selectedSubjectId
                    ? await getCheckinsBySubject(selectedSubjectId, filterParams)
                    : await getUserManagedCheckins(filterParams);

                // KHẮC PHỤC: Phân chia dữ liệu vào đúng state
                const sidebarData = [...response.listForSidebar].reverse(); // Sắp xếp mới nhất lên đầu
                const mapData = response.pointsForMap;

                setSidebarCheckins(sidebarData);
                setMapCheckins(mapData);

                if (mapData.length > 0) {
                    const latestPoint = mapData[mapData.length - 1];
                    setMapCenter([latestPoint.latitude, latestPoint.longitude]);
                    handleSelectCheckin(latestPoint.id, [latestPoint.latitude, latestPoint.longitude]);
                } else {
                    setSelectedCheckin(null);
                }
            } catch (err) {
                console.error("Error fetching checkin markers:", err);
                setSidebarCheckins([]);
                setMapCheckins([]);
            } finally {
                setLoading(false);
            }
        };

        loadCheckins();
    }, [selectedSubjectId, startDate, endDate, startTime, endTime]);

    // 3. Xử lý sự kiện xem chi tiết
    const handleSelectCheckin = async (id: string, coords: [number, number]) => {
        setMapCenter(coords);
        try {
            const detail = await getCheckinById(id);
            if (detail) {
                setSelectedCheckin(detail);
            }
        } catch (error) {
            console.error("Error loading deep checkin payload:", error);
        }
    };

    // 4. Xóa bộ lọc
    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
    };

    // Mảng tọa độ để vẽ Polyline
    const movementPath: [number, number][] = mapCheckins.map(p => [p.latitude, p.longitude]);

    return (
        <PageContainer>
            <TopBar>
                 <FilterGroup>
                    <Label htmlFor="subject-filter">Giám sát:</Label>
                    <Select
                        id="subject-filter"
                        value={selectedSubjectId}
                        onChange={(e) => { setSelectedSubjectId(e.target.value); }}
                        disabled={loading}
                    >
                        <option value="">-- Tất cả đối tượng quản lý --</option>
                        {subjects.map(s => (
                            <option key={s._id} value={s._id}>{s.fullName}</option>
                        ))}
                    </Select>
                </FilterGroup>

                <FilterGroup>
                    <Label htmlFor="start-date">Từ:</Label>
                    <DateInput 
                        id="start-date"
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={loading}
                    />
                    <TimeInput 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={loading}
                    />
                </FilterGroup>

                <FilterGroup>
                    <Label htmlFor="end-date">Đến:</Label>
                    <DateInput 
                        id="end-date"
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={loading}
                    />
                    <TimeInput 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={loading}
                    />
                </FilterGroup>

                {(startDate || endDate || startTime || endTime) && (
                    <ClearButton onClick={handleClearFilters} disabled={loading}>
                        Xóa lọc
                    </ClearButton>
                )}

                {loading && <span style={{ fontSize: '13px', color: '#868e96' }}>Đang nạp dữ liệu định vị...</span>}
            </TopBar>

            <MainContent>
                <SidebarList>
                    <SidebarHeader>
                        LỊCH SỬ VỊ TRÍ ({sidebarCheckins.length} Điểm ghi nhận)
                    </SidebarHeader>
                    {sidebarCheckins.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#adb5bd', fontSize: '14px' }}>
                            Không tìm thấy dữ liệu check-in trong khoảng này
                        </div>
                    ) : (
                        sidebarCheckins.map((item) => {
                            const originalIndex = mapCheckins.findIndex(c => c.id === item.id);
                            const isActive = selectedCheckin?.id === item.id;
                            return (
                                <CheckinCard
                                    key={item.id}
                                    $isActive={isActive}
                                    onClick={() => handleSelectCheckin(item.id, [item.latitude, item.longitude])}
                                >
                                    <CardMeta>
                                        <span style={{ fontWeight: 'bold', color: '#495057' }}>
                                            📍 Điểm số #{originalIndex + 1}
                                        </span>
                                        <span>
                                            {new Date(item.checkin_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </CardMeta>

                                    <SubjectBadgeName>
                                        <span>👤 {item.subject?.full_name || 'Không xác định'}</span>
                                    </SubjectBadgeName>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#868e96' }}>
                                            {new Date(item.checkin_time).toLocaleDateString('vi-VN')}
                                        </span>
                                        <StatusBadge $status={item.status}>{item.status}</StatusBadge>
                                    </div>
                                    <CardNotes>{item.notes || 'Không có ghi chú'}</CardNotes>
                                </CheckinCard>
                            );
                        })
                    )}
                </SidebarList>

                <MapWrapper>
                    <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        <MapController center={mapCenter} />

                        {mapCheckins.map((point, idx) => (
                            <Marker
                                key={point.id}
                                position={[point.latitude, point.longitude]}
                                eventHandlers={{
                                    click: () => handleSelectCheckin(point.id, [point.latitude, point.longitude])
                                }}
                            >
                                <Popup>
                                    <PopupDetails>
                                        <h4>📍 Điểm check-in #{idx + 1}</h4>
                                        <p><b>Đối tượng:</b> <span style={{ color: '#228be6', fontWeight: 600 }}>{point.subject?.full_name || 'Không rõ'}</span></p>
                                        <p><b>Thời gian:</b> {new Date(point.checkin_time).toLocaleString('vi-VN')}</p>
                                        <p><b>Trạng thái:</b> <span style={{ color: point.status === 'ON_TIME' ? '#2b8a3e' : '#c92a2a', fontWeight: 'bold' }}>{point.status}</span></p>
                                        <p><b>Ghi chú:</b> {point.notes || 'Không có ghi chú'}</p>
                                        <p><b>Xác thực:</b> {point.face_verified ? '✅ Trùng khớp' : '❌ Sai lệch'}</p>

                                        {selectedCheckin && selectedCheckin.id === point.id && (
                                            <div className="img-container">
                                                {selectedCheckin.image?.url ? (
                                                    <img
                                                        src={selectedCheckin.image.url}
                                                        alt="Khuôn mặt Check-in"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/150x120?text=No+Image';
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: '#868e96' }}>Không đính kèm ảnh</span>
                                                )}
                                            </div>
                                        )}
                                    </PopupDetails>
                                </Popup>
                            </Marker>
                        ))}

                        {movementPath.length > 1 && (
                            <Polyline
                                pathOptions={{ color: '#228be6', weight: 4, opacity: 0.8, dashArray: '1, 5' }}
                                positions={movementPath}
                            />
                        )}
                    </MapContainer>
                </MapWrapper>
            </MainContent>
        </PageContainer>
    );
};

export default MapPage;
