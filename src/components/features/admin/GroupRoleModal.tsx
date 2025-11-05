import React, { useState } from 'react';
import './GroupRoleModal.css';

interface GroupRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string;
    userType: string; // 현재 user_type
    user_type?: string; // Apps Script 원본 필드 (옵셔널)
  };
  onApprove: (studentId: string, groupRole: string) => void;
  isLoading?: boolean;
}

const GROUP_ROLES = [
  { value: 'student', label: '학생', description: '뜨거운 감자 학생 그룹' },
  { value: 'std_council', label: '집행부', description: '뜨거운 감자 집행부 그룹' },
  { value: 'supp', label: '조교', description: '뜨거운 감자 조교 그룹' },
  { value: 'professor', label: '교수', description: '뜨거운 감자 교수 그룹' },
  { value: 'ad_professor', label: '겸임교원', description: '뜨거운 감자 겸임 교원' }
];

const GroupRoleModal: React.FC<GroupRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onApprove,
  isLoading = false
}) => {
  const [selectedRole, setSelectedRole] = useState(user.userType || user.user_type);
  const [debugInfo, setDebugInfo] = useState('');

  // user.userType 또는 user.user_type이 변경되면 selectedRole도 업데이트
  React.useEffect(() => {
    const actualUserType = user.userType || user.user_type;
    if (actualUserType) {
      setSelectedRole(actualUserType);
    }
    
    // 디버깅 정보를 상태로 저장
    const debug = `받은 user 데이터: ${JSON.stringify(user)}\nuser.userType: ${user.userType}\nuser.user_type: ${user.user_type}\n현재 selectedRole: ${actualUserType}`;
    setDebugInfo(debug);
  }, [user]);

  const handleApprove = () => {
    onApprove(user.studentId, selectedRole);
    onClose();
  };

  const handleClose = () => {
    setSelectedRole(user.userType || user.user_type);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="group-role-modal-overlay">
      <div className="group-role-modal">
        <div className="group-role-modal-header">
          <h3>사용자 승인 및 그룹스 권한 설정</h3>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="group-role-modal-content">
          <div className="user-info-section">
            <h4>사용자 정보</h4>
            <div className="user-info-grid">
              <div className="info-item">
                <span className="label">이름:</span>
                <span className="value">{user.name}</span>
              </div>
              <div className="info-item">
                <span className="label">이메일:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="label">학번:</span>
                <span className="value">{user.studentId}</span>
              </div>
              <div className="info-item">
                <span className="label">요청 권한:</span>
                <span className="value">
                  {GROUP_ROLES.find(role => role.value === (user.userType || user.user_type))?.label || '학생'}
                </span>
              </div>
            </div>
          </div>

          <div className="group-role-section">
            <h4>가입유형 수정</h4>
            <p className="description">
              사용자의 가입유형을 확인하고 필요시 수정해주세요. 수정된 권한으로 그룹스 관리자에게 알림이 전송됩니다.
            </p>
            
            <div className="role-selector">
              <label htmlFor="roleSelect">가입유형:</label>
              <select
                id="roleSelect"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="role-dropdown"
                disabled={isLoading}
              >
                {GROUP_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 선택한 권한에 따른 그룹스 배정 확인 메시지 */}
            <div className="assignment-confirmation">
              <h5>📧 그룹스 배정 확인</h5>
              <div className="confirmation-info">
                <p><strong>선택된 권한:</strong> {GROUP_ROLES.find(role => role.value === selectedRole)?.label}</p>
                <p><strong>배정될 그룹스:</strong> {GROUP_ROLES.find(role => role.value === selectedRole)?.description}</p>
                <p><strong>알림 대상:</strong> 해당 그룹스 관리자에게 자동으로 멤버 추가 요청 이메일이 전송됩니다.</p>
              </div>
            </div>

            {/* 디버깅 정보 (개발용) */}
            {/* <div className="debug-info" style={{marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px', fontSize: '12px'}}>
              <h6>🔍 디버깅 정보:</h6>
              <pre style={{whiteSpace: 'pre-wrap', margin: 0}}>{debugInfo}</pre>
            </div> */}
          </div>
        </div>

        <div className="group-role-modal-footer">
          <button 
            className="cancel-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            취소
          </button>
          <button 
            className="approve-btn"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '승인 및 그룹스 추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupRoleModal;
