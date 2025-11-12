/**
 * @file userResponses.ts
 * @brief 사용자 관련 API 응답 타입 정의
 * @details 사용자 인증, 승인 상태, 이름 조회 등의 API 응답 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 사용자 이름 응답 타입
 */
export interface UserNameResponse {
  success: boolean;
  name?: string;
  data?: {
    name?: string;
    user?: UserData;
  };
  user?: UserData;
  error?: string;
}

/**
 * @brief 사용자 데이터 타입
 */
export interface UserData {
  no_member?: string;
  student_id?: string;
  no?: string;
  staff_no?: string;
  id?: string;
  user_type?: string;
  userType?: string;
  is_admin?: string | boolean;
  isAdmin?: boolean;
  isApproved?: boolean;
  Approval?: string;
  email?: string;
  name?: string;
  name_member?: string;
}

/**
 * @brief 사용자 승인 상태 응답 타입
 */
export interface ApprovalStatusResponse {
  success: boolean;
  data?: {
    status?: string;
    message?: string;
    user?: UserData;
  };
  isApproved?: boolean;
  isAdmin?: boolean;
  studentId?: string;
  userType?: string;
  approvalStatus?: string;
  status?: string;
  message?: string;
  error?: string;
}

