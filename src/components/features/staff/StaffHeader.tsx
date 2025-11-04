/**
 * @file StaffHeader.tsx
 * @brief 교직원 관리 헤더 컴포넌트
 * @details 학생관리 헤더를 교직원용으로 수정한 헤더입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';

interface StaffHeaderProps {
  totalStaff: number;
  filteredStaff: number;
  totalCommittee: number;
  filteredCommittee: number;
  activeTab: 'staff' | 'committee';
  onTabChange: (tab: 'staff' | 'committee') => void;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({
  totalStaff,
  filteredStaff,
  totalCommittee,
  filteredCommittee,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="students-header">
      <div className="header-left">
        <div className="header-stats">
          <span className="stat-item">
            <span className="stat-number">{totalStaff}</span>
            <span className="stat-label">전체 교직원</span>
          </span>
          <span className="stat-item">
            <span className="stat-number">{filteredStaff}</span>
            <span className="stat-label">표시 중</span>
          </span>
        </div>
      </div>
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => onTabChange('staff')}
        >
          교직원 ({totalStaff}명)
        </button>
        <button 
          className={`tab-button ${activeTab === 'committee' ? 'active' : ''}`}
          onClick={() => onTabChange('committee')}
        >
          학과 위원회 ({totalCommittee}명)
        </button>
      </div>
    </div>
  );
};

export default StaffHeader;