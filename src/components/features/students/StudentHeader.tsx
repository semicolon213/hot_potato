// 학생 관리 헤더 컴포넌트

import React from 'react';

interface StudentHeaderProps {
  totalStudents: number;
  filteredStudents: number;
  activeTab: 'list' | 'council';
  onTabChange: (tab: 'list' | 'council') => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({
  totalStudents,
  filteredStudents,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="students-header">
      <div className="header-left">
        <h1>학생 관리</h1>
        <div className="header-stats">
          <span className="stat-item">
            <span className="stat-number">{totalStudents}</span>
            <span className="stat-label">전체 학생</span>
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
          📋 학생 목록
        </button>
        <button 
          className={`tab-button ${activeTab === 'council' ? 'active' : ''}`}
          onClick={() => onTabChange('council')}
        >
          👥 학생회
        </button>
      </div>
    </div>
  );
};

export default StudentHeader;
