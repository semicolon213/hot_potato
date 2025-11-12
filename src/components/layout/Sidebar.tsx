/**
 * @file Sidebar.tsx
 * @brief 사이드바 컴포넌트
 * @details 애플리케이션의 네비게이션을 담당하는 사이드바 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from "react";
import "./Sidebar.css";
import { GoHomeFill } from "react-icons/go";
import { FaSignOutAlt } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import {
  HiMiniMegaphone,
  HiMiniDocumentText,
  HiMiniCalendarDays,
  HiMiniUser,
  HiMiniShieldCheck,
  HiMiniSquares2X2,
  HiMiniCurrencyDollar
} from "react-icons/hi2";

// React 19 호환성을 위한 타입 단언
const MessageIcon = HiMiniMegaphone as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const FileIcon = HiMiniDocumentText as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const CalendarIcon = HiMiniCalendarDays as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const UserIcon = HiMiniUser as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ShieldIcon = HiMiniShieldCheck as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const GoogleIcon = HiMiniSquares2X2 as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const DashboardIcon = GoHomeFill as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const AccountingIcon = HiMiniCurrencyDollar as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const MyPageIcon = FaUser as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const LogoutIcon = FaSignOutAlt as React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * @brief 사이드바 Props 타입 정의
 * @details 사이드바 컴포넌트에 전달되는 props의 타입을 정의합니다.
 */
interface SidebarProps {
  onPageChange: (pageName: string) => void;
  onLogout?: () => void;
  onFullLogout?: () => void;
  user?: {
    isAdmin: boolean;
    name?: string;
    userType?: string;
    user_type?: string;
  };
  currentPage?: string;
}

/**
 * @brief 사이드바 컴포넌트
 * @details 애플리케이션의 네비게이션 메뉴를 렌더링하는 사이드바 컴포넌트입니다.
 * @param {SidebarProps} props - 컴포넌트 props
 * @returns {JSX.Element} 렌더링된 사이드바 컴포넌트
 */
import { useAuthStore } from "../../hooks/features/auth/useAuthStore";

