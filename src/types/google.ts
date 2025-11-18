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

/**
 * @brief Google Sheets API 클라이언트 타입
 */
export interface GoogleSheetsClient {
  spreadsheets: {
    create: (params: GoogleSheetsCreateParams) => Promise<GoogleSheetsCreateResponse>;
    get: (params: GoogleSheetsGetParams) => Promise<GoogleSheetsGetResponse>;
    values: {
      get: (params: GoogleSheetsValuesGetParams) => Promise<GoogleSheetsValuesGetResponse>;
      update: (params: GoogleSheetsValuesUpdateParams) => Promise<GoogleSheetsValuesUpdateResponse>;
      append: (params: GoogleSheetsValuesAppendParams) => Promise<GoogleSheetsValuesAppendResponse>;
    };
    batchUpdate: (params: GoogleSheetsBatchUpdateParams) => Promise<GoogleSheetsBatchUpdateResponse>;
  };
}

/**
 * @brief Google Drive API 클라이언트 타입
 */
export interface GoogleDriveClient {
  files: {
    list: (params: GoogleDriveFilesListParams) => Promise<GoogleDriveFilesListResponse>;
    get: (params: GoogleDriveFilesGetParams) => Promise<GoogleDriveFilesGetResponse>;
    create: (params: GoogleDriveFilesCreateParams) => Promise<GoogleDriveFilesCreateResponse>;
    update: (params: GoogleDriveFilesUpdateParams) => Promise<GoogleDriveFilesUpdateResponse>;
    copy: (params: GoogleDriveFilesCopyParams) => Promise<GoogleDriveFilesCopyResponse>;
    delete: (params: { fileId: string }) => Promise<void>;
  };
  permissions: {
    create: (params: GoogleDrivePermissionsCreateParams) => Promise<GoogleDrivePermissionsCreateResponse>;
  };
}

/**
 * @brief Google Docs API 클라이언트 타입
 */
export interface GoogleDocsClient {
  documents: {
    create: (params: GoogleDocsCreateParams) => Promise<GoogleDocsCreateResponse>;
  };
}

/**
 * @brief 통합 Google API 클라이언트 타입
 */
export interface GoogleClient {
  sheets: GoogleSheetsClient;
  drive: GoogleDriveClient;
  docs: GoogleDocsClient;
  setToken: (token: { access_token: string }) => void;
  getToken: () => GoogleToken | null;
}

/**
 * @brief Google API 토큰 타입
 */
