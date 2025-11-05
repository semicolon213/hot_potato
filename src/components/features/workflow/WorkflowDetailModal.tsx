/**
 * WorkflowDetailModal.tsx
 * 워크플로우 상세 정보 모달 (읽기 전용)
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import type { WorkflowInfoResponse } from '../../../types/api/apiResponses';
import './WorkflowDetailModal.css';

interface WorkflowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowInfoResponse | null;
}

interface WorkflowHistoryItem {
  historyId: string;
  workflowId: string;
  lineType: string;
  stepNumber: number;
  actionType: string;
  actorEmail: string;
  actorName: string;
  actionDate: string;
  opinion?: string;
  rejectReason?: string;
  previousStatus?: string;
  newStatus?: string;
}

const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({
  isOpen,
  onClose,
  workflow
}) => {
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  // 히스토리 로드
  useEffect(() => {
    if (isOpen && workflow && (workflow.workflowStatus === '결재완료' || workflow.workflowStatus === '검토반려' || workflow.workflowStatus === '전체반려')) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [isOpen, workflow]);
  
  const loadHistory = async () => {
    if (!workflow) return;
    
    if (!workflow.workflowId) {
      console.error('❌ workflowId가 없습니다:', workflow);
      return;
    }
    
    console.log('📋 히스토리 로드 시작:', { workflowId: workflow.workflowId });
    setIsLoadingHistory(true);
    try {
      const response = await apiClient.getWorkflowHistory({
        workflowId: workflow.workflowId
      });
      
      console.log('📋 히스토리 응답:', response);
      
      if (response.success && response.data) {
        setHistory(response.data as WorkflowHistoryItem[]);
      } else {
        console.warn('⚠️ 히스토리 응답 실패:', response.message);
      }
    } catch (error) {
      console.error('❌ 히스토리 로드 오류:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  if (!isOpen || !workflow) return null;

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

  // 첨부 문서 목록 파싱 (여러 개일 수 있음)
  const attachedDocIds = workflow.attachedDocumentIds || (workflow.attachedDocumentId ? [workflow.attachedDocumentId] : []);
  const attachedDocUrls = workflow.attachedDocumentUrls || (workflow.attachedDocumentUrl ? [workflow.attachedDocumentUrl] : []);
  const attachedDocTitles = workflow.attachedDocumentTitles || (workflow.attachedDocumentTitle ? [workflow.attachedDocumentTitle] : []);

  return (
    <div className="document-modal-overlay" onClick={onClose}>
      <div className="document-modal-content workflow-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="document-modal-header">
          <div className="header-left">
            <h2>결재 상세 정보</h2>
            <p className="header-subtitle">
              {workflow.workflowDocumentTitle || workflow.attachedDocumentTitle || workflow.documentTitle || '제목 없음'}
            </p>
          </div>
          <button className="document-modal-close" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>

        <div className="document-modal-body">
          <div className="workflow-detail-info">
            <div className="info-section">
              <h4>문서 정보</h4>
              <div className="info-row">
                <span className="info-label">요청자:</span>
                <span className="info-value">{workflow.requesterName || workflow.requesterEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">요청일시:</span>
                <span className="info-value">{formatDate(workflow.workflowRequestDate)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">상태:</span>
                <span className={`status-badge ${getStatusBadgeClass(workflow.workflowStatus)}`}>
                  {workflow.workflowStatus}
                </span>
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
              {attachedDocUrls.length > 0 && (
                <div className="info-row">
                  <span className="info-label">첨부 문서:</span>
                  <div className="attached-docs-list">
                    {attachedDocUrls.map((url, index) => (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="document-link"
                      >
                        {attachedDocTitles[index] || `첨부 문서 ${index + 1}`} 열기
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {workflow.workflowCompleteDate && (
                <div className="info-row">
                  <span className="info-label">완료일시:</span>
                  <span className="info-value">{formatDate(workflow.workflowCompleteDate)}</span>
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
                        className={`line-step-item ${step.status === '승인' ? 'approved' : step.status === '반려' ? 'rejected' : step.status === '보류' ? 'held' : 'pending'}`}
                      >
                        <div className="step-number">{step.step}</div>
                        <div className="step-info">
                          <div className="step-name">{step.name || step.email}</div>
                          <div className="step-status">
                            {step.status === '승인' && (
                              <>
                                <span className="status-badge approved">✓ 승인</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '반려' && (
                              <>
                                <span className="status-badge rejected">✗ 반려</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '보류' && (
                              <>
                                <span className="status-badge held">⏸ 보류</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '대기' && <span className="status-badge pending">○ 대기</span>}
                          </div>
                          {step.opinion && (
                            <div className="step-opinion">
                              <span className="opinion-label">의견:</span>
                              <span className="opinion-text">{step.opinion}</span>
                            </div>
                          )}
                          {step.reason && (
                            <div className="step-reason">
                              <span className="reason-label">사유:</span>
                              <span className="reason-text">{step.reason}</span>
                            </div>
                          )}
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
                        className={`line-step-item ${step.status === '승인' ? 'approved' : step.status === '반려' ? 'rejected' : step.status === '보류' ? 'held' : 'pending'}`}
                      >
                        <div className="step-number">{step.step}</div>
                        <div className="step-info">
                          <div className="step-name">{step.name || step.email}</div>
                          <div className="step-status">
                            {step.status === '승인' && (
                              <>
                                <span className="status-badge approved">✓ 승인</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '반려' && (
                              <>
                                <span className="status-badge rejected">✗ 반려</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '보류' && (
                              <>
                                <span className="status-badge held">⏸ 보류</span>
                                {step.date && <span className="step-date">{formatDate(step.date)}</span>}
                              </>
                            )}
                            {step.status === '대기' && <span className="status-badge pending">○ 대기</span>}
                          </div>
                          {step.opinion && (
                            <div className="step-opinion">
                              <span className="opinion-label">의견:</span>
                              <span className="opinion-text">{step.opinion}</span>
                            </div>
                          )}
                          {step.reason && (
                            <div className="step-reason">
                              <span className="reason-label">사유:</span>
                              <span className="reason-text">{step.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 결재 진행 과정 (히스토리) - 결재 완료된 경우만 표시 */}
            {(workflow.workflowStatus === '결재완료' || workflow.workflowStatus === '검토반려' || workflow.workflowStatus === '전체반려') && (
              <div className="info-section">
                <h4>결재 진행 과정</h4>
                {isLoadingHistory ? (
                  <div className="loading-message">히스토리를 불러오는 중...</div>
                ) : history.length === 0 ? (
                  <div className="empty-message">히스토리 정보가 없습니다.</div>
                ) : (
                  <div className="workflow-history">
                    {history.map((item, index) => (
                      <div key={item.historyId || index} className="history-item">
                        <div className="history-header">
                          <span className="history-date">{formatDate(item.actionDate)}</span>
                          <span className={`history-action history-action-${item.actionType}`}>
                            {item.actionType === '요청' && '📋 요청'}
                            {item.actionType === '승인' && '✓ 승인'}
                            {item.actionType === '반려' && '✗ 반려'}
                            {item.actionType === '보류' && '⏸ 보류'}
                            {item.actionType === '재제출' && '🔄 재제출'}
                            {!['요청', '승인', '반려', '보류', '재제출'].includes(item.actionType) && item.actionType}
                          </span>
                        </div>
                        <div className="history-content">
                          <div className="history-actor">
                            <span className="actor-name">{item.actorName || item.actorEmail}</span>
                            {item.lineType === 'review' && (
                              <span className="line-type-badge">검토 {item.stepNumber}</span>
                            )}
                            {item.lineType === 'payment' && (
                              <span className="line-type-badge">결재 {item.stepNumber}</span>
                            )}
                          </div>
                          {item.opinion && item.actionType !== '재제출' && (() => {
                            // JSON 문자열인지 확인 (재제출 관련 설정값 제외)
                            try {
                              const parsed = JSON.parse(item.opinion);
                              // JSON이지만 재제출 관련 설정값이면 표시하지 않음
                              if (parsed && typeof parsed === 'object' && (parsed.previousReviewLine || parsed.newReviewLine || parsed.previousPaymentLine || parsed.newPaymentLine)) {
                                return null;
                              }
                              // 일반 JSON은 표시하지 않음
                              if (parsed && typeof parsed === 'object') {
                                return null;
                              }
                            } catch {
                              // JSON이 아니면 일반 텍스트로 표시
                            }
                            // 일반 텍스트 의견만 표시
                            return (
                              <div className="history-opinion">
                                <span className="opinion-label">의견:</span>
                                <span className="opinion-text">{item.opinion}</span>
                              </div>
                            );
                          })()}
                          {item.rejectReason && (
                            <div className="history-reason">
                              <span className="reason-label">반려 사유:</span>
                              <span className="reason-text">{item.rejectReason}</span>
                            </div>
                          )}
                          {item.previousStatus && item.newStatus && (
                            <div className="history-status-change">
                              <span className="status-label">상태 변경:</span>
                              <span className="status-from">{item.previousStatus}</span>
                              <span className="status-arrow">→</span>
                              <span className="status-to">{item.newStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetailModal;

