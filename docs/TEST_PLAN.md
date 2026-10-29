# Hot Potato ERP 테스트 계획과 결과

> 개발 단계: **⑥ 테스트** · 산출물: 테스트 케이스 시트(TC), 결함 리포트, 테스트 결과 보고서
> 관련 다이어그램: [Communication 다이어그램](./ARCHITECTURE.md#7-communication-다이어그램-결재-승인)
> 이 문서는 `main` @ `ffed6c7` 기준입니다. 이후 결과는 [리메이크 TEST_PLAN](https://github.com/semicolon213/hot_potato_remake/blob/main/docs/TEST_PLAN.md)에서 관리합니다.

## 1. 원칙

- **사실대로 기록합니다.** 통과하지 못한 검사는 통과하지 못했다고 적습니다.
- 자동 테스트가 없는 핵심 흐름은 **수동 TC**로 매 배포 전에 확인합니다.
- 버그를 고치면 같은 커밋에 그 버그를 잡는 테스트(또는 TC)를 추가합니다.

## 2. 테스트 수준

| 수준 | 도구 | 대상 | 현재 |
|---|---|---|---|
| 단위 | Jest 29 + ts-jest + Testing Library | `src/utils`, 훅, 컴포넌트 | 3개 스위트 |
| 정적 검사 | ESLint 9, TypeScript, Prettier | `src/` 전체 | 오류 있음 (§4) |
| 빌드 | Vite | 프로덕션 번들 | 통과 (번들 크기 경고) |
| CI | GitHub Actions `ci.yml` (quality, test 20.x·22.x, performance, deploy), `electron-build.yml` (태그 푸시) | PR, `main`·`develop` 푸시 | 기준 커밋에서 test 잡 실패 (§4) |
| 백엔드 | Apps Script 편집기에서 수동 실행 (`Test*.gs`, `*Verification.gs`) | 암호화, 시트 연결, 회원, 문서 | 정비 필요 (§5) |
| 통합·시스템 | 수동 TC (§3) | 배포 환경 핵심 흐름 | 배포 전 수행 |

## 3. 테스트 케이스 시트 (수동, 배포 환경)

준비: 역할별 테스트 계정(학생, 집행부, 조교, 교수, 관리자), 테스트용 장부 1개

| TC | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| TC-AUTH-01 | 첫 로그인과 가입 신청 | 학번·이름 사전 등록 | 로그인 → 가입 폼 제출 | 승인 대기 화면 |
| TC-AUTH-02 | 사전 등록 없는 가입 신청 | 사전 등록 없음 | 가입 폼 제출 | 가입 거부 오류 메시지 |
| TC-AUTH-03 | 가입 승인 | TC-AUTH-01 완료 | 관리자가 승인 → 사용자 재로그인 | 대시보드 진입, `Approval=O`, 그룹 처리 로그 |
| TC-AUTH-04 | 가입 거부 | 승인 대기 사용자 | 관리자가 거부 | 사용자 상태가 거부로 바뀜 |
| TC-AUTH-05 | 잘못된 관리자 키 | — | 틀린 키로 관리자 가입 신청 | 신청 거부 |
| TC-AUTH-06 | 메뉴 노출 | 역할별 계정 | 각 계정으로 로그인 | 회계 메뉴는 집행부·조교·교수만, 관리자 메뉴는 관리자만 |
| TC-AUTH-07 | 관리자 가입 | 유효한 관리자 키 | 관리자 키 입력 → 가입 신청 → 승인 | `is_admin=O`, 관리자 메뉴 표시 |
| TC-AUTH-08 | 비활동 로그아웃 | — | 로그인 후 30분 동안 조작 없음 | 세션 만료 알림 후 로그인 화면 |
| TC-NOTI-01 | 공개 범위 공지 | 교수 계정 | 공개 범위를 "학생 그룹"으로 작성 | 학생 계정에 보이고, 다른 그룹 계정에는 안 보임 |
| TC-NOTI-02 | 학생 공지 작성 차단 | 학생 계정 | 공지 작성 | 서버가 거부 |
| TC-NOTI-03 | 고정 공지 | 교수 계정 | 고정 요청 → 관리자 승인 | 목록 맨 위에 표시 |
| TC-DOC-01 | 양식으로 문서 생성(나만 보기) | 공유 양식 1개 이상 | 양식 선택 → 나만 보기 | 개인 드라이브 개인 문서 폴더에 사본, 새 탭 |
| TC-DOC-02 | 양식으로 문서 생성(권한 부여) | — | 양식 선택 → 그룹 지정 | 공유 문서 폴더에 생성, 지정 그룹에 편집 권한 |
| TC-WF-01 | 결재 정상 흐름 | 검토자 1, 결재자 1 | 요청 → 검토 승인 → 결재 승인 | 상태 `검토중 → 결재중 → 결재완료`, 이력 3건 |
| TC-WF-02 | 검토 반려와 재상신 | TC-WF-01 사전 조건 | 요청 → 검토 반려(사유) → 요청자 재상신 | `검토반려 → 검토중` |
| TC-WF-03 | 결재 반려 | — | 결재 단계에서 반려 | `전체반려`, 요청자에게 재상신 버튼 |
| TC-WF-04 | 보류와 재개 | — | 검토 보류 → 같은 검토자 승인 | `검토보류 → 결재중` |
| TC-WF-05 | 순서 건너뛰기 차단 | 검토자 2명 | 2번 검토자가 먼저 승인 시도 | 거부 |
| TC-WF-06 | 참여자 문서 열람 | — | 결재 요청 후 검토자가 문서 열기 | 열람 가능 |
| TC-ACC-01 | 장부 생성 | 집행부 계정 | 장부 생성 | 폴더·시트·증빙 폴더 생성, 지정 사용자만 접근 |
| TC-ACC-02 | 지출 등록과 증빙 | TC-ACC-01 | 지출 + 영수증 파일 | 잔액 감소, 증빙 폴더에 파일, 내역에 링크 |
| TC-ACC-03 | 예산 계획 전체 흐름 | 부관리인 1명 | 작성 → 검토 → 승인 → 집행 | `pending → reviewed → approved → executed`, 지출 내역 자동 생성 |
| TC-ACC-04 | 잔액 초과 예산 | — | 잔액보다 큰 예산 작성 | 거부 |
| TC-CAL-01 | 역할별 캘린더 | 역할별 계정 | 일정 추가 → 다른 역할로 조회 | 참석자 범위에 맞게 보임 |
| TC-STU-01 | 유급 표시 | 학생 데이터 | 학생 상세에서 유급 체크 → 다시 열기 | 유급 표시 유지 |
| TC-STU-02 | 연간 학년 갱신 | 테스트 학생 시트 사본, 유급 1명, 휴학 1명 | Apps Script 편집기에서 `updateStudentGrades(사본 ID)` 실행 | 1·2학년 +1, 3학년은 `졸업`, 휴학·유급 학생은 그대로 |
| TC-ETC-01 | Google 서비스 바로가기 | — | 구글 메뉴 → Sheets | 앱 안에서 해당 서비스 화면 표시 |

## 4. 자동 검사 결과 (2026-10-27, `main` @ `ffed6c7`)

로컬(Windows, Node 22)에서 `npm ci` 후 실행했습니다.

| 검사 | 명령 | 결과 |
|---|---|---|
| 단위 테스트 | `npx jest` | **13개 테스트 통과 / 스위트 3개 중 1개 컴파일 실패** |
| CI 테스트 | `npm run test:ci` | **실패**: 위 스위트 실패 + 커버리지 기준(1%) 미달 (branches 0.7%, functions 0.74%) |
| 린트 | `npm run lint` | **실패**: 오류 31, 경고 416 |
| 타입 검사 | `npx tsc --noEmit -p tsconfig.app.json` | **실패**: 오류 676 |
| `npm run type-check` | `tsc --noEmit` | 종료 코드 0이지만 **검사 대상 파일이 없음** (루트 `tsconfig.json`에 `files: []`와 참조만 있음) |
| 포맷 검사 | `npm run format:check` | **실패**: `prettier`가 devDependencies에 없어 명령을 찾지 못함 |
| 빌드 | `npm run build` | 통과 (약 8초) |
| 번들 크기 | `npm run bundle-size` | 검사 없음 (스크립트가 "skipped" 문구만 출력). 빌드 결과 `index` 1,836.7kB (gzip 561.5kB), `chart-vendor` gzip 102.0kB. Vite가 1,000kB 초과 경고 |
| GitHub Actions | `ci.yml` (run 19813851721, 2025-12-01) | **실패**: quality 통과, test(20.x) 실패, test(22.x) 취소, performance·deploy 건너뜀 |

`type-check`가 아무 파일도 검사하지 않고 린트 단계가 `continue-on-error`라서 `quality` 잡이 통과했습니다. `npm run ci` 스크립트는 `format:check`에서 멈춥니다.

### 4.1 단위 테스트 상세

| 파일 | 대상 | 결과 |
|---|---|---|
| `src/utils/__tests__/timeUtils.test.ts` | 상대 시간 표시 | 6 / 6 통과 |
| `src/utils/__tests__/localStorageUtils.test.ts` | 최근 문서 목록 (정렬, 최대 개수, 저장소 오류 처리) | 7 / 7 통과 |
| `src/utils/database/__tests__/papyrusManager.test.ts` | 스프레드시트 ID 탐색, 빈 결과 처리 | **컴파일 실패**: 삭제된 `fetchPosts`·`addPost`를 import, `fetchAnnouncements` 인자 개수 불일치 |
| `src/components/__tests__/Login.test.tsx` | 로그인 화면 | `jest.config.cjs`에서 **제외됨** |

### 4.2 린트·타입 오류 분포

- 린트 오류: `no-case-declarations` 14, `prefer-const` 12(자동 수정 가능), `no-useless-escape` 3, `no-empty` 2
- 린트 경고: 미사용 변수 274, `any` 96, `exhaustive-deps` 45, `only-export-components` 1
- 타입 오류가 많은 파일: `NewDocument.tsx` 49, `useWidgetManagement.ts` 40, `LedgerEntryList.tsx` 39, `papyrusManager.ts` 37, `DocumentManagement.tsx` 31

## 5. Apps Script 테스트 파일

| 파일 | 다루는 내용 | 상태 |
|---|---|---|
| `TestBasic.gs` | 암호화 왕복, 다층 변환, 키 생성 | 알고리즘·다층 변환 테스트는 실행 가능. 키 생성·이메일 테스트는 없는 모듈 객체를 호출 |
| `TestSpreadsheet.gs` | `hp_member` 연결, 시트 읽기·쓰기 | 일부 함수가 없는 모듈 객체를 호출 |
| `TestUserManagement.gs` | 가입·승인·거부·상태 | 일부 함수가 없는 모듈 객체를 호출 |
| `TestDocumentManagement.gs`, `DocumentTests.gs` | 문서 생성·권한·폴더 이동 (실제 파일 생성) | 함수 이름 중복 있음 (`testDocumentCreation` 등) |
| `MigrationVerification.gs`, `OptimizationVerification.gs`, `ComprehensiveVerification.gs` | 설정·캐시·종합 점검 | 정의되지 않은 객체 호출로 예외 |

테스트 파일 밖에서도 전역 함수 이름이 겹칩니다(`verifyAdminKey`, `setDocumentPermissions`, `getSheetIdByName` 등). Apps Script는 같은 이름이면 나중에 로드된 정의 하나만 남기 때문에, 어느 쪽이 실행되는지 파일 순서에 따라 달라집니다.

## 6. 결함 리포트 (테스트·코드 점검으로 발견)

| ID | 결함 | 영향 | 관련 TC | 상태 |
|---|---|---|---|---|
| BUG-01 | 검토 단계 반려 시 서버 오류 (`processReviewAction`에서 선언되지 않은 `paymentLine` 참조) | 검토 반려 불가 | TC-WF-02 | 미해결 |
| BUG-02 | 가입 거부가 옛 시트 구조(`users`, `student_id`)를 참조 | 가입 거부 불가 | TC-AUTH-04 | 미해결 |
| BUG-03 | 캘린더 역할 키(`council`, `ADprofessor`)와 실제 값(`std_council`, `ad_professor`) 불일치 | 집행부·겸임교원이 학생 캘린더로 연결됨 | TC-CAL-01 | 미해결 |
| BUG-04 | 예산계획 시트의 열 순서가 서버 헤더·프론트 쓰기·프론트 읽기마다 다름 | 예산 상태·상세가 잘못 읽힐 수 있음 | TC-ACC-03 | 미해결 |
| BUG-05 | 프론트 결재 상태 타입이 `결제중/결제완료`(오타), 서버는 `결재중/결재완료/결재보류` | 상태별 표시·필터 누락 가능 | TC-WF-01 | 미해결 |
| BUG-06 | `apiClient` 재시도가 한 번 타임아웃되면 이후 재시도가 모두 즉시 실패하고, 쓰기 요청도 재시도함 | 느린 응답에서 실패, 쓰기 중복 가능 | — | 미해결 |
| BUG-07 | `getAccountingCategories` 액션이 `카테고리` 시트가 아닌 첫 시트를 읽음 | 현재 화면은 시트를 직접 읽어 영향 없음. 이 액션을 쓰면 잘못된 목록 | — | 미해결 |
| BUG-08 | 승인 대기 화면이 자동으로 새로 고쳐지지 않음 | 승인 후에도 재로그인 필요 | TC-AUTH-03 | 개선 과제 |
| BUG-09 | `initializeSystem`이 일부 실패해도 성공으로 보고 | 초기 세팅 누락을 놓침 | — | 미해결 |
| BUG-10 | 관리자 키로 가입 신청해도 일반 사용자로 저장됨 (프론트는 `isAdmin`을 보내고 서버는 `role`을 읽음) | 관리자 가입 경로가 동작하지 않음 | TC-AUTH-07 | 미해결 |
| BUG-11 | 연간 학년 갱신이 유급 표시를 먼저 지운 뒤 모든 학생을 진급시킴 | 유급 학생도 학년이 오름 | TC-STU-02 | 미해결 |
| BUG-12 | 관리자 화면의 관리자 키 전송이 키를 찾지 못해 항상 실패 (`getConfig('admin_key')`에 해당 키가 없음) | 관리자 키를 메일로 받을 수 없음 | — | 미해결 |
| BUG-13 | 백그라운드 갱신 표(`PAGE_CATEGORY_MAP`)의 키 `workflow`·`documents`가 실제 페이지 이름과 다름 | 결재·문서 화면에서 페이지 기반 자동 갱신이 일어나지 않음 | — | 미해결 |

위치:

| ID | 파일 |
|---|---|
| BUG-01 | `appScript/DocumentWorkflowActions.gs:641` |
| BUG-02 | `appScript/UserApproval.gs:342`, `:364` |
| BUG-03 | `src/hooks/core/useAppState.ts:330`, `src/App.tsx:660`, `:784`, `:818` |
| BUG-04 | `appScript/AccountingManagement.gs:326`, `src/utils/database/accountingBudgetManager.ts:286`(쓰기), `:109`·`:129`(읽기) |
| BUG-05 | `src/types/documents.ts:93` |
| BUG-06 | `src/utils/api/apiClient.ts:137` |
| BUG-07 | `appScript/AccountingManagement.gs:741` |
| BUG-08 | `src/components/features/auth/PendingApproval.tsx:18` |
| BUG-09 | `appScript/InitialSetup.gs:45` |
| BUG-10 | `appScript/UserRegistration.gs:75`, `src/hooks/features/auth/useAuth.ts:366` |
| BUG-11 | `appScript/StudentManagement.gs:267`, `:294` |
| BUG-12 | `appScript/UserAuth.gs:265`, `appScript/CONFIG.gs:157` |
| BUG-13 | `src/services/dataSyncService.ts:59` |

BUG-10, BUG-11, BUG-12는 [리메이크](https://github.com/semicolon213/hot_potato_remake)에서 고쳐졌습니다. BUG-01~09는 리메이크에도 남아 있습니다([리메이크 TEST_PLAN §6](https://github.com/semicolon213/hot_potato_remake/blob/main/docs/TEST_PLAN.md#6-결함-리포트-테스트코드-점검으로-발견)). BUG-13도 리메이크에 남아 있습니다.

보안 관련 결함은 이 표에 적지 않고 비공개로 관리합니다([SECURITY.md](./SECURITY.md)).

## 7. 회귀 테스트 자동화 계획

기준 시점에 세운 계획입니다. 이후 진행은 리메이크에서 이어집니다.

| 단계 | 할 일 | 완료 기준 |
|---|---|---|
| 1 | `papyrusManager.test.ts`를 현재 API에 맞게 고치고 `Login.test.tsx`를 다시 켬 | `npx jest` 스위트 전부 통과 |
| 2 | `type-check` 스크립트를 `tsc -p tsconfig.app.json --noEmit`으로 바꾸고, 오류를 파일 단위로 줄임 | 새 오류가 늘지 않음 |
| 3 | 린트 오류 31건 수정, `prettier`를 devDependencies에 추가 | `npm run lint` 오류 0, `npm run format:check` 실행 가능 |
| 4 | 결재 상태 전이 로직을 순수 함수로 분리하고 표 기반 단위 테스트 작성 (§6 BUG-01, 05) | TC-WF-01~05를 단위 테스트로 재현 |
| 5 | CI의 린트 `continue-on-error`를 걷어 내고 test 잡을 통과시킴 | PR에서 실패하면 병합 불가 |
| 6 | 메인 번들 분할, `bundle-size` 스크립트를 실제 검사로 교체 | 번들 크기 기준 통과 |
| 7 | 핵심 흐름 E2E(Playwright): 로그인 목업 → 결재 요청 → 승인 | 배포 전 자동 실행 |
