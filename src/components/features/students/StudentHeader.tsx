// 학생 관리 헤더 컴포넌트

import React from 'react';
import { FaListUl, FaUsers } from 'react-icons/fa';

interface StudentHeaderProps {
  totalStudents: number;
  filteredStudents: number;
  activeTab: 'list' | 'council';
  onTabChange: (tab: 'list' | 'council') => void;
  isStaffMode?: boolean; // 교직원 모드 추가
}
// a
const StudentHeader: React.FC<StudentHeaderProps> = ({
  totalStudents,
  filteredStudents,
  activeTab,
  onTabChange,
  isStaffMode = false
}) => {
  return (
    <div className="students-header">
      <div className="header-left">
      </div>
    </div>
  );
};

export default StudentHeader;
