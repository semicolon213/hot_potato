import React, { useState, useEffect } from 'react';
import './Login.css';

// 한글 디코딩을 위한 유틸리티 함수
const decodeKoreanText = (text: string): string => {
  try {
    // 이미 올바른 한글이면 그대로 반환
    if (/[가-힣]/.test(text)) {
      return text;
    }
    
    // 깨진 한글을 복구 시도
    const decoded = decodeURIComponent(escape(text));
    return decoded;
  } catch (e) {
    console.warn('한글 디코딩 실패:', e);
    return text; // 실패 시 원본 반환
  }
};

// JWT 토큰 만료 확인 함수
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Payload = token.split('.')[1];
    const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload);
    const payload = JSON.parse(decodedPayload);
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (e) {
    console.error('토큰 파싱 실패:', e);
    return true; // 파싱 실패 시 만료된 것으로 간주
  }
};

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
    // Google OAuth 관련 오류 필터링
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Google OAuth 관련 오류는 필터링
      if (message.includes('Cross-Origin-Opener-Policy') || 
          message.includes('window.closed') || 
          message.includes('window.postMessage') ||
          message.includes('cspreport') ||
          message.includes('400 (Bad Request)') ||
          message.includes('Failed to load resource')) {
        return; // 오류 메시지 출력하지 않음
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      // Google OAuth 관련 경고는 필터링
      if (message.includes('Cross-Origin-Opener-Policy') || 
          message.includes('Refused to frame') ||
          message.includes('Content Security Policy') ||
          message.includes('iframe') ||
          message.includes('sandbox')) {
        return; // 경고 메시지 출력하지 않음
      }
      originalConsoleWarn.apply(console, args);
    };

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
          use_fedcm_for_prompt: false,
          itp_support: true,
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

    // cleanup 함수에서 원래 console 함수들 복원
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Google 로그인 성공 콜백
  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google 로그인 성공:', response);
      
      // JWT 토큰을 localStorage에 저장
      localStorage.setItem('google_token', response.credential);
      console.log('Google JWT Token 저장됨:', response.credential.substring(0, 50) + '...');
      
      // JWT 토큰에서 사용자 정보 추출 (한글 인코딩 문제 해결)
      const base64Payload = response.credential.split('.')[1];
      // Base64 패딩 추가 (필요한 경우)
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
      
      // UTF-8로 안전하게 디코딩
      let decodedPayload;
      try {
        // 먼저 일반 atob 시도
        decodedPayload = atob(paddedPayload);
      } catch (e) {
        // 실패 시 URL-safe Base64 디코딩 시도
        const urlSafePayload = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
        decodedPayload = atob(urlSafePayload);
      }
      
      const payload = JSON.parse(decodedPayload);
      
      const email = payload.email;
      const name = decodeKoreanText(payload.name);
      
      console.log('사용자 이메일:', email);
      console.log('사용자 이름 (원본):', payload.name);
      console.log('사용자 이름 (복구 후):', name);
      console.log('사용자 이름 (인코딩 확인):', encodeURIComponent(name));
      
      setUserEmail(email);
      setError('');
      
      // 사용자 등록 상태 확인 (새로운 API 사용)
      await checkUserRegistrationStatus(email, name);
      
    } catch (error) {
      console.error('Google 로그인 처리 실패:', error);
      setError('Google 로그인 처리 중 오류가 발생했습니다.');
    }
  };

    // 사용자 등록 상태 확인 (새로운 API 사용)
  const checkUserRegistrationStatus = async (email: string, name: string) => {
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
            isApproved: true
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
      
      // JWT 토큰에서 사용자 이름 추출 (이미 로그인된 상태)
      const token = localStorage.getItem('google_token');
      let userName = '';
      if (token) {
        try {
          const base64Payload = token.split('.')[1];
          const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
          
          // UTF-8로 안전하게 디코딩
          let decodedPayload;
          try {
            decodedPayload = atob(paddedPayload);
          } catch (e) {
            const urlSafePayload = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
            decodedPayload = atob(urlSafePayload);
          }
          
          const payload = JSON.parse(decodedPayload);
          userName = decodeKoreanText(payload.name || '');
          console.log('회원가입용 사용자 이름 (원본):', payload.name);
          console.log('회원가입용 사용자 이름 (복구 후):', userName);
        } catch (e) {
          console.error('토큰 파싱 실패:', e);
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
