import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { registerUser, verifyAdminKey } from '../../../utils/api/authApi';

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
}

// API 함수 - 기존 authApi 사용
const checkUserStatus = async (email: string): Promise<LoginResponse> => {
  // checkApprovalStatus 함수가 authApi에 없으므로 직접 구현
  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkApprovalStatus',
        email: email
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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

      if (result.success) {
        // approvalStatus로 승인 상태 확인
        // O = 승인됨, X = 대기중, 빈칸 = 새로운 사용자
        const isApproved = result.approvalStatus === "O" || result.approvalStatus === "o";
        const isRegistered = result.approvalStatus !== undefined && result.approvalStatus !== null && result.approvalStatus !== "";
        
        if (isRegistered && isApproved) {
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
        } else if (isRegistered && !isApproved) {
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
        } else {
          // 새로운 사용자 - 회원가입 화면 표시
          console.log('새로운 사용자 - 회원가입 화면 표시');
          setFormData(prev => ({ ...prev, email, name: '' })); // 이름은 빈 문자열로 초기화
          setLoginState(prev => ({ 
            ...prev, 
            isLoggedIn: true, 
            showRegistrationForm: true,
            isLoading: false 
          }));
        }
      } else {
        // 오류 발생 - 회원가입 화면 표시
        console.log('오류 발생 - 회원가입 화면 표시');
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

      const result = await registerUser(registrationData);

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
          stack: result.stack
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
