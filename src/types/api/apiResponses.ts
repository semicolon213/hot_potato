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
  notFound?: string[];
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

/**
 * @brief 정적 태그 응답 타입
 */
export interface StaticTagsResponse {
  success: boolean;
  data?: string[];
  tags?: string[];
  error?: string;
}

/**
 * @brief 영향받는 템플릿 응답 타입
 */
export interface AffectedTemplatesResponse {
  success: boolean;
  data?: Array<{
    templateId: string;
    templateName: string;
    tag: string;
  }>;
  affectedTemplates?: Array<{
    templateId: string;
    templateName: string;
    tag: string;
  }>;
  error?: string;
}

/**
 * @brief 태그 삭제 응답 타입
 */
export interface DeleteTagResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * @brief 태그 영향 확인 응답 타입
 */
export interface TagImpactCheckResponse {
  success: boolean;
  data?: {
    affectedTemplates: Array<{
      templateId: string;
      templateName: string;
      tag: string;
    }>;
    canDelete: boolean;
  };
  error?: string;
}

/**
 * @brief 공유 템플릿 응답 타입
 */
export interface SharedTemplatesResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    tag?: string;
    description?: string;
    createdDate?: string;
    updatedDate?: string;
    createdBy?: string;
  }>;
  templates?: Array<{
    id: string;
    name: string;
    tag?: string;
    description?: string;
    createdDate?: string;
    updatedDate?: string;
    createdBy?: string;
  }>;
  error?: string;
}

/**
 * @brief 문서 생성 응답 타입
 */
export interface CreateDocumentResponse {
  success: boolean;
  data?: {
    id: string;
    documentId: string;
    fileId: string;
    name: string;
    title: string;
    url: string;
    webViewLink: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
  };
  error?: string;
}

/**
 * @brief 사용자 등록 데이터 타입
 */
export interface RegistrationData {
  email: string;
  name: string;
  studentId: string;
  userType: string;
  isAdmin: boolean;
  adminKey?: string;
}

/**
 * @brief 문서 목록 응답 타입
 */
export interface DocumentsListResponse {
  success: boolean;
  data?: Array<{
    id?: string;
    documentId?: string;
    fileId?: string;
    name?: string;
    title?: string;
    creator?: string;
    author?: string;
    createdTime?: string;
    created_at?: string;
    modifiedTime?: string;
    lastModified?: string;
    url?: string;
    webViewLink?: string;
    mimeType?: string;
    type?: string;
    tag?: string;
    documentType?: 'shared' | 'personal';
    [key: string]: unknown;
  }>;
  documents?: Array<{
    id?: string;
    documentId?: string;
    fileId?: string;
    name?: string;
    title?: string;
    creator?: string;
    author?: string;
    createdTime?: string;
    created_at?: string;
    modifiedTime?: string;
    lastModified?: string;
    url?: string;
    webViewLink?: string;
    mimeType?: string;
    type?: string;
    tag?: string;
    documentType?: 'shared' | 'personal';
    [key: string]: unknown;
  }>;
  error?: string;
}

/**
 * @brief 문서 정보 응답 타입
 */
export interface DocumentInfoResponse {
  id?: string;
  documentId?: string;
  fileId?: string;
  name?: string;
  title?: string;
  creator?: string;
  author?: string;
  createdTime?: string;
  created_at?: string;
  modifiedTime?: string;
  lastModified?: string;
  url?: string;
  webViewLink?: string;
  mimeType?: string;
  type?: string;
  tag?: string;
  documentType?: 'shared' | 'personal';
  [key: string]: unknown;
}

/**
 * @brief 워크플로우 정보 응답 타입
 */
export interface WorkflowInfoResponse {
  success: boolean;
  data?: {
    workflowId: string;
    documentId?: string;
    workflowDocumentId?: string;
    status: string;
    requesterEmail: string;
    requesterName?: string;
    reviewLine?: Array<{ step: number; email: string; name: string; status?: string }>;
    paymentLine?: Array<{ step: number; email: string; name: string; status?: string }>;
    createdDate?: string;
    updatedDate?: string;
  };
  error?: string;
}

/**
 * @brief 워크플로우 목록 응답 타입
 */
export interface WorkflowListResponse {
  success: boolean;
  data?: Array<{
    workflowId: string;
    documentId?: string;
    workflowDocumentId?: string;
    status: string;
    requesterEmail: string;
    requesterName?: string;
    createdDate?: string;
    updatedDate?: string;
  }>;
  workflows?: Array<{
    workflowId: string;
    documentId?: string;
    workflowDocumentId?: string;
    status: string;
    requesterEmail: string;
    requesterName?: string;
    createdDate?: string;
    updatedDate?: string;
  }>;
  error?: string;
}

/**
 * @brief 템플릿 정보 타입
 */
export interface TemplateInfo {
  name: string;
  id?: string;
  tag?: string;
  [key: string]: unknown;
}

// documents.ts에서 re-export
export type { WorkflowRequestResponse } from '../documents';