export interface GoogleToken {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

// Google Sheets API 파라미터 타입들
export interface GoogleSheetsCreateParams {
  resource: {
    properties: {
      title: string;
    };
    sheets?: Array<{
      properties: {
        title: string;
        gridProperties?: {
          rowCount: number;
          columnCount: number;
        };
      };
    }>;
  };
}

export interface GoogleSheetsCreateResponse {
  result: {
    spreadsheetId: string;
    properties: {
      title: string;
    };
  };
}

export interface GoogleSheetsGetParams {
  spreadsheetId: string;
  fields?: string;
}

export interface GoogleSheetsGetResponse {
  result: {
    spreadsheetId: string;
    properties: {
      title: string;
    };
    sheets: Array<{
      properties: {
        sheetId: number;
        title: string;
        gridProperties: {
          rowCount: number;
          columnCount: number;
        };
      };
    }>;
  };
}

export interface GoogleSheetsValuesGetParams {
  spreadsheetId: string;
  range: string;
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
  dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
}

export interface GoogleSheetsValuesGetResponse {
  result: {
    range: string;
    majorDimension: 'ROWS' | 'COLUMNS';
    values: string[][];
  };
}

export interface GoogleSheetsValuesUpdateParams {
  spreadsheetId: string;
  range: string;
  valueInputOption: 'RAW' | 'USER_ENTERED';
  resource: {
    values: string[][];
  };
}

export interface GoogleSheetsValuesUpdateResponse {
  result: {
    updatedCells: number;
    updatedColumns: number;
    updatedRows: number;
    updatedRange: string;
  };
}

export interface GoogleSheetsValuesAppendParams {
  spreadsheetId: string;
  range: string;
  valueInputOption: 'RAW' | 'USER_ENTERED';
  resource: {
    values: string[][];
  };
}

export interface GoogleSheetsValuesAppendResponse {
  result: {
    updates: {
      updatedCells: number;
      updatedColumns: number;
      updatedRows: number;
      updatedRange: string;
    };
  };
}

export interface GoogleSheetsBatchUpdateParams {
  spreadsheetId: string;
  resource: {
    requests: Array<{
      addSheet?: {
        properties: {
          title: string;
          gridProperties?: {
            rowCount: number;
            columnCount: number;
          };
        };
      };
      deleteSheet?: {
        sheetId: number;
      };
      updateSheetProperties?: {
        properties: {
          sheetId: number;
          title?: string;
        };
        fields: string;
      };
    }>;
  };
}

export interface GoogleSheetsBatchUpdateResponse {
  result: {
    replies: Array<{
      addSheet?: {
        properties: {
          sheetId: number;
          title: string;
        };
      };
    }>;
  };
}

// Google Drive API 파라미터 타입들
export interface GoogleDriveFilesListParams {
  q: string;
  fields?: string;
  spaces?: string;
  orderBy?: string;
  pageSize?: number;
  pageToken?: string;
  includeItemsFromAllDrives?: boolean;
  supportsAllDrives?: boolean;
  corpora?: string;
}

export interface GoogleDriveFilesListResponse {
  result: {
    files: Array<{
      id: string;
      name: string;
      mimeType: string;
      parents?: string[];
      webViewLink?: string;
      createdTime?: string;
      modifiedTime?: string;
    }>;
    nextPageToken?: string;
  };
}

export interface GoogleDriveFilesGetParams {
  fileId: string;
  fields?: string;
}

export interface GoogleDriveFilesGetResponse {
  result: {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
    webViewLink?: string;
    createdTime?: string;
    modifiedTime?: string;
  };
}

export interface GoogleDriveFilesCreateParams {
  resource: {
    name: string;
    mimeType?: string;
    parents?: string[];
  };
  media?: {
    mimeType: string;
    body: Blob | File;
  };
  fields?: string;
}

export interface GoogleDriveFilesCreateResponse {
  result: {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
    webViewLink?: string;
  };
}

export interface GoogleDriveFilesUpdateParams {
  fileId: string;
  addParents?: string;
  removeParents?: string;
  resource?: {
    name?: string;
  };
  fields?: string;
}

export interface GoogleDriveFilesUpdateResponse {
  result: {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
  };
}

export interface GoogleDriveFilesCopyParams {
  fileId: string;
  resource?: {
    name?: string;
    parents?: string[];
  };
  fields?: string;
}

export interface GoogleDriveFilesCopyResponse {
  result: {
    id: string;
    name: string;
    mimeType: string;
  };
}

export interface GoogleDrivePermissionsCreateParams {
  fileId: string;
  resource: {
    role: 'reader' | 'writer' | 'commenter';
    type: 'user' | 'group' | 'domain' | 'anyone';
    emailAddress?: string;
  };
  fields?: string;
}

export interface GoogleDrivePermissionsCreateResponse {
  result: {
    id: string;
    role: string;
    type: string;
  };
}

// Google Docs API 파라미터 타입들
export interface GoogleDocsCreateParams {
  resource: {
    title: string;
  };
}

export interface GoogleDocsCreateResponse {
  result: {
    documentId: string;
  };
}

/**
 * @brief Papyrus Auth 타입 (papyrus-db 라이브러리용)
 */
export interface PapyrusAuth {
  client: GoogleClient;
}

/**
 * @brief Google Credential Response 타입
 * @deprecated Use GoogleCredentialResponse from './google/gapi' instead
 */
export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

/**
 * @brief Google Credential 타입
 * @deprecated Use GoogleCredential from './google/gapi' instead
 */
export interface GoogleCredential {
  id: string;
  password: string;
}
