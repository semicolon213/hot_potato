/**
 * WorkflowManagement.tsx
 * 결재 관리 페이지
 * 탭 3개: 내가 올린 결재, 내가 결재해야 하는 것, 결재 완료된 리스트
 */

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../utils/api/apiClient';
import WorkflowRequestModal from '../components/features/workflow/WorkflowRequestModal';
import WorkflowActionModal from '../components/features/workflow/WorkflowActionModal';
import WorkflowDetailModal from '../components/features/workflow/WorkflowDetailModal';
import WorkflowResubmitModal from '../components/features/workflow/WorkflowResubmitModal';
import type { WorkflowInfoResponse, WorkflowListResponse, WorkflowRequestResponse } from '../types/api/apiResponses';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import './WorkflowManagement.css';

interface WorkflowManagementProps {
  onPageChange?: (pageName: string) => void;
}

type TabType = 'requested' | 'pending' | 'completed';

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({ onPageChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requestedWorkflows, setRequestedWorkflows] = useState<WorkflowInfoResponse[]>([]);
  const [pendingWorkflows, setPendingWorkflows] = useState<WorkflowInfoResponse[]>([]);
  const [completedWorkflows, setCompletedWorkflows] = useState<WorkflowInfoResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id?: string; title?: string } | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState<boolean>(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfoResponse | null>(null);
  const [actionType, setActionType] = useState<'review' | 'payment'>('review');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('전체');

  useEffect(() => {
    const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    setUserEmail(userInfo.email || '');
  }, []);

  // 모든 탭 데이터 한번에 로드 (초기 로드 및 userEmail 변경 시)
  useEffect(() => {
    if (!userEmail) return;

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // 모든 탭의 데이터를 병렬로 로드
        const [requestedResponse, pendingResponse, completedResponse] = await Promise.all([
          apiClient.getMyRequestedWorkflows(userEmail),
          apiClient.getMyPendingWorkflows({
            userEmail
            // 상태 필터 제거: 검토중, 결재중 모두 포함
          }),
          apiClient.getCompletedWorkflows({
            userEmail
          })
        ]);

        if (requestedResponse.success && requestedResponse.data) {
          setRequestedWorkflows(requestedResponse.data);
        }
        if (pendingResponse.success && pendingResponse.data) {
          setPendingWorkflows(pendingResponse.data);
        }
        if (completedResponse.success && completedResponse.data) {
          setCompletedWorkflows(completedResponse.data);
        }
      } catch (error) {
        console.error('❌ 워크플로우 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [userEmail]);

  const getCurrentWorkflows = (): WorkflowInfoResponse[] => {
    switch (activeTab) {
      case 'requested':
        return requestedWorkflows;
      case 'pending':
        return pendingWorkflows;
      case 'completed':
        return completedWorkflows;
      default:
        return [];
    }
  };

  // 필터링된 워크플로우 목록
  const filteredWorkflows = useMemo(() => {
    const workflows = getCurrentWorkflows();
    return workflows.filter((workflow) => {
      const matchesSearch = searchTerm === '' || 
        (workflow.workflowDocumentTitle || workflow.attachedDocumentTitle || workflow.documentTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workflow.requesterName || workflow.requesterEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === '전체' || workflow.workflowStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [activeTab, requestedWorkflows, pendingWorkflows, completedWorkflows, searchTerm, filterStatus]);

  // 상태 옵션 생성
  const statusOptions = useMemo(() => {
    const workflows = getCurrentWorkflows();
    const statuses = new Set(workflows.map(w => w.workflowStatus));
    return ['전체', ...Array.from(statuses).sort()];
  }, [activeTab, requestedWorkflows, pendingWorkflows, completedWorkflows]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('전체');
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      '대기': 'status-waiting',
      '검토중': 'status-reviewing',
      '검토완료': 'status-review-complete',
      '검토반려': 'status-review-rejected',
      '검토보류': 'status-review-hold',
      '결제중': 'status-payment',
      '결제완료': 'status-payment-complete',
      '전체반려': 'status-rejected'
    };
    return statusMap[status] || 'status-default';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleWorkflowClick = (workflow: WorkflowInfoResponse) => {
    // 워크플로우 상세 정보 모달 열기
    setSelectedWorkflow(workflow);
    setIsDetailModalOpen(true);
  };

  const handleActionClick = (workflow: WorkflowInfoResponse, type: 'review' | 'payment', step: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflow(workflow);
    setActionType(type);
    setCurrentStep(step);
    setIsActionModalOpen(true);
  };

  const handleResubmit = (workflow: WorkflowInfoResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflow(workflow);
    setIsResubmitModalOpen(true);
  };
  
  const handleResubmitSuccess = async () => {
    // 모든 탭 데이터 새로고침
    const [requestedRes, pendingRes, completedRes] = await Promise.all([
      apiClient.getMyRequestedWorkflows(userEmail),
      apiClient.getMyPendingWorkflows({ userEmail }),
      apiClient.getCompletedWorkflows({ userEmail })
    ]);
    
    if (requestedRes.success && requestedRes.data) {
      setRequestedWorkflows(requestedRes.data);
    }
    if (pendingRes.success && pendingRes.data) {
      setPendingWorkflows(pendingRes.data);
    }
    if (completedRes.success && completedRes.data) {
      setCompletedWorkflows(completedRes.data);
    }
  };

  const handleActionSuccess = () => {
    // 액션 성공 시 모든 탭 데이터 갱신
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // 모든 탭의 데이터를 병렬로 로드
        const [requestedResponse, pendingResponse, completedResponse] = await Promise.all([
          apiClient.getMyRequestedWorkflows(userEmail),
          apiClient.getMyPendingWorkflows({
            userEmail
            // 상태 필터 제거: 검토중, 결재중 모두 포함
          }),
          apiClient.getCompletedWorkflows({
            userEmail
          })
        ]);

        if (requestedResponse.success && requestedResponse.data) {
          setRequestedWorkflows(requestedResponse.data);
        }
        if (pendingResponse.success && pendingResponse.data) {
          setPendingWorkflows(pendingResponse.data);
        }
        if (completedResponse.success && completedResponse.data) {
          setCompletedWorkflows(completedResponse.data);
        }
      } catch (error) {
        console.error('❌ 워크플로우 데이터 갱신 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  };

  const getMyPendingStep = (workflow: WorkflowInfoResponse): { type: 'review' | 'payment'; step: number; status?: string } | null => {
    const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const email = userInfo.email || userEmail;
    
    // 검토 라인 확인 (대기 또는 보류 상태)
    const reviewStep = workflow.reviewLine.find(r => 
      r.email === email && (r.status === '대기' || r.status === '보류')
    );
    if (reviewStep) {
      return { type: 'review', step: reviewStep.step, status: reviewStep.status };
    }
    
    // 결재 라인 확인 (대기 또는 보류 상태)
    const paymentStep = workflow.paymentLine.find(p => 
      p.email === email && (p.status === '대기' || p.status === '보류')
    );
    if (paymentStep) {
      return { type: 'payment', step: paymentStep.step, status: paymentStep.status };
    }
    
    return null;
  };

  const getHeldStep = (workflow: WorkflowInfoResponse): { type: 'review' | 'payment'; step: number } | null => {
    // 보류된 단계 찾기 (요청자가 재개 가능)
    const reviewHeldStep = workflow.reviewLine.find(r => r.status === '보류');
    if (reviewHeldStep) {
      return { type: 'review', step: reviewHeldStep.step };
    }
    
    const paymentHeldStep = workflow.paymentLine.find(p => p.status === '보류');
    if (paymentHeldStep) {
      return { type: 'payment', step: paymentHeldStep.step };
    }
    
    return null;
  };

  const workflows = getCurrentWorkflows();

  return (
    <div className="workflow-management-container">
      <div className="workflow-header">
        <div />
        <button 
          className="btn-new-workflow"
          onClick={() => {
            setSelectedDocument(null);
            setIsWorkflowModalOpen(true);
          }}
        >
          새 결재 요청
        </button>
      </div>

      <div className="search-filter-section">
        <div className="search-controls">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="제목, 요청자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="검색어 지우기"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="filter-controls">
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="btn-icon" />
              <span>필터 {showFilters ? '숨기기' : '보기'}</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">상태</label>
                <div className="select-container">
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-actions">
                <button className="btn-reset" onClick={handleResetFilters}>
                  필터 초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="workflow-tabs">
        <button
          className={`tab-btn ${activeTab === 'requested' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('requested');
            setSearchTerm('');
            setFilterStatus('전체');
          }}
        >
          내가 올린 결재 ({requestedWorkflows.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            setSearchTerm('');
            setFilterStatus('전체');
          }}
        >
          내가 결재해야 하는 것 ({pendingWorkflows.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('completed');
            setSearchTerm('');
            setFilterStatus('전체');
          }}
        >
          결재 완료된 리스트 ({completedWorkflows.length})
        </button>
      </div>

      <div className="workflow-content">
        {isLoading ? (
          <div className="loading-message">로딩 중...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="empty-message">
            {searchTerm || filterStatus !== '전체' 
              ? '검색 결과가 없습니다.' 
              : activeTab === 'requested' && '올린 결재가 없습니다.'}
            {!searchTerm && filterStatus === '전체' && activeTab === 'pending' && '결재해야 할 문서가 없습니다.'}
            {!searchTerm && filterStatus === '전체' && activeTab === 'completed' && '완료된 결재가 없습니다.'}
          </div>
        ) : (
          <div className="workflow-list">
            {filteredWorkflows.map((workflow) => {
              const myStep = activeTab === 'pending' ? getMyPendingStep(workflow) : null;
              const heldStep = activeTab === 'requested' && (workflow.workflowStatus === '검토보류' || workflow.workflowStatus === '결재보류') ? getHeldStep(workflow) : null;
              
              return (
                <div
                  key={workflow.workflowId}
                  className="workflow-card"
                  onClick={() => handleWorkflowClick(workflow)}
                >
                  <div className="workflow-card-header">
                    <h3 className="workflow-title">
                      {workflow.workflowDocumentTitle || 
                       workflow.attachedDocumentTitle || 
                       workflow.documentTitle || 
                       '제목 없음'}
                    </h3>
                    <span className={`status-badge ${getStatusBadgeClass(workflow.workflowStatus)}`}>
                      {workflow.workflowStatus}
                    </span>
                  </div>
                  <div className="workflow-card-body">
                    <div className="workflow-info-row">
                      <span className="info-label">요청자:</span>
                      <span className="info-value">{workflow.requesterName || workflow.requesterEmail}</span>
                    </div>
                    <div className="workflow-info-row">
                      <span className="info-label">요청일시:</span>
                      <span className="info-value">{formatDate(workflow.workflowRequestDate)}</span>
                    </div>
                    {workflow.workflowType === 'direct' && workflow.documentUrl && (
                      <div className="workflow-info-row">
                        <span className="info-label">문서:</span>
                        <a 
                          href={workflow.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="document-link"
                        >
                          문서 열기
                        </a>
                      </div>
                    )}
                    {workflow.workflowDocumentUrl && (
                      <div className="workflow-info-row">
                        <span className="info-label">결재 문서:</span>
                        <a 
                          href={workflow.workflowDocumentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="document-link"
                        >
                          결재 문서 열기
                        </a>
                      </div>
                    )}
                    {workflow.attachedDocumentUrl && (
                      <div className="workflow-info-row">
                        <span className="info-label">첨부 문서:</span>
                        <a 
                          href={workflow.attachedDocumentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="document-link"
                        >
                          첨부 문서 열기
                        </a>
                      </div>
                    )}
                    <div className="workflow-progress">
                      <div className="progress-item">
                        <span className="progress-label">검토:</span>
                        <span className="progress-value">
                          {workflow.reviewLine.filter(r => r.status === '승인').length} / {workflow.reviewLine.length}
                        </span>
                      </div>
                      <div className="progress-item">
                        <span className="progress-label">결재:</span>
                        <span className="progress-value">
                          {workflow.paymentLine.filter(p => p.status === '승인').length} / {workflow.paymentLine.length}
                        </span>
                      </div>
                    </div>
                    {activeTab === 'pending' && myStep && (
                      <div className="workflow-actions">
                        <button
                          className={`btn-action ${myStep.status === '보류' ? 'btn-resume' : 'btn-approve'}`}
                          onClick={(e) => handleActionClick(workflow, myStep.type, myStep.step, e)}
                          title={myStep.status === '보류' ? '보류된 결재 재개' : `${myStep.type === 'review' ? '검토' : '결재'} 처리`}
                        >
                          {myStep.status === '보류' ? '▶️ 재개' : `${myStep.type === 'review' ? '검토' : '결재'} 처리`}
                        </button>
                      </div>
                    )}
                    {activeTab === 'requested' && heldStep && (
                      <div className="workflow-actions">
                        <button
                          className="btn-action btn-resume"
                          onClick={(e) => handleActionClick(workflow, heldStep.type, heldStep.step, e)}
                          title="보류된 결재 재개"
                        >
                          ▶️ 재개
                        </button>
                      </div>
                    )}
                    {activeTab === 'requested' && 
                     (workflow.workflowStatus === '검토반려' || workflow.workflowStatus === '전체반려') &&
                     workflow.requesterEmail === userEmail && (
                      <div className="workflow-actions">
                        <button
                          className="btn-action btn-resubmit"
                          onClick={(e) => handleResubmit(workflow, e)}
                          title="반려된 결재 재제출"
                        >
                          🔄 재제출
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <WorkflowRequestModal
        isOpen={isWorkflowModalOpen}
        onClose={() => {
          setIsWorkflowModalOpen(false);
          setSelectedDocument(null);
        }}
        documentId={selectedDocument?.id}
        documentTitle={selectedDocument?.title}
        onSuccess={(response: WorkflowRequestResponse) => {
          console.log('✅ 결재 요청 성공:', response);
          // 모든 탭 데이터 갱신
          Promise.all([
            apiClient.getMyRequestedWorkflows(userEmail),
            apiClient.getMyPendingWorkflows({ userEmail }),
            apiClient.getCompletedWorkflows({ userEmail })
          ]).then(([requestedRes, pendingRes, completedRes]) => {
            if (requestedRes.success && requestedRes.data) {
              setRequestedWorkflows(requestedRes.data);
            }
            if (pendingRes.success && pendingRes.data) {
              setPendingWorkflows(pendingRes.data);
            }
            if (completedRes.success && completedRes.data) {
              setCompletedWorkflows(completedRes.data);
            }
          });
        }}
      />

      <WorkflowActionModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedWorkflow(null);
        }}
        workflow={selectedWorkflow}
        actionType={actionType}
        currentStep={currentStep}
        userEmail={userEmail}
        userName={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').name || '' : ''}
        onSuccess={handleActionSuccess}
      />

      <WorkflowDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedWorkflow(null);
        }}
        workflow={selectedWorkflow}
      />
      
      <WorkflowResubmitModal
        isOpen={isResubmitModalOpen}
        onClose={() => {
          setIsResubmitModalOpen(false);
          setSelectedWorkflow(null);
        }}
        workflow={selectedWorkflow}
        onSuccess={handleResubmitSuccess}
      />
    </div>
  );
};

export default WorkflowManagement;

