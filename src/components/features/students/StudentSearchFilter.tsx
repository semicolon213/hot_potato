// 학생 검색 및 필터 컴포넌트

import React from 'react';

interface FilterOptions {
  grades: string[];
  states: string[];
  councilPositions: string[];
}

interface Filters {
  grade: string;
  state: string;
  council: string;
}

interface StudentSearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filterOptions: FilterOptions;
}

const StudentSearchFilter: React.FC<StudentSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  filterOptions
}) => {
  const hasActiveFilters = filters.grade || filters.state || filters.council;

  return (
    <div className="search-filter-section">
      <div className="search-controls">
        <div className="search-input-group">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="이름, 학번, 주소, 직책으로 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={onToggleFilters}
          >
            🎛️ 필터 {showFilters ? '숨기기' : '보기'}
          </button>
          
          {hasActiveFilters && (
            <button 
              className="clear-filters-btn"
              onClick={() => onFiltersChange({ grade: '', state: '', council: '' })}
            >
              🗑️ 초기화
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>🎓 학년</label>
              <select
                value={filters.grade}
                onChange={(e) => onFiltersChange({ ...filters, grade: e.target.value })}
                className="filter-select"
              >
                <option value="">전체 학년</option>
                {filterOptions.grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📊 상태</label>
              <select
                value={filters.state}
                onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
                className="filter-select"
              >
                <option value="">전체 상태</option>
                {filterOptions.states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>👑 학생회 직책</label>
              <select
                value={filters.council}
                onChange={(e) => onFiltersChange({ ...filters, council: e.target.value })}
                className="filter-select"
              >
                <option value="">전체 직책</option>
                {filterOptions.councilPositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSearchFilter;
