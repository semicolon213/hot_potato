# Hot Potato Admin Key Management System - App Script 마이그레이션

## 📋 개요
이 폴더는 Google Cloud Functions에서 Google Apps Script로 마이그레이션된 Hot Potato 관리자 키 관리 시스템입니다.

**마이그레이션 일자**: 2024년 12월  
**소스**: Google Cloud Functions (Node.js)  
**대상**: Google Apps Script (JavaScript)  
**상태**: ✅ 완료

## 📁 파일 구조
```
appScript/
├── 📄 README.md                    # 메인 설명서 (이 파일)
├── 📧 EMAIL_ENCRYPTION_GUIDE.md   # 이메일 암호화 설정 가이드
├── ⚙️  CONFIG.gs                   # 설정 파일 (중앙화된 설정 관리)
├── 🔐 Encryption.gs               # 암호화/복호화 함수들
├── 🔑 KeyManagement.gs            # 관리자 키 관리 함수들
├── 📊 SpreadsheetUtils.gs         # Google Sheets 연동 함수들
├── 👥 UserManagement.gs           # 사용자 관리 함수들
├── 🚀 Main.gs                     # 메인 함수들과 POST/GET 요청 처리
├── 🧪 Test.gs                     # 테스트 함수들
└── ✅ MigrationVerification.gs    # 마이그레이션 검증 함수들
```

## 📚 문서 가이드
- **README.md**: 전체 시스템 개요 및 사용법
- **EMAIL_ENCRYPTION_GUIDE.md**: 이메일 암호화 설정 상세 가이드

## 📊 마이그레이션 통계
- **총 파일 수**: 9개
- **총 코드 크기**: 약 200KB+
- **총 함수 수**: 80+ 개
- **암호화 방법**: 23개 (Base64, Caesar, ROT13, BitShift, Substitution, Padding, MultiEncode, RandomInsert, Transposition, Reverse, Atbash, Vigenere, RailFence, Columnar, Affine, Permutation, Pattern, Mirror, Zigzag, Wave, Snake)
- **API 엔드포인트**: 20+ 개
- **테스트 함수**: 30+ 개

## 주요 변경사항

### 1. Cloud Functions → Apps Script 변환
- **이전**: Node.js 기반 Google Cloud Functions
- **현재**: Google Apps Script (JavaScript ES5/ES6)

### 2. API 호출 방식 변경
- **이전**: `exports.functionName = async (req, res) => {}`
- **현재**: `function doPost(e) {}`, `function doGet(e) {}`

### 3. Google API 사용법 변경
- **이전**: `googleapis` 패키지 사용
- **현재**: Apps Script 내장 `SpreadsheetApp` 사용

### 4. Base64 인코딩/디코딩
- **이전**: `Buffer.from(text).toString('base64')`
- **현재**: `Utilities.base64Encode(text)`

### 5. 이메일 암호화 설정 (NEW!)
- **이전**: 고정된 ROT13 암호화
- **현재**: CONFIG.gs에서 설정 가능한 다양한 암호화 방법
- **단일/다중 레이어**: 1-5단계 암호화 레이어 지원
- **동적 설정 변경**: 런타임에 암호화 방법 변경 가능
- **설정 검증**: 암호화 설정의 유효성 자동 검사
- **하위 호환성**: 기존 ROT13 방식과 완벽 호환

## 새로운 기능: 이메일 암호화 설정

### 1. 설정 가능한 암호화 방법 (23가지)
- **ROT13**: 기본값, 간단한 문자 치환
- **Base64**: Base64 인코딩
- **Caesar**: 시저 암호 (13자리 이동)
- **BitShift**: 비트 시프트
- **Substitution**: 치환 암호
- **Padding**: 패딩 기반 암호화
- **MultiEncode**: 다중 인코딩
- **RandomInsert**: 랜덤 삽입
- **Transposition**: 전치 암호
- **Reverse**: 역순 암호
- **Atbash**: 아트바시 암호
- **Vigenere**: 비제네르 암호
- **RailFence**: 레일펜스 암호
- **Columnar**: 컬럼 암호
- **Affine**: 아핀 암호
- **Permutation**: 순열 암호
- **Pattern**: 패턴 암호
- **Mirror**: 미러 암호
- **Zigzag**: 지그재그 암호
- **Wave**: 웨이브 암호
- **Snake**: 스네이크 암호

