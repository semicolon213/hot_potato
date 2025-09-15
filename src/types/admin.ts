// 관리자 관련 타입 정의

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

export type EmailStatus = 'idle' | 'sending' | 'success' | 'error';

export interface AdminPanelState {
  users: AdminUser[];
  emailToSend: string;
  isLoading: boolean;
  message: string;
  emailStatus: EmailStatus;
}
