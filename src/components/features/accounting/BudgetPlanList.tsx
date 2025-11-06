/**
 * @file BudgetPlanList.tsx
 * @brief 예산 계획 목록 컴포넌트
 * @details 예산 계획 목록을 표시하고 관리하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getBudgetPlans, reviewBudgetPlan, approveBudgetPlan, rejectBudgetPlan, executeBudgetPlan, deleteBudgetPlan } from '../../../utils/database/accountingBudgetManager';
import { getAccounts } from '../../../utils/database/accountingManager';
import { apiClient } from '../../../utils/api/apiClient';
import type { LedgerInfo } from '../../../types/features/accounting';
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
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingBudgetId, setRejectingBudgetId] = useState<string | null>(null);

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

      // 정렬 함수 - 사용자 권한 확인을 위해 외부에서 정의
      const getUserIdentifier = () => {
        if (typeof window === 'undefined') return '';
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        return userInfo.email || userInfo.studentId || '';
      };

      const userIdentifier = getUserIdentifier();
      const currentAccountForSort = accounts.find(acc => acc.accountId === selectedAccountId);
      const isSubManagerForSort = currentAccountForSort ? currentAccountForSort.subManagerIds.includes(userIdentifier) : false;
      const isMainManagerForSort = currentAccountForSort ? currentAccountForSort.mainManagerId === userIdentifier : false;

      // 정렬: 내가 처리해야 할 것 > 내가 집행해야 할 것 > 반려 > 요청일 오름차순 > 집행일 오름차순
      filteredPlans.sort((a, b) => {
        // 1순위: 검토/결재 필요한 항목 (내가 처리해야 할 경우)
        // - pending 상태이고 서브 관리자이면서 아직 검토하지 않은 것
        // - reviewed 상태이고 주 관리자인 것
        const aNeedsMyReview = a.status === 'pending' && isSubManagerForSort && 
          !a.subManagerReviews.some(r => r.email === userIdentifier);
        const bNeedsMyReview = b.status === 'pending' && isSubManagerForSort && 
          !b.subManagerReviews.some(r => r.email === userIdentifier);
        const aNeedsMyApproval = a.status === 'reviewed' && isMainManagerForSort;
        const bNeedsMyApproval = b.status === 'reviewed' && isMainManagerForSort;
        const aNeedsMyAction = aNeedsMyReview || aNeedsMyApproval;
        const bNeedsMyAction = bNeedsMyReview || bNeedsMyApproval;
        
        if (aNeedsMyAction && !bNeedsMyAction) return -1;
        if (!aNeedsMyAction && bNeedsMyAction) return 1;
        if (aNeedsMyAction && bNeedsMyAction) {
          // 둘 다 처리 필요하면 요청일 오름차순
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        }
        
        // 2순위: 내가 집행해야 할 항목 (approved 상태)
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (a.status !== 'approved' && b.status === 'approved') return 1;
        if (a.status === 'approved' && b.status === 'approved') {
          // 둘 다 승인 상태면 요청일 오름차순
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        }
        
        // 3순위: 반려된 항목
        if (a.status === 'rejected' && b.status !== 'rejected') return -1;
        if (a.status !== 'rejected' && b.status === 'rejected') return 1;
        if (a.status === 'rejected' && b.status === 'rejected') {
          // 반려된 항목은 요청일 오름차순
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        }
        
        // 4순위: 아직 진행중인 예산안 (검토중이거나 승인대기, 집행대기)
        // - pending 상태 (검토 중)
        // - reviewed 상태 (승인 대기)
        // - approved 상태 (집행 대기)
        const aInProgress = a.status === 'pending' || a.status === 'reviewed' || a.status === 'approved';
        const bInProgress = b.status === 'pending' || b.status === 'reviewed' || b.status === 'approved';
        
        // 이미 1순위나 2순위에서 처리된 것은 제외
        const aAlreadyHandled = aNeedsMyAction || a.status === 'approved';
        const bAlreadyHandled = bNeedsMyAction || b.status === 'approved';
        
        const aActuallyInProgress = aInProgress && !aAlreadyHandled && a.status !== 'rejected';
        const bActuallyInProgress = bInProgress && !bAlreadyHandled && b.status !== 'rejected';
        
        if (aActuallyInProgress && !bActuallyInProgress) return -1;
        if (!aActuallyInProgress && bActuallyInProgress) return 1;
        if (aActuallyInProgress && bActuallyInProgress) {
          // 둘 다 진행중이면 요청일 오름차순
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        }
        
        // 5순위: 요청일 오름차순 (과거부터)
        const dateA = new Date(a.requestedDate).getTime();
        const dateB = new Date(b.requestedDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        // 6순위: 집행일 오름차순 (과거부터, 집행일이 있는 경우)
        if (a.executedDate && b.executedDate) {
          const execDateA = new Date(a.executedDate).getTime();
          const execDateB = new Date(b.executedDate).getTime();
          return execDateA - execDateB;
        }
        // 집행일이 있는 항목을 먼저
        if (a.executedDate && !b.executedDate) return -1;
        if (!a.executedDate && b.executedDate) return 1;
        
        return 0;
      });

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
      
      // 이메일을 우선 사용 (서브 관리자 목록이 이메일로 저장되어 있음)
      const reviewerEmail = userInfo.email || userInfo.studentId || currentUserEmail;
      
      console.log('🔍 검토 시작:', {
        budgetId,
        reviewerEmail,
        currentUserEmail,
        userInfo: {
          studentId: userInfo.studentId,
          email: userInfo.email
        },
        currentAccount: currentAccount ? {
          accountId: currentAccount.accountId,
          mainManagerId: currentAccount.mainManagerId,
          subManagerIds: currentAccount.subManagerIds
        } : null
      });
      
      // 서브 관리자인지 확인
      if (!currentAccount) {
        throw new Error('통장 정보를 찾을 수 없습니다.');
      }
      
      console.log('🔍 서브 관리자 확인:', {
        reviewerEmail,
        subManagerIds: currentAccount.subManagerIds,
        isSubManager: currentAccount.subManagerIds.includes(reviewerEmail)
      });
      
      if (!currentAccount.subManagerIds.includes(reviewerEmail)) {
        throw new Error(`서브 관리자만 검토할 수 있습니다. 현재 사용자: ${reviewerEmail}, 서브 관리자 목록: ${currentAccount.subManagerIds.join(', ')}`);
      }
      
      await reviewBudgetPlan(spreadsheetId, budgetId, reviewerEmail);
      await loadBudgetPlans();
      alert('검토가 완료되었습니다.');
    } catch (err: any) {
      console.error('❌ 검토 오류:', err);
      alert(err.message || '검토 처리에 실패했습니다.');
    }
  };

  const handleApprove = async (budgetId: string) => {
    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      // 이메일을 우선 사용 (주 관리자 목록이 이메일로 저장되어 있음)
      const approverId = userInfo.email || userInfo.studentId || currentUserEmail;
      
      console.log('🔍 승인 시작:', {
        budgetId,
        approverId,
        userEmail: userInfo.email,
        userStudentId: userInfo.studentId,
        currentUserEmail
      });
      
      await approveBudgetPlan(spreadsheetId, budgetId, approverId);
      await loadBudgetPlans();
      alert('승인이 완료되었습니다.');
    } catch (err: any) {
      console.error('❌ 승인 오류:', err);
      alert(err.message || '승인 처리에 실패했습니다.');
    }
  };

  const handleOpenRejectModal = (budgetId: string) => {
    setRejectingBudgetId(budgetId);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason('');
    setRejectingBudgetId(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    if (!rejectingBudgetId) {
      return;
    }

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      // 이메일을 우선 사용 (서브 관리자 목록이 이메일로 저장되어 있음)
      const rejecterEmail = userInfo.email || userInfo.studentId || currentUserEmail;
      await rejectBudgetPlan(spreadsheetId, rejectingBudgetId, rejectReason, rejecterEmail);
      await loadBudgetPlans();
      handleCloseRejectModal();
      alert('반려가 완료되었습니다.');
    } catch (err: any) {
      console.error('❌ 반려 오류:', err);
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

  const handleDelete = async (budgetId: string) => {
    const plan = budgetPlans.find(p => p.budgetId === budgetId);
    if (!plan) {
      return;
    }

    // 집행된 예산안은 경고 메시지
    let confirmMessage = '예산 계획을 삭제하시겠습니까?';
    if (plan.status === 'executed') {
      confirmMessage = '⚠️ 경고: 이미 집행된 예산 계획입니다.\n\n이 예산 계획을 삭제하면 장부에 반영된 항목들도 함께 삭제됩니다.\n정말로 삭제하시겠습니까?';
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
      
      const deleterId = userInfo.email || userInfo.studentId || currentUserEmail;
      await deleteBudgetPlan(spreadsheetId, budgetId, deleterId);
      await loadBudgetPlans();
      alert('예산 계획이 삭제되었습니다.');
    } catch (err: any) {
      console.error('❌ 삭제 오류:', err);
      alert(err.message || '삭제 처리에 실패했습니다.');
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

  // 현재 사용자가 서브 관리자인지 확인 (이메일 또는 학번으로 확인)
  const getUserIdentifier = () => {
    if (typeof window === 'undefined') return '';
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    return userInfo.email || userInfo.studentId || currentUserEmail;
  };
  
  const userIdentifier = getUserIdentifier();
  const isSubManager = currentAccount ? currentAccount.subManagerIds.includes(userIdentifier) : false;
  
  // 현재 사용자가 주 관리자인지 확인 (이메일 또는 학번으로 확인)
  const isMainManager = currentAccount ? (
    currentAccount.mainManagerId === userIdentifier || 
    currentAccount.mainManagerId === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').email : '') ||
    currentAccount.mainManagerId === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').studentId : '')
  ) : false;

  // 관리자인지 확인 (주 관리자 또는 서브 관리자)
  const isManager = isMainManager || isSubManager;
  
  // 디버깅 로그
  if (currentAccount) {
    const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    console.log('🔍 주 관리자 확인:', {
      userIdentifier,
      mainManagerId: currentAccount.mainManagerId,
      userEmail: userInfo.email,
      userStudentId: userInfo.studentId,
      isMainManager,
      matches: {
        byIdentifier: currentAccount.mainManagerId === userIdentifier,
        byEmail: currentAccount.mainManagerId === userInfo.email,
        byStudentId: currentAccount.mainManagerId === userInfo.studentId
      }
    });
  }
  
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
  
  // 현재 사용자가 이미 검토했는지 확인 (이메일 또는 학번으로 확인)
  const hasUserReviewed = (plan: BudgetPlan) => {
    const userIdentifier = getUserIdentifier();
    return plan.subManagerReviews.some(r => r.email === userIdentifier);
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
                <th>집행일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {budgetPlans.map(plan => {
                // 디버깅: 각 계획의 상태와 조건 확인
                if (plan.status === 'reviewed') {
                  console.log('🔍 검토 완료된 계획:', {
                    budgetId: plan.budgetId,
                    title: plan.title,
                    status: plan.status,
                    isMainManager,
                    currentAccount: currentAccount ? {
                      accountId: currentAccount.accountId,
                      mainManagerId: currentAccount.mainManagerId
                    } : null,
                    userIdentifier,
                    subManagerReviews: plan.subManagerReviews
                  });
                }
                
                return (
                <tr key={plan.budgetId}>
                  <td>{plan.title}</td>
                  <td>{plan.totalAmount.toLocaleString()}원</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ color: getStatusColor(plan.status) }}
                    >
                      {getStatusLabel(plan.status)}
                    </span>
                  </td>
                  <td>{new Date(plan.requestedDate).toLocaleDateString('ko-KR')}</td>
                  <td>{plan.executedDate ? new Date(plan.executedDate).toLocaleDateString('ko-KR') : '-'}</td>
                  <td>
                    <div className="budget-plan-actions">
                      <button
                        onClick={() => setSelectedBudgetId(plan.budgetId)}
                        className="action-btn detail-btn"
                      >
                        상세
                      </button>
                      {plan.status === 'pending' && (
                        <button
                          onClick={() => handleReview(plan.budgetId)}
                          className={`action-btn review-btn review-btn-with-progress ${!isSubManager || hasUserReviewed(plan) ? 'disabled' : ''}`}
                          disabled={!isSubManager || hasUserReviewed(plan)}
                          style={{
                            '--progress-percentage': `${getReviewProgress(plan).percentage}%`
                          } as React.CSSProperties}
                        >
                          <span className="review-btn-text">
                            검토 {getReviewProgress(plan).completed}/{getReviewProgress(plan).total}
                          </span>
                        </button>
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
                            onClick={() => handleOpenRejectModal(plan.budgetId)}
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
                      {isManager && (
                        <button
                          onClick={() => handleDelete(plan.budgetId)}
                          className="action-btn delete-btn"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
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

      {/* 반려 모달 */}
      {isRejectModalOpen && (
        <div className="modal-overlay" onClick={handleCloseRejectModal}>
          <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>예산 계획 반려</h2>
              <button className="modal-close-btn" onClick={handleCloseRejectModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="reject-reason">
                  반려 사유 <span className="required">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={5}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p className="form-hint">반려 사유를 명확히 입력해주세요</p>
              </div>
            </div>

            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handleCloseRejectModal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  background: rejectReason.trim() ? '#f44336' : '#ccc',
                  color: 'white',
                  cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

