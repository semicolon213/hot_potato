/**
 * @file Sidebar.tsx
 * @brief 사이드바 컴포넌트
 * @details 애플리케이션의 네비게이션을 담당하는 사이드바 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from "react";
import "./Sidebar.css";
import { 
  BiMessageSquareDetail, 
  BiFileBlank, 
  BiCalendar, 
  BiUser, 
  BiShield,
  BiChevronDown,
  BiCheckSquare,
  BiDollar
} from "react-icons/bi";
import { SiGoogle } from "react-icons/si";

// React 19 호환성을 위한 타입 단언
const MessageIcon = BiMessageSquareDetail as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const FileIcon = BiFileBlank as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const CalendarIcon = BiCalendar as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const UserIcon = BiUser as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ShieldIcon = BiShield as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ChevronIcon = BiChevronDown as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const GoogleIcon = SiGoogle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const CheckSquareIcon = BiCheckSquare as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const DollarIcon = BiDollar as React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * @brief 사이드바 Props 타입 정의
 * @details 사이드바 컴포넌트에 전달되는 props의 타입을 정의합니다.
 */
interface SidebarProps {
  onPageChange: (pageName: string) => void;
  user?: {
    isAdmin: boolean;
  };
  currentPage?: string;
}

/**
 * @brief 사이드바 컴포넌트
 * @details 애플리케이션의 네비게이션 메뉴를 렌더링하는 사이드바 컴포넌트입니다.
 * @param {SidebarProps} props - 컴포넌트 props
 * @returns {JSX.Element} 렌더링된 사이드바 컴포넌트
 */
const Sidebar: React.FC<SidebarProps> = ({ onPageChange, user, currentPage }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (pageName: string, hasSubmenu: boolean = false) => {
    if (hasSubmenu) {
      setActiveMenu(activeMenu === pageName ? null : pageName);
    } else {
      onPageChange(pageName);
      setActiveMenu(null); // Close any open submenus
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <a
          href="#"
          onClick={() => onPageChange("dashboard")}
          style={{ textDecoration: "none" }}
        >
          <div className="logo-container">
            <img src="/logo.png" alt="HP ERP Logo" className="logo-image" />
          </div>
        </a>
      </div>

      <div className="menu-section">
        <div className="menu-container">
          <div
            className={`menu-item ${currentPage === 'announcements' ? 'active' : ''}`}
            onClick={() => handleMenuClick("announcements")}
          >
            <MessageIcon className="menu-icon" />
            <div className="menu-text">공지사항</div>
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "document" ? "active" : ""}`}
            onClick={() => handleMenuClick("document", true)}
          >
            <FileIcon className="menu-icon" />
            <div className="menu-text">문서</div>
            <ChevronIcon className={`submenu-arrow ${activeMenu === "document" ? "rotated" : ""}`} />
            {activeMenu === "document" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("document_management")}
                >
                  <span className="submenu-bullet">•</span>
                  문서관리
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("docbox")}
                >
                  <span className="submenu-bullet">•</span>
                  문서함
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("new_document")}
                >
                  <span className="submenu-bullet">•</span>
                  새 문서
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("workflow_management")}
                >
                  <span className="submenu-bullet">•</span>
                  결재 관리
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "schedule" ? "active" : ""}`}
            onClick={() => handleMenuClick("schedule", true)}
          >
            <CalendarIcon className="menu-icon" />
            <div className="menu-text">일정</div>
            <ChevronIcon className={`submenu-arrow ${activeMenu === "schedule" ? "rotated" : ""}`} />
            {activeMenu === "schedule" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("calendar")}
                >
                  <span className="submenu-bullet">•</span>
                  학사 일정
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("timetable")}
                >
                  <span className="submenu-bullet">•</span>
                  개인 시간표
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "personnel" ? "active" : ""}`}
            onClick={() => handleMenuClick("personnel", true)}
          >
            <UserIcon className="menu-icon" />
            <div className="menu-text">학생 및 교직원</div>
            <ChevronIcon className={`submenu-arrow ${activeMenu === "personnel" ? "rotated" : ""}`} />
            {activeMenu === "personnel" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("students")}
                >
                  <span className="submenu-bullet">•</span>
                  학생
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("staff")}
                >
                  <span className="submenu-bullet">•</span>
                  교직원
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item ${currentPage === 'accounting' ? 'active' : ''}`}
            onClick={() => handleMenuClick("accounting")}
          >
            <DollarIcon className="menu-icon" />
            <div className="menu-text">회계</div>
          </div>
        </div>
      </div>

      {/* GoogleService: 관리자 메뉴 바로 위에 위치 */}
      <div className="menu-section">
        <div className="menu-container">
          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "googleService" ? "active" : ""}`}
            onClick={() => handleMenuClick("googleService", true)}
          >
            <GoogleIcon className="menu-icon" />
            <div className="menu-text">구글서비스</div>
            <ChevronIcon className={`submenu-arrow ${activeMenu === "googleService" ? "rotated" : ""}`} />
            {activeMenu === "googleService" && (
              <div className="submenu">
                <div className="submenu-item" onClick={() => onPageChange("google_appscript")}>
                  <span className="submenu-bullet">•</span>
                  앱스크립트
                </div>
                <div className="submenu-item" onClick={() => onPageChange("google_sheets")}>
                  <span className="submenu-bullet">•</span>
                  구글시트
                </div>
                <div className="submenu-item" onClick={() => onPageChange("google_docs")}>
                  <span className="submenu-bullet">•</span>
                  구글독스
                </div>
                <div className="submenu-item" onClick={() => onPageChange("google_gemini")}>
                  <span className="submenu-bullet">•</span>
                  제미나이
                </div>
                <div className="submenu-item" onClick={() => onPageChange("google_groups")}>
                  <span className="submenu-bullet">•</span>
                  그룹스
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 관리자 메뉴 */}
      {user?.isAdmin && (
        <div className="menu-section">
          <div className="menu-container">
            <div
              className={`menu-item ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => handleMenuClick("admin")}
            >
              <ShieldIcon className="menu-icon" />
              <div className="menu-text">관리자 패널</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
