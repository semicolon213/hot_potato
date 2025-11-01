/**
 * @file AddLedgerEntryModal.tsx
 * @brief 장부 항목 추가 모달
 * @details 장부에 새로운 항목을 추가하는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { createLedgerEntry, getAccounts, getCategories, getLedgerEntries } from '../../../utils/database/accountingManager';
import type { CreateLedgerEntryRequest, Account, Category } from '../../../types/features/accounting';
import './accounting.css';

interface AddLedgerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  spreadsheetId: string;
}

export const AddLedgerEntryModal: React.FC<AddLedgerEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId
}) => {
  const [accountId, setAccountId] = useState('');
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
    if (isOpen) {
      loadData();
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, spreadsheetId]);

  // 날짜 자동 설정 (이전 항목의 날짜)
  useEffect(() => {
    if (isOpen && accountId && !date) {
      loadLastEntryDate();
    }
  }, [isOpen, accountId]);

  // 예상 잔액 계산
  useEffect(() => {
    if (accountId && amount) {
      calculateEstimatedBalance();
    }
  }, [accountId, amount, transactionType]);

  const loadData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        getAccounts(spreadsheetId),
        getCategories(spreadsheetId)
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
      
      // 장부마다 통장이 하나이므로 첫 번째 통장 자동 선택
      if (accountsData.length > 0) {
        setAccountId(accountsData[0].accountId);
      } else {
        setError('통장 정보를 찾을 수 없습니다. 장부를 다시 확인해주세요.');
      }
    } catch (err) {
      console.error('❌ 데이터 로드 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    }
  };

  const loadLastEntryDate = async () => {
    try {
      const entries = await getLedgerEntries(spreadsheetId, accountId);
      if (entries.length > 0) {
        // 가장 최근 항목의 날짜 사용
        setDate(entries[0].date);
      }
    } catch (err) {
      console.error('❌ 마지막 항목 날짜 로드 오류:', err);
    }
  };

  const calculateEstimatedBalance = async () => {
    try {
      const selectedAccount = accounts.find(acc => acc.accountId === accountId);
      if (!selectedAccount) return;

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        setEstimatedBalance(null);
        return;
      }

      const change = transactionType === 'expense' ? -amountNum : amountNum;
      setEstimatedBalance(selectedAccount.currentBalance + change);
    } catch (err) {
      console.error('❌ 잔액 계산 오류:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 장부마다 통장이 하나이므로 첫 번째 통장 자동 사용
    const effectiveAccountId = accountId || (accounts.length > 0 ? accounts[0].accountId : '');
    
    if (!effectiveAccountId) {
      setError('통장 정보를 찾을 수 없습니다.');
      return;
    }

    if (!date) {
      setError('날짜를 입력해주세요.');
      return;
    }

    if (!category) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    if (!description.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('유효한 금액을 입력해주세요.');
      return;
    }

    if (!source.trim()) {
      setError('출처/수입처를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      const request: CreateLedgerEntryRequest = {
        accountId: effectiveAccountId,
        date,
        category,
        description: description.trim(),
        amount: amountNum,
        source: source.trim(),
        transactionType,
        evidenceFile: evidenceFile || undefined
      };

      await createLedgerEntry(
        spreadsheetId,
        request,
        userInfo.studentId || userInfo.email || 'unknown'
      );

      onSuccess();
      onClose();
      // 폼 초기화
      resetForm();

    } catch (err: any) {
      console.error('❌ 장부 항목 추가 오류:', err);
      setError(err.message || '장부 항목 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAccountId('');
    setDate('');
    setCategory('');
    setDescription('');
    setAmount('');
    setSource('');
    setTransactionType('expense');
    setEvidenceFile(null);
    setEstimatedBalance(null);
  };

  const selectedAccount = accounts.find(acc => acc.accountId === accountId);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>장부 항목 추가</h2>
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
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="transactionType"
                  value="income"
                  checked={transactionType === 'income'}
                  onChange={(e) => setTransactionType('income')}
                />
                <span>수입</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="transactionType"
                  value="expense"
                  checked={transactionType === 'expense'}
                  onChange={(e) => setTransactionType('expense')}
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
            >
              <option value="">선택하세요</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryName}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>내용 *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 월례회의, MT 등"
              required
            />
          </div>

          <div className="form-group">
            <label>금액 (원) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="양수로 입력"
              min="1"
              step="1"
              required
            />
            <p className="form-hint">
              {transactionType === 'expense' ? '지출 금액' : '수입 금액'}을 양수로 입력하세요.
              실제 저장 시 {transactionType === 'expense' ? '음수로 변환' : '양수로 저장'}됩니다.
            </p>
          </div>

          <div className="form-group">
            <label>{transactionType === 'income' ? '수입처' : '출처'} *</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={transactionType === 'income' ? '예: 학생회비, 후원금 등' : '예: 편의점, 식당 등'}
              required
            />
          </div>

          <div className="form-group">
            <label>증빙 문서 (선택사항)</label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <p className="form-hint">
              증빙 문서를 업로드할 수 있습니다. (PDF, 이미지, 문서)
            </p>
          </div>

          {selectedAccount && estimatedBalance !== null && (
            <div className="balance-preview">
              <p><strong>현재 잔액:</strong> {selectedAccount.currentBalance.toLocaleString()}원</p>
              <p><strong>거래 금액:</strong> 
                <span className={transactionType === 'income' ? 'amount-income' : 'amount-expense'}>
                  {transactionType === 'income' ? '+' : '-'}
                  {parseFloat(amount || '0').toLocaleString()}원
                </span>
              </p>
              <p><strong>예상 잔액:</strong> {estimatedBalance.toLocaleString()}원</p>
            </div>
          )}

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
              {isLoading ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

