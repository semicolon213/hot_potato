# 환경변수 및 Apps Script Properties 설정 가이드

## 📋 개요
이 문서는 프로젝트의 환경변수와 Apps Script Properties 설정 방법을 안내합니다.

## 🔧 Apps Script Properties 설정

### 방법 1: Apps Script 에디터 UI에서 설정 (권장)

1. **Google Apps Script 프로젝트 열기**
   - https://script.google.com 접속
   - 해당 프로젝트 열기

2. **프로젝트 설정 열기**
   - 왼쪽 메뉴에서 **⚙️ 프로젝트 설정** (Project settings) 클릭

3. **스크립트 속성 섹션 찾기**
   - 아래로 스크롤하여 **"스크립트 속성"** (Script properties) 섹션 확인

4. **속성 추가**
   - **"스크립트 속성 추가"** (Add script property) 버튼 클릭
   - 다음 키-값 쌍을 **각각 개별적으로** 추가:

#### ✅ 필수 스크립트 속성 (폴더 경로)

```
키: ROOT_FOLDER_NAME
값: hot potato

키: DOCUMENT_FOLDER_NAME
값: 문서

키: TEMPLATE_FOLDER_NAME
값: 양식

키: SHARED_DOCUMENT_FOLDER_NAME
값: 공유 문서

키: SHEET_NAME_USER
값: user

키: SHEET_NAME_ADMIN_KEYS
값: admin_keys
```

### 방법 2: 코드로 일괄 설정 함수 만들기

Apps Script 에디터에 아래 함수를 추가하고 실행하세요:

```javascript
// 임시 설정 함수 (한 번 실행 후 삭제해도 됨)
function setupScriptProperties() {
  const properties = {
    'ROOT_FOLDER_NAME': 'hot potato',
    'DOCUMENT_FOLDER_NAME': '문서',
    'TEMPLATE_FOLDER_NAME': '양식',
    'SHARED_DOCUMENT_FOLDER_NAME': '공유 문서',
    'SHEET_NAME_USER': 'user',
    'SHEET_NAME_ADMIN_KEYS': 'admin_keys',
    'STATIC_TAG_SPREADSHEET_NAME': 'static_tag',
    'STATIC_TAG_SHEET_NAME': 'tag'
  };
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  Object.keys(properties).forEach(key => {
    scriptProperties.setProperty(key, properties[key]);
    console.log(`✅ 설정 완료: ${key} = ${properties[key]}`);
  });
  
  console.log('✅ 모든 스크립트 속성 설정 완료!');
}
```

**실행 방법:**
1. 위 함수를 Apps Script 에디터에 추가
2. 함수 선택 드롭다운에서 `setupScriptProperties` 선택
3. 실행 버튼(▶️) 클릭
4. 권한 승인 (처음만)
5. 실행 완료 후 함수 삭제 가능

---

## ✅ 확인 방법

### 스크립트 속성 확인 함수

```javascript
function checkScriptProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();
  console.log('현재 스크립트 속성:', props);
}
```

실행 후 로그에서 설정값 확인 가능합니다.

---

## 📝 변경 사항 요약

### Apps Script 수정 내용

1. **`DocumentTemplates.gs`**
   - 하드코딩된 `'hot potato'`, `'문서'`, `'양식'` 경로를 스크립트 속성으로 변경
   - `possiblePaths` 배열에서도 스크립트 속성 사용

2. **`DocumentSpreadsheet.gs`**
   - 폴백 경로 `'hot potato/문서/공유 문서'`를 스크립트 속성으로 변경

3. **`CONFIG.gs`**
   - 시트 이름(`SHEET_NAMES`)을 스크립트 속성에서 가져오도록 변경

### 프론트엔드 수정 내용

1. **환경변수 추가**
   - Drive 폴더 경로 관련 환경변수 추가
   - 개인 설정 파일 이름 환경변수 추가

2. **하드코딩 제거**
   - `loadDocumentsFromDrive.ts`
   - `personalConfigManager.ts`
   - `googleSheetUtils.ts`
   - `NewDocument.tsx`
   - `usePersonalTemplates.ts`
   - `personalTagManager.ts`

---

## ⚠️ 주의사항

1. **기본값 존재**: 모든 폴더 경로는 기본값이 설정되어 있어, 스크립트 속성을 설정하지 않아도 동작합니다.
2. **값 변경 시**: 기본값과 다른 값을 사용하려면 반드시 스크립트 속성에 설정해야 합니다.
3. **하위 호환성**: 기존 코드와의 호환성을 위해 일부 폴더명 변형(`hot_potato`, `hot potato`)을 모두 확인합니다.

---

## 🔄 다음 단계

설정 완료 후:
1. Apps Script 프로젝트 저장
2. 프론트엔드 빌드 및 테스트
3. 스크립트 속성이 올바르게 적용되었는지 확인

