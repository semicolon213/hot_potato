import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { registerUser, verifyAdminKey } from '../../../utils/api/authApi';
import { tokenManager } from '../../../utils/auth/tokenManager';
import { lastUserManager } from '../../../utils/auth/lastUserManager';

// 타입 정의
interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  userType?: string;
  accessToken?: string;
  googleAccessToken?: string;
}

interface LoginFormData {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey: string;
  userType: string;
}

interface LoginState {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string;
  showRegistrationForm: boolean;
}

interface LoginResponse {
  success: boolean;
  isRegistered: boolean;
  isApproved: boolean;
  studentId?: string;
  isAdmin?: boolean;
  userType?: string;
  error?: string;
  approvalStatus?: string;
  debug?: {
    message?: string;
    data?: unknown;
    stack?: string;
    [key: string]: unknown;
  };
}

interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  debug?: {
    message?: string;
    data?: unknown;
    stack?: string;
    [key: string]: unknown;
  };
}

// API 함수 - 기존 authApi 사용
const checkUserStatus = async (email: string): Promise<LoginResponse> => {
  // checkApprovalStatus 함수가 authApi에 없으므로 직접 구현
  try {
    console.log('사용자 상태 확인 요청:', email);

    // Vite 프록시 사용
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkUserStatus',
        email: email
      })
    });

    console.log('API 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('사용자 등록 상태 확인 응답:', data);

    // 디버그 정보 출력
    if (data.debug) {
      console.log('🔍 App Script 디버그 정보:', data.debug);
    }

    // 응답 구조 변환 (UserManagement.gs의 응답을 LoginResponse 형식으로)
    return {
      success: data.success || false,
      isRegistered: data.isRegistered || false,
      isApproved: data.isApproved || false,
      approvalStatus: data.approvalStatus || 'not_requested',
      studentId: data.user?.no_member || '',
      isAdmin: data.user?.isAdmin || false, // is_admin에서 isAdmin으로 변경
      userType: data.user?.user_type || '',
      error: data.error,
      debug: data.debug
    } as LoginResponse;
  } catch (error) {
    console.error('사용자 상태 확인 실패:', error);
    return {
      success: false,
      isRegistered: false,
      isApproved: false,
      error: '사용자 상태 확인 중 오류가 발생했습니다.'
    };
  }
};

