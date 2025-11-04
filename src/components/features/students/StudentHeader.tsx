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
        <div className="header-stats">
          <span className="stat-item">
            <span className="stat-number">{totalStudents}</span>
            <span className="stat-label">{isStaffMode ? '전체 교직원' : '전체 학생'}</span>
          </span>
          <span className="stat-item">
            <span className="stat-number">{filteredStudents}</span>
            <span className="stat-label">표시 중</span>
          </span>
        </div>
      </div>
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => onTabChange('list')}
        >
          <FaListUl className="tab-icon" />
          <span>{isStaffMode ? '교직원 목록' : '학생 목록'}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'council' ? 'active' : ''}`}
          onClick={() => onTabChange('council')}
        >
          <FaUsers className="tab-icon" />
          <span>{isStaffMode ? '학과 위원회' : '학생회'}</span>
        </button>
      </div>
    </div>
  );
};

export default StudentHeader;
