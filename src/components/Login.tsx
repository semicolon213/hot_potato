import React, { useState, useEffect } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (userData: any) => void;
}

// Google Identity Services (GIS) 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
  }
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Identity Services (GIS) 초기화
  useEffect(() => {
    const initializeGoogleGIS = () => {
      console.log('Google GIS 초기화 시작');
      console.log('window.google 존재:', typeof window.google !== 'undefined');
      console.log('window.google.accounts 존재:', typeof window.google?.accounts !== 'undefined');
      
      // Google GIS 스크립트가 로드될 때까지 대기
      if (typeof window.google === 'undefined' || !window.google.accounts) {
        console.log('Google GIS 스크립트 로딩 대기 중...');
        setTimeout(initializeGoogleGIS, 1000);
        return;
      }

      try {
        // Google GIS 초기화
        window.google.accounts.id.initialize({
          client_id: '651515712118-8293tiue05sgfau7ujig52m5m37cfjoo.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log('Google GIS 초기화 성공');
        setIsGoogleLoaded(true);
        setError('');

        // Google 로그인 버튼 렌더링 - 지연 실행
        setTimeout(() => {
          const buttonElement = document.getElementById('google-login-button');
          if (buttonElement) {
            console.log('Google 로그인 버튼 렌더링 시작');
            try {
              window.google.accounts.id.renderButton(buttonElement, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
              });
              console.log('Google 로그인 버튼 렌더링 완료');
            } catch (renderError) {
              console.error('Google 로그인 버튼 렌더링 실패:', renderError);
              // 대안 버튼 표시
              const fallbackBtn = document.querySelector('.google-login-fallback-btn') as HTMLButtonElement;
              if (fallbackBtn) {
                fallbackBtn.style.display = 'block';
              }
            }
          } else {
            console.error('Google 로그인 버튼 요소를 찾을 수 없습니다');
            // 대안 버튼 표시
            const fallbackBtn = document.querySelector('.google-login-fallback-btn') as HTMLButtonElement;
            if (fallbackBtn) {
              fallbackBtn.style.display = 'block';
            }
          }
        }, 100);

      } catch (error) {
        console.error('Google GIS 초기화 실패:', error);
        setError('Google 로그인 초기화에 실패했습니다.');
      }
    };

    // 즉시 초기화 시작
    initializeGoogleGIS();
  }, []);

  // Google 로그인 성공 콜백
  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google 로그인 성공:', response);
      
      // JWT 토큰에서 사용자 정보 추출
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email = payload.email;
      
      console.log('사용자 이메일:', email);
      setUserEmail(email);
      setIsLoggedIn(true);
      setError('');
      
      // 승인 상태 확인
      await checkApprovalStatus(email);
      
    } catch (error) {
      console.error('Google 로그인 처리 실패:', error);
      setError('Google 로그인 처리 중 오류가 발생했습니다.');
    }
  };

  // 승인 상태 확인
  const checkApprovalStatus = async (email: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/checkApprovalStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });
      
             const result = await response.json();
       console.log('백엔드 응답:', result);

       if (result.success) {
         if (result.isApproved) {
           // 승인된 사용자 - 바로 메인 화면으로
           console.log('승인된 사용자 - 메인 화면으로 이동');
           onLogin({
             email: email,
             studentId: result.studentId || '',
             isAdmin: result.isAdmin || false,
             isApproved: true
           });
         } else {
           // 승인 대기 중 - 회원가입 화면 유지
           console.log('승인 대기 중인 사용자');
         }
       } else {
         // 등록되지 않은 사용자 - 회원가입 화면 유지
         console.log('새로운 사용자');
       }
      
    } catch (error) {
      console.error('승인 상태 확인 실패:', error);
      // 오류 시 회원가입 화면 유지
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 키 인증
  const handleVerifyAdminKey = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('https://dailykeyupdate-651515712118.asia-northeast3.run.app/verifyAdminKey', {
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
      
      const signupData = {
        googleEmail: userEmail,
        studentId: studentId,
        isAdmin: isAdminVerified,
      };
      
      // 여기서 회원가입 요청을 서버로 보냄
      // 실제 구현에서는 hp_member 스프레드시트에 데이터 추가
      console.log('회원가입 요청:', signupData);
      
      // 임시로 성공 처리
      onLogin({
        email: userEmail,
        studentId: studentId,
        isAdmin: isAdminVerified,
        isApproved: false // 관리자 승인 대기 중
      });
      
    } catch (error) {
      console.error('회원가입 실패:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isGoogleLoaded) {
    return (
      <div className="login-container">
        <div className="login-loading">
          <div className="loading-spinner"></div>
          <p>Google 로그인 초기화 중...</p>
        </div>
      </div>
    );
  }

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
              <div id="google-login-button" className="google-login-button"></div>
              {/* 대안 버튼 - GIS 버튼이 로드되지 않을 경우 */}
              <button
                type="button"
                onClick={() => window.google?.accounts?.id?.prompt()}
                className="google-login-fallback-btn"
                style={{
                  display: 'none', // 기본적으로 숨김
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Google로 로그인 (대안)
              </button>
              {error && <div className="error-message">{error}</div>}
            </div>
        ) : (
          <div className="signup-section">
            <div className="user-info">
              <h2>회원가입 정보 입력</h2>
              <p className="user-email">로그인된 계정: {userEmail}</p>
            </div>

            <div className="input-group">
              <label htmlFor="studentId">학번 또는 교번</label>
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
                onClick={() => setShowAdminKey(!showAdminKey)}
              >
                {showAdminKey ? '▼' : '▶'} 관리자 키 인증 (선택사항)
              </button>
              
              {showAdminKey && (
                <div className="admin-key-input">
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="관리자 키를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAdminKey}
                    disabled={isLoading || !adminKey}
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
