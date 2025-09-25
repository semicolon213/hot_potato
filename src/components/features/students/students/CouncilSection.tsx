// 학생회 섹션 컴포넌트

import React from 'react';
import DocumentList from '../../documents/document/DocumentList';

interface CouncilData {
  name: string;
  position: string;
  year: string;
}

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface CouncilSectionProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  councilData: CouncilData[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
}

const CouncilSection: React.FC<CouncilSectionProps> = ({
  years,
  selectedYear,
  onYearChange,
  councilData,
  columns,
  sortConfig,
  onSort
}) => {
  const enhancedColumns = columns.map(col => ({
    ...col,
    sortable: true,
    render: col.key === 'position' ? (row: CouncilData) => (
      <span className="council-badge-single">
        <span className="badge-position">{row.position}</span>
      </span>
    ) : undefined
  }));

  return (
    <div className="council-section">
      <div className="council-header">
        <h2>학생회 집행부</h2>
        <div className="year-selector">
          <label htmlFor="year-select">년도 선택:</label>
          <select 
            id="year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="year-select"
          >
            <option value="">년도를 선택하세요</option>
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
      </div>

      {selectedYear ? (
        <div className="council-table">
          <DocumentList
            columns={enhancedColumns}
            data={councilData}
            onPageChange={() => {}} // 빈 함수로 전달
            title={`${selectedYear}년 학생회 집행부`}
            sortConfig={sortConfig}
            onSort={onSort}
            showViewAll={false}
          />
        </div>
      ) : (
        <div className="no-year-selected">
          년도를 선택하면 해당 년도의 학생회 집행부 목록을 볼 수 있습니다.
        </div>
      )}
    </div>
  );
};

export default CouncilSection;
