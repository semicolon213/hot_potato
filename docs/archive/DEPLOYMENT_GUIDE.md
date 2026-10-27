# 🚀 프로젝트 배포 가이드

## 📋 배포 방법 개요

이 프로젝트는 **Electron 앱**으로, GitHub Actions를 통해 자동으로 빌드 및 배포됩니다.

### 지원 플랫폼
- ✅ Windows (`.exe` - NSIS 설치 프로그램)
- ✅ macOS (`.dmg`)
- ✅ Linux (`.AppImage`)

---

## 🎯 배포 방법

### 방법 1: GitHub 태그를 통한 자동 배포 (권장)

#### 1단계: 버전 업데이트
```bash
# package.json의 version 업데이트 (선택사항)
# 또는 Git 태그만 사용해도 됨
```

#### 2단계: 변경사항 커밋 및 푸시
```bash
git add .
git commit -m "feat: 공유 템플릿 메타데이터 개선"
git push origin main  # 또는 develop
```

#### 3단계: Git 태그 생성 및 푸시
```bash
# 시맨틱 버전 형식으로 태그 생성
git tag -a v1.0.0 -m "Release v1.0.0: 공유 템플릿 메타데이터 개선"

# 태그 푸시 (이것이 빌드를 트리거함)
git push origin v1.0.0
```

**태그 형식**: `v*` (예: `v1.0.0`, `v1.2.3`, `v2.0.0-beta.1`)

#### 4단계: GitHub Actions 자동 실행
- 태그 푸시 시 `.github/workflows/electron-build.yml` 워크플로우가 자동 실행됨
- Windows, macOS, Linux에서 각각 빌드
- 빌드 완료 후 GitHub Releases에 자동 업로드

#### 5단계: 릴리즈 확인
1. GitHub 저장소 → **"Releases"** 탭 이동
2. 새 릴리즈 확인 (태그 이름과 동일)
3. 다운로드 파일 확인:
   - `HP ERP Setup X.X.X.exe` (Windows)
   - `HP ERP-X.X.X.dmg` (macOS)
   - `HP ERP-X.X.X.AppImage` (Linux)

---

### 방법 2: 수동 워크플로우 실행 (테스트용)

#### 1단계: GitHub Actions에서 수동 실행
1. GitHub 저장소 → **"Actions"** 탭 이동
2. **"Electron Build"** 워크플로우 선택
3. **"Run workflow"** 클릭
4. 브랜치 선택 (main 또는 develop)
5. **"Run workflow"** 버튼 클릭

#### 2단계: 빌드 결과 확인
- Actions 탭에서 빌드 진행 상황 확인
- 완료 후 **"Artifacts"** 섹션에서 빌드 파일 다운로드 가능
- ⚠️ **주의**: 수동 실행은 릴리즈를 생성하지 않음 (Artifacts만 생성)

---

### 방법 3: 로컬 빌드 (개발/테스트용)

#### Windows
```bash
npm run build
npm run electron:build
# 결과물: dist-electron/HP ERP Setup X.X.X.exe
```

#### macOS
```bash
npm run build
npm run electron:build
# 결과물: dist-electron/HP ERP-X.X.X.dmg
```

#### Linux
```bash
npm run build
npm run electron:build
# 결과물: dist-electron/HP ERP-X.X.X.AppImage
```

---

## ✅ 배포 전 체크리스트

### 필수 확인 사항
- [ ] **코드 테스트 완료**
  - [ ] `npm run test` 통과
  - [ ] `npm run type-check` 통과
  - [ ] `npm run lint` 경고 확인
  - [ ] 수동 기능 테스트 완료

- [ ] **환경 변수 확인**
  - [ ] GitHub Secrets에 모든 환경 변수 설정됨:
    - `VITE_GOOGLE_CLIENT_ID`
    - `VITE_APP_SCRIPT_URL`
    - `VITE_HOT_POTATO_DB_SPREADSHEET_NAME`
    - `VITE_BOARD_SPREADSHEET_NAME`
    - `VITE_ANNOUNCEMENT_SPREADSHEET_NAME`
    - `VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME`
    - `VITE_CALENDAR_STUDENT_SPREADSHEET_NAME`
    - `VITE_STUDENT_SPREADSHEET_NAME`
    - `VITE_PAPYRUS_DB_URL`
    - `VITE_PAPYRUS_DB_API_KEY`

