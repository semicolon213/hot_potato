/**
 * @file StaffList.tsx
 * @brief 교직원 목록 컴포넌트
 * @details 학생관리 목록 구조를 재사용한 교직원 목록입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import DocumentList from '../documents/DocumentList';

interface Staff {
  no: string;
  pos: string;
  name: string;
  tel: string;
  phone: string;
  email: string;
  date: string;
  note: string;
}

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: Staff) => React.ReactNode;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface StaffListProps {
  staff: Staff[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onStaffDoubleClick: (staff: Staff) => void;
}

const StaffList: React.FC<StaffListProps> = ({
  staff,
  columns,
  sortConfig,
  onSort,
  onStaffDoubleClick
}) => {
  const enhancedColumns = columns.map(col => ({
    ...col,
    sortable: true,
    render: col.key === 'pos' ? (row: Staff) => (
      <span className={`position-badge ${row.pos.toLowerCase().replace(/\s+/g, '-')}`}>
        {row.pos}
      </span>
    ) : col.render
  }));

  return (
    <DocumentList
      columns={enhancedColumns}
      data={staff}
      onPageChange={() => {}} // 빈 함수로 전달
      title={`교직원 목록 (${staff.length}명)`}
      sortConfig={sortConfig}
      onSort={onSort}
      showViewAll={false}
      onRowDoubleClick={onStaffDoubleClick}
    />
  );
};

export default StaffList;