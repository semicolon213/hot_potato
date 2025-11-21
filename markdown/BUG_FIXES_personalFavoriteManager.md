# personalFavoriteManager.ts 버그 수정 목록

## 발견된 버그들

### 1. 캐시 무효화 누락 ⚠️
**위치**: `addFavorite`, `removeFavorite` 함수
**문제**: 
- 데이터를 변경한 후 캐시를 무효화하지 않음
- 결과: 변경사항이 즉시 반영되지 않을 수 있음

**영향받는 함수**:
- `addFavorite` (118-150줄)
- `removeFavorite` (157-199줄)

**수정 필요**: 
- `addFavorite` 성공 후 캐시 무효화 추가
- `removeFavorite` 성공 후 캐시 무효화 추가

---

### 2. spreadsheetId 처리 버그 🐛
**위치**: `fetchFavorites`, `addFavorite` 함수
**문제**:
- `initializePersonalConfigFile()`을 호출하여 `newId`를 받지만 사용하지 않음
- 여전히 `spreadsheetId || ''`를 사용하여 초기화 후에도 null일 수 있음

**영향받는 함수**:
- `fetchFavorites` (76-87줄)
- `addFavorite` (122-143줄)

**수정 필요**:
```typescript
// 현재 (버그)
const newId = await initializePersonalConfigFile();
if (!newId) {
  return [];
}
const data = await getSheetData(spreadsheetId || '', 'favorite'); // ❌ spreadsheetId는 여전히 null

// 수정 후
const newId = await initializePersonalConfigFile();
if (!newId) {
  return [];
}
const data = await getSheetData(newId, 'favorite'); // ✅ newId 사용
```

---

### 3. setupPapyrusAuth 일관성 문제 🔐
**위치**: `setupPapyrusAuth` 함수 (40-46줄)
**문제**:
- `personalFavoriteManager.ts`의 `setupPapyrusAuth`는 토큰 설정을 하지 않음
- `personalConfigManager.ts`의 `setupPapyrusAuth`는 토큰 설정을 함
- 인증 실패 가능성

**비교**:
- `personalConfigManager.ts`: 토큰을 가져와서 `gapi.client.setToken()` 호출
- `personalFavoriteManager.ts`: 토큰 설정 없이 `papyrusAuth`만 설정

**수정 필요**: `personalConfigManager.ts`와 동일한 방식으로 토큰 설정 추가

---

### 4. removeFavorite의 rowIndex 계산 오류 🐛
**위치**: `removeFavorite` 함수 (175-192줄)
**문제**:
- `findIndex`로 찾은 인덱스를 그대로 `deleteRow`에 전달
- 헤더 행(1행)을 고려하지 않음
- `personalConfigManager.ts`의 `deleteScheduleEvent`는 `rowIndexToDelete + 1` 사용

**현재 코드**:
```typescript
const rowIndex = data.values.findIndex(...);
await deleteRow(spreadsheetId, sheetId, rowIndex); // ❌ 헤더 행 미고려
```

**수정 필요**:
```typescript
const rowIndex = data.values.findIndex(...);
if (rowIndex === -1) {
  return true;
}
await deleteRow(spreadsheetId, sheetId, rowIndex); // ✅ 헤더 행 포함된 인덱스
// 또는 rowIndex + 1 (API가 1-based인 경우)
```

**참고**: `deleteRow` 함수의 인덱스 기준 확인 필요 (0-based vs 1-based)

---

### 5. 캐시 키 무효화 패턴 불일치 📝
**위치**: 전체 파일
**문제**:
- 다른 매니저들은 데이터 변경 후 캐시를 무효화하지만, 이 파일은 그렇지 않음
- 일관성 부족

**수정 필요**: 
- `addFavorite` 성공 시: `cacheManager.invalidate('personalFavorites:*')` 또는 특정 키 무효화
- `removeFavorite` 성공 시: 동일하게 캐시 무효화

---

## 수정 우선순위

1. **높음**: 버그 #2 (spreadsheetId 처리) - 데이터 로드 실패 가능
2. **높음**: 버그 #4 (rowIndex 계산) - 잘못된 데이터 삭제 가능
3. **중간**: 버그 #1 (캐시 무효화) - UI 업데이트 지연
4. **중간**: 버그 #3 (인증 일관성) - 인증 실패 가능
5. **낮음**: 버그 #5 (패턴 일관성) - 코드 품질 개선

