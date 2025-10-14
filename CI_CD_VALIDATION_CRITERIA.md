# 🔍 CI/CD 검증 기준 명세서

## 📋 검증 단계별 기준

### 1️⃣ **코드 품질 검사 (Quality Check)**

#### ✅ TypeScript 타입 체크
```bash
npm run type-check
```
**통과 기준:**
- ❌ TypeScript 컴파일 에러 0개
- ❌ 타입 정의 오류 0개
- ✅ 모든 타입이 올바르게 정의됨

#### ✅ React 19 호환성 검증
```bash
npm ls react@^19.0.0
npm ls react-dom@^19.0.0
npm ls papyrus-db
```
**통과 기준:**
- ✅ React 19.2.0 설치 확인
- ✅ React DOM 19.2.0 설치 확인
- ✅ papyrus-db 1.0.4 설치 확인
- ❌ 의존성 충돌 0개

#### ✅ ESLint 검사
```bash
npm run lint -- --max-warnings 1000
```
**통과 기준:**
- ❌ ESLint 에러 0개
- ⚠️ 경고 최대 1000개 (허용)
- ✅ 코드 스타일 일관성 유지

#### ✅ 보안 감사
```bash
npm audit --audit-level high
```
**통과 기준:**
- ❌ High/Critical 취약점 0개
- ⚠️ Moderate 취약점 허용 (기존 2개)
- ✅ 보안 정책 준수

### 2️⃣ **테스트 실행 (Test Execution)**

#### ✅ 단위 테스트
```bash
npm run test:ci
```
**통과 기준:**
- ✅ 테스트 통과율 100%
- ✅ 모든 테스트 케이스 실행
- ✅ 커버리지 리포트 생성

#### ✅ 환경 변수 검증
```yaml
VITE_GOOGLE_CLIENT_ID: test-client-id
VITE_APP_SCRIPT_URL: test-app-script-url
VITE_GOOGLE_API_KEY: test-api-key
# ... 기타 환경 변수들
```
**통과 기준:**
- ✅ 모든 필수 환경 변수 설정
- ✅ 테스트 환경에서 정상 동작
- ✅ Mock 데이터 정상 처리

#### ✅ Node.js 버전 호환성
```yaml
node-version: [20.x, 22.x]
```
**통과 기준:**
- ✅ Node.js 20.x에서 테스트 통과
- ✅ Node.js 22.x에서 테스트 통과
- ✅ 크로스 플랫폼 호환성

### 3️⃣ **성능 및 빌드 검사 (Performance & Build)**

#### ✅ React 19 빌드 검증
```bash
npm run build
```
**통과 기준:**
- ✅ 빌드 성공 (exit code: 0)
- ✅ TypeScript 컴파일 성공
- ✅ Vite 번들링 성공
- ❌ 빌드 에러 0개

#### ✅ 번들 크기 검증
```bash
npm run bundle-size
```
**통과 기준:**
- ✅ 메인 번들: < 500KB
- ✅ Gzip 압축: < 150KB
- ✅ 청크 분할 정상 작동
- ✅ 라이브러리 분리 성공

#### ✅ 빌드 아티팩트 검증
**통과 기준:**
- ✅ `dist/` 폴더 생성
- ✅ `index.html` 파일 존재
- ✅ CSS 파일 번들링
- ✅ JavaScript 파일 청크 분할

### 4️⃣ **배포 검증 (Deployment)**

#### ✅ 프로덕션 빌드
**통과 기준:**
- ✅ 프로덕션 최적화 적용
- ✅ 소스맵 제거
- ✅ 압축 최적화
- ✅ 캐시 버스팅 적용

#### ✅ Electron 빌드 (선택적)
```bash
npm run electron:build
```
**통과 기준:**
- ✅ Windows 빌드 성공
- ✅ macOS 빌드 성공
- ✅ Linux 빌드 성공
- ✅ 실행 파일 생성

## 🚨 실패 기준 (Failure Criteria)

### ❌ **즉시 실패 (Immediate Failure)**
1. **TypeScript 컴파일 에러**
2. **React 19 호환성 실패**
3. **핵심 테스트 실패**
4. **빌드 실패**
5. **High/Critical 보안 취약점**

### ⚠️ **경고 (Warning)**
1. **ESLint 경고 (1000개 이하)**
2. **Moderate 보안 취약점**
3. **번들 크기 경고**
4. **성능 저하**

## 📊 성능 기준 (Performance Criteria)

### 🚀 **빌드 성능**
- **빌드 시간**: < 3초
- **메모리 사용량**: < 2GB
- **CPU 사용률**: < 80%

### 📦 **번들 성능**
- **메인 번들**: < 500KB
- **Gzip 압축**: < 150KB
- **청크 수**: 5-8개
- **로딩 시간**: < 2초

### 🧪 **테스트 성능**
- **테스트 실행 시간**: < 30초
- **커버리지**: > 80%
- **테스트 수**: > 100개

## 🔧 환경별 검증 기준

### 🖥️ **개발 환경 (Development)**
```bash
npm run dev
```
**검증 기준:**
- ✅ HMR 정상 작동
- ✅ 소스맵 생성
- ✅ 디버깅 가능
- ✅ 핫 리로드 < 1초

### 🏗️ **빌드 환경 (Build)**
```bash
npm run build
```
**검증 기준:**
- ✅ 프로덕션 최적화
- ✅ 압축 적용
- ✅ 트리 쉐이킹
- ✅ 코드 분할

### 🧪 **테스트 환경 (Test)**
```bash
npm run test:ci
```
**검증 기준:**
- ✅ 모든 테스트 통과
- ✅ 커버리지 리포트
- ✅ Mock 데이터 정상
- ✅ 환경 변수 설정

## 📈 성공 지표 (Success Metrics)

### ✅ **100% 통과 기준**
1. **TypeScript**: 0 에러
2. **React 19**: 완전 호환
3. **테스트**: 100% 통과
4. **빌드**: 성공
5. **보안**: High/Critical 0개

### 📊 **성능 지표**
- **빌드 시간**: 2.57초 (목표: < 3초) ✅
- **번들 크기**: 436.67 kB (목표: < 500KB) ✅
- **Gzip**: 136.56 kB (목표: < 150KB) ✅
- **테스트 커버리지**: > 80% ✅

## 🎯 검증 체크리스트

### ✅ **코드 품질**
- [ ] TypeScript 타입 체크 통과
- [ ] React 19 호환성 확인
- [ ] ESLint 검사 통과
- [ ] 보안 감사 통과

### ✅ **테스트**
- [ ] 단위 테스트 100% 통과
- [ ] 환경 변수 정상 설정
- [ ] Node.js 버전 호환성
- [ ] 커버리지 리포트 생성

### ✅ **빌드**
- [ ] React 19 빌드 성공
- [ ] 번들 크기 기준 통과
- [ ] 빌드 아티팩트 생성
- [ ] 성능 기준 충족

### ✅ **배포**
- [ ] 프로덕션 빌드 성공
- [ ] Electron 빌드 (선택적)
- [ ] 릴리스 아티팩트 생성
- [ ] 배포 준비 완료

## 🎉 최종 검증 완료!

**모든 기준을 통과하면:**
- ✅ **CI/CD 파이프라인 성공**
- ✅ **React 19 완전 호환**
- ✅ **프로덕션 배포 준비**
- ✅ **팀원 개발 환경 동기화**

**검증 기준이 명확하게 정의되었습니다!** 🚀
