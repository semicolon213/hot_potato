/**
 * @file CreateAccountModal.tsx
 * @brief 통장 생성 모달
 * @details 새 통장을 생성하는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { createAccount } from '../../../utils/database/accountingManager';
import { apiClient } from '../../../utils/api/apiClient';
import { ENV_CONFIG } from '../../../config/environment';
import { UserMultiSelect } from './UserMultiSelect';
import type { CreateAccountRequest } from '../../../types/features/accounting';
import './accounting.css';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  spreadsheetId: string;
}

interface User {
  email: string;
  name: string;
  studentId: string;
}

const GROUP_ROLES = [
  { value: 'student', label: '학생' },
  { value: 'std_council', label: '집행부' },
  { value: 'supp', label: '조교' },
  { value: 'professor', label: '교수' },
  { value: 'ad_professor', label: '겸임교원' }
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId
}) => {
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [mainManagerId, setMainManagerId] = useState('');
  const [subManagerIds, setSubManagerIds] = useState<string[]>([]);
  const [accessUserEmails, setAccessUserEmails] = useState<string[]>([]);
  const [accessGroups, setAccessGroups] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await apiClient.getAllUsers();
      if (response.success && response.users && Array.isArray(response.users)) {
        const userList = response.users
          .filter((user: any) => {
            const isApproved = user.isApproved || user.Approval === 'O';
            return isApproved && user.email && user.name;
          })
          .map((user: any) => ({
            email: user.email || '',
            name: user.name || user.name_member || '',
            studentId: user.studentId || user.no_member || ''
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

    if (!accountName.trim()) {
      setError('통장 이름을 입력해주세요.');
      return;
    }

    const balanceNum = parseFloat(initialBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('유효한 최초 잔액을 입력해주세요.');
      return;
    }

    if (!mainManagerId) {
      setError('주관리인을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      // 그룹 역할 코드를 그룹 이메일로 변환
      const accessGroupEmails = accessGroups.map(role => {
        const roleMap: Record<string, keyof typeof ENV_CONFIG.GROUP_EMAILS> = {
          'student': 'STUDENT',
          'std_council': 'COUNCIL',
          'supp': 'ASSISTANT',
          'professor': 'PROFESSOR',
          'ad_professor': 'ADJUNCT_PROFESSOR'
        };
        const emailKey = roleMap[role];
        return emailKey ? ENV_CONFIG.GROUP_EMAILS[emailKey] : '';
      }).filter(email => email);

      const request: CreateAccountRequest = {
        accountName: accountName.trim(),
        initialBalance: balanceNum,
        mainManagerId,
        subManagerIds,
        accessGroupEmails,
        accessUserEmails
      };

      await createAccount(
        spreadsheetId,
        request,
        userInfo.studentId || userInfo.email || 'unknown'
      );

      onSuccess();
      onClose();
      // 폼 초기화
      resetForm();

    } catch (err: any) {
      console.error('❌ 통장 생성 오류:', err);
      setError(err.message || '통장 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAccountName('');
    setInitialBalance('');
    setMainManagerId('');
    setSubManagerIds([]);
    setAccessUserEmails([]);
    setAccessGroups([]);
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
      <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 통장 만들기</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>통장 이름 *</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="예: 본부 운영 통장"
              required
            />
          </div>

          <div className="form-group">
            <label>최초 잔액 (원) *</label>
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              required
            />
          </div>

          <div className="form-group">
            <label>주관리인 *</label>
            <select
              value={mainManagerId}
              onChange={(e) => setMainManagerId(e.target.value)}
              required
            >
              <option value="">선택하세요</option>
              {users.map(user => (
                <option key={user.studentId} value={user.studentId}>
                  {user.name} ({user.studentId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <UserMultiSelect
              users={users}
              selectedUsers={subManagerIds.map(id => {
                // studentId를 email로 변환하여 UserMultiSelect 사용
                const user = users.find(u => u.studentId === id);
                return user?.email || '';
              }).filter(Boolean)}
              onSelectionChange={(emails) => {
                // email을 studentId로 변환
                const studentIds = emails.map(email => {
                  const user = users.find(u => u.email === email);
                  return user?.studentId || '';
                }).filter(Boolean);
                setSubManagerIds(studentIds);
              }}
              label="별도 관리인"
              placeholder="별도 관리인 검색..."
            />
          </div>

          <div className="form-group">
            <UserMultiSelect
              users={users}
              selectedUsers={accessUserEmails}
              onSelectionChange={setAccessUserEmails}
              label="접근 권한 - 개인 사용자"
              placeholder="사용자 검색..."
            />
          </div>

          <div className="form-group">
            <label>접근 권한 - 그룹</label>
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
            <p className="form-hint">선택된 그룹: {accessGroups.length}개</p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              취소
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

