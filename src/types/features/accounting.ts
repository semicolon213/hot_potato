/**
 * @file accounting.ts
 * @brief 회계 기능 타입 정의
 * @details 장부, 통장, 예산 계획, 카테고리 등 회계 관련 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 장부 정보 타입
 */
export interface LedgerInfo {
  folderId: string;              // 장부 폴더 ID
  folderName: string;            // 장부 이름 (폴더 이름)
  spreadsheetId: string;          // 장부 스프레드시트 ID
  evidenceFolderId: string;       // 증빙 폴더 ID
  createdDate?: string;           // 생성일
  createdBy?: string;             // 생성자 ID
  mainManagerId?: string;         // 주관리인 ID
  subManagerIds?: string[];       // 별도 관리인 ID 목록
  accessGroupEmails?: string[];   // 접근 권한 그룹 이메일 목록
  accessUserEmails?: string[];   // 접근 권한 사용자 이메일 목록
}

/**
 * @brief 통장 정보 타입
 */
export interface Account {
  accountId: string;              // 통장 고유 ID
  accountName: string;            // 통장 이름
  initialBalance: number;         // 최초 잔액
  currentBalance: number;          // 현재 잔액
  mainManagerId: string;           // 주관리인 ID
  subManagerIds: string[];        // 별도 관리인 ID 목록
  accessGroupEmails: string[];    // 접근 권한 그룹 이메일 목록
  accessUserEmails: string[];    // 접근 권한 사용자 이메일 목록
  createdBy: string;              // 생성자 ID
  createdDate: string;            // 생성일
  isActive: boolean;              // 활성화 여부
}

/**
 * @brief 장부 항목 타입
 */
export interface LedgerEntry {
  entryId: string;                 // 항목 고유 ID
  accountId: string;               // 통장 ID
  date: string;                     // 거래일
  category: string;                 // 카테고리
  description: string;             // 내용
  amount: number;                  // 금액 (수입: 양수, 지출: 음수)
  balanceAfter: number;            // 거래 후 잔액
  source: string;                  // 출처/수입처
  transactionType: 'income' | 'expense'; // 거래 유형
  evidenceFileId?: string;         // 증빙 문서 파일 ID
  evidenceFileName?: string;       // 증빙 문서 파일명
  createdBy: string;               // 작성자 ID
  createdDate: string;             // 작성일
  isBudgetExecuted: boolean;       // 예산 집행 여부
  budgetPlanId?: string;           // 예산 계획 ID (예산 집행인 경우)
}

/**
 * @brief 예산 계획 타입
 */
export interface BudgetPlan {
  budgetId: string;                // 예산 계획 고유 ID
  accountId: string;               // 통장 ID
  title: string;                    // 예산 계획 제목
  totalAmount: number;             // 총 예산액
  requestedDate: string;           // 신청일
  plannedExecutionDate: string;     // 계획된 집행일
  status: 'pending' | 'reviewed' | 'approved' | 'executed' | 'rejected'; // 상태
  subManagerReviewed: boolean;    // 부관리인 검토 여부 (하위 호환성)
  subManagerReviewDate?: string;   // 부관리인 검토일 (하위 호환성)
  subManagerReviews: Array<{ email: string; date: string }>; // 서브 관리자별 검토 목록
  mainManagerApproved: boolean;    // 주관리인 승인 여부
  mainManagerApprovalDate?: string; // 주관리인 승인일
  executedDate?: string;           // 집행일
  createdBy: string;               // 작성자 ID
  rejectionReason?: string;        // 거부 사유
  details: BudgetPlanDetail[];     // 예산 계획 상세
}

/**
 * @brief 예산 계획 상세 타입
 */
export interface BudgetPlanDetail {
  detailId: string;                 // 상세 항목 ID
  category: string;                 // 카테고리
  description: string;              // 설명
  amount: number;                   // 금액
  plannedDate?: string;             // 항목별 집행 예정일
}

/**
 * @brief 카테고리 타입
 */
export interface Category {
  categoryId: string;               // 카테고리 고유 ID
  categoryName: string;             // 카테고리 이름
  description?: string;              // 설명
  createdBy: string;                // 생성자 ID
  createdDate: string;              // 생성일
  isActive: boolean;                // 활성화 여부
  usageCount: number;               // 사용 횟수
}

