# 환경변수 설정 가이드

## Apps Script 마이그레이션 후 환경변수 설정

프론트엔드가 Cloud Run에서 Apps Script로 마이그레이션되었습니다. 다음 환경변수들을 설정해주세요.

### 1. .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Apps Script 웹앱 URL (새로 추가)
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/실제_배포_ID/exec

# 기존 환경변수 (이미 설정되어 있음)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**중요**: 
1. Apps Script에서 "웹앱"으로 배포하세요
2. `실제_배포_ID`를 실제 배포 ID로 변경해주세요
3. 액세스 권한을 "모든 사용자"로 설정하세요
4. `.env` 파일을 프로젝트 루트에 생성하세요

### 2. 환경변수 설명

- `VITE_APP_SCRIPT_URL`: Apps Script 웹앱 URL (새로 추가, 필수)
- `VITE_GOOGLE_CLIENT_ID`: Google Client ID (기존)

### 3. 마이그레이션된 API 엔드포인트

기존 Cloud Run API가 Apps Script로 변경되었습니다:

| 기존 Cloud Run API | Apps Script Action |
|-------------------|-------------------|
| `/sendAdminKeyEmail` | `sendAdminKeyEmail` |
| `/dailyKeyUpdate` (getPendingUsers) | `getPendingUsers` |
| `/dailyKeyUpdate` (approveUser) | `approveUser` |
| `/dailyKeyUpdate` (rejectUser) | `rejectUser` |
| `/checkUserApprovalStatus` | `checkApprovalStatus` |
| `/submitRegistrationRequest` | `submitRegistrationRequest` |
| `/verifyAdminKey` | `verifyAdminKey` |

### 4. 새로운 API 클라이언트

모든 API 호출이 새로운 `ApiClient` 클래스를 통해 처리됩니다:

```typescript
import { apiClient } from './utils/api/apiClient';

// 사용 예시
const users = await apiClient.getPendingUsers();
const result = await apiClient.sendAdminKeyEmail(email, token);
```

### 5. 주요 변경사항

1. **단일 엔드포인트**: 모든 API 호출이 Apps Script URL로 통합
2. **액션 기반**: `action` 파라미터로 기능 구분
3. **에러 처리**: 재시도 로직과 타임아웃 설정 포함
4. **타입 안전성**: TypeScript 타입 정의 개선

### 6. 테스트

환경변수 설정 후 다음 명령어로 테스트하세요:

```bash
npm run dev
```

브라우저 개발자 도구에서 API 호출이 정상적으로 작동하는지 확인하세요.
