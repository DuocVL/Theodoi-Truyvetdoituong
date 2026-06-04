import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styled from 'styled-components';
import { fetchTrackingData, getSubjects, getZones } from '../services/api'; // Import API functions

import 'leaflet-draw/dist/leaflet.draw.css';

// Interface for our tracking data received from the backend
interface TrackingEvent { 
    id: number;
    subject_id: string;
    subject_name: string;
    timestamp: string;
    coordinates: [number, number];
    type?: string;
    image_url?: string; // optional photo from check‑in
    zone_id?: string;
}

// --- Dữ liệu tĩnh còn lại (sẽ được thay thế dần) ---
const permittedArea = {
    center: [21.02, 105.85] as L.LatLngExpression,
    radius: 7000, // 7km
    name: 'Khu vực trung tâm Hà Nội'
};

const eventTypes = ['Check-in', 'Giao lưu', 'Vi phạm']; // This can be dynamic too if needed
const eventTypeColors: { [key: string]: string } = {
    'Check-in': 'blue',
    'Giao lưu': 'purple',
    'Vi phạm': 'red',
};


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
    h3 { margin: 0 0 15px 0; text-align: center; }
    .filter-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select { width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; }
`;

const PopupContent = styled.div`
    font-family: sans-serif;
    h4 { margin: 0 0 10px 0; }
    p { margin: 5px 0; }
`;

const LoadingOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    font-size: 1.5rem;
`;

// --- Component Chính ---
const MapPage: React.FC = () => {
    // State for data, loading, and errors
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
    const [customPolygon, setCustomPolygon] = useState<L.Polygon | null>(null);
    const [allEvents, setAllEvents] = useState<TrackingEvent[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for filters
    const [startDate, setStartDate] = useState('2023-10-27');
    const [endDate, setEndDate] = useState('2023-10-30');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');
    const [showSubjects, setShowSubjects] = useState<boolean>(false);

    // Fetch data from server when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [tracking, subj, zn] = await Promise.all([
                    fetchTrackingData(),
                    getSubjects(),
                    getZones()
                ]);
                setAllEvents(tracking);
                setSubjects(subj);
                setZones(zn);
                setError(null);
            } catch (err: any) {
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []); // Empty dependency array means this runs once on mount

    const filteredHistory = useMemo(() => {
        return allEvents.filter(event => {
            const eventDate = new Date(event.timestamp);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            const dateFilter = eventDate >= start && eventDate <= end;
            const subjectFilterMatch = subjectFilter === 'all' || event.subject_id === subjectFilter;
            const typeMatch = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type || '');
            const zoneMatch = zoneFilter === 'all' || event.zone_id === zoneFilter;
            
            // Chuyển đổi coordinates thành LatLng object trước khi kiểm tra bounds
            const eventLatLng = L.latLng(event.coordinates[0], event.coordinates[1]);
            const insideCustom = !customPolygon || customPolygon.getBounds().contains(eventLatLng);

            return dateFilter && subjectFilterMatch && typeMatch && insideCustom && zoneMatch;
        });
    }, [allEvents, startDate, endDate, subjectFilter, selectedEventTypes, customPolygon]);

    const polylineCoords = filteredHistory.map(event => event.coordinates as L.LatLngExpression);

    if (error) {
        return <LoadingOverlay>Lỗi: {error}</LoadingOverlay>;
    }

    return (
        <MapWrapper>
            {isLoading && <LoadingOverlay>Đang tải dữ liệu...</LoadingOverlay>}
            <ControlPanel>
                <h3>Bộ lọc truy vết</h3>
                <div className="filter-group">
                    <label>Loại sự kiện</label>
                    {eventTypes.map(type => (
                        <div key={type}>
                            <input type="checkbox" checked={selectedEventTypes.includes(type)} onChange={e => {
                                const checked = e.target.checked;
                                setSelectedEventTypes(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                            }} /> {type}
                        </div>
                    ))}
                </div>
                <div className="filter-group">
                    <label htmlFor="subject-filter">Đối tượng</label>
                    <select id="subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                        <option value="all">Tất cả đối tượng</option>
                        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="zone-filter">Khu vực</label>
                    <select id="zone-filter" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
                        <option value="all">Tất cả khu vực</option>
                        {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
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
                    <label>
                        <input type="checkbox" checked={showSubjects} onChange={e => setShowSubjects(e.target.checked)} /> Hiển thị danh sách đối tượng
                    </label>
                </div>
            </ControlPanel>
            <MapContainer center={permittedArea.center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {polylineCoords.length > 1 && <Polyline pathOptions={{ color: 'navy', weight: 3 }} positions={polylineCoords} />}
                {filteredHistory.map(event => (
                    <Marker key={event.id} position={event.coordinates as L.LatLngExpression} icon={createColoredIcon(event.type ? event.type.toLowerCase() : 'blue')}>
                        <Popup>
                            <PopupContent>
                                <h4>{event.subject_name}</h4>
                                <p>Thời gian: {new Date(event.timestamp).toLocaleString('vi-VN')}</p>
                                {event.image_url && <img src={event.image_url} alt="Check-in" style={{ maxWidth: '150px', borderRadius: '4px' }} />}
                            </PopupContent>
                        </Popup>
                    </Marker>
                ))}
                <Circle center={permittedArea.center} radius={permittedArea.radius} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}>
                    <Popup><b>{permittedArea.name}</b></Popup>
                </Circle>
                {showSubjects && subjects.map(sub => (
                    <Marker key={sub.id} position={[sub.lat, sub.lng] as L.LatLngExpression} icon={createColoredIcon('red')}>
                        <Popup>
                            <PopupContent>
                                <h4>{sub.name}</h4>
                                <p>ID: {sub.id}</p>
                            </PopupContent>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </MapWrapper>
    );
};

export default MapPage;
