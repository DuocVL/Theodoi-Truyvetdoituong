
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styled from 'styled-components';
import { fetchTrackingData } from '../services/api'; // Import the API function

// Interface for our tracking data received from the backend
interface TrackingEvent {
    id: number;
    subject_id: string;
    subject_name: string;
    timestamp: string;
    coordinates: [number, number];
    // Add other properties like photoUrl, address, type if they come from the API
    // For now, we will use hardcoded or derived values for some fields.
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
    const [allEvents, setAllEvents] = useState<TrackingEvent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for filters
    const [startDate, setStartDate] = useState('2023-10-27');
    const [endDate, setEndDate] = useState('2023-10-30');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');

    // Fetch data from server when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const data = await fetchTrackingData();
                setAllEvents(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []); // Empty dependency array means this runs once on mount


    const subjects = useMemo(() => {
        const uniqueSubjects = new Map<string, string>();
        allEvents.forEach(event => {
            if (!uniqueSubjects.has(event.subject_id)) {
                uniqueSubjects.set(event.subject_id, event.subject_name);
            }
        });
        return Array.from(uniqueSubjects.entries()).map(([id, name]) => ({ id, name }));
    }, [allEvents]);

    const filteredHistory = useMemo(() => {
        return allEvents.filter(event => {
            const eventDate = new Date(event.timestamp);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            const dateFilter = eventDate >= start && eventDate <= end;
            const subjectFilterMatch = subjectFilter === 'all' || event.subject_id === subjectFilter;

            return dateFilter && subjectFilterMatch;
        });
    }, [allEvents, startDate, endDate, subjectFilter]);

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
                 {/* Filters for type and address search are removed for now, can be re-added later */}
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

                {filteredHistory.map(event => (
                    <Marker key={event.id} position={event.coordinates as L.LatLngExpression} icon={createColoredIcon('blue')}>
                        <Popup>
                            <PopupContent>
                                <h4>{event.subject_name}</h4>
                                <p><strong>Thời gian:</strong> {new Date(event.timestamp).toLocaleString('vi-VN')}</p>
                                {/* Add more info here if available from API */}
                            </PopupContent>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </MapWrapper>
    );
};

export default MapPage;
