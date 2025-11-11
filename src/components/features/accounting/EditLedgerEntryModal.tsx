/**
 * @file EditLedgerEntryModal.tsx
 * @brief 장부 항목 수정 모달
 * @details 장부 항목을 수정하는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { updateLedgerEntry, getAccounts, getCategories } from '../../../utils/database/accountingManager';
import type { LedgerEntry, UpdateLedgerEntryRequest, Account, Category } from '../../../types/features/accounting';
import './accounting.css';

interface EditLedgerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  spreadsheetId: string;
  entry: LedgerEntry | null;
}

export const EditLedgerEntryModal: React.FC<EditLedgerEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  entry
}) => {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedBalance, setEstimatedBalance] = useState<number | null>(null);

  // 초기화
  useEffect(() => {
    if (isOpen && entry) {
      loadData();
      setDate(entry.date.split('T')[0]);
      setCategory(entry.category);
      setDescription(entry.description);
      setAmount(Math.abs(entry.amount).toString());
      setSource(entry.source);
      setTransactionType(entry.transactionType);
      setEstimatedBalance(entry.balanceAfter);
    }
  }, [isOpen, entry, spreadsheetId]);

  const loadData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        getAccounts(spreadsheetId),
        getCategories(spreadsheetId)
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('❌ 데이터 로드 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    }
  };

  // 예상 잔액 계산
  useEffect(() => {
    if (entry && amount && accounts.length > 0) {
      const account = accounts.find(acc => acc.accountId === entry.accountId);
      if (account) {
        // 기존 항목의 금액 제거
        const balanceBeforeEntry = account.currentBalance - entry.amount;
        // 새로운 금액 적용
        const newAmount = parseFloat(amount) || 0;
        const adjustedAmount = transactionType === 'expense' ? -newAmount : newAmount;
        setEstimatedBalance(balanceBeforeEntry + adjustedAmount);
      }
    }
  }, [amount, transactionType, entry, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry) {
      setError('장부 항목 정보가 없습니다.');
      return;
    }

    if (!date || !category || !description || !amount || !source) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: UpdateLedgerEntryRequest = {
        date: new Date(date).toISOString(),
        category,
        description,
        amount: amountNum,
        source,
        transactionType,
        evidenceFile: evidenceFile || undefined
      };

      // 현재 사용자 ID 가져오기 (실제로는 인증된 사용자 정보에서 가져와야 함)
      const currentUserEmail = window.gapi?.auth2?.getAuthInstance()?.currentUser?.get()?.getBasicProfile()?.getEmail() || 'unknown';

      await updateLedgerEntry(spreadsheetId, entry.entryId, updateData, currentUserEmail);
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('❌ 장부 항목 수정 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '장부 항목 수정에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !entry) {
    return null;
  }

  const categoryNames = categories.map(cat => cat.categoryName);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>장부 항목 수정</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="accounting-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>날짜 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>거래 유형 *</label>
            <div className="transaction-type-options">
              <label className="radio-label">
                <input
                  type="radio"
                  value="income"
                  checked={transactionType === 'income'}
                  onChange={() => setTransactionType('income')}
                />
                <span>수입</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="expense"
                  checked={transactionType === 'expense'}
                  onChange={() => setTransactionType('expense')}
                />
                <span>지출</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>카테고리 *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={entry.isBudgetExecuted && entry.budgetPlanId}
            >
              <option value="">선택하세요</option>
              {categoryNames.map(catName => (
                <option key={catName} value={catName}>{catName}</option>
              ))}
            </select>
          </div>

          {entry.isBudgetExecuted && entry.budgetPlanTitle && (
            <div className="form-group">
              <label>예산안 이름</label>
              <input
                type="text"
                value={entry.budgetPlanTitle}
                disabled
                className="disabled-input"
                readOnly
              />
              <p className="form-hint">예산안으로 생성된 항목은 예산안 이름을 수정할 수 없습니다.</p>
            </div>
          )}

          <div className="form-group">
            <label>내용 *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="거래 내용을 입력하세요"
              required
              disabled={entry.isBudgetExecuted && entry.budgetPlanId}
            />
            {entry.isBudgetExecuted && entry.budgetPlanId && (
              <p className="form-hint">예산안으로 생성된 항목은 내용을 수정할 수 없습니다.</p>
            )}
          </div>

          <div className="form-group">
            <label>금액 *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="금액을 입력하세요"
              min="0"
              step="1"
              required
            />
            <p className="form-hint">금액은 항상 양수로 입력하세요 (수입/지출은 위에서 선택)</p>
          </div>

          <div className="form-group">
            <label>출처/수입처 *</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="출처 또는 수입처를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label>증빙 문서 (선택)</label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            />
            <p className="form-hint">증빙 문서가 있다면 업로드하세요</p>
          </div>

          {estimatedBalance !== null && (
            <div className="estimated-balance">
              <strong>예상 잔액: {estimatedBalance.toLocaleString()}원</strong>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? '수정 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

