// src/components/subjects/ZoneModal.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaMapMarkedAlt, FaSave } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { createZone, updateZone, type Subject } from '../../services/api';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000;
`;

const LargeModalContent = styled.div`
  background: #ffffff; padding: 2rem; border-radius: 12px; width: 95%; max-width: 1050px;
  max-height: 90vh; display: grid; grid-template-rows: auto 1fr auto; gap: 1rem;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;
  h2 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
`;

const GridBody = styled.div`
  display: grid; grid-template-columns: 1.3fr 1.7fr; gap: 1.5rem; overflow-y: auto; padding-right: 4px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #f1f5f9; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

const FormContainer = styled.div`
  display: flex; flex-direction: column; gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem;
  label { font-size: 0.8rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
  input, select, textarea { 
    padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; color: #1e293b;
    &:focus { outline: 2px solid #4f46e5; border-color: transparent; }
  }
`;

const MapWrapper = styled.div`
  width: 100%; height: 100%; min-height: 440px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;
  position: relative;
`;

const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;
`;

const PrimaryButton = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; background-color: #4f46e5; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;
  &:hover { background-color: #4338ca; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  padding: 0.65rem 1.5rem; background-color: #f1f5f9; color: #475569; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;
  &:hover { background-color: #e2e8f0; }
`;

// Cập nhật Interface khớp hoàn toàn với định nghĩa Type Zone của API
interface ZoneData {
  id: string;
  zone_name: string;
  type: 'SAFE' | 'RESTRICTED';
  latitude: number;
  longitude: number;
  radius: number;
  interval_minutes?: number;
  grace_minutes?: number;
  description?: string;
  is_active: boolean; 
}

