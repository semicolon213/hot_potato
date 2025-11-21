/**
 * @file apiResponses.ts
 * @brief API 응답 타입 정의
 * @details Apps Script API 및 기타 API 응답 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 스프레드시트 ID 응답 타입
 */
export interface SpreadsheetIdsResponse {
  success: boolean;
  data?: {
    announcementSpreadsheetId?: string;
    calendarProfessorSpreadsheetId?: string;
    calendarCouncilSpreadsheetId?: string;
    calendarADProfessorSpreadsheetId?: string;
    calendarSuppSpreadsheetId?: string;
    calendarStudentSpreadsheetId?: string;
    hotPotatoDBSpreadsheetId?: string;
    studentSpreadsheetId?: string;
    staffSpreadsheetId?: string;
    accountingFolderId?: string;
  };
  error?: string;
}

/**
 * @brief 공지사항 항목 타입
 */
export interface AnnouncementItem {
  id: string | number;
  no_notice?: string | number;
  title?: string;
  author?: string;
  date?: string;
  content?: string;
  writer_id?: string;
  writer_email?: string;
  file_notice?: string;
  access_rights?: string;
  fix_notice?: string;
  views?: number;
  likes?: number;
}

/**
 * @brief 공지사항 목록 응답 타입
 */
export interface AnnouncementsResponse {
  success?: boolean;
  announcements?: AnnouncementItem[];
  data?: {
    announcements?: AnnouncementItem[];
  };
  error?: string;
}

/**
 * @brief 학생 이슈 타입
 */
export interface StudentIssue {
  id: string;
  studentNo: string;
  issueType: string;
  description: string;
  date: string;
  resolved: boolean;
}

/**
 * @brief API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

/**
 * @brief 성공 응답 타입
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * @brief 통합 API 응답 타입
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * @brief 사용자 이름 응답 타입
 */
export interface UserNameResponse {
  success: boolean;
  name?: string;
  data?: {
    name?: string;
  };
  error?: string;
}

/**
 * @brief 사용자 목록 응답 타입
 */
export interface UsersListResponse {
  success: boolean;
  users: Array<{
    id?: string;
    email: string;
    name?: string;
    name_member?: string;
    studentId?: string;
    no_member?: string;
    userType?: string;
    user_type?: string;
    isApproved?: boolean;
    Approval?: string;
    isAdmin?: boolean;
    is_admin?: string;
    requestDate?: string;
    approval_date?: string;
    approvalDate?: string | null;
  }>;
  pendingUsers?: unknown[];
  approvedUsers?: unknown[];
  error?: string;
  debug?: {
    classification?: unknown;
  };
}

/**
 * @brief 워크플로우 템플릿 응답 타입
 */
export interface WorkflowTemplateResponse {
  success: boolean;
  message?: string;
  data?: {
    templateId: string;
    templateName: string;
    createdDate: string;
    updatedDate?: string;
  };
  error?: string;
}

/**
 * @brief 워크플로우 템플릿 목록 응답 타입
 */
export interface WorkflowTemplatesListResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    templateId: string;
    templateName: string;
    documentTag: string;
    reviewLine: Array<{ step: number; email: string; name: string }>;
    paymentLine: Array<{ step: number; email: string; name: string }>;
    isDefault: boolean;
    createdDate: string;
    updatedDate: string;
    createdBy: string;
    description?: string;
  }>;
  error?: string;
}