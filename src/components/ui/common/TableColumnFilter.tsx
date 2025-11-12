import React, { useState, useEffect, useRef } from "react";
import "./TableColumnFilter.css";

export type SortDirection = 'asc' | 'desc' | null;
export type FilterValue = string | number | boolean;

export interface FilterOption {
  value: FilterValue;
  label: string;
  count?: number;
}

export interface ColumnFilterConfig {
  columnKey: string;
  sortDirection: SortDirection;
  selectedFilters: FilterValue[];
  availableOptions: FilterOption[];
}

interface TableColumnFilterProps {
  columnKey: string;
  columnLabel: string;
  isOpen: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  sortDirection: SortDirection;
  onSortChange: (direction: SortDirection) => void;
  availableOptions: FilterOption[];
  selectedFilters: FilterValue[];
  onFilterChange: (filters: FilterValue[]) => void;
  onClearFilters: () => void;
}

const TableColumnFilter: React.FC<TableColumnFilterProps> = ({
  columnKey,
  columnLabel,
  isOpen,
  position,
  onClose,
  sortDirection,
  onSortChange,
  availableOptions,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // 검색어로 필터링된 옵션
  const filteredOptions = availableOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 필터 토글
  const handleFilterToggle = (value: FilterValue) => {
    if (selectedFilters.includes(value)) {
      onFilterChange(selectedFilters.filter(f => f !== value));
    } else {
      onFilterChange([...selectedFilters, value]);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedFilters.length === filteredOptions.length) {
      onFilterChange([]);
    } else {
      onFilterChange(filteredOptions.map(opt => opt.value));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="table-column-filter-popup"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000,
      }}
    >
      <div className="filter-popup-content">
        {/* 정렬 섹션 */}
        <div className="filter-section">
          <div className="sort-options">
            <button
              className={`sort-option ${sortDirection === 'asc' ? 'active' : ''}`}
              onClick={() => onSortChange(sortDirection === 'asc' ? null : 'asc')}
            >
              <span className="sort-icon">↑</span>
              <span>오름차순</span>
            </button>
            <button
              className={`sort-option ${sortDirection === 'desc' ? 'active' : ''}`}
              onClick={() => onSortChange(sortDirection === 'desc' ? null : 'desc')}
            >
              <span className="sort-icon">↓</span>
              <span>내림차순</span>
            </button>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="filter-section">

          {/* 검색 입력 */}
          <div className="filter-search">
            <input
              type="text"
              placeholder="검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-search-input"
            />
          </div>

          {/* 필터 옵션 리스트 */}
          <div className="filter-options-list">
            {filteredOptions.length === 0 ? (
              <div className="filter-no-results">검색 결과가 없습니다</div>
            ) : (
              <>
                <div className="filter-select-all">
                  <label className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedFilters.length === filteredOptions.length && filteredOptions.length > 0}
                      onChange={handleSelectAll}
                      className="filter-checkbox"
                    />
                    <span>전체 선택</span>
                  </label>
                </div>
                <div className="filter-options-scroll">
                  {filteredOptions.map((option) => (
                    <label key={String(option.value)} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(option.value)}
                        onChange={() => handleFilterToggle(option.value)}
                        className="filter-checkbox"
                      />
                      <span className="filter-option-label">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="filter-option-count">({option.count})</span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableColumnFilter;

