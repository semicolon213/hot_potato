import React, { useState } from "react";
import "./Sidebar.css";
import { 
  BiHomeAlt2, 
  BiMessageSquareDetail, 
  BiFileBlank, 
  BiCalendar, 
  BiUser, 
  BiCog, 
  BiShield,
  BiChevronDown
} from "react-icons/bi";

interface SidebarProps {
  onPageChange: (pageName: string) => void;
  user?: {
    isAdmin: boolean;
  };
  currentPage?: string;
}

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
            className={`menu-item menu-item-with-submenu ${activeMenu === "board" ? "active" : ""} ${currentPage === 'board' ? 'active' : ''}`}
            onClick={() => handleMenuClick("board", true)}
          >
            <BiMessageSquareDetail className="menu-icon" />
            <div className="menu-text">게시판</div>
            <BiChevronDown className={`submenu-arrow ${activeMenu === "board" ? "rotated" : ""}`} />
            {activeMenu === "board" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("board")}
                >
                  <span className="submenu-bullet">•</span>
                  자유 게시판
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("announcements")}
                >
                  <span className="submenu-bullet">•</span>
                  공지사항
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "document" ? "active" : ""}`}
            onClick={() => handleMenuClick("document", true)}
          >
            <BiFileBlank className="menu-icon" />
            <div className="menu-text">문서</div>
            <BiChevronDown className={`submenu-arrow ${activeMenu === "document" ? "rotated" : ""}`} />
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
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "schedule" ? "active" : ""}`}
            onClick={() => handleMenuClick("schedule", true)}
          >
            <BiCalendar className="menu-icon" />
            <div className="menu-text">일정</div>
            <BiChevronDown className={`submenu-arrow ${activeMenu === "schedule" ? "rotated" : ""}`} />
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
            <BiUser className="menu-icon" />
            <div className="menu-text">학생 및 교직원</div>
            <BiChevronDown className={`submenu-arrow ${activeMenu === "personnel" ? "rotated" : ""}`} />
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
              <BiShield className="menu-icon" />
              <div className="menu-text">관리자 패널</div>
            </div>
          </div>
        </div>
      )}

      <div className="menu-section">
        <div className="menu-container">
          <div
            className="menu-item"
            onClick={() => handleMenuClick("preferences")}
          >
            <BiCog className="menu-icon" />
            <div className="menu-text">환경설정</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
