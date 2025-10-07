/**
 * @file electron.d.ts
 * @brief Electron API 타입 정의
 * @details Electron 메인 프로세스와 렌더러 프로세스 간 통신을 위한 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

declare global {
  interface Window {
    electronAPI?: {
      onAppBeforeQuit: (callback: () => void) => void;
      removeAppBeforeQuitListener: (callback: () => void) => void;
    };
  }
}

export {};
