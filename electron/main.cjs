const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Windows 팝업 입력 포커스 이슈 우회: 가림 탐지 비활성화
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

// 캐시 관련 에러 억제
app.commandLine.appendSwitch('--disable-gpu-cache');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('--disable-background-networking');
// 로그 레벨 조정 (캐시 에러 경고 억제)
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('--log-level', '0'); // 에러만 표시
}

// CSP 및 보안 관련 플래그 추가 (Apps Script 접근 허용)
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--allow-running-insecure-content');
app.commandLine.appendSwitch('--disable-site-isolation-trials');
app.commandLine.appendSwitch('--disable-extensions');
app.commandLine.appendSwitch('--disable-csp');
app.commandLine.appendSwitch('--disable-xss-auditor');
app.commandLine.appendSwitch('--disable-http2');
app.commandLine.appendSwitch('--allow-running-insecure-content');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');

// 개발 환경 감지 (여러 방법으로 확인)
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// 개발 환경에서의 Vite 서버 URL (동적 포트 감지)
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
  // 메인 윈도우 생성
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true, // 보안을 위해 활성화
        enableRemoteModule: false,
        webSecurity: false, // 웹 보안 완전 비활성화
        allowRunningInsecureContent: true,
        backgroundThrottling: false,
        webviewTag: true,
        experimentalFeatures: true, // 실험적 기능 활성화
        preload: path.join(__dirname, 'preload.js'), // preload script 추가
        additionalArguments: [
          '--disable-web-security', 
          '--disable-features=VizDisplayCompositor',
          '--allow-running-insecure-content',
          '--disable-site-isolation-trials',
          '--disable-csp',
          '--disable-xss-auditor',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection'
        ]
      },
    icon: (process.platform === 'win32'
      ? path.join(__dirname, '../public/logo.ico')
      : path.join(__dirname, '../public/logo.png')), // 플랫폼별 아이콘
    titleBarStyle: 'default',
    show: false // 윈도우가 준비될 때까지 숨김
  });

  // 창 닫기 이벤트 처리
  mainWindow.on('close', (event) => {
    // 로그아웃 신호 전송
    mainWindow.webContents.send('app-before-quit');
    
    // 잠시 대기 후 창 닫기 (로그아웃 처리 시간 확보)
    setTimeout(() => {
      mainWindow.destroy();
    }, 100);
  });

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // CSP 완전 제거 및 모든 도메인 허용
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      
      // 모든 CSP 관련 헤더 완전 제거
      Object.keys(responseHeaders).forEach(key => {
        if (key.toLowerCase().includes('content-security-policy') || 
            key.toLowerCase().includes('csp') ||
            key.toLowerCase().includes('x-frame-options') ||
            key.toLowerCase().includes('x-content-type-options')) {
          delete responseHeaders[key];
        }
      });
      
      // CSP 완전 비활성화
      responseHeaders['Content-Security-Policy'] = ['default-src * data: blob:; script-src * \'unsafe-inline\' \'unsafe-eval\'; connect-src *; img-src * data: blob:; font-src * data:; style-src * \'unsafe-inline\'; frame-src *; object-src *; media-src *;'];
      
      // CORS 헤더 추가
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS'];
      responseHeaders['Access-Control-Allow-Headers'] = ['Content-Type, Authorization, X-Requested-With'];
      responseHeaders['Access-Control-Max-Age'] = ['3600'];
      
      callback({ responseHeaders });
    });
    
    // 개발 환경에서도 개발자 도구 자동 열기 비활성화
    // 필요시 F12 또는 메뉴에서 수동으로 열 수 있음
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
  });

  // 외부 링크는 기본 브라우저에서 열기 (Google OAuth 제외)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Google OAuth URL은 팝업으로 허용
    if (url.includes('accounts.google.com') || url.includes('oauth2')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          modal: false,
          autoHideMenuBar: true,
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false
          }
        }
      };
    }
    // 다른 외부 링크는 기본 브라우저에서 열기
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 앱 로드
  if (isDev) {
    // 개발 환경: Vite 개발 서버 사용
    console.log('개발 모드: Vite 서버에 연결 중...', VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL).catch(err => {
      console.error('Vite 서버 연결 실패:', err);
      // Vite 서버가 준비되지 않았으면 잠시 후 재시도
      setTimeout(() => {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
      }, 2000);
    });
  } else {
    // 프로덕션 환경: 빌드된 파일 사용
    console.log('프로덕션 모드: 빌드된 파일 로드');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(() => {
  // Windows: App User Model ID 설정 (작업표시줄/알림용)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.hotpotato.erp');
    
    // 캐시 디렉토리 명시적 설정 (권한 문제 방지)
    try {
      const userDataPath = app.getPath('userData');
      const cachePath = path.join(userDataPath, 'Cache');
      // 캐시 경로 설정 시도 (권한이 있으면)
      app.setPath('cache', cachePath);
    } catch (error) {
      // 캐시 경로 설정 실패 시 무시 (기본 경로 사용)
      console.warn('캐시 경로 설정 실패 (무시됨):', error.message);
    }
  }
  
  // 세션 설정 (CSP 완전 우회)
  const { session } = require('electron');
  
  // 모든 요청에서 CSP 헤더 제거
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
  
  // 모든 응답에서 CSP 헤더 완전 제거
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // 모든 CSP 관련 헤더 완전 제거
    Object.keys(responseHeaders).forEach(key => {
      if (key.toLowerCase().includes('content-security-policy') || 
          key.toLowerCase().includes('csp') ||
          key.toLowerCase().includes('x-frame-options') ||
          key.toLowerCase().includes('x-content-type-options')) {
        delete responseHeaders[key];
      }
    });
    
    // CSP 완전 비활성화
    responseHeaders['Content-Security-Policy'] = ['default-src * data: blob:; script-src * \'unsafe-inline\' \'unsafe-eval\'; connect-src *; img-src * data: blob:; font-src * data:; style-src * \'unsafe-inline\'; frame-src *; object-src *; media-src *;'];
    
    callback({ responseHeaders });
  });
  
  createWindow();

  // macOS에서 독 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // 메뉴 설정 (선택사항)
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '새 창',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow();
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체 화면' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'HP ERP 정보',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'HP ERP 정보',
              message: 'HP ERP v1.0.0',
              detail: 'Hot Potato ERP 시스템'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱 종료 전 로그아웃 처리
app.on('before-quit', (event) => {
  // 모든 윈도우에 로그아웃 신호 전송
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('app-before-quit');
    }
  });
  
  // 잠시 대기 후 앱 종료 (로그아웃 처리 시간 확보)
  setTimeout(() => {
    app.exit(0);
  }, 100);
});

// 보안: 새 윈도우 생성 방지 (Google OAuth 제외)
app.on('web-contents-created', (event, contents) => {
  // 새로 생성되는 자식 윈도우는 표시/포커스 보장
  contents.on('did-create-window', (childWindow) => {
    childWindow.once('ready-to-show', () => {
      childWindow.show();
      childWindow.focus();
    });
  });
  contents.on('new-window', (event, navigationUrl) => {
    // Google OAuth URL은 팝업으로 허용
    if (navigationUrl.includes('accounts.google.com') || navigationUrl.includes('oauth2')) {
      return; // 기본 동작 허용
    }
    // 다른 외부 링크는 기본 브라우저에서 열기
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