/**
 * @brief 장부 생성 요청 타입
 */
export interface CreateLedgerRequest {
  ledgerName: string;                // 장부 이름
  accountName: string;              // 통장 이름 (장부마다 통장 하나)
  initialBalance: number;           // 최초 잔액
  creatorEmail: string;            // 생성자 이메일
  accessUsers: string[];           // 접근 권한 사용자 이메일 목록
  accessGroups: string[];          // 접근 권한 그룹 역할 코드 (예: ['std_council', 'professor'])
  mainManagerEmail: string;        // 주관리인 이메일
  subManagerEmails: string[];      // 별도 관리인 이메일 목록
}

/**
 * @brief 통장 생성 요청 타입
 */
export interface CreateAccountRequest {
  accountName: string;             // 통장 이름
  initialBalance: number;          // 최초 잔액
  mainManagerId: string;           // 주관리인 ID
  subManagerIds: string[];         // 별도 관리인 ID 목록
  accessGroupEmails: string[];     // 접근 권한 그룹 이메일 목록
  accessUserEmails: string[];     // 접근 권한 사용자 이메일 목록
}

/**
 * @brief 장부 항목 생성 요청 타입
 */
export interface CreateLedgerEntryRequest {
  accountId: string;                // 통장 ID
  date: string;                     // 거래일
  category: string;                 // 카테고리
  description: string;              // 내용
  amount: number;                   // 금액 (양수)
  source: string;                  // 출처/수입처
  transactionType: 'income' | 'expense'; // 거래 유형
  evidenceFile?: File;              // 증빙 문서 (선택사항)
}

/**
 * @brief 예산 계획 생성 요청 타입
 */
export interface CreateBudgetPlanRequest {
  accountId: string;                // 통장 ID
  title: string;                     // 제목
  totalAmount: number;              // 총 예산액
  plannedExecutionDate: string;      // 계획된 집행일
  details?: Omit<BudgetPlanDetail, 'detailId'>[]; // 예산 계획 상세 (선택사항)
}

/**
 * @brief 예산 계획 상세 수정 요청 타입
 */
export interface UpdateBudgetPlanDetailsRequest {
  details: Omit<BudgetPlanDetail, 'detailId'>[]; // 예산 계획 상세
}

/**
 * @brief 필터 옵션 타입
 */
export interface LedgerEntryFilter {
  startDate?: string;               // 시작 날짜
  endDate?: string;                 // 종료 날짜
  categories?: string[];             // 카테고리 목록
  transactionType?: 'all' | 'income' | 'expense'; // 거래 유형
  searchTerm?: string;              // 검색어 (금액, 출처명)
}

/**
 * @brief 내보내기 템플릿 타입
 */
export interface ExportTemplate {
  templateId: string;               // 템플릿 ID
  templateName: string;              // 템플릿 이름
  templateFileId: string;           // 템플릿 파일 ID
  templateSheetName: string;        // 사용할 시트 이름
  mappingConfig: MappingConfig;    // 매핑 설정
  description: string;              // 설명
  createdBy: string;                // 생성자 ID
  createdDate: string;              // 생성일
}

/**
 * @brief 매핑 설정 타입
 */
export interface MappingConfig {
  startRow: number;                 // 데이터 입력 시작 행
  mappings: Record<string, string>; // 셀 주소 → 데이터 필드 매핑
  multipleRows: boolean;             // 여러 행에 데이터 입력 여부
  summaryRow?: string;               // 합계 행 위치 (선택사항)
  summaryFormula?: string;            // 합계 수식 (선택사항)
}

/**
 * @brief 장부 데이터 필드 타입
 */
export type LedgerDataField = 
  | 'date'              // 거래일
  | 'description'       // 내용
  | 'category'          // 카테고리
  | 'amount'            // 금액
  | 'balance_after'     // 거래 후 잔액
  | 'source'            // 출처/수입처
  | 'transaction_type'  // 거래 유형 (수입/지출)
  | 'created_by'        // 작성자
  | 'created_date';     // 작성일

/**
 * @brief 역할 코드 타입
 */
export type RoleCode = 
  | 'student'
  | 'std_council'
  | 'supp'
  | 'professor'
  | 'ad_professor';

