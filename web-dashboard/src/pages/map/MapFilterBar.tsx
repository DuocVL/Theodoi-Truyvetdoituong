import React from 'react';
import type { Subject } from '../../services/api';
import { TopBar, FilterGroup, Label, Select, DateInput, TimeInput, ClearButton } from './MapStyles';

interface MapFilterBarProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSubjectChange: (id: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  loading: boolean;
  onClearFilters: () => void;
}

const MapFilterBar: React.FC<MapFilterBarProps> = ({
  subjects, selectedSubjectId, onSubjectChange,
  startDate, setStartDate, endDate, setEndDate,
  startTime, setStartTime, endTime, setEndTime,
  loading, onClearFilters
}) => {
  const hasFilter = startDate || endDate || startTime || endTime;

  return (
    <TopBar>
      <FilterGroup>
        <Label htmlFor="subject-filter">Giám sát:</Label>
        <Select
          id="subject-filter"
          value={selectedSubjectId}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Tất cả đối tượng quản lý --</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>{s.fullName}</option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label htmlFor="start-date">Từ:</Label>
        <DateInput id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
        <TimeInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={loading} />
      </FilterGroup>

      <FilterGroup>
        <Label htmlFor="end-date">Đến:</Label>
        <DateInput id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
        <TimeInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={loading} />
      </FilterGroup>

      {hasFilter && (
        <ClearButton onClick={onClearFilters} disabled={loading}>Xóa lọc</ClearButton>
      )}

      {loading && <span style={{ fontSize: '13px', color: '#868e96' }}>Đang nạp dữ liệu định vị...</span>}
    </TopBar>
  );
};

export default MapFilterBar;