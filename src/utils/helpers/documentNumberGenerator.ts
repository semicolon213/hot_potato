/**
 * @file documentNumberGenerator.ts
 * @brief 문서고유번호 생성 유틸리티
 * @details 생성날짜+파일타입+유형 조합으로 문서고유번호를 생성합니다.
 */

/**
 * 문서고유번호 생성
 * @param mimeType 파일 MIME 타입
 * @param documentType 문서 유형 ('shared' | 'personal')
 * @param documentId Google 문서 ID (고유 번호 생성용)
 * @param createdTime 문서 생성 시간
 * @returns 문서고유번호
 */
export const generateDocumentNumber = (
  mimeType: string,
  documentType: 'shared' | 'personal',
  documentId?: string,
  createdTime?: string
): string => {
  // 생성 날짜 (YYYYMMDD)
  let dateStr = '';
  if (createdTime) {
    const createdDate = new Date(createdTime);
    dateStr = createdDate.toISOString().slice(0, 10).replace(/-/g, '');
  } else {
    const now = new Date();
    dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  }
  
  // 문서 유형 (S: shared, P: personal)
  const typeStr = documentType === 'shared' ? 'S' : 'P';
  
  // 파일 타입 결정
  let fileType = 'DOC';
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('sheet')) {
    fileType = 'SHEET';
  } else if (mimeType?.includes('presentation')) {
    fileType = 'PPT';
  } else if (mimeType?.includes('pdf')) {
    fileType = 'PDF';
  }
  
  // 문서 ID의 일부 (마지막 6자리)
  const docIdPart = documentId ? documentId.slice(-6) : 'XXXXXX';
  
  // 문서고유번호 조합: YYYYMMDD-S(또는P)-파일타입-문서ID6자리
  return `${dateStr}-${typeStr}-${fileType}-${docIdPart}`;
};

/**
 * 문서고유번호에서 정보 추출
 * @param documentNumber 문서고유번호
 * @returns 파싱된 정보
 */
export const parseDocumentNumber = (documentNumber: string) => {
  const parts = documentNumber.split('-');
  
  if (parts.length !== 4) {
    return null;
  }
  
  const [dateStr, fileType, typeStr, seq] = parts;
  
  return {
    date: dateStr,
    fileType: fileType,
    documentType: typeStr === 'SHARED' ? 'shared' : 'personal',
    sequence: seq
  };
};

/**
 * 문서고유번호 유효성 검사
 * @param documentNumber 문서고유번호
 * @returns 유효성 여부
 */
export const isValidDocumentNumber = (documentNumber: string): boolean => {
  const parsed = parseDocumentNumber(documentNumber);
  return parsed !== null;
};
