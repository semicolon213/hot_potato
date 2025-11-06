/**
 * @file BudgetPlanDetail.tsx
 * @brief 예산 계획 상세 관리 컴포넌트
 * @details 예산 계획의 항목들을 추가/수정/삭제하고 저장할 수 있는 작업 화면입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getBudgetPlans, updateBudgetPlanDetails } from '../../../utils/database/accountingBudgetManager';
import { getCategories, getAccounts } from '../../../utils/database/accountingManager';
import type { BudgetPlan, BudgetPlanDetail, Category, Account } from '../../../types/features/accounting';
import './accounting.css';

interface BudgetPlanDetailProps {
  spreadsheetId: string;
  budgetId: string;
  onClose: () => void;
  onSave: () => void;
}

export const BudgetPlanDetail: React.FC<BudgetPlanDetailProps> = ({
  spreadsheetId,
  budgetId,
  onClose,
  onSave
}) => {
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [details, setDetails] = useState<Omit<BudgetPlanDetail, 'detailId'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [spreadsheetId, budgetId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [plans, categoriesData, accountsData] = await Promise.all([
        getBudgetPlans(spreadsheetId),
        getCategories(spreadsheetId),
        getAccounts(spreadsheetId)
      ]);

      const plan = plans.find(p => p.budgetId === budgetId);
      if (!plan) {
        setError('예산 계획을 찾을 수 없습니다.');
        return;
      }

      setBudgetPlan(plan);
      setDetails(plan.details.map(d => ({ 
        category: d.category, 
        description: d.description, 
        amount: d.amount,
        plannedDate: d.plannedDate 
      })));
      setCategories(categoriesData);
      
      const foundAccount = accountsData.find(acc => acc.accountId === plan.accountId);
      if (foundAccount) {
        setAccount(foundAccount);
      }
    } catch (err: any) {
      console.error('❌ 데이터 로드 오류:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDetail = () => {
    setDetails([...details, { category: '', description: '', amount: 0, plannedDate: '' }]);
    setHasChanges(true);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleDetailChange = (index: number, field: keyof Omit<BudgetPlanDetail, 'detailId'>, value: string | number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value } as Omit<BudgetPlanDetail, 'detailId'>;
    setDetails(newDetails);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setError(null);

    // 유효성 검증
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      if (!detail.category) {
        setError(`${i + 1}번째 항목의 카테고리를 선택해주세요.`);
        return;
      }
      if (!detail.description.trim()) {
        setError(`${i + 1}번째 항목의 설명을 입력해주세요.`);
        return;
      }
      if (detail.amount <= 0) {
        setError(`${i + 1}번째 항목의 금액을 입력해주세요.`);
        return;
      }
    }

    if (!account) {
      setError('통장 정보를 찾을 수 없습니다.');
      return;
    }

    const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
    if (totalAmount > account.currentBalance) {
      setError(`예산 금액(${totalAmount.toLocaleString()}원)이 통장 잔액(${account.currentBalance.toLocaleString()}원)을 초과합니다.`);
      return;
    }

    setIsSaving(true);

    try {
      await updateBudgetPlanDetails(spreadsheetId, budgetId, { details });
      setHasChanges(false);
      onSave();
      alert('예산 항목이 저장되었습니다.');
    } catch (err: any) {
      console.error('❌ 예산 항목 저장 오류:', err);
      setError(err.message || '예산 항목 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = details.reduce((sum, detail) => sum + detail.amount, 0);
  const remainingBalance = account ? account.currentBalance - totalAmount : null;

  if (isLoading) {
    return (
      <div className="budget-plan-detail">
        <div className="loading-message">로딩 중...</div>
      </div>
    );
  }

  if (error && !budgetPlan) {
    return (
      <div className="budget-plan-detail">
        <div className="error-message">{error}</div>
        <button onClick={onClose} className="btn-secondary">닫기</button>
      </div>
    );
  }

  if (!budgetPlan) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="budget-plan-detail" onClick={(e) => e.stopPropagation()}>
        <div className="budget-plan-detail-header">
          <div>
            <h2>{budgetPlan.title}</h2>
            <p className="budget-plan-meta">
              집행 예정일: {new Date(budgetPlan.plannedExecutionDate).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {account && (
          <div className="account-summary">
            <div className="account-info">
              <span className="account-name">{account.accountName}</span>
              <span className="account-balance">잔액: {account.currentBalance.toLocaleString()}원</span>
            </div>
          </div>
        )}

        <div className="budget-details-section">
          <div className="section-header">
            <h3>예산 항목</h3>
            <button
              type="button"
              onClick={handleAddDetail}
              className="add-detail-btn-small"
            >
              + 항목 추가
            </button>
          </div>

          {details.length === 0 ? (
            <div className="empty-details">
              <p className="form-hint">예산 항목을 추가해주세요.</p>
            </div>
          ) : (
            <div className="budget-details-list">
              {details.map((detail, index) => (
                <div key={index} className="budget-detail-item">
                  <div className="budget-detail-header">
                    <span className="detail-index">항목 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(index)}
                      className="remove-detail-btn"
                    >
                      삭제
                    </button>
                  </div>
                  <div className="budget-detail-row">
                    <div className="detail-field">
                      <label>카테고리</label>
                      <select
                        value={detail.category}
                        onChange={(e) => handleDetailChange(index, 'category', e.target.value)}
                        className="detail-category-select"
                        required
                      >
                        <option value="">카테고리 선택</option>
                        {categories.map(cat => (
                          <option key={cat.categoryId} value={cat.categoryName}>
                            {cat.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="detail-field">
                      <label>설명</label>
                      <input
                        type="text"
                        value={detail.description}
                        onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                        placeholder="항목 설명을 입력하세요"
                        className="detail-description-input"
                        required
                      />
                    </div>
                    <div className="detail-field">
                      <label>금액</label>
                      <input
                        type="number"
                        value={detail.amount || ''}
                        onChange={(e) => handleDetailChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="1"
                        step="1"
                        className="detail-amount-input"
                        required
                      />
                    </div>
                    <div className="detail-field">
                      <label>집행 예정일</label>
                      <input
                        type="date"
                        value={detail.plannedDate || ''}
                        onChange={(e) => handleDetailChange(index, 'plannedDate', e.target.value)}
                        className="detail-date-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {account && (
            <div className="budget-summary">
              <div className="summary-row">
                <span>통장 잔액:</span>
                <strong>{account.currentBalance.toLocaleString()}원</strong>
              </div>
              <div className="summary-row">
                <span>총 예산 금액:</span>
                <strong>{totalAmount.toLocaleString()}원</strong>
              </div>
              <div className={`summary-row ${remainingBalance !== null && remainingBalance < 0 ? 'error-text' : ''}`}>
                <span>예상 남은 잔액:</span>
                <strong>{remainingBalance !== null ? remainingBalance.toLocaleString() : '-'}원</strong>
              </div>
              {remainingBalance !== null && remainingBalance < 0 && (
                <div className="error-warning">⚠️ 예산 금액이 통장 잔액을 초과합니다!</div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="budget-plan-detail-actions">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            닫기
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={isSaving || !hasChanges || details.length === 0}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

