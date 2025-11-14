/**
 * @file api.ts
 * @brief API 설정 파일
 * @details 애플리케이션에서 사용하는 API 관련 설정과 상수들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { ENV_CONFIG } from './environment';

/**
 * @brief API 설정 객체
 * @details API 호출에 필요한 기본 설정들을 포함합니다.
 */
export const API_CONFIG = {
  // Apps Script 웹앱 URL (환경변수에서 가져오기)
  APP_SCRIPT_URL: ENV_CONFIG.APP_SCRIPT_URL,
  
  // Google Client ID (기존 환경변수)
  GOOGLE_CLIENT_ID: ENV_CONFIG.GOOGLE_CLIENT_ID,
  
  // API 타임아웃 (밀리초)
  TIMEOUT: 60000, // 60초로 증가
  
  // 재시도 횟수
  MAX_RETRIES: 5, // 5회로 증가
};

/**
 * @brief API 액션 상수들
 * @details Apps Script에서 사용하는 액션 이름들을 정의합니다.
 */
export const API_ACTIONS = {
  // 사용자 관리
  GET_ALL_USERS: 'getAllUsers',
  GET_PENDING_USERS: 'getPendingUsers',
  APPROVE_USER: 'approveUser',
  APPROVE_USER_WITH_GROUP: 'approveUserWithGroup',
  REJECT_USER: 'rejectUser',
  ADD_USERS_TO_SPREADSHEET: 'addUsersToSpreadsheet',
  REQUEST_PINNED_ANNOUNCEMENT_APPROVAL: 'requestPinnedAnnouncementApproval',
  
  // 공지사항 관리
  GET_ANNOUNCEMENTS: 'getAnnouncements',
  CREATE_ANNOUNCEMENT: 'createAnnouncement',
  UPDATE_ANNOUNCEMENT: 'updateAnnouncement',
  DELETE_ANNOUNCEMENT: 'deleteAnnouncement',
  INCREMENT_ANNOUNCEMENT_VIEW: 'incrementAnnouncementView',
  REQUEST_PINNED_ANNOUNCEMENT: 'requestPinnedAnnouncement',
  APPROVE_PINNED_ANNOUNCEMENT: 'approvePinnedAnnouncement',
  GET_PINNED_ANNOUNCEMENT_REQUESTS: 'getPinnedAnnouncementRequests',
  GET_ANNOUNCEMENT_USER_LIST: 'getAnnouncementUserList',
  
  // 인증
  CHECK_APPROVAL_STATUS: 'checkApprovalStatus',
  SUBMIT_REGISTRATION_REQUEST: 'submitRegistrationRequest',
  VERIFY_ADMIN_KEY: 'verifyAdminKey',
  
  // 관리자 키
  SEND_ADMIN_KEY_EMAIL: 'sendAdminKeyEmail',
  CLEAR_USER_CACHE: 'clearUserCache',
  
  // 이메일 마이그레이션
  MIGRATE_EMAILS: 'migrateEmails',
  
  // 테스트
  TEST_EMAIL_ENCRYPTION: 'testEmailEncryption',
  TEST_ALL_APP_SCRIPT: 'testAllAppScript',
} as const;

/**
 * @brief API 응답 타입 정의
 * @details API 호출 결과를 나타내는 표준 응답 형식입니다.
 * @template T 응답 데이터의 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  // 관리자 관련 응답
  users?: Array<Record<string, unknown>>;
  adminKey?: string;
  encryptedKey?: string;
  layersUsed?: number;
  emailTemplate?: {
    to: string;
    subject: string;
    html: string;
  };
  // 로그인 관련 응답
  approvalStatus?: string;
  // 에러 관련
  stack?: string;
}

/**
 * @brief API 요청 옵션 타입 정의
 * @details API 호출 시 사용할 수 있는 옵션들을 정의합니다.
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
