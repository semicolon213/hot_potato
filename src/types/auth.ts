/**
 * @file auth.ts
 * @brief 인증 관련 타입 정의
 * @details Google OAuth 및 사용자 인증 관련 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief Google OAuth 토큰 응답 타입
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
}

/**
 * @brief Google 사용자 정보 타입
 */
export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

