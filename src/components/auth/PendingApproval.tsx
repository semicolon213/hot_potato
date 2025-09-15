import React from 'react';
// 타입 정의
interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessToken?: string;
  googleAccessToken?: string;
}

interface PendingApprovalProps {
  user: User;
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ user, onLogout }) => {
  return (
    <div className="pending-approval">
      <div className="pending-card">
        <div className="pending-header">
          <img src="/src/assets/image/potato.png" alt="Hot Potato Logo" className="logo" />
          <h2>승인 대기 중</h2>
          <p>관리자 승인을 기다리고 있습니다.</p>
        </div>
        
        <div className="user-info">
          <p>
            <strong>이름:</strong>
            <span>{user.name}</span>
          </p>
          <p>
            <strong>이메일:</strong>
            <span>{user.email}</span>
          </p>
          <p>
            <strong>학번/교번:</strong>
            <span>{user.studentId}</span>
          </p>
          <p>
            <strong>구분:</strong>
            <span className={user.isAdmin ? 'admin' : 'user'}>
              {user.isAdmin ? '관리자 요청' : '일반 사용자'}
            </span>
          </p>
        </div>
        
        <div className="pending-actions">
          <button onClick={onLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
