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
export const ENV_CONFIG = {
  // Google API 설정
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // Apps Script URL
  APP_SCRIPT_URL: import.meta.env.VITE_APP_SCRIPT_URL || '',
  
  // 스프레드시트 이름들 (ID는 동적으로 가져옴)
  HOT_POTATO_DB_SPREADSHEET_NAME: import.meta.env.VITE_HOT_POTATO_DB_SPREADSHEET_NAME || 'hot_potato_DB',
  BOARD_SPREADSHEET_NAME: import.meta.env.VITE_BOARD_SPREADSHEET_NAME || 'board_professor',
  ANNOUNCEMENT_SPREADSHEET_NAME: import.meta.env.VITE_ANNOUNCEMENT_SPREADSHEET_NAME || 'notice_professor',
  CALENDAR_PROFESSOR_SPREADSHEET_NAME: import.meta.env.VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME || 'calendar_professor',
  CALENDAR_STUDENT_SPREADSHEET_NAME: import.meta.env.VITE_CALENDAR_STUDENT_SPREADSHEET_NAME || 'calendar_student',
  STUDENT_SPREADSHEET_NAME: import.meta.env.VITE_STUDENT_SPREADSHEET_NAME || 'student',
  
  // 시트 이름들 (원래 코드와 동일하게 수정)
  BOARD_SHEET_NAME: import.meta.env.VITE_BOARD_SHEET_NAME || '시트1',
  ANNOUNCEMENT_SHEET_NAME: import.meta.env.VITE_ANNOUNCEMENT_SHEET_NAME || '시트1',
  CALENDAR_SHEET_NAME: import.meta.env.VITE_CALENDAR_SHEET_NAME || '시트1',
  DOCUMENT_TEMPLATE_SHEET_NAME: import.meta.env.VITE_DOCUMENT_TEMPLATE_SHEET_NAME || 'document_template',
  STUDENT_SHEET_NAME: import.meta.env.VITE_STUDENT_SHEET_NAME || 'info',
  STUDENT_ISSUE_SHEET_NAME: import.meta.env.VITE_STUDENT_ISSUE_SHEET_NAME || 'std_issue',
  STAFF_SHEET_NAME: import.meta.env.VITE_STAFF_SHEET_NAME || '시트1',
  DASHBOARD_SHEET_NAME: import.meta.env.VITE_DASHBOARD_SHEET_NAME || 'user_custom',
  
  // Papyrus DB 설정
  PAPYRUS_DB_URL: import.meta.env.VITE_PAPYRUS_DB_URL || '',
  PAPYRUS_DB_API_KEY: import.meta.env.VITE_PAPYRUS_DB_API_KEY || '',
} as const;

/**
 * @brief 환경변수 검증 함수
 * @details 필수 환경변수가 설정되었는지 확인합니다.
 * @returns {boolean} 모든 필수 환경변수가 설정되었으면 true
 */
export const validateEnvironmentVariables = (): boolean => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'HOT_POTATO_DB_SPREADSHEET_NAME',
    'BOARD_SPREADSHEET_NAME',
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
