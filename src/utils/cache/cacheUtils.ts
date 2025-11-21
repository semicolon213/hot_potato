/**
 * @file cacheUtils.ts
 * @brief 캐시 유틸리티 함수
 * @details 캐시 키 생성 및 TTL 설정을 제공합니다.
 */

/**
 * 캐시 키 생성
 * 패턴: {category}:{action}:{paramsHash}
 */
export function generateCacheKey(
  category: string,
  action: string,
  params: Record<string, unknown> = {}
): string {
  // params를 정렬하여 일관된 키 생성
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  const paramsHash = JSON.stringify(sortedParams);
  return `${category}:${action}:${paramsHash}`;
}

/**
 * 캐시 TTL (Time To Live) 설정
 * 데이터 유형별 만료 시간 (토큰 만료 시간 고려하여 최대 50분)
 */
export const CACHE_TTL: Record<string, number> = {
  // 자주 변경되는 데이터 (중요도 높음)
  'getMyPendingWorkflows': 3 * 60 * 1000,      // 3분
  'getMyRequestedWorkflows': 3 * 60 * 1000,    // 3분
  'getCompletedWorkflows': 3 * 60 * 1000,      // 3분
  'getWorkflowStatus': 3 * 60 * 1000,          // 3분
  'getWorkflowHistory': 3 * 60 * 1000,         // 3분
  
  'getLedgerEntries': 5 * 60 * 1000,           // 5분
  'getAccounts': 5 * 60 * 1000,                // 5분
  'getAccountingCategorySummary': 5 * 60 * 1000, // 5분
  'getPendingBudgetPlans': 5 * 60 * 1000,      // 5분
  
  // 중간 빈도 데이터
  'getDocuments': 10 * 60 * 1000,              // 10분
  'getAllDocuments': 10 * 60 * 1000,          // 10분
  'getAnnouncements': 10 * 60 * 1000,           // 10분
  'fetchAnnouncements': 10 * 60 * 1000,        // 10분
  'fetchCalendarEvents': 15 * 60 * 1000,       // 15분
  
  // 드물게 변경되는 데이터 (토큰 만료 시간 고려하여 30분으로 제한)
  'getAllUsers': 30 * 60 * 1000,               // 30분
  'getPendingUsers': 30 * 60 * 1000,           // 30분
  'getTemplates': 30 * 60 * 1000,               // 30분
  'getSharedTemplates': 30 * 60 * 1000,        // 30분
  'getStaticTags': 30 * 60 * 1000,             // 30분
  'getWorkflowTemplates': 30 * 60 * 1000,      // 30분
  'fetchStudents': 30 * 60 * 1000,             // 30분
  'fetchStaff': 30 * 60 * 1000,                // 30분
  'fetchAttendees': 30 * 60 * 1000,            // 30분
  'fetchStudentIssues': 10 * 60 * 1000,        // 10분
  'fetchStaffFromPapyrus': 30 * 60 * 1000,    // 30분
  'fetchCommitteeFromPapyrus': 30 * 60 * 1000, // 30분
  
  // 거의 변경 안 되는 데이터 (토큰 만료 시간 고려하여 45분으로 제한)
  'getSpreadsheetIds': 45 * 60 * 1000,         // 45분
  'getAccountingFolderId': 45 * 60 * 1000,     // 45분
  'getAccountingCategories': 45 * 60 * 1000,    // 45분
  'getLedgerList': 45 * 60 * 1000,             // 45분
};

/**
 * 액션별 카테고리 매핑
 */
export const ACTION_CATEGORY_MAP: Record<string, string> = {
  // 사용자 관리
  'getAllUsers': 'users',
  'getPendingUsers': 'users',
  'getUserNameByEmail': 'users',
  'checkApprovalStatus': 'users',
  
  // 문서 관리
  'getDocuments': 'documents',
  'getAllDocuments': 'documents',
  'getTemplates': 'templates',
  'getSharedTemplates': 'templates',
  'getStaticTags': 'tags',
  
  // 워크플로우
  'getMyRequestedWorkflows': 'workflow',
  'getMyPendingWorkflows': 'workflow',
  'getCompletedWorkflows': 'workflow',
  'getWorkflowStatus': 'workflow',
  'getWorkflowHistory': 'workflow',
  'getWorkflowTemplates': 'workflow',
  
  // 회계
  'getLedgerList': 'accounting',
  'getLedgerEntries': 'accounting',
  'getAccounts': 'accounting',
  'getAccountingCategories': 'accounting',
  'getAccountingCategorySummary': 'accounting',
  'getPendingBudgetPlans': 'accounting',
  'getAccountingFolderId': 'accounting',
  
  // 공지사항
  'getAnnouncements': 'announcements',
  'fetchAnnouncements': 'announcements',
  
  // 캘린더
  'fetchCalendarEvents': 'calendar',
  
  // 학생/교직원
  'fetchStudents': 'students',
  'fetchStaff': 'staff',
  'fetchAttendees': 'attendees',
  'fetchStudentIssues': 'students',
  'fetchStaffFromPapyrus': 'staff',
  'fetchCommitteeFromPapyrus': 'staff',
  
  // 스프레드시트 관리
  'getSpreadsheetIds': 'spreadsheetIds',
};

/**
 * 읽기 전용 액션 목록 (캐싱 가능)
 */
export const CACHEABLE_ACTIONS: string[] = [
  // 사용자 관리
  'getAllUsers',
  'getPendingUsers',
  'getUserNameByEmail',
  'checkApprovalStatus',
  
  // 문서 관리
  'getDocuments',
  'getAllDocuments',
  'getTemplates',
  'getSharedTemplates',
  'getStaticTags',
  
  // 워크플로우
  'getMyRequestedWorkflows',
  'getMyPendingWorkflows',
  'getCompletedWorkflows',
  'getWorkflowStatus',
  'getWorkflowHistory',
  'getWorkflowTemplates',
  
  // 회계
  'getLedgerList',
  'getLedgerEntries',
  'getAccounts',
  'getAccountingCategories',
  'getAccountingCategorySummary',
  'getPendingBudgetPlans',
  'getAccountingFolderId',
  
  // 공지사항
  'getAnnouncements',
  'fetchAnnouncements',
  
  // 캘린더
  'fetchCalendarEvents',
  
  // 학생/교직원
  'fetchStudents',
  'fetchStaff',
  'fetchAttendees',
  'fetchStudentIssues',
  'fetchStaffFromPapyrus',
  'fetchCommitteeFromPapyrus',
  
  // 스프레드시트 관리
  'getSpreadsheetIds',
];

/**
 * 액션의 TTL 가져오기
 */
export function getCacheTTL(action: string): number {
  return CACHE_TTL[action] || 10 * 60 * 1000; // 기본값: 10분
}

/**
 * 액션의 카테고리 가져오기
 */
export function getActionCategory(action: string): string {
  return ACTION_CATEGORY_MAP[action] || 'default';
}

