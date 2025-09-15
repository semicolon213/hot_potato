// 타입 정의
interface AdminUser {
  id: string;
  email: string;
  studentId: string;
  name: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
  approvalDate?: string | null;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

interface AdminKeyResponse {
  success: boolean;
  message: string;
  userEmail: string;
  adminKey: string;
  encryptedKey: string;
  layersUsed: string;
  emailTemplate: EmailTemplate;
}

interface UserListResponse {
  success: boolean;
  users: AdminUser[];
  error?: string;
}

interface ApprovalResponse {
  success: boolean;
  message: string;
  error?: string;
}

const API_BASE_URL = 'https://dailykeyupdate-651515712118.asia-northeast3.run.app';

// 관리자 키 이메일 전송 API
export const sendAdminKeyEmail = async (
  userEmail: string, 
  adminAccessToken: string
): Promise<AdminKeyResponse> => {
  const response = await fetch(`${API_BASE_URL}/sendAdminKeyEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userEmail,
      adminAccessToken
    })
  });

  const result = await response.json();
  return result;
};

// 사용자 목록 조회 API
export const fetchPendingUsers = async (): Promise<UserListResponse> => {
  const response = await fetch(`${API_BASE_URL}/dailyKeyUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'getPendingUsers' })
  });

  const result = await response.json();
  return result;
};

// 사용자 승인 API
export const approveUser = async (userId: string): Promise<ApprovalResponse> => {
  const response = await fetch(`${API_BASE_URL}/dailyKeyUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'approveUser',
      studentId: userId
    })
  });

  const result = await response.json();
  return result;
};

// 사용자 거부 API
export const rejectUser = async (userId: string): Promise<ApprovalResponse> => {
  const response = await fetch(`${API_BASE_URL}/dailyKeyUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'rejectUser',
      studentId: userId
    })
  });

  const result = await response.json();
  return result;
};
