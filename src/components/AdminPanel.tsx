import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

interface User {
  id: string;
  email: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailToSend, setEmailToSend] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 사용자 목록 가져오기 (실제로는 hp_member 스프레드시트에서 가져옴)
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getPendingUsers' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.users);
      } else {
        setMessage('사용자 목록을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      setMessage('사용자 목록을 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 승인
  const handleApproveUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setMessage('');
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approveUser',
          studentId: userId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('사용자가 승인되었습니다.');
        // 목록 새로고침
        fetchPendingUsers();
      } else {
        setMessage(result.error || '사용자 승인에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('사용자 승인 실패:', error);
      setMessage('사용자 승인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 거부
  const handleRejectUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setMessage('');
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'rejectUser',
          studentId: userId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('사용자가 거부되었습니다.');
        // 목록 새로고침
        fetchPendingUsers();
      } else {
        setMessage(result.error || '사용자 거부에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('사용자 거부 실패:', error);
      setMessage('사용자 거부에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 키 이메일 전송
  const handleSendAdminKey = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      if (!emailToSend) {
        setMessage('이메일을 입력해주세요.');
        return;
      }

      // Google 로그인한 사용자의 액세스 토큰 가져오기
      const auth2 = window.gapi.auth2.getAuthInstance();
      const googleUser = auth2.currentUser.get();
      const adminAccessToken = googleUser.getAuthResponse().access_token;
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: emailToSend,
          adminAccessToken: adminAccessToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('관리자 키가 이메일로 전송되었습니다!');
        setEmailToSend('');
      } else {
        setMessage('이메일 전송에 실패했습니다: ' + result.error);
      }
      
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      setMessage('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const pendingUsers = users.filter(user => !user.isApproved);
  const approvedUsers = users.filter(user => user.isApproved);

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>관리자 패널</h2>
        <p>사용자 승인 및 관리자 키 전송</p>
      </div>

      {/* 관리자 키 이메일 전송 섹션 */}
      <div className="admin-key-section">
        <h3>관리자 키 이메일 전송</h3>
        <div className="email-send-form">
          <input
            type="email"
            value={emailToSend}
            onChange={(e) => setEmailToSend(e.target.value)}
            placeholder="관리자 키를 받을 이메일 주소"
            className="email-input"
          />
          <button 
            onClick={handleSendAdminKey}
            disabled={isLoading || !emailToSend}
            className="send-key-btn"
          >
            {isLoading ? '전송 중...' : '관리자 키 전송'}
          </button>
        </div>
      </div>

      {/* 승인 대기 사용자 */}
      <div className="users-section">
        <h3>승인 대기 사용자 ({pendingUsers.length}명)</h3>
        {pendingUsers.length === 0 ? (
          <p className="no-users">승인 대기 중인 사용자가 없습니다.</p>
        ) : (
          <div className="users-list">
            {pendingUsers.map(user => (
              <div key={user.id} className="user-card pending">
                <div className="user-info">
                  <div className="user-email">{user.email}</div>
                  <div className="user-id">ID: {user.studentId}</div>
                  <div className="user-type">
                    {user.isAdmin ? '관리자 요청' : '일반 사용자'}
                  </div>
                  <div className="request-date">
                    요청일: {user.requestDate}
                  </div>
                </div>
                <div className="user-actions">
                  <button 
                    onClick={() => handleApproveUser(user.id)}
                    disabled={isLoading}
                    className="approve-btn"
                  >
                    승인
                  </button>
                  <button 
                    onClick={() => handleRejectUser(user.id)}
                    disabled={isLoading}
                    className="reject-btn"
                  >
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 승인된 사용자 */}
      <div className="users-section">
        <h3>승인된 사용자 ({approvedUsers.length}명)</h3>
        {approvedUsers.length === 0 ? (
          <p className="no-users">승인된 사용자가 없습니다.</p>
        ) : (
          <div className="users-list">
            {approvedUsers.map(user => (
              <div key={user.id} className="user-card approved">
                <div className="user-info">
                  <div className="user-email">{user.email}</div>
                  <div className="user-id">ID: {user.studentId}</div>
                  <div className="user-type">
                    {user.isAdmin ? '관리자' : '일반 사용자'}
                  </div>
                  <div className="request-date">
                    승인일: {user.requestDate}
                  </div>
                </div>
                <div className="user-status">
                  <span className="status-approved">✅ 승인됨</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`message ${message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
