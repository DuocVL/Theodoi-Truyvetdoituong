import React, { useState } from 'react';
import type { CheckinData, Zone } from '../../services/api';
import { 
  SidebarList, CheckinCard, CardMeta, SubjectBadgeName, StatusBadge, CardNotes,
  TabContainer, TabButton, ZoneCard, ZoneHeader, ZoneName, ZoneBadge
} from './MapStyles';

interface MapSidebarProps {
  sidebarCheckins: CheckinData[];
  mapCheckins: CheckinData[];
  selectedCheckin: CheckinData | null;
  onSelectCheckin: (id: string, coords: [number, number]) => void;
  zones: Zone[];                        // Nhận thêm danh sách zone
  selectedZoneId: string | null;         // ID vùng đang được chọn focus
  onSelectZone: (id: string, coords: [number, number]) => void; // Hàm focus vùng
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  sidebarCheckins, mapCheckins, selectedCheckin, onSelectCheckin,
  zones, selectedZoneId, onSelectZone
}) => {
  // Quản lý trạng thái tab hiện tại: 'checkins' hoặc 'zones'
  const [activeTab, setActiveTab] = useState<'checkins' | 'zones'>('checkins');

  return (
    <SidebarList>
      {/* Thanh Tab Chuyển Đổi */}
      <TabContainer>
        <TabButton $active={activeTab === 'checkins'} onClick={() => setActiveTab('checkins')}>
          🕒 LỊCH SỬ VỊ TRÍ ({sidebarCheckins.length})
        </TabButton>
        <TabButton $active={activeTab === 'zones'} onClick={() => setActiveTab('zones')}>
          🛡️ VÙNG GIÁM SÁT ({zones.length})
        </TabButton>
      </TabContainer>

      {/* NỘI DUNG TAB 1: LỊCH SỬ CHECK-IN */}
      {activeTab === 'checkins' && (
        <>
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
                  onClick={() => onSelectCheckin(item.id, [item.latitude, item.longitude])}
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
        </>
      )}

      {/* NỘI DUNG TAB 2: DANH SÁCH VÙNG GIÁM SÁT (ZONE) */}
      {activeTab === 'zones' && (
        <>
          {zones.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#adb5bd', fontSize: '14px' }}>
              Không có dữ liệu vùng bảo vệ (Vui lòng chọn 1 đối tượng cụ thể)
            </div>
          ) : (
            zones.map((zone) => {
              const zoneId = zone.id || (zone as any)._id;
              const isActive = selectedZoneId === zoneId;
              return (
                <ZoneCard
                  key={zoneId}
                  $isActive={isActive}
                  $type={zone.type}
                  onClick={() => onSelectZone(zoneId, [zone.latitude, zone.longitude])}
                >
                  <ZoneHeader>
                    <ZoneName>{zone.zone_name}</ZoneName>
                    <ZoneBadge $type={zone.type}>
                      {zone.type === 'SAFE' ? 'AN TOÀN' : 'VÙNG CẤM'}
                    </ZoneBadge>
                  </ZoneHeader>
                  <div style={{ fontSize: '12.5px', color: '#6c757d', marginBottom: '4px' }}>
                    🌐 Tọa độ: {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#495057', fontWeight: 500 }}>
                    📏 Bán kính định vị: {zone.radius}m
                  </div>
                  {zone.description && (
                    <CardNotes style={{ marginTop: '4px', fontStyle: 'italic' }}>
                      {zone.description}
                    </CardNotes>
                  )}
                </ZoneCard>
              );
            })
          )}
        </>
      )}
    </SidebarList>
  );
};

export default MapSidebar;