# 🥔 Hot Potato ERP System

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-3178C6?logo=typescript)
![Electron](https://img.shields.io/badge/Electron-38.2.0-47848F?logo=electron)
![License](https://img.shields.io/badge/license-Private-red.svg)

**구글 계정 기반의 통합 ERP 시스템**

[기능 소개](#-주요-기능) • [설치 방법](#-설치-방법) • [개발 가이드](#-개발-가이드) • [배포](#-배포)

</div>

---

## 📋 프로젝트 개요

Hot Potato는 Google Workspace를 기반으로 한 통합 ERP(Enterprise Resource Planning) 시스템입니다. 학생, 교직원, 관리자가 하나의 플랫폼에서 문서 관리, 캘린더, 회계, 워크플로우, 게시판 등 다양한 업무를 처리할 수 있습니다.

### 주요 특징
- 🔐 **Google OAuth 2.0 인증**: 안전한 구글 계정 기반 로그인
- 📄 **문서 관리**: Google Docs/Sheets 템플릿 기반 문서 생성 및 관리
- 📅 **캘린더 통합**: Google Calendar 연동으로 일정 관리
- 💰 **회계 관리**: 예산 및 지출 관리 시스템
- ✅ **워크플로우**: 결재 및 승인 프로세스 관리
- 👥 **사용자 관리**: 학생/교직원 구분 및 권한 관리
- 📢 **게시판**: 공지사항 및 자유 게시판

---

## 🎯 주요 기능

### 📄 문서 관리
- Google Docs/Sheets 템플릿 기반 문서 생성
- 공유 템플릿 관리 및 메타데이터 관리
- 문서 권한 설정 및 폴더 관리
- 문서 검색 및 필터링

### 📅 캘린더
- Google Calendar 연동
- 교수/학생/학회 일정 통합 관리
- 반복 일정 설정 (RRULE 지원)
- 일정 공유 및 알림

### 💰 회계 관리
- 예산 관리 및 지출 내역 추적
- 전자장부 및 영수증 관리
- 증빙서류 확인서 생성
- 회계 보고서 생성

### ✅ 워크플로우
- 결재 라인 설정 및 관리
- 문서 결재 프로세스
- 결재 상태 추적
- 결재 이력 관리

### 👥 사용자 관리
- 학생/교직원 구분
- 관리자 승인 시스템
- 권한별 기능 접근 제어
- 사용자 프로필 관리

### 📢 게시판
- 공지사항 작성 및 관리
- 자유 게시판
- 파일 첨부 지원
- 댓글 및 좋아요 기능

---

## 🛠️ 기술 스택

### Frontend
- **React 19.2.0** - UI 라이브러리
- **TypeScript 5.0.4** - 타입 안정성
- **Vite 5.4.20** - 빌드 도구
- **Zustand 5.0.8** - 상태 관리
- **TipTap 3.9.0** - 리치 텍스트 에디터
- **Recharts 3.4.1** - 차트 라이브러리

### Desktop App
- **Electron 38.2.0** - 데스크톱 앱 프레임워크
- **Electron Builder 26.0.12** - 앱 빌드 및 배포

### Backend
- **Google Apps Script** - 서버리스 백엔드
- **Google Drive API** - 파일 저장 및 관리
- **Google Sheets API** - 데이터베이스
- **Papyrus DB 1.0.4** - Google Sheets ORM

### 인증 및 API
- **Google OAuth 2.0** - 사용자 인증
- **JWT** - 토큰 기반 인증
- **Google Calendar API** - 캘린더 연동

### 개발 도구
- **Jest 29.7.0** - 테스트 프레임워크
- **ESLint 9.29.0** - 코드 린팅
- **Prettier** - 코드 포맷팅
- **GitHub Actions** - CI/CD

---

## 🚀 설치 방법

### 필수 요구사항
- Node.js 22.x 이상
- npm 또는 yarn
- Google 계정
- Google Cloud Console 프로젝트

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/hot_potato.git
cd hot_potato
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google OAuth 설정
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Apps Script URL
VITE_APP_SCRIPT_URL=your_app_script_url

# 스프레드시트 이름
VITE_HOT_POTATO_DB_SPREADSHEET_NAME=your_spreadsheet_name
VITE_BOARD_SPREADSHEET_NAME=your_board_spreadsheet_name
VITE_ANNOUNCEMENT_SPREADSHEET_NAME=your_announcement_spreadsheet_name
VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME=your_calendar_professor_spreadsheet_name
VITE_CALENDAR_STUDENT_SPREADSHEET_NAME=your_calendar_student_spreadsheet_name
VITE_STUDENT_SPREADSHEET_NAME=your_student_spreadsheet_name

# Papyrus DB 설정
VITE_PAPYRUS_DB_URL=your_papyrus_db_url
VITE_PAPYRUS_DB_API_KEY=your_papyrus_db_api_key
```

### 4. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. 다음 API 활성화:
   - Google+ API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI 추가:
   - 개발용: `http://localhost:5173`
   - 프로덕션: 실제 도메인

### 5. Google Apps Script 배포

`appScript/` 폴더의 스크립트를 Google Apps Script에 배포하세요. 자세한 내용은 [appScript/README.md](./appScript/README.md)를 참조하세요.

---

## 💻 개발

### 개발 서버 실행

#### 웹 브라우저에서 실행
```bash
npm run dev
# 또는
npm run dev:web
```
브라우저에서 `http://localhost:5173` 접속

#### Electron 앱으로 실행
```bash
npm run electron:dev
```
Electron 창이 자동으로 열립니다.

### 빌드

#### 웹 빌드
```bash
npm run build
```

#### Electron 빌드
```bash
npm run electron:build
```

### 테스트
```bash
# 단위 테스트 실행
npm run test

# 테스트 커버리지
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### 코드 품질 검사
```bash
# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# 포맷팅 검사
npm run format:check
```

---

## 📁 프로젝트 구조

```
hot_potato/
├── src/                          # 소스 코드
│   ├── components/               # UI 컴포넌트
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   ├── features/            # 기능별 컴포넌트
│   │   │   ├── auth/           # 인증 관련
│   │   │   ├── calendar/        # 캘린더 기능
│   │   │   ├── documents/       # 문서 관리
│   │   │   ├── accounting/      # 회계 관리
│   │   │   ├── workflow/        # 워크플로우
│   │   │   ├── students/        # 학생 관리
│   │   │   ├── admin/          # 관리자 기능
│   │   │   └── templates/       # 템플릿 관리
│   │   └── ui/                 # 공통 UI 컴포넌트
│   ├── hooks/                   # 커스텀 훅
│   │   ├── core/               # 핵심 훅
│   │   └── features/           # 기능별 훅
│   ├── pages/                   # 페이지 컴포넌트
│   ├── services/                # 서비스 레이어
│   ├── utils/                   # 유틸리티 함수
│   │   ├── api/                # API 클라이언트
│   │   ├── database/           # 데이터베이스 유틸
│   │   ├── google/             # Google API 유틸
│   │   └── auth/               # 인증 유틸
│   ├── types/                   # TypeScript 타입 정의
│   ├── config/                  # 설정 파일
│   ├── styles/                  # 스타일 파일
│   └── assets/                  # 정적 자산
├── appScript/                   # Google Apps Script 백엔드
│   ├── Main.gs                 # 메인 엔트리 포인트
│   ├── CONFIG.gs               # 설정 파일
│   ├── DocumentTemplates.gs    # 문서 템플릿 관리
│   ├── DocumentCreation.gs     # 문서 생성
│   ├── UserAuth.gs             # 사용자 인증
│   └── ...                     # 기타 스크립트 파일
├── electron/                    # Electron 설정
│   └── main.cjs                # Electron 메인 프로세스
├── public/                      # 정적 파일
├── .github/                     # GitHub Actions 워크플로우
│   └── workflows/
│       ├── ci.yml              # CI 파이프라인
│       └── electron-build.yml # Electron 빌드
├── package.json                # 프로젝트 설정
├── tsconfig.json               # TypeScript 설정
├── vite.config.ts              # Vite 설정
└── README.md                    # 프로젝트 문서
```

---

## 🔐 인증 시스템

### 사용자 인증 플로우

1. **Google 로그인**: 사용자가 Google 계정으로 로그인
2. **사용자 정보 입력**: 학생/교직원 구분 및 학번/교번 입력
3. **승인 대기**: 관리자 승인 대기 상태
4. **승인 완료**: 관리자 승인 후 메인 화면 접근

### 권한 관리

- **학생**: 기본 기능 접근 (문서 보기, 캘린더 조회 등)
- **교직원**: 추가 기능 접근 (문서 생성, 캘린더 편집 등)
- **관리자**: 모든 기능 접근 (사용자 관리, 시스템 설정 등)

---

## 📦 배포

### GitHub Actions를 통한 자동 배포

1. **태그 생성 및 푸시**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **자동 빌드 및 배포**
   - GitHub Actions가 자동으로 Windows, macOS, Linux 빌드 실행
   - 빌드 완료 후 GitHub Releases에 자동 업로드

자세한 내용은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참조하세요.

---

## 📚 문서

- [설치 가이드](./INSTALLATION_GUIDE.md) - 상세한 설치 방법
- [배포 가이드](./DEPLOYMENT_GUIDE.md) - 배포 방법 및 체크리스트
- [프로젝트 문서](./PROJECT_DOCUMENTATION.md) - 프로젝트 구조 및 아키텍처
- [Apps Script 문서](./appScript/README.md) - 백엔드 스크립트 가이드
- [환경 변수 설정](./ENVIRONMENT_VARIABLES_SETUP.md) - 환경 변수 설정 가이드

---

## 🤝 기여

프로젝트에 기여하고 싶으신가요? 다음 단계를 따르세요:

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

### 코딩 스타일

- TypeScript 사용
- ESLint 규칙 준수
- Prettier로 코드 포맷팅
- 컴포넌트는 함수형 컴포넌트 사용
- 커스텀 훅으로 로직 분리

---

## 🐛 문제 해결

### 일반적인 문제

**의존성 설치 실패**
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**빌드 실패**
```bash
# 빌드 디렉토리 정리 후 재빌드
rm -rf dist dist-electron
npm run build
```

**환경 변수 인식 안 됨**
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 `VITE_`로 시작하는지 확인
- 개발 서버 재시작

자세한 문제 해결 방법은 [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)를 참조하세요.

---

## 📝 라이선스

이 프로젝트는 비공개 프로젝트입니다. 모든 권리가 보유자에게 있습니다.

---

## 👥 팀

Hot Potato 개발 팀

---

## 🔗 관련 링크

- [Google Apps Script](https://script.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Electron 문서](https://www.electronjs.org/)
- [React 문서](https://react.dev/)

---

<div align="center">

**Made with ❤️ by Hot Potato Team**

</div>
