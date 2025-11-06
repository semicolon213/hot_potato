/**
 * @file AccountDisplay.tsx
 * @brief 통장 정보 표시 컴포넌트
 * @details 장부의 통장 정보를 표시합니다 (장부마다 통장 하나).
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getAccounts } from '../../../utils/database/accountingManager';
import { apiClient } from '../../../utils/api/apiClient';
import { UserMultiSelect } from './UserMultiSelect';
import type { Account } from '../../../types/features/accounting';
import './accounting.css';

interface AccountDisplayProps {
  spreadsheetId: string;
}

interface User {
  email: string;
  name: string;
  studentId: string;
  userType?: string;
}

export const AccountDisplay: React.FC<AccountDisplayProps> = ({
  spreadsheetId
}) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainManagerName, setMainManagerName] = useState<string>('');
  const [subManagerNames, setSubManagerNames] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubManagers, setEditingSubManagers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAccount();
    if (isEditModalOpen) {
      loadUsers();
    }
  }, [spreadsheetId, isEditModalOpen]);

  const loadAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accountsData = await getAccounts(spreadsheetId);
      // 장부마다 통장이 하나
      if (accountsData.length > 0) {
        const accountData = accountsData[0];
        setAccount(accountData);
        
        // 통장 정보 로드 후 바로 관리인 이름도 함께 조회
        await loadManagerNames(accountData);
      } else {
        setError('통장 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('❌ 통장 정보 조회 오류:', err);
      setError('통장 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadManagerNames = async (accountData: Account) => {
    try {
      const promises: Promise<string>[] = [];
      
      // 주관리인 이름 조회
      if (accountData.mainManagerId) {
        promises.push(
          apiClient.getUserNameByEmail(accountData.mainManagerId).then(response => {
            const name = (response as any).name || response.data?.name;
            if (response.success && name && name !== accountData.mainManagerId && name !== '') {
              return name;
            }
            return accountData.mainManagerId;
          }).catch(() => accountData.mainManagerId)
        );
      }

      // 별도 관리인 이름 조회
      if (accountData.subManagerIds && accountData.subManagerIds.length > 0) {
        accountData.subManagerIds.forEach(email => {
          promises.push(
            apiClient.getUserNameByEmail(email).then(response => {
              const name = (response as any).name || response.data?.name;
              if (response.success && name && name !== email && name !== '') {
                return name;
              }
              return email;
            }).catch(() => email)
          );
        });
      }

      // 모든 이름 조회를 병렬로 처리
      const names = await Promise.all(promises);
      
      // 주관리인 이름 설정
      if (accountData.mainManagerId && names.length > 0) {
        setMainManagerName(names[0]);
        // 별도 관리인 이름 설정
        if (names.length > 1) {
          setSubManagerNames(names.slice(1));
        } else {
          setSubManagerNames([]);
        }
      } else {
        // 주관리인이 없으면 별도 관리인만 설정
        if (names.length > 0) {
          setSubManagerNames(names);
        } else {
          setSubManagerNames([]);
        }
      }
    } catch (err) {
      console.error('❌ 관리인 이름 조회 오류:', err);
      // 오류 시 이메일 그대로 표시
      if (accountData.mainManagerId) {
        setMainManagerName(accountData.mainManagerId);
      }
      setSubManagerNames(accountData.subManagerIds || []);
    }
  };

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
            studentId: user.studentId || user.no_member || '',
            userType: user.userType || user.user_type || 'student'
          }));
        setUsers(userList);
      }
    } catch (err) {
      console.error('❌ 사용자 목록 로드 오류:', err);
    }
  };

  const handleOpenEditModal = () => {
    if (account) {
      setEditingSubManagers([...account.subManagerIds]);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubManagers([]);
  };

  const handleSaveSubManagers = async () => {
    if (!account) return;

    setIsSaving(true);
    try {
      const response = await apiClient.updateAccountSubManagers({
        spreadsheetId,
        accountId: account.accountId,
        subManagerEmails: editingSubManagers
      });

      if (!response.success) {
        throw new Error(response.message || '서브 관리자 목록 업데이트에 실패했습니다.');
      }

      // 계정 정보 새로고침
      await loadAccount();
      setIsEditModalOpen(false);
      alert('서브 관리자 목록이 성공적으로 업데이트되었습니다.');
    } catch (err: any) {
      console.error('❌ 서브 관리자 업데이트 오류:', err);
      alert(err.message || '서브 관리자 목록 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="account-display">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-display">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="account-display">
        <div className="empty-message">
          등록된 통장이 없습니다.
        </div>
      </div>
    );
  }

  // 현재 사용자가 주 관리자인지 확인
  const userInfo = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};
  const currentUserEmail = userInfo.email || userInfo.studentId || '';
  const isMainManager = account && account.mainManagerId === currentUserEmail;

  return (
    <div className="account-display">
      <div className="account-display-header">
        <h3>통장 정보</h3>
        {isMainManager && (
          <button
            onClick={handleOpenEditModal}
            className="edit-sub-managers-btn"
          >
            서브 관리자 수정
          </button>
        )}
      </div>

      <div className="account-display-card">
        <div className="account-display-name">
          <h4>{account.accountName}</h4>
        </div>
        
        <div className="account-display-balance">
          <div className="balance-item">
            <span className="balance-label">최초 잔액</span>
            <span className="balance-value">{account.initialBalance.toLocaleString()}원</span>
          </div>
          <div className="balance-item current">
            <span className="balance-label">현재 잔액</span>
            <span className="balance-value">{account.currentBalance.toLocaleString()}원</span>
          </div>
        </div>

        <div className="account-display-details">
          <div className="detail-row">
            <span className="detail-label">주관리인:</span>
            <span className="detail-value">
              {mainManagerName || account.mainManagerId || '-'}
            </span>
          </div>
          {(subManagerNames.length > 0 || (account.subManagerIds && account.subManagerIds.length > 0)) && (
            <div className="detail-row">
              <span className="detail-label">별도 관리인:</span>
              <span className="detail-value">
                {subManagerNames.length > 0 ? subManagerNames.join(', ') : account.subManagerIds.join(', ')}
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">생성일:</span>
            <span className="detail-value">
              {new Date(account.createdDate).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      {/* 서브 관리자 수정 모달 */}
      {isEditModalOpen && account && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>서브 관리자 수정</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <p className="form-hint">
                  통장: <strong>{account.accountName}</strong>
                </p>
              </div>

              <div className="form-group">
                <UserMultiSelect
                  users={users.filter(user => user.email !== account.mainManagerId)}
                  selectedUsers={editingSubManagers}
                  onSelectionChange={setEditingSubManagers}
                  label="별도 관리인"
                  placeholder="별도 관리인 검색..."
                />
                <p className="form-hint">주관리인은 자동으로 제외됩니다.</p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubManagers}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

