/**
 * @file MapPage.tsx
 * @description
 * Trang này hiển thị bản đồ để theo dõi lịch sử vị trí của một đối tượng.
 * - Người dùng có thể chọn một đối tượng từ danh sách thả xuống.
 * - Khi một đối tượng được chọn, trang sẽ gọi API để lấy dữ liệu vị trí (tracking data) của đối tượng đó.
 * - Dữ liệu vị trí được hiển thị trên bản đồ bằng các Marker (đánh dấu).
 * - Một đường Polyline nối các Marker để thể hiện lộ trình di chuyển.
 * - Sử dụng thư viện `react-leaflet` để hiển thị bản đồ.
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import styled from 'styled-components';
import 'leaflet/dist/leaflet.css'; // Import CSS cho Leaflet.
import L from 'leaflet';

import type { Subject, TrackingPoint } from '../services/api';
import { getSubjects, getTrackingDataBySubjectId } from '../services/api';

// --- FIX LỖI ICON CỦA LEAFLET TRONG REACT ---
// React có thể gặp vấn đề khi tải các file ảnh của Leaflet. Đoạn mã này để fix lỗi đó.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});
// ----------------------------------------------

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Container = styled.div`
  /* ... */
`;
const Controls = styled.div`
  /* ... */
`;
const Select = styled.select`
  /* ... */
`;
// Wrapper để đảm bảo bản đồ chiếm hết không gian còn lại.
const MapWrapper = styled.div`
  flex-grow: 1;
  border-radius: 8px;
  overflow: hidden;
  z-index: 1; // Đảm bảo bản đồ không bị các phần tử khác che khuất.
`;

// ==================================================================
// MAP PAGE COMPONENT
// ==================================================================

const MapPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [subjects, setSubjects] = useState<Subject[]>([]); // Danh sách các đối tượng để chọn.
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(''); // ID của đối tượng đang được chọn.
    const [trackingData, setTrackingData] = useState<TrackingPoint[]>([]); // Dữ liệu vị trí của đối tượng được chọn.
    const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu vị trí.
    
    // --- DATA FETCHING (useEffect) ---

    // 1. Lấy danh sách các đối tượng khi component được mount.
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const subjectList = await getSubjects();
                setSubjects(subjectList || []);
            } catch (error) {
                console.error("Failed to fetch subjects:", error);
                setSubjects([]);
            }
        };
        fetchSubjects();
    }, []); // Chỉ chạy một lần.

    // 2. Lấy dữ liệu vị trí khi `selectedSubjectId` thay đổi.
    useEffect(() => {
        if (!selectedSubjectId) {
            setTrackingData([]); // Nếu không có đối tượng nào được chọn, xóa dữ liệu cũ.
            return;
        }

        const fetchTrackingData = async () => {
            setLoading(true);
            try {
                const trackingHistory = await getTrackingDataBySubjectId(selectedSubjectId);
                setTrackingData(trackingHistory || []); 
            } catch (error) {
                console.error(`Failed to fetch tracking data for subject ${selectedSubjectId}:`, error);
                setTrackingData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTrackingData();
    }, [selectedSubjectId]); // Phụ thuộc vào `selectedSubjectId`.

    // --- EVENT HANDLERS ---
    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSubjectId(e.target.value);
    };

    // --- DATA PREPARATION FOR MAP ---

    // Chuyển đổi mảng dữ liệu vị trí thành định dạng mà Polyline của Leaflet yêu cầu.
    const polylinePositions: L.LatLngExpression[] = trackingData.map(p => [p.lat, p.lng]);

    // Xác định vị trí trung tâm của bản đồ.
    // Nếu có dữ liệu, lấy vị trí của điểm đầu tiên. Nếu không, dùng một vị trí mặc định (TP.HCM).
    const mapCenter: L.LatLngExpression = trackingData.length > 0 
        ? [trackingData[0].lat, trackingData[0].lng] 
        : [10.762622, 106.660172];

    // --- RENDER LOGIC ---
    return (
        <Container>
            <Controls>
                <label htmlFor="subject-select">Chọn đối tượng:</label>
                <Select id="subject-select" value={selectedSubjectId} onChange={handleSubjectChange} disabled={loading}>
                    <option value="">-- Xem lịch sử của --</option>
                    {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.fullName}</option>
                    ))}
                </Select>
                {loading && <span>Đang tải dữ liệu...</span>}
            </Controls>

            <MapWrapper>
                <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                    {/* Lớp nền bản đồ từ OpenStreetMap */}
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Render các Marker cho mỗi điểm vị trí */}
                    {trackingData.map((point, idx) => (
                        <Marker key={idx} position={[point.lat, point.lng]}>
                            <Popup>
                                <b>Thời gian:</b> {new Date(point.timestamp).toLocaleString('vi-VN')}<br/>
                                {point.zone && <><b>Khu vực:</b> {point.zone}</>}
                            </Popup>
                        </Marker>
                    ))}

                    {/* Render đường nối các điểm nếu có nhiều hơn 1 điểm */}
                    {polylinePositions.length > 1 && (
                        <Polyline pathOptions={{ color: 'blue' }} positions={polylinePositions} />
                    )}
                </MapContainer>
            </MapWrapper>
        </Container>
    );
};

export default MapPage;
