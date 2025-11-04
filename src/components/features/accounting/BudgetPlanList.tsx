/**
 * @file BudgetPlanList.tsx
 * @brief 예산 계획 목록 컴포넌트
 * @details 예산 계획 목록을 표시하고 관리하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getBudgetPlans, reviewBudgetPlan, approveBudgetPlan, rejectBudgetPlan, executeBudgetPlan } from '../../../utils/database/accountingBudgetManager';
import { getAccounts } from '../../../utils/database/accountingManager';
import { apiClient } from '../../../utils/api/apiClient';
import { CreateBudgetPlanModal } from './CreateBudgetPlanModal';
import { BudgetPlanDetail } from './BudgetPlanDetail';
import type { BudgetPlan, Account } from '../../../types/features/accounting';
import './accounting.css';

interface BudgetPlanListProps {
  spreadsheetId: string;
  accountId?: string;
}

export const BudgetPlanList: React.FC<BudgetPlanListProps> = ({
  spreadsheetId,
  accountId
}) => {
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || '');
  const [statusFilter, setStatusFilter] = useState<'all' | BudgetPlan['status']>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts();
    // 현재 사용자 이메일 가져오기
    const userInfo = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : {};
    setCurrentUserEmail(userInfo.email || userInfo.studentId || '');
  }, [spreadsheetId]);

  useEffect(() => {
    // 장부마다 통장이 하나이므로 첫 번째 통장 자동 선택
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].accountId);
    }
  }, [accounts]);

  useEffect(() => {
    loadBudgetPlans();
    // 선택된 통장 정보 업데이트
    if (accounts.length > 0 && selectedAccountId) {
      const account = accounts.find(acc => acc.accountId === selectedAccountId);
      setCurrentAccount(account || null);
    }
  }, [spreadsheetId, selectedAccountId, statusFilter, accounts]);

  const loadAccounts = async () => {
    try {
      const accountsData = await getAccounts(spreadsheetId);
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountsData[0].accountId);
        setCurrentAccount(accountsData[0]);
      } else if (accountsData.length > 0) {
        const account = accountsData.find(acc => acc.accountId === selectedAccountId) || accountsData[0];
        setCurrentAccount(account);
      }
    } catch (err) {
      console.error('❌ 통장 목록 로드 오류:', err);
    }
  };

  const loadBudgetPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const plans = await getBudgetPlans(
        spreadsheetId,
        selectedAccountId || undefined
      );
      
      let filteredPlans = plans;
      if (statusFilter !== 'all') {
        filteredPlans = plans.filter(plan => plan.status === statusFilter);
      }

      setBudgetPlans(filteredPlans);
    } catch (err) {
      console.error('❌ 예산 계획 목록 조회 오류:', err);
      setError('예산 계획을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (budgetId: string) => {
    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      const reviewerEmail = userInfo.studentId || userInfo.email || currentUserEmail;
      
      // 서브 관리자인지 확인
      if (!currentAccount) {
        throw new Error('통장 정보를 찾을 수 없습니다.');
      }
      
      if (!currentAccount.subManagerIds.includes(reviewerEmail)) {
        throw new Error('서브 관리자만 검토할 수 있습니다.');
      }
      
      await reviewBudgetPlan(spreadsheetId, budgetId, reviewerEmail);
      await loadBudgetPlans();
    } catch (err: any) {
      alert(err.message || '검토 처리에 실패했습니다.');
    }
  };

  const handleApprove = async (budgetId: string) => {
    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      await approveBudgetPlan(spreadsheetId, budgetId, userInfo.studentId || userInfo.email || 'unknown');
      await loadBudgetPlans();
    } catch (err: any) {
      alert(err.message || '승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async (budgetId: string, reason: string) => {
    if (!reason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      const rejecterEmail = userInfo.studentId || userInfo.email || currentUserEmail;
      await rejectBudgetPlan(spreadsheetId, budgetId, reason, rejecterEmail);
      await loadBudgetPlans();
    } catch (err: any) {
      alert(err.message || '반려 처리에 실패했습니다.');
    }
  };

  const handleExecute = async (budgetId: string) => {
    if (!confirm('예산 계획을 집행하시겠습니까? 장부에 자동으로 반영됩니다.')) {
      return;
    }

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      await executeBudgetPlan(spreadsheetId, budgetId, userInfo.studentId || userInfo.email || 'unknown');
      await loadBudgetPlans();
      alert('예산 계획이 성공적으로 집행되었습니다.');
    } catch (err: any) {
      alert(err.message || '집행 처리에 실패했습니다.');
    }
  };

  const getStatusLabel = (status: BudgetPlan['status']) => {
    const labels = {
      'pending': '대기',
      'reviewed': '검토됨',
      'approved': '승인됨',
      'executed': '집행됨',
      'rejected': '반려됨'
    };
    return labels[status];
  };

  const getStatusColor = (status: BudgetPlan['status']) => {
    const colors = {
      'pending': '#666',
      'reviewed': '#2196F3',
      'approved': '#4CAF50',
      'executed': '#9C27B0',
      'rejected': '#f44336'
    };
    return colors[status];
  };

  // 현재 사용자가 서브 관리자인지 확인
  const isSubManager = currentAccount ? currentAccount.subManagerIds.includes(currentUserEmail) : false;
  
  // 현재 사용자가 주 관리자인지 확인
  const isMainManager = currentAccount ? currentAccount.mainManagerId === currentUserEmail : false;
  
  // 검토 진행률 계산 (서브 관리자 검토 완료율)
  const getReviewProgress = (plan: BudgetPlan) => {
    if (!currentAccount || currentAccount.subManagerIds.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const totalSubManagers = currentAccount.subManagerIds.length;
    const reviewedCount = plan.subManagerReviews.filter(review => 
      currentAccount.subManagerIds.includes(review.email)
    ).length;
    
    return {
      completed: reviewedCount,
      total: totalSubManagers,
      percentage: Math.round((reviewedCount / totalSubManagers) * 100)
    };
  };
  
  // 현재 사용자가 이미 검토했는지 확인
  const hasUserReviewed = (plan: BudgetPlan) => {
    return plan.subManagerReviews.some(r => r.email === currentUserEmail);
  };

  return (
    <div className="budget-plan-list">
      <div className="budget-plan-list-header">
        <h3>예산 계획</h3>
        <div className="budget-plan-list-actions">
          {accounts.length > 0 && (
            <div className="account-info-display">
              <span className="account-name">{accounts[0].accountName}</span>
            </div>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="status-filter"
          >
            <option value="all">전체</option>
            <option value="pending">대기</option>
            <option value="reviewed">검토됨</option>
            <option value="approved">승인됨</option>
            <option value="executed">집행됨</option>
            <option value="rejected">반려됨</option>
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="create-budget-btn"
          >
            + 예산 계획 작성
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">
          로딩 중...
        </div>
      ) : budgetPlans.length === 0 ? (
        <div className="empty-message">
          예산 계획이 없습니다.
        </div>
      ) : (
        <div className="budget-plan-table-container">
          <table className="budget-plan-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>금액</th>
                <th>상태</th>
                <th>신청일</th>
                <th>집행 예정일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {budgetPlans.map(plan => (
                <tr key={plan.budgetId}>
                  <td>{plan.title}</td>
                  <td>{plan.totalAmount.toLocaleString()}원</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        className="status-badge"
                        style={{ color: getStatusColor(plan.status) }}
                      >
                        {getStatusLabel(plan.status)}
                      </span>
                      {plan.status === 'pending' && currentAccount && currentAccount.subManagerIds.length > 0 && (
                        <div className="review-progress-container">
                          <div className="review-progress-bar">
                            <div 
                              className="review-progress-fill"
                              style={{ width: `${getReviewProgress(plan).percentage}%` }}
                            />
                          </div>
                          <span className="review-progress-text">
                            검토 진행: {getReviewProgress(plan).completed}/{getReviewProgress(plan).total}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{new Date(plan.requestedDate).toLocaleDateString('ko-KR')}</td>
                  <td>{new Date(plan.plannedExecutionDate).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div className="budget-plan-actions">
                      <button
                        onClick={() => setSelectedBudgetId(plan.budgetId)}
                        className="action-btn detail-btn"
                      >
                        상세
                      </button>
                      {plan.status === 'pending' && isSubManager && !hasUserReviewed(plan) && (
                        <button
                          onClick={() => handleReview(plan.budgetId)}
                          className="action-btn review-btn"
                        >
                          검토
                        </button>
                      )}
                      {plan.status === 'pending' && isSubManager && hasUserReviewed(plan) && (
                        <span className="reviewed-badge">검토 완료</span>
                      )}
                      {plan.status === 'reviewed' && isMainManager && (
                        <>
                          <button
                            onClick={() => handleApprove(plan.budgetId)}
                            className="action-btn approve-btn"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('반려 사유를 입력하세요:');
                              if (reason) handleReject(plan.budgetId, reason);
                            }}
                            className="action-btn reject-btn"
                          >
                            반려
                          </button>
                        </>
                      )}
                      {plan.status === 'approved' && (
                        <button
                          onClick={() => handleExecute(plan.budgetId)}
                          className="action-btn execute-btn"
                        >
                          집행
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateBudgetPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadBudgetPlans();
          setIsCreateModalOpen(false);
        }}
        spreadsheetId={spreadsheetId}
        accountId={selectedAccountId}
      />

      {selectedBudgetId && (
        <BudgetPlanDetail
          spreadsheetId={spreadsheetId}
          budgetId={selectedBudgetId}
          onClose={() => setSelectedBudgetId(null)}
          onSave={() => {
            loadBudgetPlans();
            setSelectedBudgetId(null);
          }}
        />
      )}
    </div>
  );
};

