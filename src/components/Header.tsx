import React from 'react';
import {
  bellIcon,
  searchIcon,
  settingsIcon,
  userIcon,
  downIcon,
} from '../assets/Icons';

interface HeaderProps {
  onPageChange: (pageName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onPageChange }) => {
  return (
    <header className="header">
      <div className="search-bar">
        <div className="search-icon" dangerouslySetInnerHTML={{ __html: searchIcon }} />
        <input type="text" placeholder="검색..." className="search-input" />
      </div>
      <div className="header-actions">
        <div className="icon-button" dangerouslySetInnerHTML={{ __html: bellIcon }} />
        <div className="icon-button" onClick={() => onPageChange('preferences')} dangerouslySetInnerHTML={{ __html: settingsIcon }} />
        <div className="user-menu">
          <div className="user-avatar" dangerouslySetInnerHTML={{ __html: userIcon }} />
          <span className="user-name">Admin</span>
          <div className="icon-button" dangerouslySetInnerHTML={{ __html: downIcon }} />
        </div>
      </div>
    </header>
  );
};

export default Header;
