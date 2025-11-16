/**
 * @file UserMultiSelect.tsx
 * @brief 사용자 멀티 선택 컴포넌트 (검색 가능)
 * @details 검색 기능이 있는 사용자 선택 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useMemo } from 'react';
import './accounting.css';

interface User {
  email: string;
  name: string;
  studentId: string;
  userType?: string;
}

interface UserMultiSelectProps {
  users: User[];
  selectedUsers: string[];
  onSelectionChange: (selectedEmails: string[]) => void;
  label: string;
  placeholder?: string;
}

export const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
  users,
  selectedUsers,
  onSelectionChange,
  label,
  placeholder = '이름, 학번, 이메일로 검색...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // 검색 필터링
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const name = String(user.name || '').toLowerCase();
      const studentId = String(user.studentId || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      
      return name.includes(term) ||
        studentId.includes(term) ||
        email.includes(term);
    });
  }, [users, searchTerm]);

  const handleSelectUser = (email: string) => {
    const isSelected = selectedUsers.includes(email);
    if (isSelected) {
      onSelectionChange(selectedUsers.filter(e => e !== email));
    } else {
      onSelectionChange([...selectedUsers, email]);
    }
    setSearchTerm('');
  };

  const handleRemoveUser = (email: string) => {
    onSelectionChange(selectedUsers.filter(e => e !== email));
  };

  const handleToggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  const selectedUsersData = useMemo(() => {
    return users.filter(user => selectedUsers.includes(user.email));
  }, [users, selectedUsers]);

  return (
    <div className="user-multi-select create-ledger-user-select">
      <div className="user-select-header">
        <label className="user-select-label">{label}</label>
        <button type="button" className="add-user-btn" onClick={handleToggleSearch}>
          {isSearchVisible ? '닫기' : '추가'}
        </button>
      </div>
      
      {/* 선택된 사용자 태그 표시 */}
      {selectedUsersData.length > 0 ? (
        <div className="selected-users-list">
          {selectedUsersData.map(user => (
            <div key={user.email} className="user-tag">
              <span className="user-tag-name">{user.name} ({user.studentId})</span>
              <button
                type="button"
                className="remove-user-btn"
                onClick={() => handleRemoveUser(user.email)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-users-message">선택된 사용자가 없습니다</div>
      )}

      {/* 검색 패널 */}
      {isSearchVisible && (
        <div className="user-search-panel">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="user-search-input"
          />
          <div className="user-results-list">
            {filteredUsers.length === 0 ? (
              <p>검색 결과가 없습니다</p>
            ) : (
              <ul>
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user.email);
                  return (
                    <li
                      key={user.email}
                      onClick={() => handleSelectUser(user.email)}
                      className={isSelected ? 'selected' : ''}
                    >
                      {user.name} ({user.studentId}) - {user.email}
                      {isSelected && <span className="checkmark-icon">✓</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