export const useAuth = (onLogin: (user: User) => void) => {
  const [loginState, setLoginState] = useState<LoginState>({
    isLoggedIn: false,
    isLoading: false,
    error: '',
    showRegistrationForm: false
  });

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    name: '',
    studentId: '',
    isAdmin: false,
    adminKey: '',
    userType: ''
  });

  // Google 로그인 공통 핸들러
  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
      try {
        setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

        // 토큰 만료 시간 확인 및 저장
        // expires_in은 초 단위 (기본값: 3600초 = 1시간)
        const expiresIn = tokenResponse.expires_in || 3600;
        const accessToken = tokenResponse.access_token;

        // 토큰 저장 (만료 시간 포함)
        tokenManager.save(accessToken, expiresIn);

        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userInfo = await response.json();

        const { email, name, picture } = userInfo;

        console.log('Google 로그인 성공:', { email, name, expiresIn });

        // 마지막 로그인 사용자 정보 저장
        lastUserManager.save({ email, name, picture });

        // 사용자 등록 상태 확인
        await checkUserRegistrationStatus(email, name, accessToken);
      } catch (error) {
        console.error('Google 로그인 실패:', error);
        setLoginState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Google 로그인 중 오류가 발생했습니다.'
        }));
      }
    };

  // Google 로그인 공통 에러 핸들러
  const handleGoogleLoginError = (error: any) => {
    console.error('Google 로그인 오류:', error);
    setLoginState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Google 로그인에 실패했습니다.'
    }));
  };

  // Google 로그인 (overrideConfig로 hint와 prompt 전달 가능)
  const googleLoginBase = useGoogleLogin({
    flow: 'implicit',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
      'profile',
      'email'
    ].join(' '),
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
    // include_granted_scopes를 true로 설정하여 이미 승인된 권한 재사용
    include_granted_scopes: true
  });

  // 일반 Google 로그인 (새 계정 로그인용)
  const googleLogin = () => {
    googleLoginBase();
  };

  // 사용자 등록 상태 확인
  const checkUserRegistrationStatus = async (email: string, name: string, accessToken: string) => {
    try {
      const result = await checkUserStatus(email);
      console.log('사용자 등록 상태 확인 응답:', result);

      if (result.success && result.isRegistered) {
        // 등록된 사용자 - 승인 상태 확인
        if (result.isApproved) {
          // 이미 승인된 회원 - 바로 메인 화면으로 (알림 없이)
          console.log('이미 승인된 회원 - 메인 화면으로 이동');
          onLogin({
            email: email,
            name: name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: true,
            userType: result.userType || '',
            accessToken: accessToken,
            googleAccessToken: accessToken
          });
        } else {
          // 승인 대기 중 - 승인 대기 화면으로
          console.log('승인 대기 중인 사용자');
          alert('가입 요청이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.');
          onLogin({
            email: email,
            name: name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: false,
            googleAccessToken: accessToken
          });
        }
      } else {
        // 새로운 사용자 또는 등록되지 않은 사용자 - 회원가입 화면 표시
        console.log('새로운 사용자 - 회원가입 화면 표시');
        setFormData(prev => ({ ...prev, email, name: '' })); // 이름은 빈 문자열로 초기화
        setLoginState(prev => ({
          ...prev,
          isLoggedIn: true,
          showRegistrationForm: true,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('사용자 등록 상태 확인 실패:', error);
      setLoginState(prev => ({
        ...prev,
        error: '사용자 상태 확인 중 오류가 발생했습니다.',
        isLoading: false
      }));
      // 오류 시 회원가입 화면 표시
      setFormData(prev => ({ ...prev, email, name: '' })); // 이름은 빈 문자열로 초기화
      setLoginState(prev => ({
        ...prev,
        isLoggedIn: true,
        showRegistrationForm: true
      }));
    }
  };

  // 관리자 키 인증
  const handleVerifyAdminKey = async () => {
    if (!formData.adminKey.trim()) {
      setLoginState(prev => ({ ...prev, error: '관리자 키를 입력해주세요.' }));
      return;
    }

    try {
      setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

      const result = await verifyAdminKey(formData.adminKey);

      if (result.success) {
        setFormData(prev => ({ ...prev, isAdmin: true }));
        setLoginState(prev => ({ ...prev, error: '관리자 키가 인증되었습니다.' }));
      } else {
        setLoginState(prev => ({ ...prev, error: result.error || '관리자 키 인증에 실패했습니다.' }));
      }
    } catch (error) {
      console.error('관리자 키 인증 실패:', error);
      setLoginState(prev => ({ ...prev, error: '관리자 키 인증 중 오류가 발생했습니다.' }));
    } finally {
      setLoginState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 회원가입 요청
  const handleRegistration = async () => {
    if (!formData.email.trim()) {
      setLoginState(prev => ({ ...prev, error: '이메일 정보가 없습니다. 다시 로그인해주세요.' }));
      return;
    }

    if (!formData.name.trim()) {
      setLoginState(prev => ({ ...prev, error: '이름을 입력해주세요.' }));
      return;
    }

    if (!formData.studentId.trim()) {
      setLoginState(prev => ({ ...prev, error: '학번/교번을 입력해주세요.' }));
      return;
    }

    if (!formData.userType) {
      setLoginState(prev => ({ ...prev, error: '가입유형을 선택해주세요.' }));
      return;
    }

    try {
      setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

      const registrationData = {
        email: formData.email,
        name: formData.name,
        studentId: formData.studentId,
        isAdmin: formData.isAdmin,
        adminKey: formData.isAdmin ? formData.adminKey : undefined,
        userType: formData.userType
      };

      const result: RegistrationResponse = await registerUser(registrationData);

      // 디버그 정보 출력
      if (result.debug) {
        console.log('🔍 App Script 디버그 정보:', result.debug);
      }

      if (result.success) {
        alert(result.message);
        onLogin({
          email: formData.email,
          name: formData.name,
          studentId: formData.studentId,
          isAdmin: formData.isAdmin,
          isApproved: false
        });
      } else {
        console.error('회원가입 실패 응답:', result);
        console.error('상세 오류 정보:', {
          message: result.message,
          error: result.error,
          debug: result.debug,
          stack: result.debug?.stack
        });

        // 더 자세한 오류 메시지 표시
        let errorMessage = '회원가입에 실패했습니다.';
        if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = result.error;
        }

        setLoginState(prev => ({ ...prev, error: errorMessage }));
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      setLoginState(prev => ({ ...prev, error: '회원가입 중 오류가 발생했습니다.' }));
    } finally {
      setLoginState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 폼 데이터 업데이트
  const updateFormData = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 에러 메시지 초기화
  const clearError = () => {
    setLoginState(prev => ({ ...prev, error: '' }));
  };

  // 특정 사용자로 빠른 로그인
  const loginWithLastUser = async (email?: string) => {
    const targetEmail = email || (lastUserManager.get()?.email);
    if (!targetEmail) {
      setLoginState(prev => ({ ...prev, error: '저장된 사용자 정보가 없습니다.' }));
      return;
    }

    const lastUser = lastUserManager.getAll().find(u => u.email === targetEmail);
    if (!lastUser) {
      setLoginState(prev => ({ ...prev, error: '저장된 사용자 정보가 없습니다.' }));
      return;
    }

    // 로딩 상태 시작
    setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

    // 토큰이 유효한지 확인
    const validToken = tokenManager.get();
    if (validToken) {
      // 토큰이 유효하면 사용자 상태 확인 후 바로 로그인
      try {
        const result = await checkUserStatus(lastUser.email);
        
        if (result.success && result.isRegistered && result.isApproved) {
          // 바로 로그인 처리
          onLogin({
            email: lastUser.email,
            name: lastUser.name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: true,
            userType: result.userType || '',
            accessToken: validToken,
            googleAccessToken: validToken
          });
          setLoginState(prev => ({ ...prev, isLoading: false }));
          return;
        } else {
          // 승인되지 않았거나 등록되지 않은 경우
          setLoginState(prev => ({ ...prev, isLoading: false }));
          // 마지막 사용자용 Google 로그인으로 진행 (hint 사용)
          googleLoginBase({
            hint: lastUser.email
            // prompt를 설정하지 않음: 이미 승인된 경우 팝업 없이 진행
          });
          return;
        }
      } catch (error) {
        console.error('마지막 사용자 로그인 실패:', error);
        setLoginState(prev => ({ ...prev, isLoading: false }));
        // 에러 발생 시 마지막 사용자용 Google 로그인으로 진행
        googleLoginBase({
          hint: lastUser.email
        });
        return;
      }
    }

    // 토큰이 없거나 만료되었으면 마지막 사용자용 Google 로그인 시작
    // hint로 계정 지정하여 계정 선택 팝업 방지
    // prompt를 설정하지 않으면 Google이 자동으로 적절한 프롬프트 선택
    // include_granted_scopes: true로 이미 승인된 권한은 재사용되어 팝업 없이 진행
    googleLoginBase({
      hint: lastUser.email
      // prompt를 설정하지 않음: 이미 승인된 경우 팝업 없이 진행, 권한 필요한 경우에만 표시
    });
  };

  // 모든 로그인 사용자 목록 가져오기
  const lastUsers = lastUserManager.getAll();
  
  // 마지막 로그인 사용자 정보 가져오기 (하위 호환성)
  const lastUser = lastUsers.length > 0 ? lastUsers[0] : null;

  return {
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
  };
};
