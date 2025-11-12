import React from "react";
import "./Header.css";
import type { PageType } from "../../types/app";
import { FaSearch, FaTimes } from "react-icons/fa";

// 사용자 프로필 타입이 필요해지면 아래를 참조해 확장

interface HeaderProps {
  onPageChange: (pageName: string) => void;
  userInfo?: {
    name: string;
    email: string;
    isAdmin: boolean;
  };
  onLogout?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
  pageSectionLabel?: string;
  currentPage?: PageType;
}

interface SubMenuTab {
  pageName: PageType;
  label: string;
}

const Header: React.FC<HeaderProps> = ({ onPageChange, pageSectionLabel, currentPage, searchTerm, onSearchChange, onSearchSubmit }) => {
  // 페이지별 검색 placeholder
  const getSearchPlaceholder = (): string => {
    if (!currentPage) return '검색하기';
    
    // 페이지별 검색 placeholder
    if (['document_management', 'docbox', 'new_document', 'workflow_management'].includes(currentPage)) {
      return '문서에서 검색하기';
    }
    if (['announcements', 'announcement-view'].includes(currentPage)) {
      return '공지사항에서 검색하기';
    }
    if (['calendar', 'timetable'].includes(currentPage)) {
      return '일정에서 검색하기';
    }
    if (['students', 'staff'].includes(currentPage)) {
      return '학생에서 검색하기';
    }
    
    return '검색하기';
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  // 하위 메뉴 탭 정의
  const getSubMenuTabs = (): SubMenuTab[] | null => {
    if (!currentPage) return null;

    // 문서 섹션
    if (['document_management', 'new_document', 'workflow_management'].includes(currentPage)) {
      return [
        { pageName: 'document_management', label: '문서관리' },
        { pageName: 'new_document', label: '새 문서' },
        { pageName: 'workflow_management', label: '결재관리' },
      ];
    }

    // 일정 섹션
    if (['calendar', 'timetable'].includes(currentPage)) {
      return [
        { pageName: 'calendar', label: '학사 일정' },
        { pageName: 'timetable', label: '개인 시간표' },
      ];
    }

    // 학생 및 교직원 섹션
    if (['students', 'staff'].includes(currentPage)) {
      return [
        { pageName: 'students', label: '학생' },
        { pageName: 'staff', label: '교직원' },
      ];
    }

    // 구글 서비스 섹션
    if (['google_appscript', 'google_sheets', 'google_docs', 'google_gemini', 'google_groups'].includes(currentPage)) {
      return [
        { pageName: 'google_appscript', label: '앱스크립트' },
        { pageName: 'google_sheets', label: '구글시트' },
        { pageName: 'google_docs', label: '구글독스' },
        { pageName: 'google_gemini', label: '제미나이' },
        { pageName: 'google_groups', label: '그룹스' },
      ];
    }

    return null;
  };

  const subMenuTabs = getSubMenuTabs();
  const searchPlaceholder = getSearchPlaceholder();

  const renderBreadcrumb = () => {
    if (!pageSectionLabel) return null;
    
    const parts = pageSectionLabel.split(' | ');
    // 하위 메뉴 탭이 있는 경우 breadcrumb-child를 제거하고 상위 섹션만 표시
    if (parts.length === 2 && subMenuTabs) {
      return (
        <div className="page-section-label" data-oid="page-section-label">
          <span className="breadcrumb-parent">{parts[0]}</span>
        </div>
      );
    }
    // 하위 메뉴 탭이 없는 경우 기존대로 표시
    if (parts.length === 2) {
      return (
        <div className="page-section-label" data-oid="page-section-label">
          <span className="breadcrumb-parent">{parts[0]}</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-child">{parts[1]}</span>
        </div>
      );
    }
    return (
      <div className="page-section-label" data-oid="page-section-label">
        {pageSectionLabel}
      </div>
    );
  };

  return (
      <div className="header" data-oid="klo-qi-">
        {subMenuTabs ? (
          <div className="header-navigation-group">
            {renderBreadcrumb()}
            <div className="submenu-tabs">
              {subMenuTabs.map((tab) => (
                <button
                  key={tab.pageName}
                  className={`submenu-tab ${currentPage === tab.pageName ? 'active' : ''}`}
                  onClick={() => onPageChange(tab.pageName)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          renderBreadcrumb()
        )}
        <div className="header-actions" data-oid="xq1uhkt">
          <div className="header-search-group">
            <FaSearch className="header-search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="header-search-input"
            />
            {searchTerm && (
              <button 
                className="header-clear-search-btn"
                onClick={() => onSearchChange('')}
                title="검색어 지우기"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
  );
};

export default Header;
