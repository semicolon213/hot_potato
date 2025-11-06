/**
 * @file tokenManager.ts
 * @brief Google OAuth 토큰 관리 유틸리티
 * @details Access Token의 만료 시간을 관리하고 검증하는 유틸리티 함수들
 */

export interface TokenData {
  accessToken: string;
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
   */
  save: (accessToken: string, expiresIn: number): void => {
    const tokenData: TokenData = {
      accessToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      issuedAt: Date.now()
    };
    localStorage.setItem('googleAccessToken', JSON.stringify(tokenData));
    console.log('✅ 토큰 저장 완료:', {
      expiresAt: new Date(tokenData.expiresAt).toLocaleString(),
      expiresIn: `${expiresIn}초 (${(expiresIn / 60).toFixed(1)}분)`
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
    return this.get() !== null;
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
    const tokenData = this.getTokenData();
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
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const fiveMinutes = 5 * 60 * 1000;
    return timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes;
  }
};

