/**
 * @file AccountList.tsx
 * @brief 통장 목록 컴포넌트
 * @details 장부 내 통장 목록을 표시하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount } from '../../../utils/database/accountingManager';
import { CreateAccountModal } from './CreateAccountModal';
import type { Account, CreateAccountRequest } from '../../../types/features/accounting';
import './accounting.css';

interface AccountListProps {
  spreadsheetId: string;
}

export const AccountList: React.FC<AccountListProps> = ({
  spreadsheetId
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [spreadsheetId]);

  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accountsData = await getAccounts(spreadsheetId);
      setAccounts(accountsData);
    } catch (err) {
      console.error('❌ 통장 목록 조회 오류:', err);
      setError('통장 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadAccounts();
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="account-list">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="account-list">
      <div className="account-list-header">
        <h3>통장 목록</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="create-account-btn"
        >
          + 통장 추가
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-message">
          등록된 통장이 없습니다.
        </div>
      ) : (
        <div className="account-grid">
          {accounts.map(account => (
            <div key={account.accountId} className="account-card">
              <h4>{account.accountName}</h4>
              <div className="account-info">
                <p className="account-balance">
                  잔액: <strong>{account.currentBalance.toLocaleString()}원</strong>
                </p>
                <p className="account-detail">
                  최초 잔액: {account.initialBalance.toLocaleString()}원
                </p>
                <p className="account-detail">
                  주관리인: {account.mainManagerId}
                </p>
                {account.subManagerIds.length > 0 && (
                  <p className="account-detail">
                    별도 관리인: {account.subManagerIds.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        spreadsheetId={spreadsheetId}
      />
    </div>
  );
};