### 2. 다중 레이어 암호화 (5-15단계)
- **최소 레이어**: 5개
- **최대 레이어**: 15개
- 여러 암호화 방법을 순차적으로 적용하여 보안성 향상

### 3. 동적 설정 변경
런타임에 암호화 방법을 변경할 수 있어 유연성 제공

### 4. 설정 검증
암호화 설정의 유효성을 자동으로 검사하여 오류 방지

자세한 사용법은 [EMAIL_ENCRYPTION_GUIDE.md](./EMAIL_ENCRYPTION_GUIDE.md)를 참조하세요.

## ✨ 최적화 사항

### 1. 설정 관리 최적화
- ✅ `CONFIG.gs`로 중앙화된 설정 관리
- ✅ 환경별 설정 지원 (development, staging, production)
- ✅ 동적 설정 변경 지원

### 2. 성능 최적화
- ✅ `CacheService`를 활용한 데이터 캐싱
- ✅ 사용자 데이터 캐시 무효화 로직
- ✅ 재시도 로직 (지수적 백오프)

### 3. 에러 처리 최적화
- ✅ 통합된 에러 처리 시스템
- ✅ 재시도 가능한 함수 실행
- ✅ 상세한 로깅 시스템

### 4. 코드 구조 최적화
- ✅ 모듈화된 파일 구조
- ✅ 함수별 명확한 책임 분리
- ✅ 재사용 가능한 유틸리티 함수들

## 🔧 설정 방법

### 1. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. "새 프로젝트" 클릭
3. 프로젝트 이름을 "Hot Potato Admin Key Management"로 설정

### 2. 파일 업로드
각 `.gs` 파일의 내용을 Apps Script 에디터에 복사하여 붙여넣기

### 3. 스프레드시트 연결 (권장)
**방법 1: Apps Script 프로젝트에 스프레드시트 연결 (권장)**
1. Apps Script 에디터에서 "리소스" → "고급 Google 서비스" 클릭
2. "Google Sheets API" 활성화
3. 스프레드시트를 Apps Script 프로젝트에 연결
4. 코드에서 자동으로 연결된 스프레드시트 사용

**장점:**
- ✅ ID 하드코딩 불필요
- ✅ 자동으로 연결된 스프레드시트 사용
- ✅ 설정 오류 방지
- ✅ 더 안전하고 간편함

**방법 2: CONFIG.gs에서 스프레드시트 ID 설정**
```javascript
const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID_HERE';
```

**방법 3: 동적 설정**
```javascript
setSpreadsheetId('YOUR_ACTUAL_SPREADSHEET_ID_HERE');
```

### 4. 권한 설정
Apps Script에서 다음 권한이 필요합니다:
- Google Sheets 읽기/쓰기
- Google Drive 읽기 (스프레드시트 접근용)

## API 엔드포인트

### POST 요청 처리
Apps Script는 `doPost(e)` 함수를 통해 POST 요청을 처리합니다.

#### 지원하는 액션들:
- `getPendingUsers`: 모든 사용자 목록 조회
- `approveUser`: 사용자 승인
- `rejectUser`: 사용자 거부
- `verifyAdminKey`: 관리자 키 검증
- `sendAdminKeyEmail`: 관리자 키 이메일 전송
- `submitRegistrationRequest`: 가입 요청 제출
- `checkApprovalStatus`: 승인 상태 확인
- `checkRegistrationStatus`: 등록 상태 확인
- `migrateEmails`: 이메일 마이그레이션

