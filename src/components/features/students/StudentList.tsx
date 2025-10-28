/**
 * @file StudentList.tsx
 * @brief 학생 목록 컴포넌트
 * @details 학생 데이터를 테이블 형태로 표시하고 정렬, 검색 기능을 제공합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import DocumentList from '../documents/DocumentList';
import type { StudentWithCouncil } from '../../../types/features/students/student';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface StudentListProps {
  students: StudentWithCouncil[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onStudentDoubleClick: (student: StudentWithCouncil) => void;
  isStaffMode?: boolean; // 교직원 모드 추가
  onAddStaff?: () => void;
  onAddCommittee?: () => void;
  staffTabType?: 'staff' | 'committee';
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  columns,
  sortConfig,
  onSort,
  onStudentDoubleClick,
  isStaffMode = false,
  onAddStaff,
  onAddCommittee,
  staffTabType = 'staff'
}) => {
  const enhancedColumns = columns.map(col => ({
    ...col,
    sortable: true,
    render: col.key === 'council' ? (row: StudentWithCouncil) => (
      <div className="council-badges">
        {row.parsedCouncil.map((council, index) => (
          <span key={index} className="council-badge">
            {council.year && <span className="badge-year">{council.year}년</span>}
            <span className="badge-position">{council.position}</span>
          </span>
        ))}
      </div>
    ) : col.render
  }));

  const getTitle = () => {
    if (isStaffMode) {
      if (staffTabType === 'committee') {
        return `위원회 목록 (${students.length}명)`;
      }
      return `교직원 목록 (${students.length}명)`;
    }
    return `학생 목록 (${students.length}명)`;
  };

  const headerContent = isStaffMode ? (
    staffTabType === 'staff' && onAddStaff ? (
        <button className="add-staff-button" onClick={onAddStaff}>
        + 교직원 추가
        </button>
    ) : staffTabType === 'committee' && onAddCommittee ? (
        <button className="add-staff-button" onClick={onAddCommittee}>
        + 위원 추가
        </button>
    ) : undefined
) : undefined;

  return (
    <DocumentList
      columns={enhancedColumns}
      data={students}
      onPageChange={() => {}} // 빈 함수로 전달
      title={getTitle()}
      sortConfig={sortConfig}
      onSort={onSort}
      showViewAll={false}
      onRowDoubleClick={onStudentDoubleClick}
      headerContent={headerContent}
    />
  );
};

export default StudentList;
