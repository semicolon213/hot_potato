// Apps Script API 응답 타입 정의

// 스프레드시트 ID 조회 응답
export interface SpreadsheetIdsResponse {
  [spreadsheetName: string]: string;
}

// 기본 태그 목록 조회 응답 (이미 string[]로 처리되지만 명시)
export type StaticTagsResponse = string[];

// 템플릿 정보
export interface TemplateInfo {
  id: string;
  name: string;
  title?: string;
}

// 영향받는 템플릿 정보 (태그 수정/삭제 시)
export interface AffectedTemplatesResponse {
  affectedSharedTemplates: TemplateInfo[];
  affectedPersonalTemplates: TemplateInfo[];
}

// 태그 삭제 응답
export interface DeleteTagResponse {
  deletedSharedTemplates?: number;
  deletedPersonalTemplates?: number;
  updatedPersonalTemplates?: number;
}

// 태그 수정/삭제 확인 응답 (confirm: false일 때)
export interface TagImpactCheckResponse {
  affectedSharedTemplates: TemplateInfo[];
  affectedPersonalTemplates: TemplateInfo[];
}

// 공유 템플릿 정보
export interface SharedTemplate {
  id: string;
  title: string;
  description: string;
  tag: string;
  creatorEmail: string;
  createdDate: string;
  fullTitle: string;
  modifiedDate: string;
  mimeType: string;
  owner: string;
}

// 공유 템플릿 목록 응답
export type SharedTemplatesResponse = SharedTemplate[];

// 문서 생성 응답
export interface CreateDocumentResponse {
  documentUrl: string;
  documentId?: string;
  debug?: {
    metadataStatus?: string;
    metadataError?: string;
    requestedEditors?: string[];
    permissionSuccess?: boolean;
    permissionMessage?: string;
    grantedUsers?: string[];
    currentEditors?: string[];
    tag?: string;
    creatorEmail?: string;
    documentId?: string;
    verifiedProperties?: Record<string, string>;
  };
  permissionResult?: {
    successCount: number;
    failCount: number;
  };
}

// 사용자 등록 요청 데이터
export interface RegistrationData {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey?: string;
  userType?: string;
}

// 문서 정보 (getDocuments API 응답)
export interface DocumentInfoResponse {
  id: string;
  documentNumber?: string;
  title: string;
  author?: string;
  authorEmail?: string;
  createdTime?: string;
  lastModified?: string;
  url?: string;
  mimeType?: string;
  tag?: string;
  originalIndex?: number;
  approvalDate?: string;
  status?: string;
  permission?: string;
}

// 문서 목록 응답 (data가 직접 배열인 경우)
export type DocumentsListResponse = DocumentInfoResponse[];

// 사용자 이름 조회 응답
export interface UserNameResponse {
  name: string;
}

// 워크플로우 관련 응답 타입 (documents.ts에서 import할 수도 있지만, apiResponses.ts에도 정의)
export interface WorkflowRequestResponse {
  workflowId: string;
  createWorkflowDocument: boolean;
  attachDocument: boolean;
  workflowDocumentId?: string;
  workflowDocumentUrl?: string;
  documentId?: string;
  documentUrl?: string;
  attachedDocumentIds?: string[];  // 여러 첨부 문서 ID 목록
  attachedDocumentUrls?: string[];  // 여러 첨부 문서 URL 목록
  attachedDocumentTitles?: string[];  // 여러 첨부 문서 제목 목록
  attachedDocumentId?: string;  // 하위 호환성 (첫 번째 문서)
  attachedDocumentUrl?: string;  // 하위 호환성 (첫 번째 문서)
  attachedDocumentTitle?: string;  // 하위 호환성 (첫 번째 문서)
  workflowStatus: string;
  workflowRequestDate: string;
  reviewLine: Array<{
    step: number;
    email: string;
    name: string;
    status?: string;
    date?: string;
    reason?: string;
    opinion?: string;
  }>;
  paymentLine: Array<{
    step: number;
    email: string;
    name: string;
    status?: string;
    date?: string;
    reason?: string;
    opinion?: string;
  }>;
  permissionResult: {
    successCount: number;
    failCount: number;
    grantedUsers: string[];
    failedUsers: string[];
  };
  requiresFrontendPermissionGrant?: boolean;  // 프론트엔드에서 권한 부여 필요 여부 (개인 문서)
  personalDocuments?: Array<{                 // 프론트엔드에서 권한 부여할 문서 목록
    documentId: string;
    userEmails: string[];
  }>;
}

export interface WorkflowInfoResponse {
  workflowId: string;
  workflowType: string;
  documentId?: string;
  documentTitle?: string;
  documentUrl?: string;
  workflowDocumentId?: string;
  workflowDocumentTitle?: string;
  workflowDocumentUrl?: string;
  attachedDocumentIds?: string[];  // 여러 첨부 문서 ID 목록 (쉼표로 구분된 문자열을 파싱)
  attachedDocumentUrls?: string[];  // 여러 첨부 문서 URL 목록 (쉼표로 구분된 문자열을 파싱)
  attachedDocumentTitles?: string[];  // 여러 첨부 문서 제목 목록 (쉼표로 구분된 문자열을 파싱)
  attachedDocumentId?: string;  // 하위 호환성 (첫 번째 문서 또는 단일 문서)
  attachedDocumentTitle?: string;  // 하위 호환성 (첫 번째 문서 또는 단일 문서)
  attachedDocumentUrl?: string;  // 하위 호환성 (첫 번째 문서 또는 단일 문서)
  requesterEmail: string;
  requesterName: string;
  workflowStatus: string;
  workflowRequestDate: string;
  currentReviewStep?: number;
  currentPaymentStep?: number;
  reviewLine: Array<{
    step: number;
    email: string;
    name: string;
    status?: string;
    date?: string;
    reason?: string;
    opinion?: string;
  }>;
  paymentLine: Array<{
    step: number;
    email: string;
    name: string;
    status?: string;
    date?: string;
    reason?: string;
    opinion?: string;
  }>;
  workflowCompleteDate?: string;
}

export type WorkflowListResponse = WorkflowInfoResponse[];

export interface WorkflowTemplateResponse {
  templateId: string;
  templateName: string;
  documentTag: string;
  reviewLine: Array<{
    step: number;
    email: string;
    name: string;
  }>;
  paymentLine: Array<{
    step: number;
    email: string;
    name: string;
  }>;
  isDefault: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  description?: string;
}

export type WorkflowTemplatesListResponse = WorkflowTemplateResponse[];

