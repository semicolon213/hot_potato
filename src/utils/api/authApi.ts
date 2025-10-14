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

// 새로운 API 클라이언트를 사용하는 래퍼 함수들
export { 
  checkUserRegistrationStatus, 
  registerUser, 
  verifyAdminKey 
} from './apiClient';