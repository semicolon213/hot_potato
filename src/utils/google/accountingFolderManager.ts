/**
 * @file accountingFolderManager.ts
 * @brief 회계 폴더 관리 유틸리티
 * @details Google Drive API를 사용하여 회계 폴더 및 장부 폴더를 관리합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getAccountingFolderId as getPapyrusAccountingFolderId } from '../database/papyrusManager';
import { ENV_CONFIG } from '../../config/environment';
import type { LedgerInfo } from '../../types/features/accounting';

/**
 * 회계 폴더 ID 가져오기
 */
export const getAccountingFolderId = (): string | null => {
  return getPapyrusAccountingFolderId();
};

/**
 * 장부 폴더 목록 조회
 * @returns {Promise<LedgerInfo[]>} 장부 목록
 */
export const getLedgerFolders = async (): Promise<LedgerInfo[]> => {
  try {
    const folderId = getAccountingFolderId();
    
    if (!folderId) {
      console.warn('⚠️ 회계 폴더 ID가 없습니다.');
      return [];
    }

    if (!(window as any).gapi || !(window as any).gapi.client) {
      console.warn('⚠️ Google API가 초기화되지 않았습니다.');
      return [];
    }

    const gapi = (window as any).gapi.client;
    
    // 회계 폴더 내의 모든 폴더 조회
    const response = await gapi.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'createdTime desc'
    });

    if (!response.result.files || response.result.files.length === 0) {
      console.log('📁 장부 폴더가 없습니다.');
      return [];
    }

    // 각 장부 폴더의 상세 정보 조회
    const ledgers: LedgerInfo[] = await Promise.all(
      response.result.files.map(async (folder: any) => {
        // 증빙 폴더는 제외
        if (folder.name === ENV_CONFIG.EVIDENCE_FOLDER_NAME) {
          return null;
        }

        const ledgerInfo = await getLedgerInfo(folder.id);
        return ledgerInfo;
      })
    );

    // null 제거 및 필터링
    return ledgers.filter((ledger): ledger is LedgerInfo => ledger !== null);
    
  } catch (error) {
    console.error('❌ 장부 폴더 목록 조회 오류:', error);
    return [];
  }
};

/**
 * 특정 장부 폴더의 상세 정보 조회
 * @param {string} folderId - 장부 폴더 ID
 * @returns {Promise<LedgerInfo | null>} 장부 정보
 */
export const getLedgerInfo = async (folderId: string): Promise<LedgerInfo | null> => {
  try {
    if (!(window as any).gapi || !(window as any).gapi.client) {
      console.warn('⚠️ Google API가 초기화되지 않았습니다.');
      return null;
    }

    const gapi = (window as any).gapi.client;

    // 폴더 정보 조회
    const folderResponse = await gapi.drive.files.get({
      fileId: folderId,
      fields: 'id, name, createdTime'
    });

    const folderName = folderResponse.result.name;
    const createdDate = folderResponse.result.createdTime;

    // 폴더 내 파일 목록 조회
    const filesResponse = await gapi.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)'
    });

    let spreadsheetId: string | null = null;
    let evidenceFolderId: string | null = null;

    // 스프레드시트 파일 찾기
    const spreadsheetFile = filesResponse.result.files?.find((file: any) => 
      file.mimeType === 'application/vnd.google-apps.spreadsheet'
    );
    if (spreadsheetFile) {
      spreadsheetId = spreadsheetFile.id;
    }

    // 증빙 폴더 찾기
    const evidenceFolder = filesResponse.result.files?.find((file: any) => 
      file.mimeType === 'application/vnd.google-apps.folder' && 
      file.name === ENV_CONFIG.EVIDENCE_FOLDER_NAME
    );
    if (evidenceFolder) {
      evidenceFolderId = evidenceFolder.id;
    }

    return {
      folderId: folderId,
      folderName: folderName,
      spreadsheetId: spreadsheetId || '',
      evidenceFolderId: evidenceFolderId || '',
      createdDate: createdDate
    };

  } catch (error) {
    console.error('❌ 장부 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 회계 폴더 ID 설정 (papyrusManager에서 호출)
 */
export const setAccountingFolderId = (folderId: string | null): void => {
  // papyrusManager의 accountingFolderId 변수는 직접 접근하지 않고
  // getAccountingFolderId() 함수를 통해 접근
  console.log('📁 회계 폴더 ID 설정:', folderId);
};