- [ ] **Apps Script 배포 확인**
  - [ ] Apps Script 최신 버전 배포 완료
  - [ ] API 엔드포인트 정상 작동 확인
  - [ ] 메타데이터 응답 구조 확인

- [ ] **버전 관리**
  - [ ] 변경사항 커밋 완료
  - [ ] 적절한 태그 이름 선택 (`v1.0.0`, `v1.1.0` 등)

### 권장 확인 사항
- [ ] **CHANGELOG 업데이트** (선택사항)
- [ ] **릴리즈 노트 작성** (GitHub Releases에서)
- [ ] **로컬 빌드 테스트** (선택사항)

---

## 🔧 배포 설정

### GitHub Secrets 설정
1. GitHub 저장소 → **"Settings"** → **"Secrets and variables"** → **"Actions"**
2. 다음 Secrets 추가/확인:

```
VITE_GOOGLE_CLIENT_ID
VITE_APP_SCRIPT_URL
VITE_HOT_POTATO_DB_SPREADSHEET_NAME
VITE_BOARD_SPREADSHEET_NAME
VITE_ANNOUNCEMENT_SPREADSHEET_NAME
VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME
VITE_CALENDAR_STUDENT_SPREADSHEET_NAME
VITE_STUDENT_SPREADSHEET_NAME
VITE_PAPYRUS_DB_URL
VITE_PAPYRUS_DB_API_KEY
```

### Electron Builder 설정
`package.json`의 `build` 섹션에서 설정 확인:
- **appId**: `com.hotpotato.erp`
- **productName**: `HP ERP`
- **Windows**: NSIS 설치 프로그램
- **macOS**: DMG 파일
- **Linux**: AppImage

---

## 📦 배포 후 확인

### 1. GitHub Releases 확인
- [ ] 새 릴리즈 생성됨
- [ ] 3개 플랫폼 빌드 파일 모두 업로드됨
- [ ] 릴리즈 노트 작성 (선택사항)

### 2. 빌드 파일 다운로드 및 테스트
- [ ] Windows `.exe` 파일 다운로드 및 설치 테스트
- [ ] macOS `.dmg` 파일 다운로드 및 설치 테스트 (가능한 경우)
- [ ] Linux `.AppImage` 파일 다운로드 및 실행 테스트 (가능한 경우)

### 3. 기능 확인
- [ ] 앱 정상 실행
- [ ] 로그인 기능 정상 작동
- [ ] 주요 기능 정상 작동
- [ ] API 연결 정상 작동

---

## 🐛 문제 해결

### 빌드 실패 시

#### 1. GitHub Actions 로그 확인
- Actions 탭 → 실패한 워크플로우 → 로그 확인
- 에러 메시지 확인

#### 2. 일반적인 문제

**환경 변수 누락**
```
Error: VITE_APP_SCRIPT_URL is not defined
```
→ GitHub Secrets에 환경 변수 추가

**빌드 타임아웃**
- macOS 빌드는 시간이 오래 걸릴 수 있음
- Actions 탭에서 진행 상황 확인

**코드 서명 오류 (macOS)**
- macOS 코드 서명은 선택사항
- 필요시 `electron-builder` 설정에서 코드 서명 설정

### 로컬 빌드 실패 시

```bash
# 1. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 2. 캐시 정리
npm cache clean --force

# 3. 빌드 디렉토리 정리
rm -rf dist dist-electron

# 4. 재빌드
npm run build
npm run electron:build
```

---

## 📝 버전 관리 가이드

### 시맨틱 버전 (Semantic Versioning)
- **Major** (X.0.0): 호환되지 않는 API 변경
- **Minor** (0.X.0): 하위 호환되는 기능 추가
- **Patch** (0.0.X): 하위 호환되는 버그 수정

### 태그 예시
```bash
# 메이저 릴리즈
git tag -a v2.0.0 -m "Release v2.0.0: Major update"

# 마이너 릴리즈
git tag -a v1.1.0 -m "Release v1.1.0: New features"

# 패치 릴리즈
git tag -a v1.0.1 -m "Release v1.0.1: Bug fixes"

# 베타 릴리즈
git tag -a v1.1.0-beta.1 -m "Release v1.1.0-beta.1: Beta version"
```

---

## 🚀 빠른 배포 명령어

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 2. 푸시
git push origin main

# 3. 태그 생성 및 푸시
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 완료! GitHub Actions가 자동으로 빌드 및 배포합니다.
```

---

## 📚 참고 자료

- [Electron Builder 문서](https://www.electron.build/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [시맨틱 버전 관리](https://semver.org/)

