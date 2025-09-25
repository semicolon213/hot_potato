// 학생 목록 컴포넌트

import React from 'react';
import DocumentList from '../../documents/document/DocumentList';

interface Student {
  no_student: string;
  name: string;
  address: string;
  grade: string;
  state: string;
  council: string;
}

interface CouncilPosition {
  year: string;
  position: string;
}

interface StudentWithCouncil extends Student {
  parsedCouncil: CouncilPosition[];
}

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface StudentListProps {
  students: StudentWithCouncil[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onStudentDoubleClick: (student: StudentWithCouncil) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  columns,
  sortConfig,
  onSort,
  onStudentDoubleClick
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

  return (
    <DocumentList
      columns={enhancedColumns}
      data={students}
      onPageChange={() => {}} // 빈 함수로 전달
      title={`학생 목록 (${students.length}명)`}
      sortConfig={sortConfig}
      onSort={onSort}
      showViewAll={false}
      onRowDoubleClick={onStudentDoubleClick}
    />
  );
};

export default StudentList;
