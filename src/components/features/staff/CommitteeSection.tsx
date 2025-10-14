/**
 * @file CommitteeSection.tsx
 * @brief 학과 위원회 섹션 컴포넌트
 * @details 학생관리 집행부 섹션 구조를 재사용한 학과 위원회 섹션입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import DocumentList from '../documents/DocumentList';

interface Committee {
  sortation: string;
  name: string;
  tel: string;
  email: string;
  position: string;
  career: string;
  company_name: string;
  company_position: string;
  location: string;
  is_family: boolean;
  representative: string;
  note: string;
}

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: Committee) => React.ReactNode;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface CommitteeSectionProps {
  committee: Committee[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onCommitteeDoubleClick: (committee: Committee) => void;
}

const CommitteeSection: React.FC<CommitteeSectionProps> = ({
  committee,
  columns,
  sortConfig,
  onSort,
  onCommitteeDoubleClick
}) => {
  const enhancedColumns = columns.map(col => ({
    ...col,
    sortable: true,
    render: col.key === 'sortation' ? (row: Committee) => (
      <span className={`committee-badge ${row.sortation.toLowerCase().replace(/\s+/g, '-')}`}>
        {row.sortation}
      </span>
    ) : col.render
  }));

  return (
    <DocumentList
      columns={enhancedColumns}
      data={committee}
      onPageChange={() => {}} // 빈 함수로 전달
      title={`학과 위원회 목록 (${committee.length}명)`}
      sortConfig={sortConfig}
      onSort={onSort}
      showViewAll={false}
      onRowDoubleClick={onCommitteeDoubleClick}
    />
  );
};

export default CommitteeSection;


