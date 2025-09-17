const API_BASE_URL = 'https://dailykeyupdate-651515712118.asia-northeast3.run.app';

// 인증 관련 타입 정의
export interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessToken?: string;
  googleAccessToken?: string;
}

export interface LoginResponse {
  success: boolean;
  isRegistered: boolean;
  isApproved: boolean;
  studentId?: string;
  isAdmin?: boolean;
  error?: string;
}

export interface RegistrationRequest {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface AdminKeyVerificationResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface LoginFormData {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey: string;
}

export interface LoginState {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string;
  showRegistrationForm: boolean;
}

// 사용자 등록 상태 확인 API
export const checkUserRegistrationStatus = async (email: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/checkUserApprovalStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email })
  });

  const result = await response.json();
  return result;
};

// 사용자 등록 요청 API
export const registerUser = async (registrationData: RegistrationRequest): Promise<RegistrationResponse> => {
  const response = await fetch(`${API_BASE_URL}/submitRegistrationRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userEmail: registrationData.email,
      userName: registrationData.name,
      studentId: registrationData.studentId,
      isAdminVerified: registrationData.isAdmin
    })
  });

  const result = await response.json();
  return result;
};

// 관리자 키 검증 API
export const verifyAdminKey = async (adminKey: string): Promise<AdminKeyVerificationResponse> => {
  const response = await fetch(`${API_BASE_URL}/verifyAdminKey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ adminKey })
  });

  const result = await response.json();
  return result;
};