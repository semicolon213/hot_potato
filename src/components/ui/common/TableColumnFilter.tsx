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
  isStaffMode?: boolean; // 교직원 모드 추가
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
  isStaffMode = false,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustedPosition, setAdjustedPosition] = useState<{ top: number; left: number; transform: string }>({
    top: position.top,
    left: position.left,
    transform: 'translateX(-50%)'
  });

  // 위치 조정: 페이지 경계를 벗어나면 자동 조정
  useEffect(() => {
    if (isOpen && popupRef.current) {
      const popup = popupRef.current;
      const popupWidth = popup.offsetWidth;
      const viewportWidth = window.innerWidth;
      const padding = 16; // 화면 가장자리 여백

      let newLeft = position.left;
      let newTransform = 'translateX(-50%)';

      // 오른쪽 경계를 벗어나는 경우
      if (position.left + popupWidth / 2 > viewportWidth - padding) {
        newLeft = viewportWidth - padding;
        newTransform = 'translateX(-100%)';
      }
      // 왼쪽 경계를 벗어나는 경우
      else if (position.left - popupWidth / 2 < padding) {
        newLeft = padding;
        newTransform = 'translateX(0)';
      }

      setAdjustedPosition({
        top: position.top,
        left: newLeft,
        transform: newTransform
      });
    }
  }, [isOpen, position]);

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
  const filteredOptions = (availableOptions || []).filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 필터 토글
  const handleFilterToggle = (value: FilterValue) => {
    const currentFilters = selectedFilters || [];
    if (currentFilters.includes(value)) {
      onFilterChange(currentFilters.filter(f => f !== value));
    } else {
      onFilterChange([...currentFilters, value]);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    const currentFilters = selectedFilters || [];
    if (currentFilters.length === filteredOptions.length) {
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
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
        transform: adjustedPosition.transform,
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
              placeholder={isStaffMode ? "교직원 검색" : "학생 검색"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Enter 키를 눌렀을 때 기본 동작(페이지 이동 등)을 막음
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
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
                      checked={(selectedFilters || []).length === filteredOptions.length && filteredOptions.length > 0}
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
                        checked={(selectedFilters || []).includes(option.value)}
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

