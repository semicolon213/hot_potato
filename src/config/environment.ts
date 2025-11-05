/**
 * @file environment.ts
 * @brief 환경변수 설정 파일
 * @details 애플리케이션에서 사용하는 모든 환경변수를 중앙에서 관리합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 환경변수 설정 객체
 * @details 모든 환경변수를 타입 안전하게 관리합니다.
 */
// 환경변수 접근 함수 (테스트 환경과 실제 환경 모두 지원)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Jest 테스트 환경에서는 process.env 사용
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return process.env[key] || defaultValue;
  }
  // 실제 애플리케이션에서는 import.meta.env 사용
  if (typeof window !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

export const ENV_CONFIG = {
  // Google API 설정
  GOOGLE_CLIENT_ID: getEnvVar('VITE_GOOGLE_CLIENT_ID'),

  // Apps Script URL
  APP_SCRIPT_URL: getEnvVar('VITE_APP_SCRIPT_URL'),

  // 스프레드시트 이름들 (ID는 동적으로 가져옴)
  HOT_POTATO_DB_SPREADSHEET_NAME: getEnvVar('VITE_HOT_POTATO_DB_SPREADSHEET_NAME', 'hot_potato_DB'),
  ANNOUNCEMENT_SPREADSHEET_NAME: getEnvVar('VITE_ANNOUNCEMENT_SPREADSHEET_NAME', 'notice'),
  CALENDAR_PROFESSOR_SPREADSHEET_NAME: getEnvVar('VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME', 'calendar_professor'),
  CALENDAR_STUDENT_SPREADSHEET_NAME: getEnvVar('VITE_CALENDAR_STUDENT_SPREADSHEET_NAME', 'calendar_student'),
  STUDENT_SPREADSHEET_NAME: getEnvVar('VITE_STUDENT_SPREADSHEET_NAME', 'student'),
  STAFF_SPREADSHEET_NAME: getEnvVar('VITE_STAFF_SPREADSHEET_NAME', 'staff'),

  // 시트 이름들 (원래 코드와 동일하게 수정)
  ANNOUNCEMENT_SHEET_NAME: getEnvVar('VITE_ANNOUNCEMENT_SHEET_NAME', '시트1'),
  CALENDAR_SHEET_NAME: getEnvVar('VITE_CALENDAR_SHEET_NAME', '시트1'),
  DOCUMENT_TEMPLATE_SHEET_NAME: getEnvVar('VITE_DOCUMENT_TEMPLATE_SHEET_NAME', 'document_template'),
  STUDENT_SHEET_NAME: getEnvVar('VITE_STUDENT_SHEET_NAME', 'info'),
  STUDENT_ISSUE_SHEET_NAME: getEnvVar('VITE_STUDENT_ISSUE_SHEET_NAME', 'std_issue'),
  STAFF_INFO_SHEET_NAME: getEnvVar('VITE_STAFF_INFO_SHEET_NAME', 'info'),
  STAFF_COMMITTEE_SHEET_NAME: getEnvVar('VITE_STAFF_COMMITTEE_SHEET_NAME', 'committee'),
  DASHBOARD_SHEET_NAME: getEnvVar('VITE_DASHBOARD_SHEET_NAME', 'user_custom'),

  // Papyrus DB 설정
  PAPYRUS_DB_URL: getEnvVar('VITE_PAPYRUS_DB_URL'),
  PAPYRUS_DB_API_KEY: getEnvVar('VITE_PAPYRUS_DB_API_KEY'),

  // 그룹스 이메일 설정
  GROUP_EMAILS: {
    STUDENT: getEnvVar('VITE_GROUP_EMAIL_STUDENT'),
    COUNCIL: getEnvVar('VITE_GROUP_EMAIL_COUNCIL'),
    PROFESSOR: getEnvVar('VITE_GROUP_EMAIL_PROFESSOR'),
    ADJUNCT_PROFESSOR: getEnvVar('VITE_GROUP_EMAIL_ADJUNCT_PROFESSOR'),
    ASSISTANT: getEnvVar('VITE_GROUP_EMAIL_ASSISTANT'),
  },

  // Drive 폴더 경로 설정
  ROOT_FOLDER_NAME: getEnvVar('VITE_ROOT_FOLDER_NAME', 'hot potato'),
  DOCUMENT_FOLDER_NAME: getEnvVar('VITE_DOCUMENT_FOLDER_NAME', '문서'),
  SHARED_DOCUMENT_FOLDER_NAME: getEnvVar('VITE_SHARED_DOCUMENT_FOLDER_NAME', '공유 문서'),
  PERSONAL_DOCUMENT_FOLDER_NAME: getEnvVar('VITE_PERSONAL_DOCUMENT_FOLDER_NAME', '개인 문서'),
  TEMPLATE_FOLDER_NAME: getEnvVar('VITE_TEMPLATE_FOLDER_NAME', '양식'),
  PERSONAL_TEMPLATE_FOLDER_NAME: getEnvVar('VITE_PERSONAL_TEMPLATE_FOLDER_NAME', '개인 양식'),
  ACCOUNTING_FOLDER_NAME: getEnvVar('VITE_ACCOUNTING_FOLDER_NAME', '회계'),
  EVIDENCE_FOLDER_NAME: getEnvVar('VITE_EVIDENCE_FOLDER_NAME', '증빙'),
  
  // 개인 설정 파일 이름
  PERSONAL_CONFIG_FILE_NAME: getEnvVar('VITE_PERSONAL_CONFIG_FILE_NAME', 'hp_potato_DB'),
} as const;

/**
 * @brief 환경변수 검증 함수
 * @details 필수 환경변수가 설정되었는지 확인합니다.
 * @returns {boolean} 모든 필수 환경변수가 설정되었으면 true
 */
export const validateEnvironmentVariables = (): boolean => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'ANNOUNCEMENT_SPREADSHEET_NAME',
    'CALENDAR_PROFESSOR_SPREADSHEET_NAME',
    'CALENDAR_STUDENT_SPREADSHEET_NAME',
    'STUDENT_SPREADSHEET_NAME',
  ];

  const missingVars = requiredVars.filter(varName => !ENV_CONFIG[varName as keyof typeof ENV_CONFIG]);

  if (missingVars.length > 0) {
    console.error('❌ 필수 환경변수가 설정되지 않았습니다:', missingVars);
    console.error('현재 설정된 환경변수:', {
      GOOGLE_CLIENT_ID: ENV_CONFIG.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음',
      APP_SCRIPT_URL: ENV_CONFIG.APP_SCRIPT_URL ? '설정됨' : '설정되지 않음'
    });
    return false;
  }

  console.log('✅ 모든 필수 환경변수가 설정되었습니다.');
  return true;
};
