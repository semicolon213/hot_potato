/**
 * @file importMeta.ts
 * @brief import.meta 모킹 파일
 * @details Jest 테스트 환경에서 import.meta를 모킹합니다.
 */

// Jest 환경에서 import.meta를 모킹
if (typeof import.meta === 'undefined') {
  (global as any).import = {
    meta: {
      env: {
        VITE_GOOGLE_CLIENT_ID: 'test-client-id',
        VITE_APP_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
        VITE_GOOGLE_API_KEY: 'test-api-key',
        DEV: false,
        PROD: true,
        MODE: 'test'
      }
    }
  };
}
