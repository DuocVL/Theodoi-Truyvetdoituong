import React, { useState, useEffect } from 'react';
import { PageContainer, MainContent } from './MapStyles';
import MapFilterBar from './MapFilterBar';
import MapSidebar from './MapSidebar';
import MapView from './MapView';

// Import các API đầu mối
import type { Subject, CheckinData, Zone } from '../../services/api';
import { getSubjects, getUserManagedCheckins, getCheckinsBySubject, getCheckinById, getZonesBySubject } from '../../services/api';

const MapPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const [sidebarCheckins, setSidebarCheckins] = useState<CheckinData[]>([]);
  const [mapCheckins, setMapCheckins] = useState<CheckinData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]); // Quản lý danh sách các vùng bảo vệ
  
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.974639, 105.8466543]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Thêm hàm xử lý Focus Zone khi click từ danh sách:
const handleSelectZone = (id: string, coords: [number, number]) => {
  setSelectedZoneId(id);
  setMapCenter(coords); // Kích hoạt MapController di chuyển bản đồ đến tâm Zone
  setSelectedCheckin(null); // Tạm ẩn popup checkin nếu có để tập trung nhìn khu vực zone
};

// Cập nhật lại hiệu ứng useEffect số 2 (Khi đổi User thì reset luôn selectedZoneId):
useEffect(() => {
  setSelectedZoneId(null); // Reset trạng thái chọn vùng cũ
  if (!selectedSubjectId) {
    setZones([]);
    return;
  }

  getZonesBySubject(selectedSubjectId)
    .then(data => setZones(data || []))
    .catch(err => {
      console.error("Không thể lấy danh sách vùng bảo vệ:", err);
      setZones([]);
    });
}, [selectedSubjectId]);

  // 1. Tải danh sách người dùng ban đầu
  useEffect(() => {
    getSubjects()
      .then(data => setSubjects(data || []))
      .catch(err => console.error("Error fetching subjects:", err));
  }, []);

  // 2. Tải danh sách các Vùng giám sát (Zone) - CHỈ CHẠY KHI CHỌN NGƯỜI DÙNG CỤ THỂ
  useEffect(() => {
    if (!selectedSubjectId) {
      setZones([]); // Reset xóa sạch vùng nếu chọn xem "Tất cả"
      return;
    }

    getZonesBySubject(selectedSubjectId)
      .then(data => setZones(data || []))
      .catch(err => {
        console.error("Không thể lấy danh sách vùng bảo vệ:", err);
        setZones([]);
      });
  }, [selectedSubjectId]);

  // 3. Tải danh sách điểm Check-in tích hợp bộ lọc
  useEffect(() => {
    const loadCheckins = async () => {
      setLoading(true);
      try {
        const filterParams = { startDate, endDate, startTime, endTime };

        const response = selectedSubjectId
          ? await getCheckinsBySubject(selectedSubjectId, filterParams)
          : await getUserManagedCheckins(filterParams);

        const sidebarData = [...response.listForSidebar].reverse();
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

  // 4. Xử lý xem chi tiết điểm check-in cụ thể
  const handleSelectCheckin = async (id: string, coords: [number, number]) => {
    setMapCenter(coords);
    try {
      const detail = await getCheckinById(id);
      if (detail) setSelectedCheckin(detail);
    } catch (error) {
      console.error("Error loading deep checkin payload:", error);
    }
  };

  // 5. Xóa bộ lọc thời gian về mặc định
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
  };

  const movementPath: [number, number][] = mapCheckins.map(p => [p.latitude, p.longitude]);

  return (
    <PageContainer>
      {/* Khối Lọc đầu trang */}
      <MapFilterBar
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSubjectChange={setSelectedSubjectId}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        loading={loading}
        onClearFilters={handleClearFilters}
      />

      <MainContent>
        {/* Khối Dòng thời gian Check-in bên trái */}
        <MapSidebar
            sidebarCheckins={sidebarCheckins}
            mapCheckins={mapCheckins}
            selectedCheckin={selectedCheckin}
            onSelectCheckin={handleSelectCheckin}
            zones={zones}                     // <-- TRUYỀN THÊM
            selectedZoneId={selectedZoneId}   // <-- TRUYỀN THÊM
            onSelectZone={handleSelectZone}   // <-- TRUYỀN THÊM
            />

        {/* Khối Bản đồ hiển thị cốt lõi */}
        <MapView
          mapCenter={mapCenter}
          mapCheckins={mapCheckins}
          selectedCheckin={selectedCheckin}
          onSelectCheckin={handleSelectCheckin}
          movementPath={movementPath}
          zones={zones} // Chỉ vẽ khi mảng này có phần tử (khi chọn 1 user)
        />
      </MainContent>
    </PageContainer>
  );
};

export default MapPage;