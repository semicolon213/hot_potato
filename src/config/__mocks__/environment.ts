/**
 * @file environment.ts (Mock)
 * @brief Jest 테스트 환경용 환경변수 모킹 파일
 * @details 테스트 환경에서 사용할 환경변수 모킹을 제공합니다.
 */

export const ENV_CONFIG = {
  // Google API 설정
  GOOGLE_CLIENT_ID: 'test-client-id',
  
  // Apps Script URL
  APP_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
  
  // 스프레드시트 이름들 (ID는 동적으로 가져옴)
  HOT_POTATO_DB_SPREADSHEET_NAME: 'hot_potato_DB',
  BOARD_SPREADSHEET_NAME: 'board_professor',
  ANNOUNCEMENT_SPREADSHEET_NAME: 'notice_professor',
  CALENDAR_PROFESSOR_SPREADSHEET_NAME: 'calendar_professor',
  CALENDAR_STUDENT_SPREADSHEET_NAME: 'calendar_student',
  STUDENT_SPREADSHEET_NAME: 'student',
  
  // 시트 이름들 (원래 코드와 동일하게 수정)
  BOARD_SHEET_NAME: '시트1',
  ANNOUNCEMENT_SHEET_NAME: '시트1',
  CALENDAR_SHEET_NAME: '시트1',
  DOCUMENT_TEMPLATE_SHEET_NAME: 'document_template',
  STUDENT_SHEET_NAME: 'info',
  STUDENT_ISSUE_SHEET_NAME: 'std_issue',
  STAFF_SHEET_NAME: '시트1',
  DASHBOARD_SHEET_NAME: 'user_custom',
  
  // Papyrus DB 설정
  PAPYRUS_DB_URL: '',
  PAPYRUS_DB_API_KEY: 'test-api-key',
} as const;

export const validateEnvironmentVariables = (): boolean => {
  console.log('✅ 모든 필수 환경변수가 설정되었습니다. (Mock)');
  return true;
};