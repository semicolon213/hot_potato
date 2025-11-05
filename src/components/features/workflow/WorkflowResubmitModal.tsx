/**
 * WorkflowResubmitModal.tsx
 * 결재 재제출 모달
 * 반려된 결재를 재제출할 때 결재 문서 내용과 결재 라인을 수정할 수 있는 모달
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../utils/api/apiClient';
import { NotificationModal } from '../../ui/NotificationModal';
import WorkflowEditor from './WorkflowEditor';
import type { ReviewLine, PaymentLine, WorkflowLineStep } from '../../../types/documents';
import type { WorkflowInfoResponse } from '../../../types/api/apiResponses';
import './WorkflowResubmitModal.css';

interface WorkflowResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowInfoResponse | null;
  onSuccess?: () => void;
}

interface User {
  email: string;
  name: string;
  userType?: string;
  isApproved?: boolean;
}

const WorkflowResubmitModal: React.FC<WorkflowResubmitModalProps> = ({
  isOpen,
  onClose,
  workflow,
  onSuccess
}) => {
  const [workflowTitle, setWorkflowTitle] = useState<string>('');
  const [workflowContent, setWorkflowContent] = useState<string>('');
  const [reviewLine, setReviewLine] = useState<ReviewLine>([]);
  const [paymentLine, setPaymentLine] = useState<PaymentLine>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiClient.getAllUsers();
        console.log('📋 사용자 목록 응답:', response);
        
        if (response.success && response.users && Array.isArray(response.users)) {
          const userList = response.users.filter((user: any) => {
            const isApproved = user.isApproved || user.Approval === 'O';
            return isApproved && user.email && user.name;
          }).map((user: any) => ({
            email: user.email || '',
            name: user.name || user.name_member || '',
            userType: user.userType || user.user_type || 'student',
            isApproved: user.isApproved || user.Approval === 'O'
          }));
          
          console.log('📋 필터링된 사용자 목록:', userList);
          setUsers(userList);
        }
      } catch (error) {
        console.error('❌ 사용자 목록 로드 오류:', error);
      }
    };
    
    if (isOpen && workflow) {
      loadUsers();
      // 기존 워크플로우 데이터로 초기화
      setWorkflowTitle(workflow.workflowDocumentTitle || '');
      setWorkflowContent(''); // 문서 내용은 별도로 불러와야 할 수도 있음
      setReviewLine(workflow.reviewLine || []);
      
      // 결재 라인에서 요청자 제외 (요청자는 자동으로 맨 앞에 추가되므로)
      const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const requesterEmail = userInfo.email || '';
      const filteredPaymentLine = (workflow.paymentLine || []).filter(p => p.email !== requesterEmail);
      setPaymentLine(filteredPaymentLine);
    }
  }, [isOpen, workflow]);

  // 모달 닫을 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setWorkflowTitle('');
      setWorkflowContent('');
      setReviewLine([]);
      setPaymentLine([]);
      setNotification(null);
    }
  }, [isOpen]);

  // 검토 라인 사용자 추가
  const addReviewUser = (user: User) => {
    const exists = reviewLine.some(r => r.email === user.email);
    if (exists) {
      setNotification({ message: '이미 추가된 사용자입니다.', type: 'error' });
      return;
    }
    
    const newStep: WorkflowLineStep = {
      step: reviewLine.length + 1,
      email: user.email,
      name: user.name,
      status: '대기',
      date: '',
      reason: '',
      opinion: ''
    };
    setReviewLine([...reviewLine, newStep]);
  };

  // 결재 라인 사용자 추가
  const addPaymentUser = (user: User) => {
    const exists = paymentLine.some(p => p.email === user.email);
    if (exists) {
      setNotification({ message: '이미 추가된 사용자입니다.', type: 'error' });
      return;
    }
    
    const newStep: WorkflowLineStep = {
      step: paymentLine.length + 1,
      email: user.email,
      name: user.name,
      status: '대기',
      date: '',
      reason: '',
      opinion: ''
    };
    setPaymentLine([...paymentLine, newStep]);
  };

  // 검토 라인에서 사용자 제거
  const removeReviewUser = (index: number) => {
    const newLine = reviewLine.filter((_, i) => i !== index);
    newLine.forEach((r, idx) => { r.step = idx + 1; });
    setReviewLine(newLine);
  };

  // 결재 라인에서 사용자 제거
  const removePaymentUser = (index: number) => {
    const newLine = paymentLine.filter((_, i) => i !== index);
    newLine.forEach((p, idx) => { p.step = idx + 1; });
    setPaymentLine(newLine);
  };

  const handleSubmit = async () => {
    if (!workflow) {
      setNotification({ message: '워크플로우 정보가 없습니다.', type: 'error' });
      return;
    }

    // 유효성 검사
    if (!workflowTitle.trim()) {
      setNotification({ message: '결재 문서 제목을 입력해주세요.', type: 'error' });
      return;
    }

    if (reviewLine.length === 0 || reviewLine.some(r => !r.email)) {
      setNotification({ message: '검토 라인을 모두 입력해주세요.', type: 'error' });
      return;
    }

    if (paymentLine.length === 0 || paymentLine.some(p => !p.email)) {
      setNotification({ message: '결재 라인을 모두 입력해주세요.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      
      const response = await apiClient.resubmitWorkflow({
        workflowId: workflow.workflowId,
        userEmail: userInfo.email,
        userName: userInfo.name || '',
        workflowTitle: workflowTitle,
        workflowContent: workflowContent,
        reviewLine: reviewLine.map(r => ({ step: r.step, email: r.email, name: r.name })),
        paymentLine: paymentLine.map(p => ({ step: p.step, email: p.email, name: p.name }))
      });

      if (response.success) {
        setNotification({ message: '결재가 성공적으로 재제출되었습니다.', type: 'success' });
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 1500);
      } else {
        setNotification({ message: response.message || '재제출 처리 중 오류가 발생했습니다.', type: 'error' });
      }
    } catch (error) {
      console.error('❌ 재제출 오류:', error);
      setNotification({ message: '재제출 처리 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !workflow) {
    return null;
  }

  return (
    <>
      <div className="document-modal-overlay" onClick={onClose}>
        <div className="document-modal-content workflow-resubmit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="document-modal-header">
            <h2>결재 재제출</h2>
            <button className="document-modal-close" onClick={onClose}>×</button>
          </div>

          <div className="workflow-resubmit-content">
            {/* 결재 문서 내용 수정 */}
            <div className="workflow-section">
              <h3>결재 문서 내용</h3>
              <div className="form-group">
                <label>문서 제목</label>
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  placeholder="결재 문서 제목"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>문서 내용</label>
                <WorkflowEditor
                  value={workflowContent}
                  onChange={setWorkflowContent}
                />
              </div>
            </div>

            {/* 검토 라인 설정 */}
            <div className="workflow-section">
              <h3>검토 라인</h3>
              <div className="added-users-list">
                {reviewLine.map((step, index) => (
                  <div key={index} className="added-user-item">
                    <span className="step-number-small">{step.step}</span>
                    <span className="user-info">{step.name} ({step.email})</span>
                    <button 
                      type="button"
                      className="btn-remove"
                      onClick={() => removeReviewUser(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="user-table-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>이메일</th>
                      <th>이름</th>
                      <th>구분</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr
                        key={idx}
                        className="user-table-row"
                        onDoubleClick={() => addReviewUser(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{user.email}</td>
                        <td>{user.name}</td>
                        <td>{user.userType === 'staff' ? '교직원' : '학생'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="help-text">더블클릭하여 검토자 추가</p>
              </div>
            </div>

            {/* 결재 라인 설정 */}
            <div className="workflow-section">
              <h3>결재 라인</h3>
              <div className="added-users-list">
                {paymentLine.map((step, index) => (
                  <div key={index} className="added-user-item">
                    <span className="step-number-small">{step.step}</span>
                    <span className="user-info">{step.name} ({step.email})</span>
                    <button 
                      type="button"
                      className="btn-remove"
                      onClick={() => removePaymentUser(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="user-table-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>이메일</th>
                      <th>이름</th>
                      <th>구분</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr
                        key={idx}
                        className="user-table-row"
                        onDoubleClick={() => addPaymentUser(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{user.email}</td>
                        <td>{user.name}</td>
                        <td>{user.userType === 'staff' ? '교직원' : '학생'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="help-text">더블클릭하여 결재자 추가</p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="workflow-resubmit-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '재제출'}
              </button>
            </div>
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

export default WorkflowResubmitModal;
