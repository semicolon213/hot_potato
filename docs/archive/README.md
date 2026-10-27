# 보관 문서

2026-10-27 문서 재정리 전에 쓰던 문서입니다. **코드와 다른 내용이 있으니** 내용을 확인할 때는 [docs/README.md](../README.md)의 문서를 기준으로 하세요.
"왜 이렇게 바뀌었는지" 추적할 때 참고용으로 남겼습니다.

## 어디로 옮겨졌나

| 보관 문서 | 현재 문서 |
|---|---|
| `INSTALLATION_GUIDE`, `ENVIRONMENT_VARIABLES_SETUP` | [GETTING_STARTED.md](../GETTING_STARTED.md) |
| `DEPLOYMENT_GUIDE`, `CI_CD_UPDATE_GUIDE`, `CI_CD_VALIDATION_CRITERIA`, `APPSCRIPT_DEPLOYMENT_CHECKLIST` | [DEPLOYMENT.md](../DEPLOYMENT.md) |
| `PROJECT_DOCUMENTATION`, `DATA_CACHING_STRATEGY`, `REFACTORING_DOCUMENTATION`, `DESIGN_ANALYSIS` | [ARCHITECTURE.md](../ARCHITECTURE.md), [ADR.md](../ADR.md) |
| `API_DOCUMENTATION`, `APPSCRIPT_README_LEGACY` | [API_SPEC.md](../API_SPEC.md) |
| `EMAIL_ENCRYPTION_GUIDE` | [SECURITY.md](../SECURITY.md), [OPERATOR_MANUAL.md](../OPERATOR_MANUAL.md) |
| `BUG_FIXES_personalFavoriteManager`, `TYPE_ERROR_FIXES` | 당시 분석·수정 기록 |

## 알려진 차이

- 캐시는 메모리 + localStorage만 씁니다. `DATA_CACHING_STRATEGY`의 IndexedDB 단계는 구현되지 않았습니다.
- `TYPE_ERROR_FIXES`는 "타입 에러 0개"라고 적었지만, 기준 커밋에서 `tsc -p tsconfig.app.json`은 오류 676개를 냅니다([TEST_PLAN.md §4](../TEST_PLAN.md#4-자동-검사-결과-2026-10-27-main--ffed6c7)).
- `CI_CD_*` 문서가 설명하는 품질 검사 중 타입 검사(`npm run type-check`)는 실제로 검사하는 파일이 없고, 포맷 검사는 `prettier`가 설치되지 않아 실패합니다.
- `APPSCRIPT_README_LEGACY`의 "Cloud Functions" 서버 코드는 2025-10-29에 삭제되었습니다([ADR-013](../ADR.md#adr-013-백엔드를-cloud-run-서버에서-apps-script로-옮긴다)).
- `initializeSystem()`은 `calendar_professor`를 만들지 않고, `admin_keys` 시트와 스크립트 속성도 직접 추가해야 합니다([DEPLOYMENT.md](../DEPLOYMENT.md)).
