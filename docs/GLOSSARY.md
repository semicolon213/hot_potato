# Hot Potato ERP 용어 사전

> 개발 단계: **② 요구사항** · 산출물: 용어 사전(Glossary)
> 기준: `main` 브랜치 `ffed6c7` (2025-12-01)

문서와 코드에서 같은 대상을 같은 이름으로 부르기 위한 목록입니다. "코드 표기"는 시트 열 이름이나 코드상 값입니다.

## 업무 용어

| 용어 | 코드 표기 | 뜻 |
|---|---|---|
| 뜨거운 감자 | Hot Potato | 서비스 이름. Google 그룹 설명 등 UI 문구에서 한글로 씀 |
| 사전 등록 | `addUsersToSpreadsheet` | 관리자가 학번·이름만 미리 넣어 두는 것. 가입 신청은 이 행과 일치해야 함 |
| 가입 신청 | `registerUser` | 사용자가 가입유형을 골라 승인을 요청하는 것 |
| 승인 대기 | `Approval = X` | 가입 신청 후 관리자 승인을 기다리는 상태. 승인되면 `O` |
| 가입유형 / 그룹 역할 | `user_type` | `student`(학생), `std_council`(집행부), `supp`(조교), `professor`(교수), `ad_professor`(겸임교원) |
| 관리자 | `is_admin = O` | 가입유형과 별개인 관리 권한 |
| 관리자 키 | `admin_keys` | 관리자 가입에 필요한 일회성 키. 매일 갱신 |
| Google 그룹 | `GROUP_ROLE_MAPPING` | 가입유형별 Google 그룹. 승인하면 그룹 관리자에게 추가 요청 메일을 보냄 |
| 결재 | workflow | 문서를 검토·결재 단계를 거쳐 승인받는 절차 |
| 결재 유형 | `workflow_type` | `direct`(기존 문서 결재), `workflow`(결재 문서 새로 작성), `workflow_with_attachment`(새 결재 문서 + 기존 문서 첨부) |
| 검토선 | `review_line` | 결재 전에 내용을 확인하는 사람 목록 (순서 있음) |
| 결재선 | `payment_line` | 최종 승인하는 사람 목록 (순서 있음). 코드의 `payment`는 '결재'를 뜻하며 돈과 무관 |
| 결재 상태 | `workflow_status` | `검토중` → `결재중` → `결재완료`. 그 밖에 `검토보류`, `검토반려`, `결재보류`, `전체반려` |
| 단계 상태 | 결재선 항목의 `status` | `대기`, `승인`, `반려`, `보류`. 반려로 건너뛴 단계는 `-` |
| 처리 이력 유형 | `action_type` | `요청`, `승인`, `재개`(보류 후 승인), `반려`, `보류`, `재제출` |
| 보류 | `검토보류`, `결재보류` | 담당자가 판단을 미룬 상태. 승인하면 `검토중`/`결재중`으로 재개 |
| 반려 | `검토반려`, `전체반려` | 담당자가 돌려보낸 상태. 검토 단계 반려는 `검토반려`, 결재 단계 반려는 `전체반려`. 요청자가 재상신 가능 |
| 재상신 | `resubmitWorkflow` | 반려된 결재를 고쳐서 다시 올리는 것. 이력에는 `재제출`로 남음 |
| 결재 문서 | `workflow_document_*` | 결재를 위해 시스템이 새로 만든 Google 문서. `ROOT/결재 문서/`에 저장 |
| 결재선 템플릿 | `workflow_templates` | 자주 쓰는 검토선·결재선 조합. 문서 태그와 연결 가능 |
| 양식 / 공유 양식 | `문서/양식` | 관리자가 올린 공용 템플릿 |
| 개인 양식 | `문서/개인 양식` | 사용자가 자기 드라이브에 둔 템플릿 |
| 공유 문서 / 개인 문서 | `문서/공유 문서` / `문서/개인 문서` | 시스템으로 만든 문서의 저장 위치 |
| 공용 태그 / 개인 태그 | `static_tag` / `hp_potato_DB.tag` | 문서·양식 분류 라벨 |
| 장부 | `{장부명}_장부` | 통장 하나의 입출금, 예산, 카테고리를 담은 스프레드시트 |
| 통장 | `통장` 시트 | 장부의 잔액과 관리인 정보 |
| 주관리인 / 부관리인 | `main_manager_id` / `sub_manager_ids` | 예산 계획을 승인 / 검토하는 사람 |
| 증빙 | `증빙` 폴더, `evidence_file_id` | 입출금 근거 파일(영수증 등). 장부별 `증빙/` 폴더에 저장 |
| 예산 계획 | `예산계획` 시트 | 집행 전에 승인받는 지출 계획 |
| 예산 계획 상태 | `status` | `pending`(검토 대기) → `reviewed`(부관리인 검토 완료) → `approved`(주관리인 승인) → `executed`(집행). 주관리인이 거절하면 `rejected` |
| 집행 | `executed` | 승인된 예산 계획을 실제 지출로 기록하는 것 |
| 고정 공지 | `fix_notice = O` | 목록 맨 위에 고정된 공지. 요청하면 `-`, 관리자가 승인하면 `O`, 거절하면 `X` |
| 공개 범위 | `access_rights` | 공지를 볼 수 있는 그룹·개인. 비우면 전체 공개 |
| 학적 상태 | `state` | `재학`, `휴학`, `졸업` 등 |
| 유급 | `flunk = O` | 진급 대상에서 제외되는 학생 |
| 진급 / 졸업 처리 | `updateStudentGrades` | 매년 1월 학년을 1 올림. 3학년은 학년 `-`, 상태 `졸업`으로 바꿈 |
| 학생 이슈 | `std_issue` | 학생별 상담·특이사항 기록 |
| 위원회 | `committee` | 학과 운영 위원회 구성원 |

## 기술 용어

| 용어 | 뜻 |
|---|---|
| Apps Script (GAS) | Google이 호스팅하는 서버리스 JavaScript 런타임. 이 시스템의 백엔드 |
| 웹앱 배포 | Apps Script를 HTTP로 호출할 수 있게 공개하는 것. `/exec` URL이 생김 |
| 스크립트 속성 | Apps Script의 키-값 설정 저장소 (`PropertiesService`). 폴더·시트 이름 등을 둠 |
| 시간 기반 트리거 | Apps Script가 정해진 시각에 함수를 실행하는 기능. 관리자 키 갱신, 학년 진급에 사용 |
| action | 프론트가 Apps Script에 보내는 요청 종류. 예: `requestWorkflow` |
| 프록시 | Netlify Function `proxy.js`. 브라우저 요청을 Apps Script로 대신 전달 |
| papyrus-db | Google Sheets를 테이블처럼 읽고 쓰는 라이브러리 |
| 데이터 동기화 / 프리페치 | `dataSyncService`가 로그인 직후 자주 쓰는 데이터를 미리 받아 캐시에 넣는 것 |
| TTL | 캐시 유효 시간 |
| 루트 폴더 | Drive의 `hot potato/`. 모든 공용 데이터가 이 아래에 있음 |
| `hp_potato_DB` | 사용자마다 개인 드라이브 `hot potato/`에 생기는 설정 스프레드시트 |
| 환경변수 | 프론트 설정. 이름마다 변수 하나씩 둠 (`VITE_APP_SCRIPT_URL`, `VITE_*_SPREADSHEET_NAME`, `VITE_*_SHEET_NAME`, `VITE_*_FOLDER_NAME`, `VITE_GROUP_EMAIL_*`). `src/config/environment.ts`에서 읽음 |