#### 테스트 액션들:
- `testRot13Encryption`: ROT13 암호화 테스트 (하위 호환성)
- `testEmailEncryption`: 이메일 암호화 설정 테스트
- `testDecryption`: 복호화 테스트
- `testEncryption`: 암호화/복호화 기능 테스트
- `testAdminKey`: 관리자 키 생성 및 검증 테스트
- `testSpreadsheetIntegration`: 스프레드시트 연동 테스트
- `testUserManagement`: 사용자 관리 기능 테스트
- `testEmailSending`: 이메일 발송 기능 테스트
- `testConfigManagement`: 설정 관리 기능 테스트
- `testAPIEndpoints`: API 엔드포인트 테스트
- `testAllAppScript`: 전체 App Script 기능 테스트
- `testCORSSettings`: CORS 설정 테스트
- `testSystemInfo`: 시스템 정보 테스트
- `testCache`: 캐시 기능 테스트

#### 요청 형식:
```json
{
  "action": "getPendingUsers",
  "data": {
    // 필요한 데이터
  }
}
```

#### CORS 설정:
- **웹 앱 배포 시 설정**: Apps Script 웹 앱 배포 시 "액세스 권한"을 "모든 사용자"로 설정
- **지원하는 메서드**: GET, POST, OPTIONS
- **허용된 헤더**: Content-Type, Authorization, X-Requested-With
- **Origin**: 모든 도메인 허용 (*)

#### JavaScript에서 사용 예시:
```javascript
// CORS가 포함된 POST 요청
fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'getPendingUsers'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### GET 요청 처리 (시스템 정보)
`doGet(e)` 함수는 간단한 시스템 정보를 제공합니다.

#### 시스템 정보 응답 예시:
```json
{
  "success": true,
  "message": "Hot Potato Admin Key Management System",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2024-12-01T12:00:00.000Z",
  "info": {
    "type": "Google Apps Script",
    "method": "POST only",
    "description": "관리자 키 관리 및 사용자 관리 시스템"
  },
  "endpoints": {
    "method": "POST",
    "actions": [
      "getPendingUsers",
      "approveUser",
      "rejectUser",
      "verifyAdminKey",
      "sendAdminKeyEmail",
      "submitRegistrationRequest",
      "checkApprovalStatus",
      "checkRegistrationStatus",
      "migrateEmails",
      "testRot13Encryption",
      "testEmailEncryption",
      "testDecryption"
    ],
    "note": "모든 기능은 POST 요청으로 사용하세요"
  }
}
```

## 주요 기능

### 1. 암호화/복호화 시스템
- **파일**: `Encryption.gs`
- **기능**: 23가지 암호화 방법 지원
- **특징**: 가역적 암호화만 사용하여 데이터 복원 가능
- **이메일 암호화**: 전체 이메일 주소를 통으로 암호화 (사용자명@도메인.확장자)
- **다중 레이어**: 5-15단계 암호화 레이어 지원

### 2. 관리자 키 관리
- **파일**: `KeyManagement.gs`
- **기능**: 
  - 다중 레이어 키 생성
  - 키 검증
  - 키 갱신
  - 이메일 템플릿 생성

### 3. Google Sheets 연동
- **파일**: `SpreadsheetUtils.gs`
- **기능**:
  - 스프레드시트 데이터 읽기/쓰기
  - 사용자 관리
  - ROT13 이메일 암호화

### 4. 사용자 관리
- **파일**: `UserManagement.gs`
- **기능**:
  - 사용자 승인/거부
  - 등록 상태 확인
  - 가입 요청 처리

### 5. 테스트 시스템
- **파일**: `Test.gs`
- **기능**:
  - 암호화/복호화 테스트 (30+ 개 테스트 함수)
  - 성능 테스트
  - 통합 테스트
  - 이메일 암호화 설정 테스트
  - 관리자 키 생성 테스트
  - 스프레드시트 연동 테스트
  - 사용자 관리 테스트
  - 이메일 발송 테스트
  - 설정 관리 테스트
  - API 엔드포인트 테스트
  - CORS 설정 테스트
  - 시스템 정보 테스트
  - 캐시 기능 테스트

## 사용 방법

### 1. 기본 테스트 실행
```javascript
// Apps Script 에디터에서 실행
runSimpleTest();
runReversibilityTest();
runAllTests();

