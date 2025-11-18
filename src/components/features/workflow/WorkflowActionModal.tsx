/**
 * WorkflowActionModal.tsx
 * 워크플로우 승인/반려/보류 모달
 */

import React, { useState } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import { NotificationModal } from '../../ui/NotificationModal';
import type { WorkflowInfoResponse } from '../../../types/api/apiResponses';
import './WorkflowActionModal.css';

interface WorkflowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowInfoResponse | null;
  actionType: 'review' | 'payment';
  currentStep: number;
  userEmail: string;
  userName: string;
  onSuccess?: () => void;
}

type Action = 'approve' | 'reject' | 'hold';

const WorkflowActionModal: React.FC<WorkflowActionModalProps> = ({
  isOpen,
  onClose,
  workflow,
  actionType,
  currentStep,
  userEmail,
  userName,
  onSuccess
}) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [opinion, setOpinion] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [holdReason, setHoldReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen || !workflow) return null;

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action);
    if (action !== 'reject') {
      setRejectReason('');
    }
    if (action !== 'hold') {
      setHoldReason('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction) {
      setNotification({ message: '처리 방식을 선택해주세요.', type: 'error' });
      return;
    }

    if (selectedAction === 'reject' && !rejectReason.trim()) {
      setNotification({ message: '반려 사유를 입력해주세요.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      const requestData = {
        workflowId: workflow.workflowId,
        documentId: workflow.documentId,
        workflowDocumentId: workflow.workflowDocumentId,
        userEmail: userEmail,
        userName: userName,
        step: currentStep,
        opinion: opinion || undefined,
        rejectReason: selectedAction === 'reject' ? rejectReason : undefined,
        holdReason: selectedAction === 'hold' ? holdReason : undefined
      };

      if (actionType === 'review') {
        if (selectedAction === 'approve') {
          response = await apiClient.approveReview(requestData);
        } else if (selectedAction === 'reject') {
          response = await apiClient.rejectReview(requestData);
        } else {
          response = await apiClient.holdReview(requestData);
        }
      } else {
        if (selectedAction === 'approve') {
          response = await apiClient.approvePayment(requestData);
        } else if (selectedAction === 'reject') {
          response = await apiClient.rejectPayment(requestData);
        } else {
          response = await apiClient.holdPayment(requestData);
        }
      }

      if (response.success) {
        setNotification({ 
          message: `${selectedAction === 'approve' ? '승인' : selectedAction === 'reject' ? '반려' : '보류'} 처리가 완료되었습니다.`, 
          type: 'success' 
        });
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          // 상태 초기화
          setSelectedAction(null);
          setOpinion('');
          setRejectReason('');
          setHoldReason('');
        }, 1500);
      } else {
        setNotification({ message: response.message || '처리 중 오류가 발생했습니다.', type: 'error' });
      }
    } catch (error) {
      console.error('❌ 워크플로우 액션 처리 오류:', error);
      setNotification({ message: '처리 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStepInfo = () => {
    if (actionType === 'review') {
      return workflow.reviewLine.find(r => r.step === currentStep && r.email === userEmail);
    } else {
      return workflow.paymentLine.find(p => p.step === currentStep && p.email === userEmail);
    }
  };

  const stepInfo = getCurrentStepInfo();
  const title = actionType === 'review' ? '검토' : '결재';
  
  // 보류 상태에서 재개 가능한지 확인
  const canResume = stepInfo?.status === '보류';

  return (
    <div className="document-modal-overlay" onClick={onClose}>
      <div className="document-modal-content workflow-action-modal" onClick={(e) => e.stopPropagation()}>
        <div className="document-modal-header">
          <div className="header-left">
            <h2>{title} 처리</h2>
            <p className="header-subtitle">
              {workflow.workflowDocumentTitle || workflow.documentTitle || '제목 없음'}
            </p>
          </div>
          <button className="document-modal-close" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>

        <div className="document-modal-body">
          <div className="workflow-action-info">
            <div className="info-section">
              <h4>문서 정보</h4>
              <div className="info-row">
                <span className="info-label">요청자:</span>
                <span className="info-value">{workflow.requesterName || workflow.requesterEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">요청일시:</span>
                <span className="info-value">{workflow.workflowRequestDate}</span>
              </div>
              {workflow.documentUrl && (
                <div className="info-row">
                  <span className="info-label">문서:</span>
                  <a href={workflow.documentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                    문서 열기
                  </a>
                </div>
              )}
              {workflow.workflowDocumentUrl && (
                <div className="info-row">
                  <span className="info-label">결재 문서:</span>
                  <a href={workflow.workflowDocumentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                    결재 문서 열기
                  </a>
                </div>
              )}
            </div>

            <div className="info-section">
              <h4>진행 상황</h4>
              <div className="progress-info">
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
            </div>

            {workflow.reviewLine && workflow.reviewLine.length > 0 && (
              <div className="info-section">
                <h4>검토 라인</h4>
                <div className="workflow-line">
                  {workflow.reviewLine
                    .sort((a, b) => a.step - b.step)
                    .map((step, index) => (
                      <div 
                        key={index} 
                        className={`line-step-item ${step.email === userEmail && step.step === currentStep && actionType === 'review' ? 'current' : ''} ${step.status === '승인' ? 'approved' : step.status === '반려' ? 'rejected' : step.status === '보류' ? 'held' : 'pending'}`}
                      >
                        <div className="step-number">{step.step}</div>
                        <div className="step-info">
                          <div className="step-name">{step.name || step.email}</div>
                          <div className="step-status">
                            {step.status === '승인' && <span className="status-badge approved">✓ 승인</span>}
                            {step.status === '반려' && <span className="status-badge rejected">✗ 반려</span>}
                            {step.status === '보류' && <span className="status-badge held">⏸ 보류</span>}
                            {step.status === '대기' && <span className="status-badge pending">○ 대기</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {workflow.paymentLine && workflow.paymentLine.length > 0 && (
              <div className="info-section">
                <h4>결재 라인</h4>
                <div className="workflow-line">
                  {workflow.paymentLine
                    .sort((a, b) => a.step - b.step)
                    .map((step, index) => (
                      <div 
                        key={index} 
                        className={`line-step-item ${step.email === userEmail && step.step === currentStep && actionType === 'payment' ? 'current' : ''} ${step.status === '승인' ? 'approved' : step.status === '반려' ? 'rejected' : step.status === '보류' ? 'held' : 'pending'}`}
                      >
                        <div className="step-number">{step.step}</div>
                        <div className="step-info">
                          <div className="step-name">{step.name || step.email}</div>
                          <div className="step-status">
                            {step.status === '승인' && <span className="status-badge approved">✓ 승인</span>}
                            {step.status === '반려' && <span className="status-badge rejected">✗ 반려</span>}
                            {step.status === '보류' && <span className="status-badge held">⏸ 보류</span>}
                            {step.status === '대기' && <span className="status-badge pending">○ 대기</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="action-selection">
            <h4>처리 방식 선택</h4>
            {canResume && (
              <div className="resume-notice">
                <p>⚠️ 이 단계는 현재 보류 상태입니다. 승인으로 재개할 수 있습니다.</p>
              </div>
            )}
            <div className="action-buttons">
              <button
                className={`action-btn ${selectedAction === 'approve' ? 'active approve' : ''}`}
                onClick={() => handleActionSelect('approve')}
                disabled={isLoading}
              >
                {canResume ? '▶️ 재개' : '✅ 승인'}
              </button>
              {!canResume && (
                <>
                  <button
                    className={`action-btn ${selectedAction === 'reject' ? 'active reject' : ''}`}
                    onClick={() => handleActionSelect('reject')}
                    disabled={isLoading}
                  >
                    ❌ 반려
                  </button>
                  <button
                    className={`action-btn ${selectedAction === 'hold' ? 'active hold' : ''}`}
                    onClick={() => handleActionSelect('hold')}
                    disabled={isLoading}
                  >
                    ⏸️ 보류
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedAction && (
            <div className="action-form">
              <div className="form-group">
                <label htmlFor="opinion">결재 의견 (선택사항)</label>
                <textarea
                  id="opinion"
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="결재 의견을 입력하세요..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {selectedAction === 'reject' && (
                <div className="form-group">
                  <label htmlFor="rejectReason">반려 사유 <span className="required">*</span></label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="반려 사유를 입력하세요..."
                    rows={3}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {selectedAction === 'hold' && (
                <div className="form-group">
                  <label htmlFor="holdReason">보류 사유 (선택사항)</label>
                  <textarea
                    id="holdReason"
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    placeholder="보류 사유를 입력하세요..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading || !selectedAction}
            >
              {isLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <NotificationModal
          isOpen={true}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default WorkflowActionModal;

