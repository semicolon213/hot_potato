import { ENV_CONFIG, validateEnvironmentVariables } from '../environment';

// Mock import.meta.env
const mockEnv = {
  VITE_GOOGLE_CLIENT_ID: 'test-client-id',
  VITE_APP_SCRIPT_URL: 'test-app-script-url',
  VITE_HOT_POTATO_DB_SPREADSHEET_NAME: 'hot_potato_DB',
  VITE_BOARD_SPREADSHEET_NAME: 'board_professor',
  VITE_ANNOUNCEMENT_SPREADSHEET_NAME: 'notice_professor',
  VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME: 'calendar_professor',
  VITE_CALENDAR_STUDENT_SPREADSHEET_NAME: 'calendar_student',
  VITE_STUDENT_SPREADSHEET_NAME: 'student',
};

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true,
});

describe('Environment Configuration', () => {
  describe('ENV_CONFIG', () => {
    it('should have all required configuration values', () => {
      expect(ENV_CONFIG.GOOGLE_CLIENT_ID).toBe('test-client-id');
      expect(ENV_CONFIG.APP_SCRIPT_URL).toBe('test-app-script-url');
      expect(ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME).toBe('hot_potato_DB');
      expect(ENV_CONFIG.BOARD_SPREADSHEET_NAME).toBe('board_professor');
      expect(ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME).toBe('notice_professor');
      expect(ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME).toBe('calendar_professor');
      expect(ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME).toBe('calendar_student');
      expect(ENV_CONFIG.STUDENT_SPREADSHEET_NAME).toBe('student');
    });

    it('should have default values for optional configurations', () => {
      expect(ENV_CONFIG.BOARD_SHEET_NAME).toBe('시트1');
      expect(ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME).toBe('시트1');
      expect(ENV_CONFIG.CALENDAR_SHEET_NAME).toBe('시트1');
      expect(ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME).toBe('document_template');
      expect(ENV_CONFIG.STUDENT_SHEET_NAME).toBe('시트1');
      expect(ENV_CONFIG.STAFF_SHEET_NAME).toBe('시트1');
    });
  });

  describe('validateEnvironmentVariables', () => {
    it('should return true when all required variables are set', () => {
      const result = validateEnvironmentVariables();
      expect(result).toBe(true);
    });

    it('should return false when required variables are missing', () => {
      // Mock missing environment variables
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_GOOGLE_CLIENT_ID: '',
        },
        writable: true,
      });

      const result = validateEnvironmentVariables();
      expect(result).toBe(false);
    });
  });
});






