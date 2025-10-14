/**
 * @file CommitteeList.tsx
 * @brief 학과 위원회 목록 컴포넌트
 * @details 학과 위원회 데이터를 테이블 형태로 표시하고 정렬, 검색 기능을 제공합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import DocumentList from '../documents/DocumentList';
import type { Committee } from '../../../types/features/staff';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: Committee) => React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface CommitteeListProps {
  committeeList: Committee[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onCommitteeDoubleClick: (committee: Committee) => void;
}

const CommitteeList: React.FC<CommitteeListProps> = ({
  committeeList,
  columns,
  sortConfig,
  onSort,
  onCommitteeDoubleClick
}) => {
  const enhancedColumns = columns.map(col => ({
    ...col,
    sortable: true,
    render: col.key === 'sortation' ? (row: Committee) => (
      <span className={`sortation-badge ${row.sortation.toLowerCase().replace(/\s+/g, '-')}`}>
        {row.sortation}
      </span>
    ) : col.key === 'is_family' ? (row: Committee) => (
      <span className={`family-badge ${row.is_family ? 'family' : 'non-family'}`}>
        {row.is_family ? '가족회사' : '일반회사'}
      </span>
    ) : col.render
  }));

  return (
    <DocumentList
      columns={enhancedColumns}
      data={committeeList}
      onPageChange={() => {}} // 빈 함수로 전달
      title={`학과 위원회 목록 (${committeeList.length}명)`}
      sortConfig={sortConfig}
      onSort={onSort}
      showViewAll={false}
      onRowDoubleClick={onCommitteeDoubleClick}
    />
  );
};

export default CommitteeList;

