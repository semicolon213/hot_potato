import React, { useState } from 'react';
import { useAuth } from '../../../hooks/features/auth/useAuth';
import { lastUserManager } from '../../../utils/auth/lastUserManager';

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

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [logoSrc, setLogoSrc] = useState<string>("/logo.svg");
  const [logoClickCount, setLogoClickCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const {
    loginState,
    formData,
    googleLogin,
    handleVerifyAdminKey,
    handleRegistration,
    updateFormData,
    clearError,
    loginWithLastUser,
    lastUser,
    lastUsers
  } = useAuth(onLogin);

  const handleLogoClick = () => {
    const next = logoClickCount + 1;
    if (next >= 10 && logoSrc !== "/logo-eat.png") {
      setLogoSrc("/logo-eat.png");
    }
    setLogoClickCount(next);
  };

  const handleRemoveAccount = (email: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 이벤트 전파 방지
    lastUserManager.remove(email);
    // 상태 갱신을 위해 refreshKey 업데이트하여 컴포넌트 리렌더링
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-card-left">
          <div className="login-header-left">
            <img
              src={logoSrc}
              alt="Hot Potato Logo"
              className="login-logo"
              onClick={handleLogoClick}
              onError={() => setLogoSrc("/logo.svg")}
              title=""
            />
            <h1 className="hp-erp-title">HP ERP</h1>
          </div>
        </div>
        <div className="login-card-right">
          {!loginState.isLoggedIn ? (
            <div className="login-section">
              {lastUserManager.getAll().length > 0 ? (
                <>
                  <div className="last-users-section" key={refreshKey}>
                    <div className="last-users-list">
                      {lastUserManager.getAll().map((user) => (
                        <div key={user.email} className="last-user-item">
                          <button
                            onClick={() => loginWithLastUser(user.email)}
                            disabled={loginState.isLoading}
                            className="last-user-btn"
                          >
                            <div className="last-user-avatar">
                              {user.picture ? (
                                <img src={user.picture} alt={user.name} />
                              ) : (
                                <div className="last-user-initial">{user.name.charAt(0)}</div>
                              )}
                            </div>
                            <div className="last-user-info">
                              <div className="last-user-name">{user.name}</div>
                              <div className="last-user-email">{user.email}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAccount(user.email, e);
                              }}
                              className="last-user-remove-btn"
                              title="계정 제거"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="login-divider">
                    <span>또는</span>
                  </div>
                </>
              ) : (
                <div className="no-last-user-message">
                  기존 로그인된 계정이 없습니다
                </div>
              )}
              <button
                onClick={() => googleLogin()}
                disabled={loginState.isLoading}
                className="google-login-btn"
              >
                {loginState.isLoading ? (
                  <>
                    <div className="spinner"></div>
                    로그인 중...
                  </>
                ) : (
                  <>
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {lastUserManager.getAll().length > 0 ? '다른 계정으로 로그인' : 'Google로 로그인'}
                  </>
                )}
              </button>
            </div>
          ) : loginState.showRegistrationForm ? (
          <div className="signup-section">
            <h2 className="signup-section-title">회원가입</h2>
            <div className="signup-section-email">{formData.email}</div>

            <div className="input-group">
              <label htmlFor="name">이름 *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="이름을 입력하세요"
                className="form-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="studentId">학번/교번 *</label>
              <input
                type="text"
                id="studentId"
                value={formData.studentId}
                onChange={(e) => updateFormData('studentId', e.target.value)}
                placeholder="학번 또는 교번을 입력하세요"
                className="form-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="userType">가입유형 *</label>
              <select
                id="userType"
                value={formData.userType}
                onChange={(e) => updateFormData('userType', e.target.value)}
                className="form-input"
              >
                <option value="">가입유형을 선택하세요</option>
                <option value="student">학생</option>
                <option value="std_council">집행부</option>
                <option value="supp">조교</option>
                <option value="professor">교수</option>
                <option value="ad_professor">겸임교원</option>
              </select>
            </div>

            <div className="input-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => updateFormData('isAdmin', e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">관리자로 가입하기</span>
              </label>
            </div>

            {formData.isAdmin && (
              <div className="admin-key-section">
                <div className="input-group">
                  <label htmlFor="adminKey">관리자 키 *</label>
                  <div className="admin-key-input-group">
                    <input
                      type="password"
                      id="adminKey"
                      value={formData.adminKey}
                      onChange={(e) => updateFormData('adminKey', e.target.value)}
                      placeholder="관리자 키를 입력하세요"
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAdminKey}
                      disabled={loginState.isLoading || !formData.adminKey.trim()}
                      className="verify-btn"
                    >
                      인증
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loginState.error && (
              <div className="error-message" onClick={clearError}>
                {loginState.error}
              </div>
            )}

            <button
              type="button"
              onClick={handleRegistration}
              disabled={loginState.isLoading || !formData.name.trim() || !formData.studentId.trim() || !formData.userType || (formData.isAdmin && !formData.adminKey.trim())}
              className="register-btn"
            >
              {loginState.isLoading ? (
                <>
                  <div className="spinner"></div>
                  가입 중...
                </>
              ) : (
                '가입하기'
              )}
            </button>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;