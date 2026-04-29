
import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styled from 'styled-components';

// --- Dữ liệu mẫu (Trong ứng dụng thật, dữ liệu này sẽ được fetch từ server) ---

const subjects = [
    { id: 'DT001', name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=DT001' },
    { id: 'DT002', name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?u=DT002' },
    { id: 'DT003', name: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?u=DT003' }
];

const checkinHistory = [
    // --- Dữ liệu cho Nguyễn Văn A (DT001) ---
    { id: 'EV01', subjectId: 'DT001', timestamp: '2023-10-27T09:00:00Z', coords: [21.0285, 105.8542], photoUrl: 'https://picsum.photos/200/150?random=1', address: 'Hồ Hoàn Kiếm, Hà Nội', type: 'Check-in' },
    { id: 'EV02', subjectId: 'DT001', timestamp: '2023-10-27T14:30:00Z', coords: [21.0368, 105.8344], photoUrl: 'https://picsum.photos/200/150?random=2', address: 'Lăng Chủ tịch Hồ Chí Minh, Hà Nội', type: 'Check-in' },
    { id: 'EV03', subjectId: 'DT001', timestamp: '2023-10-28T19:15:00Z', coords: [21.0056, 105.8431], photoUrl: 'https://picsum.photos/200/150?random=3', address: 'Vincom Center, Bà Triệu, Hà Nội', type: 'Giao lưu' },
    { id: 'EV04', subjectId: 'DT001', timestamp: '2023-10-29T17:00:00Z', coords: [21.0402, 105.7997], photoUrl: 'https://picsum.photos/200/150?random=5', address: 'Keangnam Landmark 72, Hà Nội', type: 'Vi phạm' },

    // --- Dữ liệu cho Trần Thị B (DT002) ---
    { id: 'EV05', subjectId: 'DT002', timestamp: '2023-10-27T10:15:00Z', coords: [21.0227, 105.8019], photoUrl: 'https://picsum.photos/200/150?random=4', address: 'Bảo tàng Dân tộc học Việt Nam, Hà Nội', type: 'Check-in' },
    { id: 'EV06', subjectId: 'DT002', timestamp: '2023-10-28T11:00:00Z', coords: [20.9974, 105.8614], photoUrl: 'https://picsum.photos/200/150?random=6', address: 'Times City, Hà Nội', type: 'Check-in' },
    { id: 'EV07', subjectId: 'DT002', timestamp: '2023-10-29T15:30:00Z', coords: [21.0285, 105.8542], photoUrl: 'https://picsum.photos/200/150?random=7', address: 'Hồ Hoàn Kiếm, Hà Nội', type: 'Giao lưu' },

    // --- Dữ liệu cho Lê Văn C (DT003) ---
    { id: 'EV08', subjectId: 'DT003', timestamp: '2023-10-28T08:30:00Z', coords: [21.0333, 105.8667], photoUrl: 'https://picsum.photos/200/150?random=8', address: 'Nhà hát Lớn Hà Nội, Hà Nội', type: 'Check-in' },
    { id: 'EV09', subjectId: 'DT003', timestamp: '2023-10-28T12:00:00Z', coords: [21.0278, 105.8333], photoUrl: 'https://picsum.photos/200/150?random=9', address: 'Văn Miếu - Quốc Tử Giám, Hà Nội', type: 'Check-in' },
    { id: 'EV10', subjectId: 'DT003', timestamp: '2023-10-30T09:00:00Z', coords: [20.9833, 105.8000], photoUrl: 'https://picsum.photos/200/150?random=10', address: 'Royal City, Nguyễn Trãi, Hà Nội', type: 'Vi phạm' },
];


const permittedArea = {
    center: [21.02, 105.85] as L.LatLngExpression,
    radius: 7000, // 7km
    name: 'Khu vực trung tâm Hà Nội'
};

const eventTypes = ['Check-in', 'Giao lưu', 'Vi phạm'];
const eventTypeColors: { [key: string]: string } = {
    'Check-in': 'blue',
    'Giao lưu': 'purple',
    'Vi phạm': 'red',
};


// --- Sửa lỗi icon mặc định của Leaflet ---
// Bỏ qua nếu dùng Vite, chỉ cần thiết cho Webpack/Create-react-app
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//     iconUrl: require('leaflet/dist/images/marker-icon.png'),
//     shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });

const createColoredIcon = (color: string) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};


// --- Styled Components ---
const MapWrapper = styled.div`
    position: relative;
    height: 100vh;
    width: 100%;
`;

const ControlPanel = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: sans-serif;
    width: 320px;

    h3 {
        margin: 0 0 15px 0;
        text-align: center;
    }

    .filter-group {
        margin-bottom: 15px;
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
            box-sizing: border-box;
        }
    }
`;


const PopupContent = styled.div`
    font-family: sans-serif;
    h4 { margin: 0 0 10px 0; }
    p { margin: 5px 0; }
    img { width: 100%; height: auto; border-radius: 4px; margin-top: 10px; }
`;

// --- Component Chính ---
const MapPage: React.FC = () => {
    const [startDate, setStartDate] = useState('2023-10-27');
    const [endDate, setEndDate] = useState('2023-10-30');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = useMemo(() => {
        return checkinHistory.filter(event => {
            const eventDate = new Date(event.timestamp);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            const dateFilter = eventDate >= start && eventDate <= end;
            const typeFilterMatch = typeFilter === 'all' || event.type === typeFilter;
            const subjectFilterMatch = subjectFilter === 'all' || event.subjectId === subjectFilter;
            const searchTermMatch = event.address.toLowerCase().includes(searchTerm.toLowerCase());

            return dateFilter && typeFilterMatch && subjectFilterMatch && searchTermMatch;
        });
    }, [startDate, endDate, typeFilter, subjectFilter, searchTerm]);

    const polylineCoords = filteredHistory.map(event => event.coords as L.LatLngExpression);
    
    const getSubjectById = (id: string) => subjects.find(s => s.id === id);

    return (
        <MapWrapper>
            <ControlPanel>
                <h3>Bộ lọc truy vết</h3>
                 <div className="filter-group">
                    <label htmlFor="subject-filter">Đối tượng</label>
                    <select id="subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                        <option value="all">Tất cả đối tượng</option>
                        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="start-date">Từ ngày</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label htmlFor="end-date">Đến ngày</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label htmlFor="type-filter">Loại sự kiện</label>
                    <select id="type-filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="all">Tất cả</option>
                        {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="search-term">Tìm theo địa chỉ</label>
                    <input type="text" id="search-term" placeholder="Nhập địa chỉ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </ControlPanel>

            <MapContainer center={permittedArea.center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <Circle
                    center={permittedArea.center}
                    radius={permittedArea.radius}
                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                >
                    <Popup><b>{permittedArea.name}</b></Popup>
                </Circle>
                
                {polylineCoords.length > 1 && <Polyline pathOptions={{ color: 'navy', weight: 3 }} positions={polylineCoords} />}

                {filteredHistory.map(event => {
                     const subject = getSubjectById(event.subjectId);
                     return (
                        <Marker key={event.id} position={event.coords as L.LatLngExpression} icon={createColoredIcon(eventTypeColors[event.type] || 'grey')}>
                            <Popup>
                                <PopupContent>
                                    <h4>{event.type}</h4>
                                    <p><strong>Đối tượng:</strong> {subject ? subject.name : 'Không rõ'}</p>
                                    <p><strong>Thời gian:</strong> {new Date(event.timestamp).toLocaleString('vi-VN')}</p>
                                    <p><strong>Địa chỉ:</strong> {event.address}</p>
                                    {event.photoUrl && <img src={event.photoUrl} alt="Ảnh check-in" />}
                                </PopupContent>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </MapWrapper>
    );
};

export default MapPage;
