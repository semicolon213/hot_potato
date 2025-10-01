// API 설정 파일
export const API_CONFIG = {
  // Apps Script 웹앱 URL (환경변수에서 가져오기)
  APP_SCRIPT_URL: import.meta.env.VITE_APP_SCRIPT_URL || '',
  
  // Google Client ID (기존 환경변수)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // API 타임아웃 (밀리초)
  TIMEOUT: 60000, // 60초로 증가
  
  // 재시도 횟수
  MAX_RETRIES: 5, // 5회로 증가
};

// API 엔드포인트 액션들
export const API_ACTIONS = {
  // 사용자 관리
  GET_PENDING_USERS: 'getPendingUsers',
  APPROVE_USER: 'approveUser',
  REJECT_USER: 'rejectUser',
  
  // 인증
  CHECK_APPROVAL_STATUS: 'checkApprovalStatus',
  SUBMIT_REGISTRATION_REQUEST: 'submitRegistrationRequest',
  VERIFY_ADMIN_KEY: 'verifyAdminKey',
  
  // 관리자 키
  SEND_ADMIN_KEY_EMAIL: 'sendAdminKeyEmail',
  
  // 이메일 마이그레이션
  MIGRATE_EMAILS: 'migrateEmails',
  
  // 테스트
  TEST_EMAIL_ENCRYPTION: 'testEmailEncryption',
  TEST_ALL_APP_SCRIPT: 'testAllAppScript',
} as const;

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// API 요청 옵션
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
