import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import './AdminPanel.css';

interface User {
  id: string;
  email: string;
  studentId: string;
  name: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
  approvalDate?: string | null;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailToSend, setEmailToSend] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  
  // useAuthStore에서 사용자 정보와 토큰 가져오기
  const { user } = useAuthStore();

  // 사용자 목록 가져오기 (실제로는 hp_member 스프레드시트에서 가져옴)
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // 이메일 전송 성공 후 상태 초기화
  useEffect(() => {
    if (emailStatus === 'success') {
      const timer = setTimeout(() => {
        setEmailStatus('idle');
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emailStatus]);

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
      
      if (result.success && Array.isArray(result.users)) {
        console.log('=== 사용자 목록 받음 ===');
        console.log('사용자 수:', result.users.length);
        console.log('사용자 목록:', result.users.map(user => ({
          id: user.id,
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          isApproved: user.isApproved
        })));
        setUsers(result.users);
      } else {
        setUsers([]); // 빈 배열로 초기화
        setMessage('사용자 목록을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      setUsers([]); // 오류 발생 시 빈 배열로 초기화
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
      
      const requestData = { 
        action: 'approveUser',
        studentId: userId
      };
      
      console.log('=== 승인 요청 데이터 ===');
      console.log('userId:', userId);
      console.log('requestData:', requestData);
      console.log('JSON.stringify:', JSON.stringify(requestData));
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
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
      
      const requestData = { 
        action: 'rejectUser',
        studentId: userId
      };
      
      console.log('=== 거부 요청 데이터 ===');
      console.log('userId:', userId);
      console.log('requestData:', requestData);
      console.log('JSON.stringify:', JSON.stringify(requestData));
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
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

  // 관리자 키 이메일 전송 (새로운 방식)
  const handleSendAdminKey = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      setEmailStatus('sending');
      
      if (!emailToSend) {
        setMessage('이메일을 입력해주세요.');
        setEmailStatus('error');
        return;
      }

      // useAuthStore에서 액세스 토큰 가져오기
      let adminAccessToken;
      try {
        // 1순위: useAuthStore의 user.googleAccessToken
        if (user?.googleAccessToken) {
          console.log('useAuthStore에서 토큰 발견:', user.googleAccessToken.substring(0, 20) + '...');
          adminAccessToken = user.googleAccessToken;
        } 
        // 2순위: localStorage에서 토큰 확인
        else {
          const storedToken = localStorage.getItem('googleAccessToken');
          if (storedToken) {
            console.log('localStorage에서 토큰 발견:', storedToken.substring(0, 20) + '...');
            adminAccessToken = storedToken;
          } else {
            // 3순위: gapi에서 직접 가져오기
            const auth2 = window.gapi.auth2.getAuthInstance();
            if (!auth2) {
              throw new Error('Google Auth2가 초기화되지 않았습니다.');
            }
            
            const googleUser = auth2.currentUser.get();
            if (!googleUser) {
              throw new Error('Google 사용자 정보를 가져올 수 없습니다.');
            }
            
            let authResponse = googleUser.getAuthResponse();
            
            // 토큰이 없거나 만료된 경우 갱신 시도
            if (!authResponse || !authResponse.access_token) {
              console.log('토큰이 없거나 만료됨, 갱신 시도...');
              try {
                await googleUser.reloadAuthResponse();
                authResponse = googleUser.getAuthResponse();
                console.log('토큰 갱신 완료');
              } catch (reloadError) {
                console.error('토큰 갱신 실패:', reloadError);
                throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
              }
            }
            
            if (!authResponse || !authResponse.access_token) {
              throw new Error('액세스 토큰을 가져올 수 없습니다.');
            }
            
            adminAccessToken = authResponse.access_token;
            console.log('액세스 토큰 길이:', adminAccessToken.length);
            console.log('토큰 만료 시간:', new Date(authResponse.expires_at));
          }
        }
      } catch (tokenError) {
        console.error('토큰 가져오기 실패:', tokenError);
        setMessage('Google 인증이 필요합니다. 다시 로그인해주세요.');
        setEmailStatus('error');
        return;
      }
      
      // 백엔드에서 복호화된 키와 이메일 템플릿 가져오기
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/sendAdminKeyEmail', {
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
      console.log('백엔드 응답:', result);
      
      if (result.success) {
        console.log('이메일 템플릿:', result.emailTemplate);
        
        // 이메일 템플릿을 사용하여 Gmail API로 이메일 전송
        try {
          await sendEmailWithGmailAPI(result.emailTemplate, adminAccessToken);
          setMessage('관리자 키가 이메일로 전송되었습니다!');
          setEmailToSend('');
          setEmailStatus('success');
        } catch (gmailError) {
          console.error('Gmail API 전송 실패:', gmailError);
          setMessage('Gmail API 전송에 실패했습니다: ' + gmailError.message);
          setEmailStatus('error');
        }
      } else {
        setMessage('이메일 전송에 실패했습니다: ' + result.error);
        setEmailStatus('error');
      }
      
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      setMessage('이메일 전송 중 오류가 발생했습니다.');
      setEmailStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Gmail API를 사용한 이메일 전송 함수
  const sendEmailWithGmailAPI = async (emailTemplate: any, accessToken: string) => {
    try {
      console.log('Gmail API로 이메일 전송 시작');
      console.log('emailTemplate:', emailTemplate);
      
      // emailTemplate 유효성 검사
      if (!emailTemplate) {
        throw new Error('이메일 템플릿이 없습니다.');
      }
      
      if (!emailTemplate.to) {
        throw new Error('이메일 수신자 주소가 없습니다.');
      }
      
      if (!emailTemplate.subject) {
        throw new Error('이메일 제목이 없습니다.');
      }
      
      if (!emailTemplate.html) {
        throw new Error('이메일 내용이 없습니다.');
      }
      
      console.log('이메일 정보:', {
        to: emailTemplate.to,
        subject: emailTemplate.subject,
        htmlLength: emailTemplate.html.length
      });
      
      // Gmail API가 초기화되었는지 확인
      if (!window.gapi || !window.gapi.client || !window.gapi.client.gmail) {
        throw new Error('Gmail API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
      }
      
      // Gmail API를 사용하여 이메일 전송
      const gmail = window.gapi.client.gmail;
      
      // 이메일 메시지 구성 (RFC 2822 형식)
      const message = [
        `To: ${emailTemplate.to}`,
        `Subject: ${emailTemplate.subjectEncoded || emailTemplate.subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        emailTemplate.html
      ].join('\r\n');
      
      // Base64 URL-safe 인코딩
      const encodedMessage = btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      console.log('인코딩된 메시지 길이:', encodedMessage.length);
      
      // Gmail API로 이메일 전송
      const request = gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage
        }
      });
      
      const response = await request;
      console.log('Gmail API 이메일 전송 완료:', response);
      
    } catch (error) {
      console.error('Gmail API 이메일 전송 실패:', error);
      throw error;
    }
  };

  const pendingUsers = users?.filter(user => !user.isApproved) || [];
  const approvedUsers = users?.filter(user => user.isApproved) || [];

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
            placeholder="📧 관리자 키를 받을 이메일 주소를 입력하세요"
            className="email-input"
          />
          <button 
            onClick={handleSendAdminKey}
            disabled={isLoading || !emailToSend}
            className={`send-key-btn ${emailStatus === 'sending' ? 'sending' : emailStatus === 'success' ? 'success' : emailStatus === 'error' ? 'error' : ''}`}
          >
            {isLoading ? '⏳ 전송 중...' : emailStatus === 'success' ? '✅ 전송 완료' : '🚀 관리자 키 전송'}
          </button>
        </div>
        {message && (
          <div className={`message ${emailStatus === 'success' ? 'success' : emailStatus === 'error' ? 'error' : ''}`}>
            {message}
          </div>
        )}
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
                  <div className="user-details">
                    <div className="user-name">{user.name || '이름 없음'}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.studentId}</div>
                    <div className="request-date">
                      요청일: {user.requestDate}
                    </div>
                  </div>
                  <div className="user-badge">
                    <div className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자 요청' : '일반 사용자'}
                    </div>
                  </div>
                </div>
                <div className="user-actions">
                  <button 
                    onClick={() => handleApproveUser(user.id)}
                    disabled={isLoading}
                    className="approve-btn"
                  >
                    ✅ 승인
                  </button>
                  <button 
                    onClick={() => handleRejectUser(user.id)}
                    disabled={isLoading}
                    className="reject-btn"
                  >
                    ❌ 거부
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
                  <div className="user-details">
                    <div className="user-name">{user.name || '이름 없음'}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.studentId}</div>
                    <div className="request-date">
                      승인일: {user.approvalDate || user.requestDate}
                    </div>
                  </div>
                  <div className="user-badge">
                    <div className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자' : '일반 사용자'}
                    </div>
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
