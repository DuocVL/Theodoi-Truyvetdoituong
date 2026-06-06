import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import styled from 'styled-components';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import các kiểu dữ liệu từ service API đã được định nghĩa tập trung
import { Subject, TrackingPoint, getSubjects, getTrackingDataBySubjectId } from '../services/api';

// SỬA LỖI CRASH: Thay thế `require` bằng `import` cho môi trường Vite (ESM)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});

const Container = styled.div`
  padding: 1rem;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
`;

const Controls = styled.div`
  background: #fff;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Select = styled.select`
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    min-width: 250px;
`;

const MapWrapper = styled.div`
  flex-grow: 1;
  border-radius: 8px;
  overflow: hidden;
  z-index: 1;
`;

// Không cần định nghĩa lại Subject và TrackingPoint ở đây nữa

const MapPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [trackingData, setTrackingData] = useState<TrackingPoint[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // Vì api.ts đã được sửa, giờ đây getSubjects trả về mảng Subject trực tiếp
                const subjectList = await getSubjects();
                setSubjects(subjectList || []);
            } catch (error) {
                console.error("Failed to fetch subjects:", error);
                setSubjects([]); // Dọn dẹp state nếu có lỗi
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (!selectedSubjectId) {
            setTrackingData([]);
            return;
        }

        const fetchTrackingData = async () => {
            setLoading(true);
            try {
                // Tương tự, hàm này giờ trả về mảng TrackingPoint trực tiếp
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
    }, [selectedSubjectId]);

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSubjectId(e.target.value);
    };

    const polylinePositions = trackingData.map(p => [p.lat, p.lng] as L.LatLngExpression);

    const mapCenter = trackingData.length > 0 ? [trackingData[0].lat, trackingData[0].lng] as L.LatLngExpression : [10.762622, 106.660172]; // Tọa độ mặc định

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
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {trackingData.map((point, idx) => (
                        <Marker key={idx} position={[point.lat, point.lng]}>
                            <Popup>
                                <b>Thời gian:</b> {new Date(point.timestamp).toLocaleString('vi-VN')}<br/>
                                {point.zone && <><b>Khu vực:</b> {point.zone}</>}
                            </Popup>
                        </Marker>
                    ))}

                    {polylinePositions.length > 1 && (
                        <Polyline pathOptions={{ color: 'blue' }} positions={polylinePositions} />
                    )}
                </MapContainer>
            </MapWrapper>
        </Container>
    );
};

export default MapPage;
