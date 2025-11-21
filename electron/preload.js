/**
 * @file preload.js
 * @brief Electron preload script
 * @details 메인 프로세스와 렌더러 프로세스 간 안전한 통신을 위한 preload script입니다.
 * @author Hot Potato Team
 * @date 2024
 */

const { contextBridge, ipcRenderer, shell } = require('electron');

// 렌더러 프로세스에 노출할 API 정의
contextBridge.exposeInMainWorld('electronAPI', {
  // 앱 종료 이벤트 리스너 등록
  onAppBeforeQuit: (callback) => {
    ipcRenderer.on('app-before-quit', callback);
  },
  
  // 앱 종료 이벤트 리스너 제거
  removeAppBeforeQuitListener: (callback) => {
    ipcRenderer.removeListener('app-before-quit', callback);
  },
  
  // 외부 브라우저에서 URL 열기
  openExternal: (url) => {
    shell.openExternal(url);
  }
});
