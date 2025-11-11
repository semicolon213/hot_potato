/**
 * @file googleSheets.ts
 * @brief Google Sheets API 상세 타입 정의
 * @details Google Sheets API의 응답 및 요청 타입들을 상세하게 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief Google Sheets 병합 셀 정보
 */
export interface GridRange {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

/**
 * @brief Google Sheets 셀 데이터
 */
export interface CellData {
  userEnteredValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
  effectiveValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
  formattedValue?: string;
}

/**
 * @brief Google Sheets 행 데이터
 */
export interface RowData {
  values: CellData[];
}

/**
 * @brief Google Sheets 배치 업데이트 데이터
 */
export interface BatchUpdateData {
  range: string;
  values: string[][];
}

