import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import './EmailAutocomplete.css';

interface User {
  email: string;
  name?: string;
  name_member?: string;
  userType?: string;
  user_type?: string;
  isApproved?: boolean;
  Approval?: string;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const EmailAutocomplete: React.FC<EmailAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '이름이나 이메일을 입력하세요',
  disabled = false,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 회원 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getAllUsers();
        if (response.success && response.users && Array.isArray(response.users)) {
          // 승인된 사용자만 필터링하고 정리
          const userList = response.users
            .filter((user: User) => {
              const isApproved = user.isApproved || user.Approval === 'O';
              // 이메일과 이름이 있는 사용자만
              return isApproved && user.email && user.name;
            })
            .map((user: User) => ({
              email: user.email || '',
              name: user.name || user.name_member || '',
              userType: user.userType || user.user_type || 'student'
            }));
          
          setAllUsers(userList);
        }
      } catch (error) {
        console.error('회원 목록 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // 입력값에 따라 자동완성 제안 필터링
  useEffect(() => {
    if (!value || value.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const filtered = allUsers.filter(user => {
      const emailMatch = user.email.toLowerCase().includes(searchTerm);
      const nameMatch = user.name.toLowerCase().includes(searchTerm);
      return emailMatch || nameMatch;
    }).slice(0, 10); // 최대 10개만 표시

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, allUsers]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (user: User) => {
    onChange(user.email);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`email-autocomplete-wrapper ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="email-autocomplete-input"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="email-autocomplete-suggestions">
          {suggestions.map((user, index) => (
            <div
              key={`${user.email}-${index}`}
              className="email-autocomplete-suggestion-item"
              onClick={() => handleSelect(user)}
            >
              <div className="suggestion-name">{user.name}</div>
              <div className="suggestion-email">{user.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailAutocomplete;

