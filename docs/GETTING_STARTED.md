# 개발 환경 시작하기

> 대상: 이미 배포된 Apps Script 백엔드가 있고, 프론트엔드를 로컬에서 개발하려는 사람
> 기준: `main` @ `ffed6c7` (2025-12-01). 이후 개발은 [hot_potato_remake](https://github.com/semicolon213/hot_potato_remake)에서 이어집니다.
> 백엔드부터 새로 세팅해야 한다면 [DEPLOYMENT.md](./DEPLOYMENT.md)를 먼저 보세요.

## 1. 준비물

| 항목 | 버전 |
|---|---|
| Node.js | 18 이상 (Netlify 빌드는 18, GitHub Actions는 20·22를 씁니다) |
| npm | Node에 포함된 버전 |
| Google 계정 | 승인된 Hot Potato ERP 계정 (로그인 테스트용) |
| Apps Script 웹앱 URL | `https://script.google.com/macros/s/.../exec` (팀에서 받기) |
| OAuth 클라이언트 ID | `http://localhost:5173`이 승인된 원본·리디렉션 URI로 등록돼 있어야 함 |

## 2. 설치

```bash
git clone https://github.com/semicolon213/hot_potato.git
cd hot_potato
npm ci
```

`.env.example` 파일은 없습니다. 루트에 `.env`를 직접 만듭니다(§3).

## 3. 환경변수 (`.env`)

모든 값은 `src/config/environment.ts`의 `ENV_CONFIG`에서 읽습니다. 변수 하나가 이름 하나에 대응하는 방식입니다.

### 3.1 꼭 넣을 값

| 변수 | 필수 | 설명 |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Google OAuth 클라이언트 ID. 로그인 URL을 만들 때 씀 |
| `VITE_APP_SCRIPT_URL` | ✅ | Apps Script 웹앱 `/exec` URL. 학생·교직원 화면 일부가 이 값을 직접 씀 |

### 3.2 기본값이 있는 값 (바꿀 때만)

| 구분 | 변수 | 기본값 |
|---|---|---|
| 스프레드시트 이름 | `VITE_ANNOUNCEMENT_SPREADSHEET_NAME` | `notice` |
| | `VITE_CALENDAR_PROFESSOR_SPREADSHEET_NAME` | `calendar_professor` |
| | `VITE_CALENDAR_COUNCIL_SPREADSHEET_NAME` | `calendar_council` |
| | `VITE_CALENDAR_ADPROFESSOR_SPREADSHEET_NAME` | `calendar_ADprofessor` |
| | `VITE_CALENDAR_SUPP_SPREADSHEET_NAME` | `calendar_supp` |
| | `VITE_CALENDAR_STUDENT_SPREADSHEET_NAME` | `calendar_student` |
| | `VITE_STUDENT_SPREADSHEET_NAME` | `student` |
| | `VITE_STAFF_SPREADSHEET_NAME` | `staff` |
| | `VITE_HOT_POTATO_DB_SPREADSHEET_NAME` | `hot_potato_DB` |
| 시트 이름 | `VITE_ANNOUNCEMENT_SHEET_NAME`, `VITE_CALENDAR_SHEET_NAME` | `시트1` |
| | `VITE_STUDENT_SHEET_NAME`, `VITE_STAFF_INFO_SHEET_NAME` | `info` |
| | `VITE_STUDENT_ISSUE_SHEET_NAME` | `std_issue` |
| | `VITE_STAFF_COMMITTEE_SHEET_NAME` | `committee` |
| | `VITE_DOCUMENT_TEMPLATE_SHEET_NAME` | `document_template` |
| | `VITE_DASHBOARD_SHEET_NAME` | `dashboard` |
| | `VITE_MENU_SHEET_NAME` | `menu` |
| Drive 폴더 이름 | `VITE_ROOT_FOLDER_NAME` | `hot potato` |
| | `VITE_DOCUMENT_FOLDER_NAME` | `문서` |
| | `VITE_SHARED_DOCUMENT_FOLDER_NAME` / `VITE_PERSONAL_DOCUMENT_FOLDER_NAME` | `공유 문서` / `개인 문서` |
| | `VITE_TEMPLATE_FOLDER_NAME` / `VITE_PERSONAL_TEMPLATE_FOLDER_NAME` | `양식` / `개인 양식` |
| | `VITE_ACCOUNTING_FOLDER_NAME` / `VITE_EVIDENCE_FOLDER_NAME` | `회계` / `증빙` |
| 개인 설정 파일 | `VITE_PERSONAL_CONFIG_FILE_NAME` | `hp_potato_DB` |
| 역할별 그룹 이메일 | `VITE_GROUP_EMAIL_STUDENT`, `VITE_GROUP_EMAIL_COUNCIL`, `VITE_GROUP_EMAIL_PROFESSOR`, `VITE_GROUP_EMAIL_ADJUNCT_PROFESSOR`, `VITE_GROUP_EMAIL_ASSISTANT` | 없음. 문서·장부를 그룹에 공유할 때 씀 |
| 기타 | `VITE_PAPYRUS_DB_API_KEY` | 없음. 있으면 gapi 클라이언트의 API 키로 설정 |

- 앱 시작 시 `validateEnvironmentVariables()`가 필수 값을 검사합니다. 빠진 값이 있으면 콘솔에 `❌ 필수 환경변수가 설정되지 않았습니다` 오류가 나오지만 앱은 계속 실행됩니다.
- `VITE_PAPYRUS_DB_URL`은 `ENV_CONFIG`에 있지만 코드에서 쓰지 않습니다.
- `.github/workflows/ci.yml`에 나오는 `VITE_GOOGLE_API_KEY`, `VITE_BOARD_*`, `VITE_STAFF_SHEET_NAME`은 `ENV_CONFIG`가 읽지 않는 이름입니다.
- `.env`는 `.gitignore`에 들어 있습니다. 커밋하지 않습니다.

### 3.3 로컬 프록시 주소

`npm run dev:web`에서 API 호출은 Vite 프록시(`/api`)를 거칩니다. 프록시 대상은 `vite.config.ts`가 **셸 환경변수** `VITE_APP_SCRIPT_URL`에서 읽습니다. `vite.config.ts`는 `.env` 파일을 읽지 않으므로, 다른 백엔드로 붙으려면 셸에 값을 넣고 실행합니다. 값이 없으면 코드에 적힌 기본 배포 URL로 연결됩니다.

```bash
VITE_APP_SCRIPT_URL="https://script.google.com/macros/s/.../exec" npm run dev:web
```

## 4. 실행

| 명령 | 용도 | 주소 |
|---|---|---|
| `npm run dev:web` | 웹만 실행 (가장 많이 씀) | http://localhost:5173 |
| `npm run dev` | 웹 + Electron 동시 실행 | 5173 + 데스크톱 창 |
| `npm run electron:dev` | 위와 같음 (`dev:web` 후 Electron) | 5173 + 데스크톱 창 |

Netlify Function을 로컬에서 돌리는 npm 스크립트는 없습니다. 필요하면 Netlify CLI(`netlify dev`)를 따로 설치해 씁니다.

로그인 후 대시보드가 뜨고, 개발자 도구 콘솔에 `✅ API 응답 성공` 로그가 보이면 정상입니다.

## 5. 자주 쓰는 명령

| 명령 | 설명 |
|---|---|
| `npm run build` | 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 미리 보기 |
| `npm test` | Jest 테스트 |
| `npm run test:coverage` | 커버리지 포함 테스트 |
| `npm run test:ci` | CI용 테스트 (`--coverage --ci`) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit -p tsconfig.app.json` | 타입 검사. `npm run type-check`(`tsc --noEmit`)는 루트 `tsconfig.json`이 `files: []`라 실제로는 검사하는 파일이 없습니다 |
| `npm run electron:build` | 데스크톱 앱 패키징 → `dist-electron/` |

- `npm run format`, `npm run format:check`는 Prettier를 부르지만 Prettier가 `devDependencies`에 없습니다. 전역으로 설치해야 동작합니다. 같은 이유로 이 둘을 포함하는 `npm run ci`도 그대로는 끝까지 돌지 않습니다.
- `npm run bundle-size`는 빌드 후 "skipped" 메시지만 출력합니다.

## 6. 코드 둘러보기

처음 읽을 때는 아래 순서를 추천합니다.

1. `src/main.tsx` — 환경변수 검증, 앱 마운트
2. `src/App.tsx` — 로그인·승인 게이트, 세션·토큰 만료 처리
3. `src/hooks/core/useAppState.ts` — 전역 상태와 로그인 후 초기화
4. `src/components/layout/PageRenderer.tsx` — 화면 전환
5. `src/utils/api/apiClient.ts` — Apps Script 호출, 재시도, 캐시
6. `src/utils/database/papyrusManager.ts` — 스프레드시트 ID 초기화, 시트 직접 읽기
7. `appScript/Main.gs` — 백엔드 라우터 (`doPost`)

구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 규칙은 [CONVENTIONS.md](./CONVENTIONS.md)를 보세요.

## 7. 로컬에서 자주 막히는 문제

| 증상 | 해결 |
|---|---|
| Google 화면에 `client_id` 누락 오류 | `.env`에 `VITE_GOOGLE_CLIENT_ID`를 넣고 dev 서버 재시작 |
| 로그인 후 `redirect_uri_mismatch` | Google Cloud Console의 OAuth 클라이언트에 `http://localhost:5173`을 원본·리디렉션 URI로 추가 |
| 로컬인데 엉뚱한 백엔드 데이터가 보임 | 셸에 `VITE_APP_SCRIPT_URL`을 넣지 않아 기본 URL로 붙은 경우. §3.3대로 실행 |
| 예전 데이터가 계속 보임 | 헤더의 동기화 새로고침 버튼 또는 localStorage의 `cache_*` 삭제 |
| 5173 포트 사용 중 | 기존 dev 서버 종료 또는 `npx vite --port 5174` (OAuth URI도 추가 필요) |

운영 환경 장애는 [RUNBOOK.md](./RUNBOOK.md)를 보세요.
