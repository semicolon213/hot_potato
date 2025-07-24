import React, { useState } from "react";
import "./Sidebar.css";
import potatoLogo from "../assets/image/potato2.png";
import {
  fileIcon,
  listIcon,
  calendarIcon,
  usersIcon,
  settingsIcon,
} from "../assets/Icons";

interface SidebarProps {
  onPageChange: (pageName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onPageChange }) => {
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
          onClick={() => onPageChange("ddd")}
          style={{ textDecoration: "none" }}
        >
          <div className="logo-container">
            <div className="logo-box">
              <img
                src={potatoLogo}
                className="logo-image"
                alt="Hot Potato Logo"
              />
            </div>
            <div className="logo-title">Hot Potato</div>
          </div>
        </a>
      </div>

      <div className="menu-section">
        <div className="menu-section-title">메인 메뉴</div>
        <div className="menu-container">
          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "board" ? "active" : ""}`}
            onClick={() => handleMenuClick("board", true)}
          >
            <img src={listIcon} alt="List Icon" className="icon" />

            <div className="menu-text">게시판</div>
            {activeMenu === "board" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("board")}
                >
                  자유 게시판
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("announcements")}
                >
                  공지사항
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "document" ? "active" : ""}`}
            onClick={() => handleMenuClick("document", true)}
          >
            <img src={fileIcon} alt="File Icon" className="icon" />

            <div className="menu-text">문서</div>
            {activeMenu === "document" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("document_management")}
                >
                  문서관리
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("docbox")}
                >
                  문서함
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("new_document")}
                >
                  새 문서
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "schedule" ? "active" : ""}`}
            onClick={() => handleMenuClick("schedule", true)}
          >
            <img src={calendarIcon} alt="Calendar Icon" className="icon" />

            <div className="menu-text">일정</div>
            {activeMenu === "schedule" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("calendar")}
                >
                  학사 일정
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("timetable")}
                >
                  개인 시간표
                </div>
              </div>
            )}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${activeMenu === "personnel" ? "active" : ""}`}
            onClick={() => handleMenuClick("personnel", true)}
          >
            <img src={usersIcon} alt="Users Icon" className="icon" />

            <div className="menu-text">학생 및 교직원</div>
            {activeMenu === "personnel" && (
              <div className="submenu">
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("students")}
                >
                  학생
                </div>
                <div
                  className="submenu-item"
                  onClick={() => onPageChange("staff")}
                >
                  교직원
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-section-title">설정</div>
        <div className="menu-container">
          <div
            className="menu-item"
            onClick={() => handleMenuClick("preferences")}
          >
            <img src={settingsIcon} alt="Settings Icon" className="icon" />

            <div className="menu-text">환경설정</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
