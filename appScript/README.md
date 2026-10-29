# appScript: Hot Potato ERP 백엔드 (Google Apps Script)

이 폴더는 Google Apps Script 웹앱 코드입니다. `clasp` 설정 파일이 없어서, Apps Script 편집기에 파일을 붙여 넣어 올립니다.

| 알고 싶은 것 | 문서 |
|---|---|
| 액션 목록, 요청·응답 형식 | [docs/API_SPEC.md](../docs/API_SPEC.md) |
| 시트·폴더 구조 | [docs/DATA_MODEL.md](../docs/DATA_MODEL.md) |
| 파일 간 의존 관계 | [docs/ARCHITECTURE.md §8.2](../docs/ARCHITECTURE.md#82-apps-script-appscript) |
| 업로드·배포·초기 세팅 | [docs/DEPLOYMENT.md §2](../docs/DEPLOYMENT.md#2-apps-script) |
| 운영 작업 (관리자 키, 승인) | [docs/OPERATOR_MANUAL.md](../docs/OPERATOR_MANUAL.md) |
| 코딩 규칙 | [docs/CONVENTIONS.md §4](../docs/CONVENTIONS.md#4-apps-script) |

## 파일 구성

| 분류 | 파일 |
|---|---|
| 진입점 | `Main.gs` (`doPost`, `doGet`) |
| 설정 | `CONFIG.gs`, `TimeUtils.gs` |
| 초기 세팅 | `InitialSetup.gs` (`initializeSystem`) |
| 회원 | `UserAuth.gs`, `UserRegistration.gs`, `UserApproval.gs`, `GroupManagement.gs` |
| 관리자 키 | `KeyGeneration.gs`, `KeyVerification.gs`, `EncryptionKeyManagement.gs` |
| 암호화 | `EncryptionEmail.gs`, `EncryptionCore.gs`, `EncryptionAlgorithms.gs` |
| 공지 | `AnnouncementManagement.gs` |
| 문서·양식·태그 | `DocumentCreation.gs`, `DocumentTemplates.gs`, `DocumentSpreadsheet.gs`, `DocumentFolder.gs`, `DocumentPermissions.gs`, `StaticTagManager.gs` |
| 결재 | `DocumentWorkflow.gs`, `DocumentWorkflowActions.gs`, `WorkflowSpreadsheet.gs`, `WorkflowTemplateManager.gs` |
| 회계 | `AccountingManagement.gs` |
| 학생 | `StudentManagement.gs` |
| 시트 공통 | `SpreadsheetCore.gs`, `SpreadsheetUtils.gs`, `SpreadsheetCache.gs` |
| 수동 테스트·검증 | `TestBasic.gs`, `TestSpreadsheet.gs`, `TestUserManagement.gs`, `TestDocumentManagement.gs`, `DocumentTests.gs`, `*Verification.gs` ([TEST_PLAN §5](../docs/TEST_PLAN.md#5-apps-script-테스트-파일)) |

## 배포

편집기에서 파일을 갱신한 뒤 **배포 관리 → 기존 배포 편집 → 새 버전**으로 올리면 웹앱 URL이 그대로 유지됩니다.

이전 버전의 상세 README는 [docs/archive/APPSCRIPT_README_LEGACY.md](../docs/archive/APPSCRIPT_README_LEGACY.md)에 보관했습니다(현재 코드와 다른 부분이 있습니다).
