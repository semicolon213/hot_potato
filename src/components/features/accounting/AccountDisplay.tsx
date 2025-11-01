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
import type { Account } from '../../../types/features/accounting';
import './accounting.css';

interface AccountDisplayProps {
  spreadsheetId: string;
}

export const AccountDisplay: React.FC<AccountDisplayProps> = ({
  spreadsheetId
}) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainManagerName, setMainManagerName] = useState<string>('');
  const [subManagerNames, setSubManagerNames] = useState<string[]>([]);

  useEffect(() => {
    loadAccount();
  }, [spreadsheetId]);

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

  return (
    <div className="account-display">
      <div className="account-display-header">
        <h3>통장 정보</h3>
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
    </div>
  );
};

