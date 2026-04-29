import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styled from 'styled-components';

// --- Dữ liệu mẫu (Trong ứng dụng thật, dữ liệu này sẽ được fetch từ server) ---

// Thông tin về đối tượng đang theo dõi
const subjectInfo = {
    id: 'DT001',
    name: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
};

// Lịch sử check-in của đối tượng
const checkinHistory = [
    {
        id: 'EV01',
        timestamp: '2023-10-27T09:00:00Z',
        coords: [21.0285, 105.8542] as L.LatLngExpression,
        photoUrl: 'https://picsum.photos/200/150?random=1',
        address: 'Hồ Hoàn Kiếm, Hà Nội'
    },
    {
        id: 'EV02',
        timestamp: '2023-10-27T14:30:00Z',
        coords: [21.0368, 105.8344] as L.LatLngExpression,
        photoUrl: 'https://picsum.photos/200/150?random=2',
        address: 'Lăng Chủ tịch Hồ Chí Minh, Hà Nội'
    },
    {
        id: 'EV03',
        timestamp: '2023-10-27T19:15:00Z',
        coords: [21.0056, 105.8431] as L.LatLngExpression,
        photoUrl: 'https://picsum.photos/200/150?random=3',
        address: 'Vincom Center, Bà Triệu, Hà Nội'
    }
];

// Khu vực được phép hoạt động của đối tượng
const permittedArea = {
    center: [21.02, 105.85] as L.LatLngExpression,
    radius: 2000, // mét
    name: 'Khu vực trung tâm Hà Nội'
};


// --- Sửa lỗi icon mặc định của Leaflet ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- Styled Components ---
const MapWrapper = styled.div`
    height: 100vh;
    width: 100%;
`;

const PopupContent = styled.div`
    font-family: sans-serif;
    h4 {
        margin: 0 0 10px 0;
    }
    p {
        margin: 5px 0;
    }
    img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        margin-top: 10px;
    }
`;

// --- Component Chính ---
const MapPage: React.FC = () => {
    // Trong ứng dụng thật, bạn sẽ dùng useEffect để fetch dữ liệu từ API
    // const [checkins, setCheckins] = useState([]);
    // useEffect(() => {
    //     fetch('/api/subjects/DT001/checkins')
    //         .then(res => res.json())
    //         .then(data => setCheckins(data));
    // }, []);

    return (
        <MapWrapper>
            <MapContainer center={permittedArea.center} zoom={13} style={{ height: '100%', width: '100%' }}>
                {/* Lớp bản đồ nền từ OpenStreetMap */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Vẽ vòng tròn khu vực được phép */}
                <Circle
                    center={permittedArea.center}
                    radius={permittedArea.radius}
                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                >
                    <Popup>
                        <b>{permittedArea.name}</b><br />
                        Khu vực được phép hoạt động của {subjectInfo.name}.
                    </Popup>
                </Circle>

                {/* Lặp qua lịch sử check-in và hiển thị các điểm đánh dấu */}
                {checkinHistory.map(event => (
                    <Marker key={event.id} position={event.coords}>
                        <Popup>
                            <PopupContent>
                                <h4>Thông tin Check-in</h4>
                                <p><strong>Đối tượng:</strong> {subjectInfo.name}</p>
                                <p><strong>Thời gian:</strong> {new Date(event.timestamp).toLocaleString('vi-VN')}</p>
                                <p><strong>Tọa độ:</strong> {event.coords.join(', ')}</p>
                                <p><strong>Địa chỉ:</strong> {event.address}</p>
                                <img src={event.photoUrl} alt="Ảnh check-in" />
                            </PopupContent>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </MapWrapper>
    );
};

export default MapPage;
