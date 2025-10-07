/**
 * @file StaffSearchFilter.tsx
 * @brief 교직원 검색 필터 컴포넌트
 * @details 학생관리 검색 필터를 교직원용으로 수정한 검색 필터입니다.
 * @author Hot Potato Team
 * @date 2024
 */

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

interface StaffSearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filterOptions: FilterOptions;
}

const StaffSearchFilter: React.FC<StaffSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  filterOptions
}) => {
  return (
    <div className="search-filter-section">
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="이름, 교번, 구분으로 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        <button 
          className="filter-toggle-btn"
          onClick={onToggleFilters}
        >
          {showFilters ? '필터 숨기기' : '필터 보기'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-section">
          <div className="filter-group">
            <label>구분</label>
            <select
              value={filters.grade}
              onChange={(e) => onFiltersChange({ ...filters, grade: e.target.value })}
              className="filter-select"
            >
              <option value="">전체 구분</option>
              {filterOptions.grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>위원회</label>
            <select
              value={filters.state}
              onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
              className="filter-select"
            >
              <option value="">전체 위원회</option>
              {filterOptions.states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>직책</label>
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
      )}
    </div>
  );
};

export default StaffSearchFilter;