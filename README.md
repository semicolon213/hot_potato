# Hot Potato - React Application

## 프로젝트 개요
Hot Potato는 구글 계정 기반의 사용자 인증 시스템을 가진 React 애플리케이션입니다.

## 주요 기능
- 구글 OAuth 로그인
- 학생/교직원 구분 및 학번/교번 입력
- 관리자 승인 시스템
- 대시보드, 캘린더, 문서 관리 등

## 설정 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 2. Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. Google+ API 및 Google Calendar API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI에 `http://localhost:5173` 추가 (개발용)

### 3. 의존성 설치
```bash
npm install
```

### 4. 개발 서버 실행

#### 웹 브라우저에서 실행 (일반 웹 앱)
```bash
npm run dev
# 또는
npm run dev:web
```
브라우저에서 `http://localhost:5173` 접속

#### 일렉트론 앱으로 실행 (데스크톱 앱)
```bash
npm run dev:electron
```
일렉트론 창이 자동으로 열립니다.

## 로그인 시스템

### 사용자 인증 플로우
1. **구글 로그인**: 사용자가 구글 계정으로 로그인
2. **사용자 정보 입력**: 학생/교직원 구분 및 학번/교번 입력
3. **승인 대기**: 관리자 승인 대기 상태
4. **승인 완료**: 관리자 승인 후 메인 화면 접근

### 관리자 승인 시스템
- 구글 그룹스에 관리자 그룹 생성
- 승인된 사용자만 메인 화면 접근 가능
- 회원 관리 스프레드시트 연동 (구현 예정)

## 프로젝트 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Login.tsx       # 로그인 컴포넌트
│   ├── Header.tsx      # 헤더 컴포넌트
│   └── Sidebar.tsx     # 사이드바 컴포넌트
├── hooks/              # 커스텀 훅
│   └── useAuthStore.ts # 인증 상태 관리
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx   # 대시보드
│   ├── Calendar.tsx    # 캘린더
│   └── ...
└── App.tsx             # 메인 앱 컴포넌트
```

## 기술 스택
- React 19
- TypeScript
- Vite
- Zustand (상태 관리)
- Google OAuth 2.0
- CSS3

## 개발 가이드
- 컴포넌트는 TypeScript로 작성
- 상태 관리는 Zustand 사용
- 스타일링은 CSS 모듈 또는 일반 CSS 사용
- 구글 API 연동은 OAuth 2.0 사용

## 주의사항
- 실제 운영 환경에서는 백엔드 API 연동 필요
- 구글 스프레드시트 연동은 별도 구현 필요
- 보안을 위해 환경 변수는 절대 커밋하지 마세요
