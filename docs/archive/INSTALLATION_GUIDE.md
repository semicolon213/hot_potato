# 📦 팀원 설치 가이드

## 🚀 빠른 시작

### 1단계: 저장소 클론/업데이트
```bash
git pull origin develop
```

### 2단계: 기존 의존성 정리
```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# macOS/Linux  
rm -rf node_modules package-lock.json
```

### 3단계: 의존성 설치
```bash
npm install
```

### 4단계: 빌드 테스트
```bash
npm run build
```

### 5단계: 개발 서버 실행

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

## ✅ 설치 확인

### 정상 설치 시 출력
```
✓ 216 modules transformed.
✓ built in 2.57s
```

### 브라우저 접속
- **웹 개발 서버**: http://localhost:5173 (`npm run dev` 실행 시)
- **일렉트론 앱**: `npm run dev:electron` 실행 시 자동으로 열림
- **빌드 미리보기**: `npm run preview` (웹 빌드 미리보기)

## 🛠️ 개발 명령어

### 웹 개발 (브라우저)
```bash
# 개발 서버 실행 (웹)
npm run dev
# 또는
npm run dev:web

# 웹 빌드
npm run build
# 또는
npm run build:web

# 빌드 미리보기
npm run preview
# 또는
npm run preview:web
```

### 일렉트론 개발 (데스크톱 앱)
```bash
# 개발 서버 실행 (일렉트론)
npm run dev:electron

# 일렉트론 빌드
npm run build:electron
# 또는
npm run electron:build

# 일렉트론 배포용 빌드
npm run electron:dist
```

### 공통 명령어
```bash
# 테스트
npm run test

# 린트 검사
npm run lint

# 타입 체크
npm run type-check
```

## 🚨 문제 해결

### 설치 실패 시
```bash
# 1. 캐시 정리
npm cache clean --force

# 2. 의존성 재설치
npm install

# 3. 권한 확인 (Windows)
npm install --no-optional
```

### 빌드 실패 시
```bash
# TypeScript 설정 확인
npm run type-check

# 의존성 확인
npm ls react
npm ls papyrus-db
```

### 포트 충돌 시
```bash
# 다른 포트 사용
npm run dev -- --port 3000
```

## 📋 시스템 요구사항

- **Node.js**: 18.17.0 이상 (권장: 22.17.0)
- **npm**: 9.0.0 이상 (권장: 11.6.1)
- **메모리**: 최소 4GB RAM
- **디스크**: 최소 2GB 여유 공간

## 🎯 React 19 주요 변경사항

### 새로운 기능
- ✅ 향상된 성능
- ✅ 개선된 타입 시스템  
- ✅ papyrus-db 완벽 호환
- ✅ react-icons 타입 안전성

### 주의사항
- ❌ `--legacy-peer-deps` 사용 금지
- ❌ React 18 패키지 혼용 금지
- ✅ 모든 의존성이 React 19 호환

## 📞 지원

### 문제 발생 시
1. **팀 채널**에서 문의
2. **GitHub Issues**에 문제 보고  
3. **개발자 문서** 참고

### 유용한 명령어
```bash
# 의존성 상태 확인
npm ls --depth=0

# 보안 검사
npm audit

# 업데이트 가능한 패키지 확인
npm outdated
```

## 🎉 완료!

설치가 완료되면 React 19의 새로운 기능들을 활용할 수 있습니다!

**Happy Coding with React 19! 🚀**
