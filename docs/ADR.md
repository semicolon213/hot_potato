# Hot Potato ERP 아키텍처 결정 기록 (ADR)

> 개발 단계: **④ 구조 생성** · 산출물: 소프트웨어 아키텍처 정의서(결정 근거)
> 기준: `main` @ `ffed6c7` (2025-12-01). 날짜는 해당 결정이 처음 코드에 들어간 커밋 날짜입니다.

각 결정은 **상황 → 결정 → 결과(얻은 것과 치른 대가)** 순서로 적었습니다. 상황과 이유는 커밋 메시지, 코드 주석, 당시 문서(`docs/archive/`)에 근거가 있는 것만 적었습니다. 근거를 찾지 못한 경우 "기록 없음"이라고 썼습니다.
상태: **채택**(기준 시점에 유효) / **대체됨**(다른 결정으로 바뀜)

| ID | 결정 | 날짜 | 상태 |
|---|---|---|---|
| [ADR-001](#adr-001-google-workspace를-플랫폼으로-쓴다) | Google Workspace를 플랫폼으로 쓴다 | 2025-08-06 | 채택 |
| [ADR-002](#adr-002-google-sheets를-데이터베이스로-쓴다) | Google Sheets를 데이터베이스로 쓴다 | 2025-08-14 | 채택 |
| [ADR-003](#adr-003-데이터-접근-경로를-두-갈래로-나눈다) | 데이터 접근 경로를 두 갈래로 나눈다 | 2025-10-01 | 채택 |
| [ADR-004](#adr-004-apps-script-앞에-netlify-function-프록시를-둔다) | Apps Script 앞에 Netlify Function 프록시를 둔다 | 2025-11-18 | 채택 |
| [ADR-005](#adr-005-클라이언트-캐시와-백그라운드-동기화) | 클라이언트 캐시와 백그라운드 동기화 | 2025-11-17 | 채택 |
| [ADR-006](#adr-006-폴더시트-이름을-환경변수와-스크립트-속성으로-관리한다) | 폴더·시트 이름을 환경변수와 스크립트 속성으로 관리한다 | 2025-10-04 | 채택 |
| [ADR-007](#adr-007-가입은-사전-등록--승인제로-한다) | 가입은 사전 등록 + 승인제로 한다 | 2025-10-29 | 채택 |
| [ADR-008](#adr-008-결재는-검토선과-결재선을-분리한다) | 결재는 검토선과 결재선을 분리한다 | 2025-11-01 | 채택 |
| [ADR-009](#adr-009-장부마다-스프레드시트를-따로-만든다) | 장부마다 스프레드시트를 따로 만든다 | 2025-11-02 | 채택 |
| [ADR-010](#adr-010-라우터-없이-상태-기반으로-화면을-전환한다) | 라우터 없이 상태 기반으로 화면을 전환한다 | 2025-07-08 | 채택 |
| [ADR-011](#adr-011-electron-데스크톱-앱으로-배포한다) | Electron 데스크톱 앱으로 배포한다 | 2025-09-15 | 채택 (2025-11-18부터 웹과 병행) |
| [ADR-012](#adr-012-github-actions로-ci와-electron-빌드를-돌린다) | GitHub Actions로 CI와 Electron 빌드를 돌린다 | 2025-10-04 | 채택 |
| [ADR-013](#adr-013-백엔드를-cloud-run-서버에서-apps-script로-옮긴다) | 백엔드를 Cloud Run 서버에서 Apps Script로 옮긴다 | 2025-10-01 | 채택 |
| [ADR-014](#adr-014-앱-상태를-useappstate-훅으로-모은다) | 앱 상태를 `useAppState` 훅으로 모은다 | 2025-09-25 | 채택 |

이 저장소 이후에 내려진 결정(리메이크의 CI 정리, 환경변수 구조 변경 등)은 [hot_potato_remake의 ADR](https://github.com/semicolon213/hot_potato_remake/blob/main/docs/ADR.md)에 있습니다.

---

## ADR-001 Google Workspace를 플랫폼으로 쓴다

**날짜:** 2025-08-06 `d3994fe` "구글 로그인성공"

**상황:** 기록된 선택 이유는 없습니다. 당시 README는 프로젝트를 "구글 계정 기반의 사용자 인증 시스템을 가진 React 애플리케이션", 이후 "Google Workspace를 기반으로 한 통합 ERP"로 소개합니다.

**결정:** 로그인(OAuth), 저장(Sheets·Drive), 문서(Docs), 일정(Calendar), 메일(Gmail)을 Google Workspace에 맡깁니다. 처음에는 Cloud Run 서버, 2025-10-01부터는 Apps Script가 업무 로직을 맡습니다([ADR-013](#adr-013-백엔드를-cloud-run-서버에서-apps-script로-옮긴다)).

**결과:**
- 별도 계정 체계 없이 Google 계정으로 로그인합니다.
- 결과물(문서, 장부)은 Google 화면에서 그대로 열립니다. Google 서비스 화면을 앱 안에 띄우는 페이지(`GoogleService`)도 있습니다.
- 대가: Apps Script와 Sheets API의 호출 할당량 안에서 동작해야 합니다. 실제로 429가 자주 나서 [ADR-005](#adr-005-클라이언트-캐시와-백그라운드-동기화)를 도입했습니다.

## ADR-002 Google Sheets를 데이터베이스로 쓴다

**날짜:** 2025-08-14 `96a52c9` "자유게시판 엑셀 시트 연결" (이후 2025-08-17 공지, 2025-08-19 대시보드)

**상황:** 기록된 선택 이유는 없습니다.

**결정:** 스프레드시트 파일을 DB로, 시트를 테이블로 씁니다. 도메인마다 파일을 나눕니다(`hp_member`, `notice`, `workflow`, `student`, `staff`, `calendar_*`, 장부별 파일, 사용자별 `hp_potato_DB`).

**결과:**
- 운영자가 시트를 열어 데이터를 직접 확인하고 고칠 수 있습니다.
- 파일 단위 Drive 공유로 접근 범위를 나눌 수 있습니다.
- 대가: FK·트랜잭션·동시성 제어가 없습니다. 무결성은 애플리케이션 코드가 지켜야 하고, 열 순서가 바뀌면 코드가 깨집니다([DATA_MODEL.md §6](./DATA_MODEL.md#6-알려진-불일치-정리-대상)).

## ADR-003 데이터 접근 경로를 두 갈래로 나눈다

**날짜:** 2025-10-01 `f9c3d76` "apps script migration". 브라우저 직접 경로(`papyrus-db`)는 2025-08부터 있었고, Apps Script 경로가 이날 더해졌습니다.

**상황:** 브라우저 직접 경로는 사용자의 OAuth 토큰으로 시트를 읽고 씁니다. 회원 승인, 관리자 키, 폴더 생성·권한 부여처럼 배포자 권한이 필요한 처리는 서버 쪽에서 해야 했습니다.

**결정:**
- **Apps Script 경유(`apiClient`):** 회원·관리자, 공지, 결재, 공유 문서·양식·태그, 장부 생성, 스프레드시트 ID 조회
- **브라우저 직접(`papyrus-db`·`gapi` + 사용자 OAuth 토큰):** 캘린더, 학생·교직원, 장부 항목, 예산 계획, 개인 설정(`hp_potato_DB`), 양식 문서 생성

**결과:**
- 조회가 많은 화면은 Apps Script를 거치지 않습니다.
- 대가: 같은 시트를 두 경로에서 다루면 열 구성 가정이 어긋납니다(예산계획 시트, [DATA_MODEL.md §6](./DATA_MODEL.md#6-알려진-불일치-정리-대상)). 일부 훅(`useStaffOnly`, `useCommitteeOnly`, `useStudentManagement`)과 `StudentDetailModal`은 `apiClient`를 거치지 않고 `fetch`로 프록시를 직접 불러, 재시도·캐시 규칙이 적용되지 않습니다.

## ADR-004 Apps Script 앞에 Netlify Function 프록시를 둔다

**날짜:** 2025-11-18 `4afac0c` "Netlify Function"

**상황:** 개발 중에는 Vite dev 서버 프록시(`/api`)로 Apps Script를 불렀습니다(주석: "CSP 문제 해결을 위해 Vite 프록시 사용"). 운영 빌드는 `VITE_APP_SCRIPT_URL`로 Apps Script를 직접 불렀습니다. 웹 배포를 시작하면서 브라우저에서 직접 호출할 때의 CORS 문제를 풀어야 했습니다(`proxy.js` 머리 주석: "CORS 문제 해결을 위해 서버 사이드에서 Apps Script로 요청을 프록시").

**결정:** 운영 빌드의 `apiClient`는 `/.netlify/functions/proxy`를 부릅니다. 프록시는 CommonJS(`exports.handler`)로 작성했고, `process.env.VITE_APP_SCRIPT_URL || process.env.APP_SCRIPT_URL`을 대상 주소로 씁니다. 로컬 개발은 그대로 Vite 프록시(`/api`)를 씁니다.

**결과:**
- 웹 배포에서 CORS 문제가 사라졌습니다.
- Apps Script가 JSON이 아닌 응답(HTML 오류 페이지 등)을 주면 프록시가 `{success:false, error}`로 감싸 돌려줍니다.
- 대가: 요청마다 한 단계를 더 거칩니다. Netlify 환경변수를 빠뜨리면 모든 API가 500을 반환합니다. 같은 날 추가된 `papyrusManager.getApiBaseUrl()`은 Electron에서는 Apps Script 주소를 직접 쓰지만, `apiClient`는 Electron을 구분하지 않습니다.

## ADR-005 클라이언트 캐시와 백그라운드 동기화

**날짜:** 2025-11-17 `609af62` "캐시 도입.... 성능 최적화", 2025-11-18 `7a3b219` "스마트 갱신 추가", `21fa009` "429"

**상황:** 당시 문서 `DATA_CACHING_STRATEGY.md`는 "현재 프로젝트에서 429 에러가 자주 발생하는 것을 확인"했다고 적고, Apps Script·Sheets API 호출 제한과 동시 사용자 수를 이유로 호출 빈도를 줄이기로 합니다. 액세스 토큰이 약 1시간이라 캐시 TTL을 그보다 짧게 잡았습니다.

**결정:**
- 응답을 메모리(LRU 100개) + localStorage(항목 100KB 이하) 2단계 캐시에 액션별 TTL(3~45분)로 보관합니다. IndexedDB는 "현재는 불필요"로 미뤘습니다.
- 로그인 후 `DataSyncService.initializeData`가 화면에 필요한 데이터를 카테고리별로 미리 가져옵니다.
- 카테고리별 주기로 **현재 페이지가 쓰는 데이터만** 백그라운드에서 갱신합니다(스마트 갱신). 창이 비활성이면 멈춥니다.
- 쓰기가 성공하면 관련 캐시 키만 무효화하고 다시 가져옵니다.
- 429가 오면 그 카테고리의 갱신을 30~120분 멈춥니다.

**결과:**
- 같은 데이터를 여러 화면에서 써도 TTL 안에서는 호출이 한 번입니다.
- 대가: 캐시 무효화 규칙을 액션마다 손으로 관리합니다(`apiClient.getCacheKeysToInvalidate`, `papyrusManager`의 공지 쓰기). 페이지-카테고리 표의 키가 실제 페이지 이름과 달라 결재·문서 화면에서는 스마트 갱신이 동작하지 않습니다([ARCHITECTURE.md §9.2](./ARCHITECTURE.md#92-데이터-로딩과-캐시)).

## ADR-006 폴더·시트 이름을 환경변수와 스크립트 속성으로 관리한다

**날짜:** 2025-10-04 `661a30b` "3차 리펙터링 및 코드 최적화"(`src/config/environment.ts` 추가), 2025-10-31 `0a7c3a0` "시트ID 방식 변경, 앱스크립트 속성 적용, 환경변수 정리"

**상황:** 기록된 선택 이유는 커밋 메시지 외에 없습니다.

**결정:**
- 프론트는 이름마다 환경변수를 하나씩 둡니다. `VITE_APP_SCRIPT_URL`, `VITE_*_SPREADSHEET_NAME`, `VITE_*_SHEET_NAME`, `VITE_*_FOLDER_NAME`, `VITE_GROUP_EMAIL_STUDENT`/`COUNCIL`/`PROFESSOR`/`ADJUNCT_PROFESSOR`/`ASSISTANT` 등입니다. 값이 없으면 `ENV_CONFIG`의 기본값(`hot potato`, `notice`, `시트1` …)을 씁니다.
- 스프레드시트 ID는 코드에 두지 않고, 이름 목록을 Apps Script `getSpreadsheetIds`에 보내 찾습니다.
- Apps Script는 같은 종류의 이름을 스크립트 속성(`ROOT_FOLDER_NAME`, `SHEET_NAME_USER` …)에서 읽고, 없으면 기본값을 씁니다.

**결과:**
- 폴더·시트 이름이 바뀌어도 코드를 고치지 않고 설정만 바꿀 수 있습니다.
- 대가: 변수 수가 많고, 프론트(`.env`, Netlify)와 Apps Script(스크립트 속성) 양쪽 값을 맞춰야 합니다. 일부 이름(`VITE_HOT_POTATO_DB_SPREADSHEET_NAME`, 게시판의 `BOARD_SHEET_NAME`)은 실제 저장소와 대응하지 않습니다([DATA_MODEL.md §6](./DATA_MODEL.md#6-알려진-불일치-정리-대상)).

## ADR-007 가입은 사전 등록 + 승인제로 한다

**날짜:** 2025-10-29 `ee44903` "가입 요청 수정"(학번·이름 일치 검증), 같은 날 `cc11d27` "그룹스 알림 전송 모달", 2025-11-14 `4cf7909` "회원 정보 추가"(사전 등록 일괄 추가). 관리자 승인 화면 자체는 2025-09 초(`4cccff9`)부터 있었습니다.

**상황:** Google 계정만 있으면 누구나 로그인할 수 있습니다. 당시 README는 "관리자 승인 후 메인 화면 접근"을 인증 흐름으로 적었습니다.

**결정:** 관리자가 학번·이름을 `hp_member.user` 시트에 미리 넣고, 사용자는 일치하는 학번·이름으로 가입을 신청하며, 관리자가 역할(그룹)을 골라 승인합니다. 승인하면 그 역할의 Google 그룹 관리자에게 **추가 요청 메일**을 보냅니다. 관리자 권한은 관리자 키를 받아 신청합니다.

**결과:**
- 사전 등록되지 않은 사람은 가입 신청이 거절됩니다.
- 대가: 학기 초마다 사전 등록이 필요하고, 그룹 추가는 메일을 받은 사람이 직접 해야 합니다. 기준 시점 코드에서는 거부 처리와 관리자 가입 반영에 결함이 있습니다(BUG-02, BUG-10, [OPERATOR_MANUAL.md](./OPERATOR_MANUAL.md)).

## ADR-008 결재는 검토선과 결재선을 분리한다

**날짜:** 2025-11-01 `b093659` "후... 결재 프로토타입...", 2025-11-16 `017353b` "워크플로우 템플릿 추가"

**상황:** 기록된 선택 이유는 없습니다.

**결정:** 결재마다 `review_line`과 `payment_line`을 따로 두고, 검토가 모두 승인되어야 결재가 시작됩니다. 단계마다 승인·반려·보류를 지원하고, 모든 전이를 `workflow_history`에 남깁니다. 자주 쓰는 검토선·결재선은 결재 템플릿으로 저장합니다.

**결과:**
- 단계별 처리 이력이 시트에 남습니다.
- 대가: 상태가 7개로 늘어 전이 규칙이 복잡합니다([ARCHITECTURE.md §6.2](./ARCHITECTURE.md#62-결재-workflow_documentsworkflow_status)). 프론트 타입과 백엔드의 상태 표기(`결제`/`결재`)가 어긋나 있습니다.

## ADR-009 장부마다 스프레드시트를 따로 만든다

**날짜:** 2025-11-02 `d6a9284` "회계 기능 추가"

**상황:** 기록된 선택 이유는 없습니다. 코드(`AccountingManagement.gs`)는 장부를 만들 때 장부마다 접근 대상(역할 그룹, 사용자)을 따로 받아 폴더·파일 권한을 설정합니다.

**결정:** 장부를 만들 때마다 `hot potato/회계/{장부명}/` 폴더, 장부 스프레드시트, `증빙/` 폴더를 새로 만들고, 지정한 사용자·그룹에만 공유합니다. 장부 생성은 Apps Script가, 장부 안의 항목·예산 계획 쓰기는 브라우저가 직접 합니다.

**결과:**
- Drive 공유 권한으로 장부별 접근을 나눌 수 있습니다.
- 대가: 장부 목록을 보려면 회계 폴더를 탐색해야 하고(`getLedgerList`), 장부 스키마를 바꾸면 기존 장부 파일을 하나씩 마이그레이션해야 합니다.

## ADR-010 라우터 없이 상태 기반으로 화면을 전환한다

**날짜:** 2025-07-08 `07fedce` "Init"(`currentPage` 상태), 2025-09-04 `1897c51` "새로고침시 페이지 위치 유지"(`?page=` 쿼리), 2025-09-25 `297564c` "1차 리펙터링"(`PageRenderer` 분리)

**상황:** 처음부터 `currentPage` 상태로 화면을 바꿨습니다. 새로고침하면 대시보드로 돌아가는 문제가 있어 쿼리 파라미터에 현재 페이지를 남기게 했습니다. 라우터 라이브러리는 한 번도 의존성에 들어온 적이 없습니다.

**결정:** `currentPage` 상태와 `?page=` 쿼리 파라미터로 화면을 바꾸고, `PageRenderer`가 `switch`로 페이지를 고릅니다. 페이지는 모두 정적 import합니다.

**결과:**
- 웹과 Electron에서 같은 코드로 화면을 전환하고, 공지 딥링크(`?page=announcement-view&announcementId=N`)도 됩니다.
- 대가: 모든 페이지가 첫 번들에 들어갑니다(라이브러리만 `manualChunks`로 분리). 라우트 단위 접근 제어가 없어 권한은 메뉴 노출에만 의존합니다. 메뉴에 없는 페이지(`board`, `proceedings`)와 "구현 예정" 페이지가 `switch`에 남아 있습니다.

## ADR-011 Electron 데스크톱 앱으로 배포한다

**날짜:** 2025-09-15 `2468f40` "스타일 수정"(`electron/main.cjs` 추가), 2025-10-07 `2f3f476` "자동 로그아웃 및 교직원 UI/UX"(`preload.js`), 2025-10-04 `661a30b`(`electron-build.yml`), 2025-11-18 `v1.0.0` 태그

**상황:** 기록된 선택 이유는 없습니다. 당시 `DEPLOYMENT_GUIDE.md`는 "이 프로젝트는 Electron 앱으로, GitHub Actions를 통해 자동으로 빌드 및 배포됩니다"라고 적었고, `npm run dev`도 Vite와 Electron을 함께 띄웁니다.

**결정:** 같은 Vite 번들을 Electron으로 감싸 Windows(NSIS), macOS(dmg), Linux(AppImage)로 빌드합니다. 창을 닫을 때 `app-before-quit` 이벤트로 자동 로그아웃합니다. Google 서비스 화면은 Electron에서는 `webview`, 웹에서는 `iframe`으로 띄웁니다. 2025-11-18부터는 Netlify 웹 배포를 함께 운영합니다([ADR-004](#adr-004-apps-script-앞에-netlify-function-프록시를-둔다)).

**결과:**
- 코드 하나로 데스크톱 앱과 웹 두 형태를 냅니다.
- 대가: 패키징된 앱은 `file://`에서 열리므로 상대 경로 API 호출을 따로 처리해야 합니다. `papyrusManager`는 처리하지만 `apiClient`는 처리하지 않습니다. Electron 창의 보안 설정은 검토가 필요합니다([SECURITY.md](./SECURITY.md)).

## ADR-012 GitHub Actions로 CI와 Electron 빌드를 돌린다

**날짜:** 2025-10-04 `661a30b` "3차 리펙터링 및 코드 최적화"(워크플로 2개 추가), 2025-10-05 `28bcbf8` "CI/CD 파이프라인 수정"(`.prettierrc` 추가) ~ `665a13c` "의존성 이슈 픽스 및 ci/cd 작업"

**상황:** React 19로 올리면서 의존성 충돌을 확인할 필요가 있었습니다. 당시 `CI_CD_UPDATE_GUIDE.md`는 `npm ci --legacy-peer-deps`를 `npm ci`로 바꾸고 Node를 22.x로 올리며 "React 19 호환성 검증"을 추가했다고 적습니다.

**결정:**
- `ci.yml`: `main`·`develop` push와 PR에서 실행합니다.
  - `quality`: `npm run type-check`, React 19·`papyrus-db` 설치 확인(`npm ls`), ESLint(`--max-warnings 1000`, 실패해도 계속), `npm audit --audit-level high`(실패해도 계속)
  - `test`: Node 20.x·22.x 매트릭스로 `npm run test:ci`, Codecov 업로드
  - `performance`: `npm run build`, 번들 크기 확인(실패해도 계속), `dist/` 아티팩트 업로드
  - `deploy`(`main`만): 메시지만 출력합니다. 실제 웹 배포는 Netlify가 합니다.
- `electron-build.yml`: `v*` 태그 push 또는 수동 실행 시 3개 OS에서 Electron 앱을 빌드하고 GitHub Release를 만듭니다. 빌드용 환경변수는 저장소 Secrets에서 받습니다.

**결과:**
- push마다 빌드와 테스트가 돌고, 태그 하나로 설치 파일이 나옵니다.
- 대가: 린트·audit는 실패해도 통과합니다. `type-check`는 루트 `tsconfig.json`(`files: []`, `references`만 있음)을 검사해 실제 소스를 보지 않습니다. 같은 소스를 `tsc --noEmit -p tsconfig.app.json`으로 검사하면 오류 676건이 나옵니다(기준 시점). 테스트 파일은 4개이고 그중 1개(`Login.test.tsx`)는 Jest 설정에서 제외됩니다([TEST_PLAN.md](./TEST_PLAN.md)).

## ADR-013 백엔드를 Cloud Run 서버에서 Apps Script로 옮긴다

**날짜:** 2025-10-01 `e85aa32` "apps script 코드 변환", `f9c3d76` "apps script migration". 서버 코드 삭제는 2025-10-29 `ecdb13e` "Cloud Run 코드 제거"

**상황:** 2025-09-02(`4cccff9` "로그인 기능....")부터 관리자 키와 회원 승인은 Node.js 서버 `dailyKeyUpdate`(Google Cloud에 배포, `googleapis` 사용)가 처리했습니다. 이전 이유는 기록되어 있지 않습니다. 당시 `appScript/README.md`는 "Google Cloud Functions에서 Google Apps Script로 마이그레이션"이라고 적었습니다.

**결정:** 서버 기능을 Apps Script 웹앱(`Main.gs`의 `doPost`)으로 옮기고, 프론트는 `apiClient`의 `action` 기반 POST 하나로 호출합니다. 이후 공지·문서·결재·회계 기능도 같은 웹앱에 액션으로 더했습니다.

**결과:**
- 별도 서버 없이 Workspace 안에서 백엔드가 돌아갑니다. 웹앱은 배포자 권한으로 Drive·Gmail을 다룹니다.
- 대가: 모든 `.gs` 파일이 전역 스코프 하나를 공유해 같은 이름의 함수가 충돌할 수 있고(9건, [CONVENTIONS.md §4](./CONVENTIONS.md#4-apps-script)), `Main.gs`가 2,400줄이 넘는 if 분기 하나로 커졌습니다. 마이그레이션 검증용·테스트용 `.gs` 파일도 같은 프로젝트에 들어 있습니다.

## ADR-014 앱 상태를 `useAppState` 훅으로 모은다

**날짜:** 2025-09-25 `297564c` "1차 리펙터링", `a850be6` "2차 리펙터링 및 주석, 구조 설명 md 파일 추가"

**상황:** 당시 `REFACTORING_DOCUMENTATION.md`에 따르면 `App.tsx`가 "1600+ 라인의 거대한 단일 파일"이었습니다. 리팩터링 목표로 기능 보존, 재사용성, CSS 표준화, "병합 충돌 최소화를 위한 파일 분리", Doxygen 형식 주석을 들었습니다.

**결정:** 공용 상태와 초기화 로직을 `hooks/core/useAppState.ts`로, 화면 선택을 `components/layout/PageRenderer.tsx`로 옮기고, 기능별로 `components/features/<도메인>`, `hooks/features/<도메인>` 폴더를 나눕니다. 상태는 React `useState`로 관리하고, `zustand`는 인증 상태(`useAuthStore`)에만 씁니다. 파일 머리에 `@file`/`@brief`/`@details` 주석을 답니다.

**결과:**
- 기능별 파일이 나뉘어 여러 명이 동시에 작업하기 쉬워졌습니다.
- 대가: `useAppState`가 다시 880줄 남짓으로 커졌고, `App`이 받은 상태를 `PageRenderer`에 props 50개 남짓으로 내려보냅니다. 사용자 정보가 `useAppState`(localStorage `user`)와 `useAuthStore`(zustand persist) 두 곳에 있습니다.
