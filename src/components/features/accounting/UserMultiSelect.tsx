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
  const [isOpen, setIsOpen] = useState(false);

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

  const handleToggleUser = (email: string) => {
    const newSelection = selectedUsers.includes(email)
      ? selectedUsers.filter(e => e !== email)
      : [...selectedUsers, email];
    onSelectionChange(newSelection);
  };

  const handleRemoveUser = (email: string) => {
    onSelectionChange(selectedUsers.filter(e => e !== email));
  };

  const selectedUsersData = useMemo(() => {
    return users.filter(user => selectedUsers.includes(user.email));
  }, [users, selectedUsers]);

  return (
    <div className="user-multi-select">
      <label>{label}</label>
      
      {/* 선택된 사용자 표시 */}
      {selectedUsersData.length > 0 && (
        <div className="selected-users">
          {selectedUsersData.map(user => (
            <span key={user.email} className="selected-user-tag">
              {user.name} ({user.studentId})
              <button
                type="button"
                onClick={() => handleRemoveUser(user.email)}
                className="remove-user-btn"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 검색 입력 및 드롭다운 */}
      <div className="user-search-wrapper">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="user-search-input"
        />
        
        {isOpen && (
          <>
            <div
              className="user-search-overlay"
              onClick={() => setIsOpen(false)}
            />
            <div className="user-search-dropdown">
              {filteredUsers.length === 0 ? (
                <div className="user-search-empty">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="user-search-list">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUsers.includes(user.email);
                    return (
                      <div
                        key={user.email}
                        className={`user-search-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleUser(user.email)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleUser(user.email)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="user-info">
                          <span className="user-name">{user.name}</span>
                          <span className="user-id">({user.studentId})</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <p className="form-hint">
        선택된 {label}: {selectedUsers.length}명
      </p>
    </div>
  );
};

