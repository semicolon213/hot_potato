import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../hooks/useAuthStore';
import './Login.css';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // useAuthStore에서 setGoogleToken 함수 가져오기
  const { setGoogleToken } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        console.log('Google 로그인 성공:', tokenResponse);
        // access_token을 localStorage에 저장
        localStorage.setItem('googleAccessToken', tokenResponse.access_token);
        
        // useAuthStore에도 토큰 저장
        setGoogleToken(tokenResponse.access_token);

        // 사용자 정보 가져오기
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await userInfoResponse.json();
        const email = profile.email;
        const name = profile.name;

        console.log('사용자 이메일:', email);
        console.log('사용자 이름:', name);
        setUserEmail(email);
        setError('');

        // 사용자 등록 상태 확인
        await checkUserRegistrationStatus(email, name, tokenResponse.access_token);

      } catch (error) {
        console.error('Google 로그인 처리 실패:', error);
        setError('Google 로그인 처리 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      console.log('Login Failed');
      setError('Google 로그인에 실패했습니다.');
    },
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents profile email',
  });


  // 사용자 등록 상태 확인 (새로운 API 사용)
  const checkUserRegistrationStatus = async (email: string, name: string, accessToken: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const result = await response.json();
      console.log('사용자 등록 상태 확인 응답:', result);

      if (result.success) {
        if (result.isRegistered && result.isApproved) {
          // 이미 승인된 회원 - 바로 메인 화면으로
          console.log('이미 승인된 회원 - 메인 화면으로 이동');
          alert('이미 가입된 회원입니다. 로그인을 진행합니다.');
          onLogin({
            email: email,
            name: name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: true,
            accessToken: accessToken
          });
        } else if (result.isRegistered && !result.isApproved) {
          // 승인 대기 중 - 승인 대기 화면으로
          console.log('승인 대기 중인 사용자');
          alert('가입 요청이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.');
          onLogin({
            email: email,
            name: name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: false
          });
        } else {
          // 새로운 사용자 - 회원가입 화면 표시
          console.log('새로운 사용자 - 회원가입 화면 표시');
          setIsLoggedIn(true);
        }
      } else {
        // 오류 발생 - 회원가입 화면 표시
        console.log('오류 발생 - 회원가입 화면 표시');
        setIsLoggedIn(true);
      }

    } catch (error) {
      console.error('사용자 등록 상태 확인 실패:', error);
      setError('사용자 상태 확인 중 오류가 발생했습니다.');
      // 오류 시 회원가입 화면 표시
      setIsLoggedIn(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 키 인증
  const handleVerifyAdminKey = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: adminKey
        })
      });

      const result = await response.json();

      if (result.success && result.isValid) {
        setIsAdminVerified(true);
        setError('');
      } else {
        setError('관리자 키가 일치하지 않습니다.');
        setIsAdminVerified(false);
      }

    } catch (error) {
      console.error('키 검증 실패:', error);
      setError('키 검증 중 오류가 발생했습니다.');
      setIsAdminVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 요청
  const handleSignupRequest = async () => {
    try {
      setIsLoading(true);
      setError('');

      // access token을 사용하여 사용자 이름 다시 가져오기 (더 안정적)
      const accessToken = localStorage.getItem('googleAccessToken');
      let userName = '';
      if (accessToken) {
        try {
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profile = await userInfoResponse.json();
          userName = profile.name || '';
        } catch (e) {
          console.error('사용자 정보 가져오기 실패:', e);
        }
      }

      const signupData = {
        userEmail: userEmail,
        userName: userName,
        studentId: studentId,
        isAdminVerified: isAdminVerified,
      };

      console.log('회원가입 요청:', signupData);

      // 실제 서버로 회원가입 요청 전송
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/dailyKeyUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      });

      const result = await response.json();
      console.log('회원가입 응답:', result);

      if (result.success) {
        // 회원가입 성공 - 승인 대기 상태로 로그인
        alert('회원가입 요청이 성공적으로 제출되었습니다. 관리자의 승인을 기다려주세요.');
        onLogin({
          email: userEmail,
          name: userName,
          studentId: studentId,
          isAdmin: isAdminVerified,
          isApproved: false // 관리자 승인 대기 중
        });
      } else {
        setError(result.error || '회원가입 중 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('회원가입 실패:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/src/assets/image/potato.png" alt="Hot Potato" className="login-logo" />
            <h1>Hot Potato</h1>
            <p>관리자 승인이 필요한 로그인 시스템</p>
          </div>

          {!isLoggedIn ? (
              <div className="login-section">
                <h2>Google 계정으로 로그인</h2>
                <button
                    type="button"
                    onClick={() => login()}
                    className="google-login-button"
                >
                  Google로 로그인 (대안)
                </button>
                {error && <div className="error-message">{error}</div>}
              </div>
          ) : isLoading ? (
              <div className="login-loading">
                <div className="loading-spinner"></div>
                <p>사용자 상태 확인 중...</p>
              </div>
          ) : (
              <div className="signup-section">
                <div className="user-info">
                  <h2>회원가입 정보 입력</h2>
                  <p className="user-email">로그인된 계정: {userEmail}</p>
                </div>

                <div className="input-group">
                  <label htmlFor="studentId">학번 또는 교번 *</label>
                  <input
                      type="text"
                      id="studentId"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="학번 또는 교번을 입력하세요"
                      required
                  />
                </div>

                <div className="admin-key-section">
                  <button
                      type="button"
                      className="admin-key-toggle"
                      onClick={() => {
                        console.log('관리자 키 토글 클릭, 현재 상태:', showAdminKey);
                        setShowAdminKey(!showAdminKey);
                      }}
                  >
                    {showAdminKey ? '▼' : '▶'} 관리자 키 인증 (선택사항)
                  </button>

                  {showAdminKey && (
                      <div className="admin-key-input">
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => {
                              console.log('관리자 키 입력:', e.target.value);
                              setAdminKey(e.target.value);
                            }}
                            placeholder="관리자 키를 입력하세요"
                            disabled={isLoading}
                            style={{ 
                              pointerEvents: isLoading ? 'none' : 'auto',
                              opacity: isLoading ? 0.6 : 1 
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                              console.log('인증 버튼 클릭, 현재 키:', adminKey);
                              handleVerifyAdminKey();
                            }}
                            disabled={isLoading || !adminKey.trim()}
                            className="verify-button"
                        >
                          {isLoading ? '인증 중...' : '인증하기'}
                        </button>
                        {isAdminVerified && (
                            <div className="success-message">✓ 인증 완료</div>
                        )}
                      </div>
                  )}
                </div>

                <button
                    type="button"
                    onClick={handleSignupRequest}
                    disabled={isLoading || !studentId}
                    className="signup-button"
                >
                  {isLoading ? '처리 중...' : '가입 요청'}
                </button>

                {error && <div className="error-message">{error}</div>}
              </div>
          )}
        </div>
      </div>
  );
};

export default Login;
