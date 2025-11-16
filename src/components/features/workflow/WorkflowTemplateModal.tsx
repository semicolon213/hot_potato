/**
 * WorkflowTemplateModal.tsx
 * 워크플로우 템플릿 관리 모달
 * 관리자만 템플릿 생성/수정/삭제 가능, 모든 사용자는 조회 및 사용 가능
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import { NotificationModal } from '../../ui/NotificationModal';
import type { ReviewLine, PaymentLine, WorkflowLineStep } from '../../../types/documents';
import type { WorkflowTemplatesListResponse, UsersListResponse } from '../../../types/api/apiResponses';
import './WorkflowTemplateModal.css';

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: {
    reviewLine: ReviewLine;
    paymentLine: PaymentLine;
  }) => void;
  isAdmin?: boolean;
}

interface WorkflowTemplate {
  templateId: string;
  templateName: string;
  documentTag: string;
  reviewLine: ReviewLine;
  paymentLine: PaymentLine;
  isDefault: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  description?: string;
}

const WorkflowTemplateModal: React.FC<WorkflowTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  isAdmin = false
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [templateName, setTemplateName] = useState<string>('');
  const [documentTag, setDocumentTag] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reviewLine, setReviewLine] = useState<ReviewLine>([]);
  const [paymentLine, setPaymentLine] = useState<PaymentLine>([]);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [users, setUsers] = useState<Array<{ email: string; name: string; userType?: string }>>([]);
  const [reviewSearchQuery, setReviewSearchQuery] = useState<string>('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('');

  // 템플릿 목록 로드
  useEffect(() => {
    if (isOpen && mode === 'list') {
      loadTemplates();
    }
  }, [isOpen, mode]);

  // 사용자 목록 로드 (템플릿 생성/수정 시 필요)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiClient.getAllUsers();
        if (response.success && response.users && Array.isArray(response.users)) {
          const usersResponse = response as UsersListResponse;
          const userList = usersResponse.users.filter((user) => {
            const isApproved = user.isApproved || user.Approval === 'O';
            return isApproved && user.email && (user.name || user.name_member);
          }).map((user) => ({
            email: user.email || '',
            name: user.name || user.name_member || '',
            userType: user.userType || user.user_type || 'student'
          }));
          setUsers(userList);
        }
      } catch (error) {
        console.error('❌ 사용자 목록 로드 오류:', error);
      }
    };
    
    if (isOpen && (mode === 'create' || mode === 'edit')) {
      loadUsers();
    }
  }, [isOpen, mode]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getWorkflowTemplates();
      if (response.success && response.data) {
        setTemplates(response.data.map(t => ({
          ...t,
          reviewLine: t.reviewLine.map((r: any) => ({
            step: r.step,
            email: r.email,
            name: r.name || '',
            status: '대기' as const
          })),
          paymentLine: t.paymentLine.map((p: any) => ({
            step: p.step,
            email: p.email,
            name: p.name || '',
            status: '대기' as const
          }))
        })));
      }
    } catch (error) {
      console.error('❌ 템플릿 목록 로드 오류:', error);
      setNotification({ message: '템플릿 목록을 불러오는데 실패했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setMode('create');
    setSelectedTemplate(null);
    setTemplateName('');
    setDocumentTag('');
    setDescription('');
    setReviewLine([]);
    setPaymentLine([]);
    setIsDefault(false);
    setReviewSearchQuery('');
    setPaymentSearchQuery('');
  };

  const handleEdit = (template: WorkflowTemplate) => {
    setMode('edit');
    setSelectedTemplate(template);
    setTemplateName(template.templateName);
    setDocumentTag(template.documentTag);
    setDescription(template.description || '');
    setReviewLine(template.reviewLine);
    setPaymentLine(template.paymentLine);
    setIsDefault(template.isDefault);
    setReviewSearchQuery('');
    setPaymentSearchQuery('');
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('템플릿을 삭제하시겠습니까?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.deleteWorkflowTemplate(templateId);
      if (response.success) {
        setNotification({ message: '템플릿이 삭제되었습니다.', type: 'success' });
        loadTemplates();
      } else {
        setNotification({ message: response.message || '템플릿 삭제에 실패했습니다.', type: 'error' });
      }
    } catch (error) {
      console.error('❌ 템플릿 삭제 오류:', error);
      setNotification({ message: '템플릿 삭제 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setNotification({ message: '템플릿 이름을 입력해주세요.', type: 'error' });
      return;
    }

    if (reviewLine.length === 0 && paymentLine.length === 0) {
      setNotification({ message: '검토 라인 또는 결재 라인을 설정해주세요.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (mode === 'create') {
        response = await apiClient.createWorkflowTemplate({
          templateName,
          documentTag,
          reviewLine: reviewLine.map(r => ({ step: r.step, email: r.email, name: r.name })),
          paymentLine: paymentLine.map(p => ({ step: p.step, email: p.email, name: p.name })),
          isDefault,
          description
        });
      } else {
        if (!selectedTemplate) return;
        response = await apiClient.updateWorkflowTemplate({
          templateId: selectedTemplate.templateId,
          templateName,
          documentTag,
          reviewLine: reviewLine.map(r => ({ step: r.step, email: r.email, name: r.name })),
          paymentLine: paymentLine.map(p => ({ step: p.step, email: p.email, name: p.name })),
          isDefault,
          description
        });
      }

      if (response.success) {
        setNotification({ message: mode === 'create' ? '템플릿이 생성되었습니다.' : '템플릿이 수정되었습니다.', type: 'success' });
        setMode('list');
        loadTemplates();
      } else {
        setNotification({ message: response.message || '템플릿 저장에 실패했습니다.', type: 'error' });
      }
    } catch (error) {
      console.error('❌ 템플릿 저장 오류:', error);
      setNotification({ message: '템플릿 저장 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (template: WorkflowTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate({
        reviewLine: template.reviewLine,
        paymentLine: template.paymentLine
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content workflow-template-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              {mode === 'list' && '결재 라인 템플릿 관리'}
              {mode === 'create' && '템플릿 생성'}
              {mode === 'edit' && '템플릿 수정'}
            </h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {mode === 'list' && (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: 'var(--text-medium)' }}>
                    {isAdmin ? '템플릿을 생성, 수정, 삭제할 수 있습니다.' : '템플릿을 선택하여 사용할 수 있습니다.'}
                  </p>
                  {isAdmin && (
                    <button
                      className="btn-primary"
                      onClick={handleCreate}
                      style={{ padding: '8px 16px' }}
                    >
                      + 템플릿 생성
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
                ) : templates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-medium)' }}>
                    템플릿이 없습니다.
                  </div>
                ) : (
                  <div className="template-list">
                    {templates.map((template) => (
                      <div key={template.templateId} className="template-item">
                        <div className="template-header">
                          <h3>{template.templateName}</h3>
                          {template.isDefault && <span className="badge-default">기본</span>}
                        </div>
                        {template.description && (
                          <p className="template-description">{template.description}</p>
                        )}
                        <div className="template-info">
                          <span>태그: {template.documentTag || '없음'}</span>
                          <span>검토: {template.reviewLine.length}단계</span>
                          <span>결재: {template.paymentLine.length}단계</span>
                        </div>
                        <div className="template-actions">
                          {onSelectTemplate && (
                            <button
                              className="btn-select"
                              onClick={() => handleSelect(template)}
                            >
                              선택
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                className="btn-edit"
                                onClick={() => handleEdit(template)}
                              >
                                수정
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(template.templateId)}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {(mode === 'create' || mode === 'edit') && (
              <div className="template-form">
                {/* 기본 정보 섹션 */}
                <div className="form-section">
                  <h3 className="form-section-title">기본 정보</h3>
                  <div className="form-section-content">
                    <div className="form-group">
                      <label>템플릿 이름 *</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="템플릿 이름을 입력하세요"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>문서 태그</label>
                        <input
                          type="text"
                          value={documentTag}
                          onChange={(e) => setDocumentTag(e.target.value)}
                          placeholder="적용할 문서 태그 (선택사항)"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 0, minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                          <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            style={{ marginRight: '8px', marginTop: 0 }}
                          />
                          기본 템플릿으로 설정
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>설명</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="템플릿 설명 (선택사항)"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* 검토 라인 및 결재 라인 설정 - 좌우 배치 */}
                <div className="form-section lines-section">
                  <div className="lines-container">
                    {/* 검토 라인 설정 */}
                    <div className="line-section-half">
                      <div className="form-section-title-row">
                        <h3 className="form-section-title">검토 라인 *</h3>
                        {reviewLine.length > 0 && (
                          <span className="line-count-badge">{reviewLine.length}단계</span>
                        )}
                      </div>
                      <div className="form-section-content">
                        {reviewLine.length > 0 && (
                          <div className="added-users-section">
                            <div className="added-users-label">추가된 검토자</div>
                            <div className="added-users-list">
                              {reviewLine.map((step, index) => (
                                <div key={index} className="added-user-item">
                                  <span className="step-number-small">{step.step}</span>
                                  <span className="user-info">{step.name} ({step.email})</span>
                                  <button
                                    type="button"
                                    className="btn-remove-step"
                                    onClick={() => {
                                      const newLine = reviewLine.filter((_, i) => i !== index);
                                      setReviewLine(newLine.map((s, i) => ({ ...s, step: i + 1 })));
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="user-table-container">
                          <div className="user-table-header">
                            <span>회원 목록</span>
                            <span className="user-count">
                              {users.filter(u => {
                                const isNotInLine = !reviewLine.some(r => r.email === u.email);
                                const matchesSearch = !reviewSearchQuery || 
                                  u.name.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
                                  u.email.toLowerCase().includes(reviewSearchQuery.toLowerCase());
                                return isNotInLine && matchesSearch;
                              }).length}명
                            </span>
                          </div>
                          <div className="user-search-container">
                            <input
                              type="text"
                              className="user-search-input"
                              placeholder="이름 또는 이메일로 검색..."
                              value={reviewSearchQuery}
                              onChange={(e) => setReviewSearchQuery(e.target.value)}
                            />
                          </div>
                          <div className="user-table">
                            <div className="user-table-row user-table-header-row">
                              <div className="user-table-cell" style={{ width: '50px' }}>#</div>
                              <div className="user-table-cell" style={{ flex: 1 }}>이름</div>
                              <div className="user-table-cell" style={{ flex: 2 }}>이메일</div>
                            </div>
                            {users
                              .filter(u => {
                                const isNotInLine = !reviewLine.some(r => r.email === u.email);
                                const matchesSearch = !reviewSearchQuery || 
                                  u.name.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
                                  u.email.toLowerCase().includes(reviewSearchQuery.toLowerCase());
                                return isNotInLine && matchesSearch;
                              })
                              .map((user, index) => (
                                <div
                                  key={user.email}
                                  className="user-table-row user-table-data-row"
                                  onDoubleClick={() => {
                                    const maxStep = reviewLine.length > 0 ? Math.max(...reviewLine.map(r => r.step)) : 0;
                                    const newStep: WorkflowLineStep = {
                                      step: maxStep + 1,
                                      email: user.email,
                                      name: user.name,
                                      status: '대기'
                                    };
                                    setReviewLine([...reviewLine, newStep]);
                                  }}
                                >
                                  <div className="user-table-cell" style={{ width: '50px' }}>{index + 1}</div>
                                  <div className="user-table-cell" style={{ flex: 1 }}>{user.name}</div>
                                  <div className="user-table-cell" style={{ flex: 2 }}>{user.email}</div>
                                </div>
                              ))}
                            {users.filter(u => {
                              const isNotInLine = !reviewLine.some(r => r.email === u.email);
                              const matchesSearch = !reviewSearchQuery || 
                                u.name.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
                                u.email.toLowerCase().includes(reviewSearchQuery.toLowerCase());
                              return isNotInLine && matchesSearch;
                            }).length === 0 && (
                              <div className="user-table-row">
                                <div className="user-table-cell" style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
                                  {reviewSearchQuery ? '검색 결과가 없습니다.' : '추가할 수 있는 회원이 없습니다.'}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="user-table-hint">
                            💡 회원을 더블클릭하여 검토 라인에 추가하세요
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 결재 라인 설정 */}
                    <div className="line-section-half">
                      <div className="form-section-title-row">
                        <h3 className="form-section-title">결재 라인 *</h3>
                        {paymentLine.length > 0 && (
                          <span className="line-count-badge">{paymentLine.length}단계</span>
                        )}
                      </div>
                      <div className="form-section-content">
                        {paymentLine.length > 0 && (
                          <div className="added-users-section">
                            <div className="added-users-label">추가된 결재자</div>
                            <div className="added-users-list">
                              {paymentLine.map((step, index) => (
                                <div key={index} className="added-user-item">
                                  <span className="step-number-small">{step.step}</span>
                                  <span className="user-info">{step.name} ({step.email})</span>
                                  <button
                                    type="button"
                                    className="btn-remove-step"
                                    onClick={() => {
                                      const newLine = paymentLine.filter((_, i) => i !== index);
                                      setPaymentLine(newLine.map((s, i) => ({ ...s, step: i + 1 })));
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="user-table-container">
                          <div className="user-table-header">
                            <span>회원 목록</span>
                            <span className="user-count">
                              {users.filter(u => {
                                const isNotInLine = !paymentLine.some(p => p.email === u.email);
                                const matchesSearch = !paymentSearchQuery || 
                                  u.name.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                                  u.email.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                                return isNotInLine && matchesSearch;
                              }).length}명
                            </span>
                          </div>
                          <div className="user-search-container">
                            <input
                              type="text"
                              className="user-search-input"
                              placeholder="이름 또는 이메일로 검색..."
                              value={paymentSearchQuery}
                              onChange={(e) => setPaymentSearchQuery(e.target.value)}
                            />
                          </div>
                          <div className="user-table">
                            <div className="user-table-row user-table-header-row">
                              <div className="user-table-cell" style={{ width: '50px' }}>#</div>
                              <div className="user-table-cell" style={{ flex: 1 }}>이름</div>
                              <div className="user-table-cell" style={{ flex: 2 }}>이메일</div>
                            </div>
                            {users
                              .filter(u => {
                                const isNotInLine = !paymentLine.some(p => p.email === u.email);
                                const matchesSearch = !paymentSearchQuery || 
                                  u.name.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                                  u.email.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                                return isNotInLine && matchesSearch;
                              })
                              .map((user, index) => (
                                <div
                                  key={user.email}
                                  className="user-table-row user-table-data-row"
                                  onDoubleClick={() => {
                                    const maxStep = paymentLine.length > 0 ? Math.max(...paymentLine.map(p => p.step)) : 0;
                                    const newStep: WorkflowLineStep = {
                                      step: maxStep + 1,
                                      email: user.email,
                                      name: user.name,
                                      status: '대기'
                                    };
                                    setPaymentLine([...paymentLine, newStep]);
                                  }}
                                >
                                  <div className="user-table-cell" style={{ width: '50px' }}>{index + 1}</div>
                                  <div className="user-table-cell" style={{ flex: 1 }}>{user.name}</div>
                                  <div className="user-table-cell" style={{ flex: 2 }}>{user.email}</div>
                                </div>
                              ))}
                            {users.filter(u => {
                              const isNotInLine = !paymentLine.some(p => p.email === u.email);
                              const matchesSearch = !paymentSearchQuery || 
                                u.name.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                                u.email.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                              return isNotInLine && matchesSearch;
                            }).length === 0 && (
                              <div className="user-table-row">
                                <div className="user-table-cell" style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
                                  {paymentSearchQuery ? '검색 결과가 없습니다.' : '추가할 수 있는 회원이 없습니다.'}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="user-table-hint">
                            💡 회원을 더블클릭하여 결재 라인에 추가하세요
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setMode('list')}
                    disabled={isLoading}
                  >
                    취소
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default WorkflowTemplateModal;

