import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { registerUser, verifyAdminKey, type RegistrationResponse } from '../../../utils/api/authApi';

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

interface LoginFormData {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey: string;
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
  error?: string;
  approvalStatus?: string;
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
    
    // 데이터 구조 디버깅
    console.log('🔍 전체 데이터 구조 분석:', {
      'data 전체': data,
      'data.user': data.user,
      'data.user?.isAdmin': data.user?.isAdmin,
      'data.user?.is_admin': data.user?.is_admin,
      'data.isAdmin': data.isAdmin,
      'data.is_admin': data.is_admin,
      'data의 모든 키': Object.keys(data)
    });
    
    // 디버그 정보 출력
    if (data.debug) {
      console.log('🔍 App Script 디버그 정보:', data.debug);
    }
    
    // 응답 구조 변환 (UserManagement.gs의 응답을 LoginResponse 형식으로)
    // isAdmin은 boolean이거나 is_admin 문자열 "0"도 관리자로 인식
    // data.user 객체에서 관리자 권한 정보를 가져옴
    const userData = data.user || data;
    const isAdminValue = userData.isAdmin || userData.is_admin === "0" || userData.is_admin === 0;
    
    console.log('🔍 관리자 권한 확인:', {
      'userData.isAdmin': userData.isAdmin,
      'userData.is_admin': userData.is_admin,
      '최종 isAdminValue': isAdminValue,
      '타입 확인': {
        'isAdmin 타입': typeof userData.isAdmin,
        'is_admin 타입': typeof userData.is_admin
      }
    });
    
    return {
      success: data.success || false,
      isRegistered: data.isRegistered || false,
      isApproved: data.isApproved || false,
      approvalStatus: data.approvalStatus || 'not_requested',
      studentId: data.studentId || data.memberNumber || '',
      isAdmin: isAdminValue,
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
    adminKey: ''
  });

  // Google 로그인
  const googleLogin = useGoogleLogin({
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
    onSuccess: async (tokenResponse) => {
      try {
        setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const userInfo = await response.json();
        
        const { email, name } = userInfo;
        const accessToken = tokenResponse.access_token;

        console.log('Google 로그인 성공:', { email, name });

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
    },
    onError: (error) => {
      console.error('Google 로그인 오류:', error);
      setLoginState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Google 로그인에 실패했습니다.' 
      }));
    }
  });

  // 사용자 등록 상태 확인
  const checkUserRegistrationStatus = async (email: string, name: string, accessToken: string) => {
    try {
      const result = await checkUserStatus(email);
      console.log('사용자 등록 상태 확인 응답:', result);

      if (result.success && result.isRegistered) {
        // 등록된 사용자 - 승인 상태 확인
        if (result.isApproved) {
          // 이미 승인된 회원 - 바로 메인 화면으로
          console.log('이미 승인된 회원 - 메인 화면으로 이동');
          alert('이미 가입된 회원입니다. 로그인을 진행합니다.');
          onLogin({
            email: email,
            name: name,
            studentId: result.studentId || '',
            isAdmin: result.isAdmin || false,
            isApproved: true,
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

    if (formData.isAdmin && !formData.adminKey.trim()) {
      setLoginState(prev => ({ ...prev, error: '관리자 키를 입력해주세요.' }));
      return;
    }

    try {
      setLoginState(prev => ({ ...prev, isLoading: true, error: '' }));

      const registrationData = {
        email: formData.email,
        name: formData.name,
        studentId: formData.studentId,
        isAdmin: formData.isAdmin,
        adminKey: formData.isAdmin ? formData.adminKey : undefined
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

  return {
    loginState,
    formData,
    googleLogin,
    handleVerifyAdminKey,
    handleRegistration,
    updateFormData,
    clearError
  };
};
