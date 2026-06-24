import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, CircleMarker } from 'react-leaflet';
import type { CheckinData, Zone } from '../../services/api';
import { MapWrapper, PopupDetails } from './MapStyles';

interface MapViewProps {
  mapCenter: [number, number];
  mapCheckins: CheckinData[];
  selectedCheckin: CheckinData | null;
  onSelectCheckin: (id: string, coords: [number, number]) => void;
  zones: Zone[]; // Nhận các zone đổ từ server về khi chọn 1 user cụ thể
  locationHistory: any[];
  movementPath: [number, number][]; // <--- THÊM DÒNG NÀY VÀO
}

// Hợp phần bổ trợ di chuyển góc nhìn bản đồ mượt mà
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(center);
  }, [center, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  mapCenter, mapCheckins, selectedCheckin, onSelectCheckin, zones, locationHistory, movementPath
}) => {
  // Khai báo biến path dựa trên locationHistory
  const path: [number, number][] = locationHistory.map(p => [p.latitude, p.longitude]);
  return (
    <MapWrapper>
      <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <MapController center={mapCenter} />

        {/* --- YÊU CẦU 1: VẼ CÁC ZONE GIÁM SÁT --- */}
        {zones.map((zone) => {
          // Tránh lỗi bất đồng bộ trường ID từ Backend Prisma/Mongoose
          const zoneId = zone.id || (zone as any)._id;
          return (
            <Circle
              key={zoneId}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: zone.type === 'SAFE' ? '#10b981' : '#ef4444',
                fillColor: zone.type === 'SAFE' ? '#10b981' : '#ef4444',
                fillOpacity: 0.16,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px', minWidth: '160px' }}>
                  <b style={{ color: zone.type === 'SAFE' ? '#10b981' : '#ef4444' }}>
                    {zone.type === 'SAFE' ? '🟢 VÙNG AN TOÀN' : '🔴 VÙNG CẤM'}
                  </b>
                  <h4 style={{ margin: '4px 0', fontSize: '13px' }}>{zone.zone_name}</h4>
                  <p style={{ margin: '2px 0' }}>Bán kính: {zone.radius} mét</p>
                  {zone.description && <p style={{ margin: '2px 0', color: '#666' }}><i>* {zone.description}</i></p>}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* --- VẼ CÁC ĐIỂM CHECK-IN --- */}
        {mapCheckins.map((point, idx) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            eventHandlers={{
              click: () => onSelectCheckin(point.id, [point.latitude, point.longitude])
            }}
          >
            <Popup>
              <PopupDetails>
                <h4>📍 Điểm check-in #{idx + 1}</h4>
                <p><b>Đối tượng:</b> <span style={{ color: '#228be6', fontWeight: 600 }}>{point.subject?.full_name || 'Không rõ'}</span></p>
                <p><b>Thời gian:</b> {new Date(point.checkin_time).toLocaleString('vi-VN')}</p>
                <p><b>Trạng thái:</b> <span style={{ color: point.status === 'ON_TIME' ? '#2b8a3e' : '#c92a2a', fontWeight: 'bold' }}>{point.status === 'ON_TIME' ? 'Đúng hạn' : point.status === 'LATE' ? 'Quá hạn' : 'Vi phạm vùng cấm'}</span></p>
                <p><b>Ghi chú:</b> {point.notes || 'Không có ghi chú'}</p>
                <p><b>Xác thực:</b> {point.face_verified ? '✅ Trùng khớp' : '❌ Sai lệch'}</p>

                {selectedCheckin && selectedCheckin.id === point.id && (
                  <div className="img-container">
                    {selectedCheckin.image?.url ? (
                      <img
                        src={selectedCheckin.image.url}
                        alt="Khuôn mặt Check-in"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/150x120?text=No+Image'; }}
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

        {/* Đường nối lịch sử */}
        <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 3 }} />

        {/* Điểm bắt đầu (cũ nhất) */}
        {locationHistory.length > 0 && locationHistory[locationHistory.length - 1] && (
          <CircleMarker
            center={[
              locationHistory[locationHistory.length - 1].latitude,
              locationHistory[locationHistory.length - 1].longitude
            ]}
            pathOptions={{ color: 'green' }}
            radius={6}
          />
        )}

        {/* Điểm kết thúc (mới nhất) */}
        {locationHistory.length > 0 && locationHistory[0] && (
          <CircleMarker
            center={[
              locationHistory[0].latitude,
              locationHistory[0].longitude
            ]}
            pathOptions={{ color: 'red' }}
            radius={6}
          />
        )}
      </MapContainer>
    </MapWrapper>
  );
};

export default MapView;