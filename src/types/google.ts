/**
 * @file google.ts
 * @brief Google API 관련 타입 정의
 * @details Google Sheets, Google Drive API 응답 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief Google Sheets 시트 정보 타입
 */
export interface SheetInfo {
  properties?: {
    title?: string;
    sheetId?: number;
  };
}

/**
 * @brief Google Drive 파일 정보 타입
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * @brief Google Drive 파일 목록 항목 타입
 */
export interface FileItem {
  name: string;
  mimeType: string;
}

/**
 * @brief Google Drive 폴더 항목 타입
 */
export interface FolderItem {
  id: string;
  name: string;
  mimeType: string;
}

