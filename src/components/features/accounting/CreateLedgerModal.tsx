/**
 * @file CreateLedgerModal.tsx
 * @brief 장부 생성 모달
 * @details 새 장부를 생성하는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import { ENV_CONFIG } from '../../../config/environment';
import { UserMultiSelect } from './UserMultiSelect';
import type { CreateLedgerRequest } from '../../../types/features/accounting';
import type { UsersListResponse } from '../../../types/api/apiResponses';
import './accounting.css';

interface CreateLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  email: string;
  name: string;
  studentId: string;
  userType?: string;
}

const GROUP_ROLES = [
  { value: 'student', label: '학생' },
  { value: 'std_council', label: '집행부' },
  { value: 'supp', label: '조교' },
  { value: 'professor', label: '교수' },
  { value: 'ad_professor', label: '겸임교원' }
];

export const CreateLedgerModal: React.FC<CreateLedgerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [ledgerName, setLedgerName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [mainManagerEmail, setMainManagerEmail] = useState('');
  const [subManagerEmails, setSubManagerEmails] = useState<string[]>([]);
  const [accessUsers, setAccessUsers] = useState<string[]>([]);
  const [accessGroups, setAccessGroups] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await apiClient.getAllUsers();
      if (response.success && response.users && Array.isArray(response.users)) {
        const usersResponse = response as UsersListResponse;
        const userList = usersResponse.users
          .filter((user) => {
            const isApproved = user.isApproved || user.Approval === 'O';
            return isApproved && user.email && (user.name || user.name_member);
          })
          .map((user) => ({
            email: user.email || '',
            name: user.name || user.name_member || '',
            studentId: user.studentId || user.no_member || '',
            userType: user.userType || user.user_type || 'student'
          }));
        setUsers(userList);
      }
    } catch (err) {
      console.error('❌ 사용자 목록 로드 오류:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ledgerName.trim()) {
      setError('장부 이름을 입력해주세요.');
      return;
    }

    if (!accountName.trim()) {
      setError('통장 이름을 입력해주세요.');
      return;
    }

    const balanceNum = parseFloat(initialBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('유효한 최초 잔액을 입력해주세요.');
      return;
    }

    if (!mainManagerEmail) {
      setError('주관리인을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      // 관리자들을 accessUsers에 자동으로 포함 (중복 제거)
      const allAccessUsers = [
        ...accessUsers,
        mainManagerEmail,
        ...subManagerEmails
      ].filter((email, index, arr) => 
        email && email.trim() !== '' && arr.indexOf(email) === index
      );

      const request: CreateLedgerRequest = {
        ledgerName: ledgerName.trim(),
        accountName: accountName.trim(),
        initialBalance: balanceNum,
        creatorEmail: userInfo.email || '',
        accessUsers: allAccessUsers,
        accessGroups,
        mainManagerEmail,
        subManagerEmails
      };

      const response = await apiClient.createLedger({
        ledgerName: request.ledgerName,
        accountName: request.accountName,
        initialBalance: request.initialBalance,
        creatorEmail: request.creatorEmail,
        accessUsers: request.accessUsers,
        accessGroups: request.accessGroups,
        mainManagerEmail: request.mainManagerEmail,
        subManagerEmails: request.subManagerEmails
      });

      if (!response.success) {
        throw new Error(response.message || '장부 생성에 실패했습니다.');
      }

      onSuccess();
      onClose();
      // 폼 초기화
      setLedgerName('');
      setAccountName('');
      setInitialBalance('');
      setMainManagerEmail('');
      setSubManagerEmails([]);
      setAccessUsers([]);
      setAccessGroups([]);

    } catch (err: unknown) {
      console.error('❌ 장부 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '장부 생성에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleGroupToggle = (roleValue: string) => {
    setAccessGroups(prev =>
      prev.includes(roleValue)
        ? prev.filter(r => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accounting-modal create-ledger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 장부 만들기</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-ledger-form">
          <div className="form-section">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={ledgerName}
                onChange={(e) => setLedgerName(e.target.value)}
                placeholder="장부 이름 *"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="통장 이름 *"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                className="form-input"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="최초 잔액 (원) *"
                min="0"
                step="1"
                required
              />
            </div>

            <div className="form-group">
              <select
                className="form-select"
                value={mainManagerEmail}
                onChange={(e) => setMainManagerEmail(e.target.value)}
                required
              >
                <option value="">주관리인 *</option>
                {users.map(user => (
                  <option key={user.email} value={user.email}>
                    {user.name} ({user.studentId}) - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <UserMultiSelect
                users={users}
                selectedUsers={subManagerEmails}
                onSelectionChange={setSubManagerEmails}
                label="별도 관리인"
                placeholder="별도 관리인 검색..."
              />
            </div>

            <div className="form-group">
              <UserMultiSelect
                users={users.filter(user => 
                  user.email !== mainManagerEmail && 
                  !subManagerEmails.includes(user.email)
                )}
                selectedUsers={accessUsers.filter(email => 
                  email !== mainManagerEmail && 
                  !subManagerEmails.includes(email)
                )}
                onSelectionChange={(selected) => {
                  // 관리자 제외하고 업데이트
                  const filtered = selected.filter(email => 
                    email !== mainManagerEmail && 
                    !subManagerEmails.includes(email)
                  );
                  setAccessUsers(filtered);
                }}
                label="접근 권한 - 개인 사용자"
                placeholder="사용자 검색..."
              />
            </div>

            <div className="form-group">
              <div className="multi-select-list">
                {GROUP_ROLES.map(role => (
                  <label key={role.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={accessGroups.includes(role.value)}
                      onChange={() => handleGroupToggle(role.value)}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

