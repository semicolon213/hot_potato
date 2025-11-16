/**
 * @file tokenManager.ts
 * @brief Google OAuth 토큰 관리 유틸리티
 * @details Access Token의 만료 시간을 관리하고 검증하는 유틸리티 함수들
 */

export interface TokenData {
  accessToken: string;
  refreshToken?: string;  // Refresh Token (선택적)
  expiresAt: number;  // 만료 시각 (timestamp, milliseconds)
  issuedAt: number;   // 발급 시각 (timestamp, milliseconds)
}

/**
 * @brief 토큰 관리자
 */
export const tokenManager = {
  /**
   * @brief 토큰 저장
   * @param accessToken - Google OAuth Access Token
   * @param expiresIn - 토큰 만료 시간 (초 단위, 예: 3600 = 1시간)
   * @param refreshToken - Refresh Token (선택적)
   */
  save: (accessToken: string, expiresIn: number, refreshToken?: string): void => {
    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      issuedAt: Date.now()
    };
    localStorage.setItem('googleAccessToken', JSON.stringify(tokenData));
    console.log('✅ 토큰 저장 완료:', {
      expiresAt: new Date(tokenData.expiresAt).toLocaleString(),
      expiresIn: `${expiresIn}초 (${(expiresIn / 60).toFixed(1)}분)`,
      hasRefreshToken: !!refreshToken
    });
  },

  /**
   * @brief 토큰 가져오기 (만료 체크 포함)
   * @returns 유효한 토큰이면 accessToken, 만료되었거나 없으면 null
   */
  get: (): string | null => {
    const tokenDataStr = localStorage.getItem('googleAccessToken');
    if (!tokenDataStr) {
      return null;
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr);
      
      // 만료 여부 확인 (1분 여유를 두고 만료로 간주)
      const oneMinute = 60 * 1000;
      const now = Date.now();
      
      if (now >= (tokenData.expiresAt - oneMinute)) {
        // 만료된 토큰 삭제
        console.warn('⚠️ 토큰이 만료되었습니다. 삭제합니다.');
        localStorage.removeItem('googleAccessToken');
        return null;
      }
      
      return tokenData.accessToken;
    } catch (error) {
      console.error('토큰 파싱 실패:', error);
      // 잘못된 형식의 토큰 삭제
      localStorage.removeItem('googleAccessToken');
      return null;
    }
  },

  /**
   * @brief 토큰 유효성 확인
   * @returns 토큰이 유효하면 true, 만료되었거나 없으면 false
   */
  isValid: (): boolean => {
    return tokenManager.get() !== null;
  },

  /**
   * @brief 토큰 데이터 전체 가져오기 (만료 시간 등 포함)
   * @returns 토큰 데이터 또는 null
   */
  getTokenData: (): TokenData | null => {
    const tokenDataStr = localStorage.getItem('googleAccessToken');
    if (!tokenDataStr) {
      return null;
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr);
      return tokenData;
    } catch (error) {
      console.error('토큰 데이터 파싱 실패:', error);
      return null;
    }
  },

  /**
   * @brief 토큰 삭제
   */
  clear: (): void => {
    localStorage.removeItem('googleAccessToken');
    console.log('✅ 토큰 삭제 완료');
  },

  /**
   * @brief 토큰 만료까지 남은 시간 (밀리초)
   * @returns 남은 시간 (밀리초), 만료되었거나 없으면 0
   */
  getTimeUntilExpiry: (): number => {
    const tokenData = tokenManager.getTokenData();
    if (!tokenData) {
      return 0;
    }

    const remaining = tokenData.expiresAt - Date.now();
    return Math.max(0, remaining);
  },

  /**
   * @brief 토큰이 곧 만료되는지 확인 (5분 이내)
   * @returns 5분 이내 만료되면 true
   */
  isExpiringSoon: (): boolean => {
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();
    const fiveMinutes = 5 * 60 * 1000;
    return timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes;
  },

  /**
   * @brief Refresh Token 가져오기
   * @returns Refresh Token 또는 null
   */
  getRefreshToken: (): string | null => {
    const tokenData = tokenManager.getTokenData();
    return tokenData?.refreshToken || null;
  },

  /**
   * @brief Access Token 갱신 (Refresh Token 사용)
   * @returns 새로운 Access Token 또는 null
   * @note 현재는 implicit flow를 사용하므로 refresh token이 없을 수 있습니다.
   *       refresh token을 받으려면 authorization code flow로 변경해야 합니다.
   */
  refresh: async (): Promise<string | null> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      console.warn('⚠️ Refresh Token이 없어 토큰을 갱신할 수 없습니다.');
      console.warn('💡 Refresh Token을 받으려면 OAuth flow를 authorization code flow로 변경해야 합니다.');
      return null;
    }

    try {
      // 클라이언트 시크릿은 보안상 프론트엔드에 저장하지 않으므로
      // Apps Script를 통한 토큰 갱신이 필요할 수 있습니다.
      // 또는 authorization code flow로 변경하여 백엔드에서 처리해야 합니다.
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          // client_secret은 보안상 프론트엔드에 저장하지 않음
          // authorization code flow로 변경하거나 Apps Script를 통해 처리 필요
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('토큰 갱신 실패:', errorData);
        throw new Error(`토큰 갱신 실패: ${response.status}`);
      }

      const data = await response.json();
      const { access_token, expires_in } = data;

      if (access_token && expires_in) {
        // 새 토큰 저장 (기존 refresh token 유지)
        const tokenData = tokenManager.getTokenData();
        tokenManager.save(access_token, expires_in, tokenData?.refreshToken);
        console.log('✅ 토큰 갱신 완료');
        return access_token;
      }

      return null;
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error);
      return null;
    }
  },

  /**
   * @brief 토큰 자동 갱신 (만료 임박 시)
   * @returns 갱신 성공 여부
   */
  autoRefresh: async (): Promise<boolean> => {
    // 만료 임박 시 (5분 이내) 자동 갱신
    if (tokenManager.isExpiringSoon()) {
      const newToken = await tokenManager.refresh();
      return newToken !== null;
    }
    return false;
  }
};