const Sidebar: React.FC<SidebarProps> = ({ onPageChange, onLogout, onFullLogout, user, currentPage }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<string | null>(currentPage ?? null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const { logout } = useAuthStore();

  // 외부에서 currentPage 변경 시 동기화
  React.useEffect(() => {
    setActivePage(currentPage ?? null);
  }, [currentPage]);

  // Body 클래스 토글로 레이아웃 변수 연동
  React.useEffect(() => {
    const cls = 'sb-collapsed';
    if (isCollapsed) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [isCollapsed]);

  const handleMenuClick = (pageName: string, hasSubmenu: boolean = false, e?: React.MouseEvent<HTMLDivElement>) => {
    if (hasSubmenu) {
      const next = activeMenu === pageName ? null : pageName;
      setActiveMenu(next);
      setActivePage(null);
      setIsFlyoutOpen(!!next);
      if (!!next && e) {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const left = rect.right + 12 + window.scrollX;
        setFlyoutPosition({ top, left });
      }
    } else {
      onPageChange(pageName);
      setActiveMenu(null); // Close any open submenus
      setActivePage(pageName);
      setIsFlyoutOpen(false);
    }
  };

  const isPageActive = (name: string) => !activeMenu && activePage === name;
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleNormalLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleFullLogout = () => {
    setShowLogoutModal(false);
    if (onFullLogout) {
      onFullLogout();
    } else {
      // onFullLogout이 없으면 일반 로그아웃 실행
      if (onLogout) {
        onLogout();
      } else {
        logout();
      }
    }
  };

  // 하위 항목 선택 시에도 상위 항목 활성 표시
  const isParentActive = (section: string, children: string[]) => {
    if (activeMenu === section) return true;
    if (activePage && children.includes(activePage)) return true;
    return false;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div
          className="logo-container"
          onClick={() => setIsCollapsed(!isCollapsed)}
          role="button"
          aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <img src="/logo.svg" alt="HP ERP Logo" className="logo-image" />
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-container">
          <div
            className={`menu-item ${isPageActive('dashboard') ? 'active' : ''}`}
            onClick={() => handleMenuClick("dashboard")}
          >
            <DashboardIcon className="menu-icon" />
            <div className="menu-text">대시보드</div>
          </div>
          <div
            className={`menu-item ${isPageActive('announcements') ? 'active' : ''}`}
            onClick={() => handleMenuClick("announcements")}
          >
            <MessageIcon className="menu-icon" />
            <div className="menu-text">공지사항</div>
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${isParentActive("document", ["document_management", "docbox", "new_document", "workflow_management"]) ? "active" : ""}`}
            onClick={(e) => handleMenuClick("document", true, e)}
          >
            <FileIcon className="menu-icon" />
            <div className="menu-text">문서</div>
            {/* 하위 항목은 플라이아웃으로 표시 */}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${isParentActive("schedule", ["calendar", "timetable"]) ? "active" : ""}`}
            onClick={(e) => handleMenuClick("schedule", true, e)}
          >
            <CalendarIcon className="menu-icon" />
            <div className="menu-text">일정</div>
            {/* 하위 항목은 플라이아웃으로 표시 */}
          </div>

          <div
            className={`menu-item menu-item-with-submenu ${isParentActive("personnel", ["students", "staff"]) ? "active" : ""}`}
            onClick={(e) => handleMenuClick("personnel", true, e)}
          >
            <UserIcon className="menu-icon" />
            <div className="menu-text">학생 및 교직원</div>
            {/* 하위 항목은 플라이아웃으로 표시 */}
          </div>

          {/* 회계 메뉴: 집행부, 교수, 조교만 접근 가능 */}
          {(() => {
            const userType = user?.userType || user?.user_type;
            const hasAccountingAccess = userType === 'std_council' || userType === 'professor' || userType === 'supp';
            return hasAccountingAccess ? (
              <div
                className={`menu-item ${isPageActive('accounting') ? 'active' : ''}`}
                onClick={() => handleMenuClick("accounting")}
              >
                <AccountingIcon className="menu-icon" />
                <div className="menu-text">회계</div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* GoogleService: 관리자 메뉴 바로 위에 위치 */}
      <div className="menu-section">
        <div className="menu-container">
          <div
            className={`menu-item menu-item-with-submenu ${isParentActive("googleService", ["google_appscript", "google_sheets", "google_docs", "google_gemini", "google_groups"]) ? "active" : ""}`}
            onClick={(e) => handleMenuClick("googleService", true, e)}
          >
            <GoogleIcon className="menu-icon" />
            <div className="menu-text">구글</div>
            {/* 하위 항목은 플라이아웃으로 표시 */}
          </div>
        </div>
      </div>

      {/* 관리자 메뉴 */}
      {user?.isAdmin && (
        <div className="menu-section">
          <div className="menu-container">
            <div
            className={`menu-item ${isPageActive('admin') ? 'active' : ''}`}
              onClick={() => handleMenuClick("admin")}
            >
              <ShieldIcon className="menu-icon" />
              <div className="menu-text">관리자</div>
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 - 사이드바 하단 고정 */}
      <div className="sidebar-footer">
        <div className="menu-container">
          {user && (
            <div className="menu-item" onClick={() => onPageChange("mypage")}>
              <MyPageIcon className="menu-icon" />
              <div className="menu-text">{user.name || "마이페이지"}</div>
            </div>
          )}
          <div className="menu-item" onClick={handleLogoutClick}>
            <LogoutIcon className="menu-icon" />
            <div className="menu-text">로그아웃</div>
          </div>
        </div>
      </div>
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-title">로그아웃 선택</div>
            <div className="logout-modal-content">
              <div className="logout-option" onClick={handleNormalLogout}>
                <div className="logout-option-title">일반 로그아웃</div>
                <div className="logout-option-description">다음 로그인 시 계정 정보가 표시됩니다.</div>
              </div>
              <div className="logout-option" onClick={handleFullLogout}>
                <div className="logout-option-title">완전히 로그아웃</div>
                <div className="logout-option-description">모든 로그인 정보가 삭제되며, 다음 로그인 시 Google 계정을 다시 선택해야 합니다.</div>
              </div>
            </div>
            <button className="logout-modal-cancel" onClick={() => setShowLogoutModal(false)}>
              취소
            </button>
          </div>
        </div>
      )}
      {isFlyoutOpen && activeMenu && (
        // eslint-disable-next-line
        <div className="submenu-flyout" style={{ top: flyoutPosition.top, left: flyoutPosition.left }}>
          {activeMenu === 'document' && (
            <>
              <div className="submenu-item" onClick={() => { onPageChange('document_management'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>문서관리</div>
              <div className="submenu-item" onClick={() => { onPageChange('docbox'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>문서함</div>
              <div className="submenu-item" onClick={() => { onPageChange('new_document'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>새 문서</div>
              <div className="submenu-item" onClick={() => { onPageChange('workflow_management'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>결재관리</div>
            </>
          )}
          {activeMenu === 'schedule' && (
            <>
              <div className="submenu-item" onClick={() => { onPageChange('calendar'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>학사 일정</div>
              <div className="submenu-item" onClick={() => { onPageChange('timetable'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>개인 시간표</div>
            </>
          )}
          {activeMenu === 'personnel' && (
            <>
              <div className="submenu-item" onClick={() => { onPageChange('students'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>학생</div>
              <div className="submenu-item" onClick={() => { onPageChange('staff'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>교직원</div>
            </>
          )}
          {activeMenu === 'googleService' && (
            <>
              <div className="submenu-item" onClick={() => { onPageChange('google_appscript'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>앱스크립트</div>
              <div className="submenu-item" onClick={() => { onPageChange('google_sheets'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>구글시트</div>
              <div className="submenu-item" onClick={() => { onPageChange('google_docs'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>구글독스</div>
              <div className="submenu-item" onClick={() => { onPageChange('google_gemini'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>제미나이</div>
              <div className="submenu-item" onClick={() => { onPageChange('google_groups'); setIsFlyoutOpen(false); setActiveMenu(null); }}><span className="submenu-bullet">•</span>그룹스</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
