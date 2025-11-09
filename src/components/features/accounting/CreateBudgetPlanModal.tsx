/**
 * @file CreateBudgetPlanModal.tsx
 * @brief 예산 계획 작성 모달
 * @details 새로운 예산 계획을 작성하는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { createBudgetPlan } from '../../../utils/database/accountingBudgetManager';
import { getAccounts } from '../../../utils/database/accountingManager';
import type { CreateBudgetPlanRequest, Account } from '../../../types/features/accounting';
import './accounting.css';

interface CreateBudgetPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  spreadsheetId: string;
}

export const CreateBudgetPlanModal: React.FC<CreateBudgetPlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId
}) => {
  // 기본 정보만 입력
  const [title, setTitle] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, spreadsheetId]);

  useEffect(() => {
    // 장부마다 통장이 하나이므로 첫 번째 통장 자동 선택
    if (accounts.length > 0) {
      const firstAccount = accounts[0];
      setSelectedAccountId(firstAccount.accountId);
    }
  }, [accounts]);

  const loadData = async () => {
    try {
      const accountsData = await getAccounts(spreadsheetId);
      setAccounts(accountsData);

      // 장부마다 통장이 하나이므로 첫 번째 통장 사용
      if (accountsData.length > 0) {
        setSelectedAccountId(accountsData[0].accountId);
      } else {
        setError('통장 정보를 찾을 수 없습니다. 장부를 다시 확인해주세요.');
      }
    } catch (err) {
      console.error('❌ 데이터 로드 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    // 장부마다 통장이 하나이므로 첫 번째 통장 사용
    const effectiveAccountId = selectedAccountId || (accounts.length > 0 ? accounts[0].accountId : '');
    
    if (!effectiveAccountId) {
      setError('통장 정보를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      const request: CreateBudgetPlanRequest = {
        accountId: effectiveAccountId,
        title: title.trim(),
        totalAmount: 0, // 초기에는 0, 나중에 항목 추가 시 업데이트
        details: [] // 초기에는 빈 배열, 상세 화면에서 추가
      };

      await createBudgetPlan(
        spreadsheetId,
        request,
        userInfo.studentId || userInfo.email || 'unknown'
      );

      onSuccess();
      onClose();
      resetForm();

    } catch (err: any) {
      console.error('❌ 예산 계획 작성 오류:', err);
      setError(err.message || '예산 계획 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>예산 계획 작성</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {accounts.length > 0 && (
            <div className="form-group">
              <label>통장</label>
              <div className="account-display">
                <strong>{accounts[0].accountName}</strong>
                <span className="account-balance-text">
                  잔액: {accounts[0].currentBalance.toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2024년 상반기 MT 예산"
              required
            />
            <p className="form-hint">예산 계획의 제목을 입력하세요. 항목은 저장 후 상세 화면에서 추가할 수 있습니다.</p>
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
            <button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