// 이메일 암호화 설정 테스트
runEmailEncryptionConfigTest();

// 전체 App Script 기능 테스트
runAllAppScriptTests();

// 캐시 기능 테스트
testCache();
```

### 2. 개별 기능 테스트 실행
```javascript
// CORS 설정 테스트
testCORSSettings();

// 스프레드시트 연결 테스트
testSpreadsheetConnection();

// 시스템 정보 테스트
testSystemInfo();

// 암호화/복호화 기능 테스트
testEncryptionDecryptionFunctions();

// 관리자 키 생성 및 검증 테스트
testAdminKeyGeneration();

// 스프레드시트 연동 테스트
testSpreadsheetIntegration();

// 사용자 관리 기능 테스트
testUserManagement();

// 이메일 발송 기능 테스트
testEmailSending();

// 설정 관리 기능 테스트
testConfigManagement();

// API 엔드포인트 테스트
testAPIEndpoints();

// 캐시 기능 테스트
testCache();
```

### 3. 특정 테스트 실행
```javascript
// 특정 테스트만 실행
runSpecificTest('cors');                 // CORS 설정 테스트
runSpecificTest('spreadsheetConnection'); // 스프레드시트 연결 테스트
runSpecificTest('systemInfo');           // 시스템 정보 테스트
runSpecificTest('encryption');           // 암호화 테스트
runSpecificTest('adminKey');             // 관리자 키 테스트
runSpecificTest('spreadsheetIntegration'); // 스프레드시트 테스트
runSpecificTest('userManagement');       // 사용자 관리 테스트
runSpecificTest('emailSending');         // 이메일 발송 테스트
runSpecificTest('configManagement');     // 설정 관리 테스트
runSpecificTest('apiEndpoints');         // API 엔드포인트 테스트
runSpecificTest('allAppScript');         // 전체 기능 테스트
```

### 4. 관리자 키 갱신
```javascript
// 수동으로 키 갱신
handleDailyKeyUpdate();
```

### 5. 사용자 관리
```javascript
// 사용자 목록 조회
handleGetPendingUsers();

// 사용자 승인
handleApproveUser('학번');

// 사용자 거부
handleRejectUser('학번');
```

### 6. 이메일 암호화 설정
```javascript
// 이메일 암호화 방법 설정
setEmailEncryptionMethod('Base64');

// 암호화 레이어 수 설정
setEmailEncryptionLayers(2);

// 레이어 방법들 설정
setEmailEncryptionLayerMethods(['ROT13', 'Base64']);

// 현재 설정 확인
const config = getCurrentEmailEncryptionConfig();
console.log(config);

// 설정 검증
const validation = validateEmailEncryptionConfig();
console.log(validation);

// 이메일 암호화 테스트
testEmailEncryption();
```

### 7. App Script 기능 테스트
```javascript
// 개별 기능 테스트
testEncryptionDecryptionFunctions();     // 암호화/복호화 기능
testAdminKeyGeneration();                // 관리자 키 생성
testSpreadsheetIntegration();            // 스프레드시트 연동
testUserManagement();                    // 사용자 관리
testEmailSending();                      // 이메일 발송
testConfigManagement();                  // 설정 관리
testAPIEndpoints();                      // API 엔드포인트
testCache();                             // 캐시 기능

// 전체 기능 테스트
runAllAppScriptTests();                  // 모든 기능 통합 테스트

