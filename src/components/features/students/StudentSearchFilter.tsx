// 학생 검색 및 필터 컴포넌트

import React from 'react';
import { FaSearch, FaFilter, FaTrash, FaTimes } from 'react-icons/fa';

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
  filters: Record<string, unknown>; // 필터 객체
  onFiltersChange: (filters: Record<string, unknown>) => void; // 필터 변경 핸들러
  filterOptions: Record<string, string[]>; // 필터 옵션
  isStaffMode?: boolean; // 교직원 모드 추가
  activeTab?: 'staff' | 'committee'; // 활성 탭 추가
}

const StudentSearchFilter: React.FC<StudentSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  filterOptions,
  isStaffMode = false,
  activeTab = 'staff'
}) => {
  const hasActiveFilters = filters.grade || filters.state || filters.council;

  return (
    <div className="search-filter-section">
      <div className="search-controls">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={isStaffMode ? "이름, 교번, 구분으로 검색..." : "이름, 학번, 주소, 직책으로 검색..."}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter 키를 눌렀을 때 기본 동작(페이지 이동 등)을 막음
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="검색어 지우기"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={onToggleFilters}
          >
            <FaFilter className="btn-icon" />
            <span>필터 {showFilters ? '숨기기' : '보기'}</span>
          </button>
          
          {hasActiveFilters && (
            <button 
              className="clear-filters-btn"
              onClick={() => onFiltersChange({ grade: '', state: '', council: '' })}
            >
              <FaTrash className="btn-icon" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
          {(!isStaffMode || activeTab !== 'committee') && (
            <div className="filter-group">
              <label>{isStaffMode ? '구분' : '학년'}</label>
              <select
                value={filters.grade}
                onChange={(e) => onFiltersChange({ ...filters, grade: e.target.value })}
                className="filter-select"
              >
                <option value="">{isStaffMode ? '전체 구분' : '전체 학년'}</option>
                {filterOptions.grades?.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                )) || []}
              </select>
            </div>
          )}

            {!isStaffMode && (
              <div className="filter-group">
                <label>상태</label>
                <select
                  value={filters.state}
                  onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
                  className="filter-select"
                >
                  <option value="">전체 상태</option>
                  {filterOptions.states?.map(state => (
                    <option key={state} value={state}>{state}</option>
                  )) || []}
                </select>
              </div>
            )}

            {!isStaffMode && (
              <div className="filter-group">
                <label>학생회 직책</label>
                <select
                  value={filters.council}
                  onChange={(e) => onFiltersChange({ ...filters, council: e.target.value })}
                  className="filter-select"
                >
                  <option value="">전체 직책</option>
                  {filterOptions.councilPositions?.map(position => (
                    <option key={position} value={position}>{position}</option>
                  )) || []}
                </select>
              </div>
            )}

            {isStaffMode && activeTab === 'committee' && (
              <div className="filter-group">
                <label>위원회 종류</label>
                <select
                  value={filters.state}
                  onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
                  className="filter-select"
                >
                  <option value="">전체 위원회</option>
                  {filterOptions.states?.map(state => (
                    <option key={state} value={state}>{state}</option>
                  )) || []}
                </select>
              </div>
            )}

            {isStaffMode && activeTab === 'committee' && (
              <div className="filter-group">
                <label>직책</label>
                <select
                  value={filters.council}
                  onChange={(e) => onFiltersChange({ ...filters, council: e.target.value })}
                  className="filter-select"
                >
                  <option value="">전체 직책</option>
                  {filterOptions.councilPositions?.map(position => (
                    <option key={position} value={position}>{position}</option>
                  )) || []}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSearchFilter;