interface Props {
  subject: Subject;
  zoneToEdit?: ZoneData | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const MapClickHandler = ({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) => {
  useMapEvents({ click: onClick });
  return null;
};

const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const ZoneModal: React.FC<Props> = ({ subject, zoneToEdit, onClose, onSuccess }) => {
  const isEditMode = !!zoneToEdit;

  // Khởi tạo State ứng dụng
  const [zoneName, setZoneName] = useState('');
  const [type, setType] = useState<'SAFE' | 'RESTRICTED'>('SAFE');
  const [lat, setLat] = useState<number>(21.0285);
  const [lng, setLng] = useState<number>(105.8542);
  const [radius, setRadius] = useState<number>(200);
  const [intervalMin, setIntervalMin] = useState<number>(15);
  const [graceMin, setGraceMin] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true); // Quản lý thuộc tính is_active
  const [submitting, setSubmitting] = useState(false);

  // Map dữ liệu cũ phục vụ tính năng "Sửa thông số"
  useEffect(() => {
    if (zoneToEdit) {
      setZoneName(zoneToEdit.zone_name);
      setType(zoneToEdit.type);
      setLat(zoneToEdit.latitude);
      setLng(zoneToEdit.longitude);
      setRadius(zoneToEdit.radius);
      setIntervalMin(zoneToEdit.interval_minutes ?? 15);
      setGraceMin(zoneToEdit.grace_minutes ?? 5);
      setDescription(zoneToEdit.description ?? '');
      setIsActive(zoneToEdit.is_active ?? true);
    }
  }, [zoneToEdit]);

  const handleMapClick = (e: LeafletMouseEvent) => {
    setLat(Number(e.latlng.lat.toFixed(6)));
    setLng(Number(e.latlng.lng.toFixed(6)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return alert('Vui lòng điền tên vùng giám sát.');
    if (radius <= 0) return alert('Bán kính định vị giám sát phải lớn hơn 0.');

    setSubmitting(true);
    try {
      // 1. Khởi tạo Payload dùng chung chứa các trường bắt buộc cơ bản
      const basePayload = {
        zone_name: zoneName,
        type,
        latitude: lat,
        longitude: lng,
        radius,
        interval_minutes: intervalMin,
        grace_minutes: graceMin,
        description: description || undefined,
        is_active: isActive, 
      };

      if (isEditMode && zoneToEdit) {
        // Chế độ Cập Nhật: Bỏ hoàn toàn 'subject_id' để thỏa mãn Omit<Zone, "_id" | "createdAt" | "subject_id">
        await updateZone(zoneToEdit.id, basePayload);
        onSuccess(`Cập nhật vùng giám sát "${zoneName}" thành công.`);
      } else {
        // Chế độ Tạo Mới: Đính kèm 'subject_id' để thỏa mãn Omit<Zone, "_id" | "createdAt">
        await createZone({
          ...basePayload,
          subject_id: subject._id,
        });
        onSuccess(`Khởi tạo vùng giám sát thành công cho đối tượng ${subject.fullName}`);
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý cấu hình vùng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={() => !submitting && onClose()}>
      <LargeModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaMapMarkedAlt style={{ color: '#4f46e5' }} /> 
            {isEditMode ? `Sửa thông số vùng: ${zoneToEdit?.zone_name}` : `Thiết lập Vùng giám sát mới: ${subject.fullName}`}
          </h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={onClose}>
            <FaTimes style={{ color: '#64748b' }} />
          </button>
        </ModalHeader>

        <GridBody>
          {/* CỘT TRÁI: FORM ĐIỀN THÔNG SỐ */}
          <form id="zone-form" onSubmit={handleSubmit}>
            <FormContainer>
              <FormGroup>
                <label>Tên Vùng Giám Sát</label>
                <input type="text" placeholder="Ví dụ: Khu vực nơi làm việc, Vùng cách ly..." value={zoneName} onChange={e => setZoneName(e.target.value)} required />
              </FormGroup>

              {/* CHIA ĐÔI: PHÂN LOẠI VÀ TRẠNG THÁI HOẠT ĐỘNG */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                <FormGroup>
                  <label>Phân Loại Vùng</label>
                  <select value={type} onChange={e => setType(e.target.value as any)}>
                    <option value="SAFE">SAFE (Vùng An Toàn)</option>
                    <option value="RESTRICTED">RESTRICTED (Vùng Cấm)</option>
                  </select>
                </FormGroup>
                <FormGroup>
                  <label>Trạng Thái</label>
                  <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
                    <option value="true">Kích Hoạt</option>
                    <option value="false">Tạm Dừng</option>
                  </select>
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormGroup>
                  <label>Vĩ Độ (Latitude)</label>
                  <input type="number" step="any" value={lat} onChange={e => setLat(Number(e.target.value))} required />
                </FormGroup>
                <FormGroup>
                  <label>Kinh Độ (Longitude)</label>
                  <input type="number" step="any" value={lng} onChange={e => setLng(Number(e.target.value))} required />
                </FormGroup>
              </div>

              <FormGroup>
                <label>Bán Kính Quét Hình Tròn (mét)</label>
                <input type="number" min="10" value={radius} onChange={e => setRadius(Number(e.target.value))} required />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormGroup>
                  <label>Chu Kỳ Check-in (Phút)</label>
                  <input type="number" min="1" value={intervalMin} onChange={e => setIntervalMin(Number(e.target.value))} required />
                </FormGroup>
                <FormGroup>
                  <label>Thời Gian Chờ Thêm (Phút)</label>
                  <input type="number" min="0" value={graceMin} onChange={e => setGraceMin(Number(e.target.value))} required />
                </FormGroup>
              </div>

              <FormGroup>
                <label>Ghi Chú Chi Tiết</label>
                <textarea rows={3} placeholder="Mô tả mục đích cấu hình hoặc địa chỉ cụ thể..." value={description} onChange={e => setDescription(e.target.value)} />
              </FormGroup>
            </FormContainer>
          </form>

          {/* CỘT PHẢI: BẢN ĐỒ TƯƠNG TÁC ĐỒNG BỘ */}
          <MapWrapper>
            <MapContainer center={[lat, lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onClick={handleMapClick} />
              <MapRecenter lat={lat} lng={lng} />
              <Marker position={[lat, lng]} />
              <Circle 
                center={[lat, lng]} 
                radius={radius} 
                pathOptions={{
                  color: type === 'SAFE' ? '#10b981' : '#ef4444',
                  fillColor: type === 'SAFE' ? '#10b981' : '#ef4444',
                  fillOpacity: 0.18
                }} 
              />
            </MapContainer>
          </MapWrapper>
        </GridBody>

        <ModalFooter>
          <SecondaryButton type="button" onClick={onClose} disabled={submitting}>Hủy Bỏ</SecondaryButton>
          <PrimaryButton type="submit" form="zone-form" disabled={submitting}>
            <FaSave /> {submitting ? 'Đang lưu vùng...' : 'Xác Nhận Lưu Vùng'}
          </PrimaryButton>
        </ModalFooter>
  {/* Đóng thẻ LargeModalContent */}
      </LargeModalContent> 
    </ModalOverlay>
  );
};

export default ZoneModal;