// 특정 테스트 실행
runSpecificTest('encryption');           // 암호화 테스트
runSpecificTest('adminKey');             // 관리자 키 테스트
runSpecificTest('spreadsheetIntegration'); // 스프레드시트 테스트
runSpecificTest('userManagement');       // 사용자 관리 테스트
runSpecificTest('emailSending');         // 이메일 발송 테스트
runSpecificTest('configManagement');     // 설정 관리 테스트
runSpecificTest('apiEndpoints');         // API 엔드포인트 테스트
runSpecificTest('cache');                // 캐시 기능 테스트
runSpecificTest('allAppScript');         // 전체 기능 테스트
```

## 웹 앱으로 배포

### 1. 웹 앱 배포 설정
1. Apps Script 에디터에서 "배포" → "새 배포" 클릭
2. 유형: "웹 앱" 선택
3. 실행 권한: "나" 또는 "모든 사용자"
4. 액세스 권한: "모든 사용자" 또는 "조직 내 사용자"

### 2. URL 사용
배포 후 생성된 URL을 사용하여 API 호출:

```javascript
// POST 요청 예시
fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'getPendingUsers'
  })
});
```

## 트리거 설정

### 1. 시간 기반 트리거 (자동 키 갱신)
1. Apps Script 에디터에서 "트리거" 클릭
2. "트리거 추가" 클릭
3. 함수: `handleDailyKeyUpdate`
4. 이벤트 소스: "시간 기반"
5. 시간 기반 트리거 유형: "일 타이머"
6. 시간: "자정 12시 - 오전 1시"

### 2. 수동 트리거
필요에 따라 특정 함수를 수동으로 실행할 수 있습니다.

## 🔍 검증 방법

### 1. 마이그레이션 검증
```javascript
// 전체 마이그레이션 검증
verifyMigration();

// 최적화 확인
verifyOptimization();

// 종합 검증
runCompleteVerification();
```

### 2. 성능 테스트
```javascript
// 성능 테스트 실행
runPerformanceTest();

// 특정 테스트 실행
runSpecificTest('performance');
```

## ⚠️ 보안 고려사항

### 1. 스프레드시트 접근 권한
- Apps Script는 스크립트 소유자의 권한으로 스프레드시트에 접근
- 스프레드시트 공유 설정 확인 필요

### 2. API 보안
- 웹 앱 배포 시 적절한 액세스 권한 설정
- 필요시 추가 인증 로직 구현

### 3. 데이터 암호화
- 이메일 주소는 설정된 방법으로 암호화하여 저장
- 관리자 키는 다중 레이어 암호화 사용

## 문제 해결

### 1. 스프레드시트 접근 오류
- 스프레드시트 ID 확인
- 스크립트 소유자의 스프레드시트 접근 권한 확인

### 2. 함수 실행 오류
- Apps Script 로그 확인
- 권한 설정 확인

### 3. 암호화/복호화 오류
- 테스트 함수 실행하여 개별 암호화 방법 확인

## 마이그레이션 체크리스트

- [ ] Apps Script 프로젝트 생성
- [ ] 모든 .gs 파일 업로드
- [ ] 스프레드시트 연결 또는 ID 설정
- [ ] 권한 설정 확인
- [ ] 기본 테스트 실행
- [ ] 웹 앱 배포
- [ ] 트리거 설정
- [ ] 실제 데이터로 테스트

## 성능 최적화

### 1. 캐싱 활용
- 스프레드시트 데이터 캐싱
- PropertiesService 사용

### 2. 배치 처리
- 여러 사용자 처리 시 배치 작업 사용

### 3. 에러 처리
- 적절한 try-catch 구문 사용
- 로깅 시스템 구축

## 추가 개발 사항

### 1. 모니터링
- 실행 로그 모니터링
- 에러 알림 시스템

### 2. 백업
- 정기적인 스프레드시트 백업
- 설정 데이터 백업

### 3. 확장성
- 새로운 암호화 방법 추가
- 추가 사용자 관리 기능

## 지원 및 문의

문제가 발생하거나 추가 기능이 필요한 경우:
1. Apps Script 로그 확인
2. 테스트 함수 실행
3. 스프레드시트 권한 확인
4. 코드 리뷰 및 디버깅

---

**마이그레이션 항목 변경일**: 2025년 10월 1일   
**버전**: 1.0.0     
**개발팀**: 감자도리    
**작성자**: 김형균균
