import React from 'react';
import {
  boardIcon,
  fileIcon,
  settingsIcon,
  userIcon,
  calendarIcon,
  folderIcon,
  listIcon,
} from '../assets/Icons';

interface SidebarProps {
  onPageChange: (pageName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onPageChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/potato.png" alt="Potato Logo" className="logo" />
          <span className="logo-text">HOT POTATO</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className="menu-item" onClick={() => onPageChange('ddd')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: boardIcon }} />
            <span className="menu-text">대시보드</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('document_management')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: folderIcon }} />
            <span className="menu-text">문서관리</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('docbox')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: fileIcon }} />
            <span className="menu-text">문서함</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('new_document')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: listIcon }} />
            <span className="menu-text">새 문서</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('calendar')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: calendarIcon }} />
            <span className="menu-text">캘린더</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('preferences')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: settingsIcon }} />
            <span className="menu-text">환경설정</span>
          </li>
          <li className="menu-item" onClick={() => onPageChange('mypage')}>
            <div className="menu-icon" dangerouslySetInnerHTML={{ __html: userIcon }} />
            <span className="menu-text">내 정보</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
