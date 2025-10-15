// 타입 정의
export interface AdminUser {
  id: string;
  email: string;
  studentId: string;
  name: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
  approvalDate?: string | null;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export interface AdminKeyResponse {
  success: boolean;
  message: string;
  userEmail: string;
  adminKey: string;
  encryptedKey: string;
  layersUsed: string;
  emailTemplate: EmailTemplate;
}

export interface UserListResponse {
  success: boolean;
  users: AdminUser[];
  error?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  error?: string;
}

// 새로운 API 클라이언트를 사용하는 래퍼 함수들
export { 
  sendAdminKeyEmail, 
  fetchPendingUsers, 
  approveUser, 
  rejectUser,
  clearUserCache
} from './apiClient';
