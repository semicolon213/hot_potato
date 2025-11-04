import React from "react";
import "./Header.css";
import { FaSearch } from "react-icons/fa";

 

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
}

const Header: React.FC<HeaderProps> = ({ onPageChange: _onPageChange, searchTerm, onSearchChange, onSearchSubmit, pageSectionLabel }) => {
  return (
      <div className="header" data-oid="klo-qi-">
        {pageSectionLabel && (
          <div className="page-section-label" data-oid="page-section-label">
            {pageSectionLabel}
          </div>
        )}
        <div className="header-actions" data-oid="xq1uhkt"></div>

        <div className="search-container" data-oid="ztfgwty">
          <FaSearch
            className="search-icon"
              onClick={onSearchSubmit}
              data-oid="i8vx3cc"
          />

          <input
              type="text"
              className="search-inputbox"
              placeholder="문서 검색"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit();
                }
              }}
              data-oid="750ewi9"
          />
        </div>

      </div>
  );
};

export default Header;
