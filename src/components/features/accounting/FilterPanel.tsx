/**
 * @file FilterPanel.tsx
 * @brief 필터 패널 컴포넌트
 * @details 장부 항목 필터링을 위한 패널 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import type { LedgerEntryFilter } from '../../../types/features/accounting';
import './accounting.css';

interface FilterPanelProps {
  categories: string[];
  onFilterChange: (filter: LedgerEntryFilter) => void;
  initialFilter?: LedgerEntryFilter;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  onFilterChange,
  initialFilter
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<LedgerEntryFilter>(initialFilter || {
    transactionType: 'all'
  });

  const handleFilterChange = (key: keyof LedgerEntryFilter, value: LedgerEntryFilter[keyof LedgerEntryFilter]) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  const handleReset = () => {
    const resetFilter: LedgerEntryFilter = { transactionType: 'all' };
    setFilter(resetFilter);
    onFilterChange(resetFilter);
  };

  return (
    <div className="filter-panel">
      <div className="filter-panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>필터</h3>
        <span className="filter-toggle">
          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        </span>
      </div>

      {isExpanded && (
        <div className="filter-panel-content">
          <div className="filter-row">
            <label>거래 유형</label>
            <select
              value={filter.transactionType || 'all'}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
          </div>

          <div className="filter-row">
            <label>카테고리</label>
            <select
              value={filter.categories?.[0] || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('categories', value ? [value] : undefined);
              }}
            >
              <option value="">모든 카테고리</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <label>시작 날짜</label>
            <input
              type="date"
              value={filter.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            />
          </div>

          <div className="filter-row">
            <label>종료 날짜</label>
            <input
              type="date"
              value={filter.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            />
          </div>

          <div className="filter-row">
            <label>검색어</label>
            <input
              type="text"
              value={filter.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value || undefined)}
              placeholder="금액 또는 출처명 검색"
            />
          </div>

          <div className="filter-actions">
            <button onClick={handleReset} className="filter-reset-btn">
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

