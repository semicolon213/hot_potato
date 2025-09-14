const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// 개발 환경 감지 (여러 방법으로 확인)
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// 개발 환경에서의 Vite 서버 URL
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

function createWindow() {
  // 메인 윈도우 생성
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Google OAuth를 위해 임시로 비활성화
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../public/vite.svg'), // 앱 아이콘
    titleBarStyle: 'default',
    show: false // 윈도우가 준비될 때까지 숨김
  });

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
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
      return { action: 'allow' };
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

// 보안: 새 윈도우 생성 방지 (Google OAuth 제외)
app.on('web-contents-created', (event, contents) => {
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
