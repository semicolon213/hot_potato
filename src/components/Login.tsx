import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore, type User } from '../hooks/useAuthStore';
import './Login.css';

const Login: React.FC = () => {
  const [step, setStep] = useState<'login' | 'id-input' | 'pending'>('login');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [tempUser, setTempUser] = useState<Partial<User> | null>(null);

  const { setUser, setLoading, setError } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await userInfoResponse.json();
        
        // 임시 사용자 정보 저장
        const tempUserData: Partial<User> = {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          googleAccessToken: tokenResponse.access_token,
          role: 'student', // 기본값
          isApproved: false,
        };
        
        setTempUser(tempUserData);
        setStep('id-input');
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setError("사용자 정보를 가져오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("구글 로그인에 실패했습니다.");
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly profile email',
  });

  const handleIdSubmit = async () => {
    if (!tempUser) return;

    try {
      setLoading(true);
      
      // 여기서 스프레드시트에 사용자 정보를 추가하는 API 호출
      // 실제 구현에서는 백엔드 API를 호출해야 합니다
      const userData: User = {
        ...tempUser,
        studentId: userType === 'student' ? studentId : undefined,
        teacherId: userType === 'teacher' ? teacherId : undefined,
        role: userType,
        isApproved: false,
      } as User;

      // 임시로 로컬 스토리지에 저장 (실제로는 스프레드시트에 저장)
      localStorage.setItem('pendingUser', JSON.stringify(userData));
      
      setStep('pending');
    } catch (error) {
      console.error("Failed to submit user info:", error);
      setError("사용자 정보 제출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginStep = () => (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/src/assets/image/potato.png" alt="Hot Potato" className="logo" />
          <h1>Hot Potato</h1>
          <p>구글 계정으로 로그인하여 시작하세요</p>
        </div>
        <button 
          className="google-login-btn"
          onClick={() => login()}
          disabled={false}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          구글로 로그인
        </button>
      </div>
    </div>
  );

  const renderIdInputStep = () => (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>사용자 정보 입력</h2>
          <p>학번 또는 교번을 입력해주세요</p>
        </div>
        
        <div className="user-type-selector">
          <label>
            <input
              type="radio"
              name="userType"
              value="student"
              checked={userType === 'student'}
              onChange={(e) => setUserType(e.target.value as 'student' | 'teacher')}
            />
            학생
          </label>
          <label>
            <input
              type="radio"
              name="userType"
              value="teacher"
              checked={userType === 'teacher'}
              onChange={(e) => setUserType(e.target.value as 'student' | 'teacher')}
            />
            교직원
          </label>
        </div>

        <div className="input-group">
          {userType === 'student' ? (
            <input
              type="text"
              placeholder="학번을 입력하세요"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="id-input"
            />
          ) : (
            <input
              type="text"
              placeholder="교번을 입력하세요"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="id-input"
            />
          )}
        </div>

        <div className="button-group">
          <button 
            className="back-btn"
            onClick={() => setStep('login')}
          >
            뒤로가기
          </button>
          <button 
            className="submit-btn"
            onClick={handleIdSubmit}
            disabled={!studentId && !teacherId}
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  );

  const renderPendingStep = () => (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>승인 대기 중</h2>
          <p>관리자 승인을 기다리고 있습니다</p>
        </div>
        
        <div className="pending-info">
          <div className="info-item">
            <strong>이름:</strong> {tempUser?.name}
          </div>
          <div className="info-item">
            <strong>이메일:</strong> {tempUser?.email}
          </div>
          <div className="info-item">
            <strong>구분:</strong> {userType === 'student' ? '학생' : '교직원'}
          </div>
          <div className="info-item">
            <strong>번호:</strong> {userType === 'student' ? studentId : teacherId}
          </div>
        </div>

        <div className="pending-message">
          <p>관리자가 승인하면 자동으로 로그인됩니다.</p>
          <p>승인 상태를 확인하려면 페이지를 새로고침하세요.</p>
        </div>

        <button 
          className="refresh-btn"
          onClick={() => window.location.reload()}
        >
          새로고침
        </button>
      </div>
    </div>
  );

  switch (step) {
    case 'id-input':
      return renderIdInputStep();
    case 'pending':
      return renderPendingStep();
    default:
      return renderLoginStep();
  }
};

export default Login;
