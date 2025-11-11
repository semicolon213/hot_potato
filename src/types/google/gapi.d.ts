/**
 * @file gapi.d.ts
 * @brief Google API Client Library 타입 정의
 * @details gapi.client의 명시적 타입 정의
 * @author Hot Potato Team
 * @date 2024
 */

import type {
  GoogleDriveFilesCopyParams,
  GoogleDriveFilesCopyResponse,
  GoogleDriveFilesGetParams,
  GoogleDriveFilesGetResponse,
  GoogleSheetsValuesGetParams,
  GoogleSheetsValuesGetResponse,
  GoogleSheetsValuesUpdateParams,
  GoogleSheetsValuesUpdateResponse,
  GoogleSheetsValuesAppendParams,
  GoogleSheetsValuesAppendResponse,
  GoogleSheetsBatchUpdateParams,
  GoogleSheetsBatchUpdateResponse,
  GoogleSheetsGetParams,
  GoogleSheetsGetResponse
} from '../google';
import type { GoogleToken } from '../google';

/**
 * @brief Google Identity Services Credential Response 타입
 */
export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

/**
 * @brief Google Identity Services Credential 타입
 */
export interface GoogleCredential {
  id: string;
  password: string;
}

/**
 * @brief Google Identity Services Callback 함수 타입
 */
export type GoogleCredentialCallback = (response: GoogleCredentialResponse) => void;

