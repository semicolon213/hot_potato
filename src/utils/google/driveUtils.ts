/**
 * @file driveUtils.ts
 * @brief Google Drive API 관련 유틸리티 함수
 * @details 폴더 검색, 파일 목록 조회 등 Google Drive와 상호작용하는 함수들을 포함합니다.
 */

// gapi 클라이언트가 로드되었는지 확인하기 위해 전역 타입을 확장합니다.
declare global {
  interface Window {
    gapi: any;
  }
}

/**
 * 폴더 이름과 부모 폴더 ID를 기반으로 폴더 ID를 검색합니다.
 * @param {string} folderName - 검색할 폴더의 이름
 * @param {string} parentFolderId - 부모 폴더의 ID. 기본값은 'root'.
 * @returns {Promise<string | null>} 폴더 ID 또는 null
 */
export const getFolderIdByName = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
  try {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const response = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true, // 공유 드라이브의 항목을 결과에 포함
      supportsAllDrives: true,         // 호출하는 사용자가 공유 드라이브를 지원함을 나타냄
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        console.warn(`Multiple folders found with name: ${folderName}. Using the first one.`);
      }
      return files[0].id || null;
    }
    console.warn(`Folder not found: ${folderName}${parentFolderId ? ` in parent ${parentFolderId}` : ''}`);
    return null;
  } catch (error) {
    console.error('Error fetching folder ID:', error);
    return null;
  }
};

/**
 * 특정 폴더 내의 모든 Google Sheets 파일 목록을 가져옵니다.
 * @param {string} folderId - 파일 목록을 조회할 폴더의 ID
 * @returns {Promise<{ id: string; name: string; }[] | null>} 시트 파일 목록 또는 null
 */
export const getSheetsInFolder = async (folderId: string): Promise<{ id: string; name: string; }[] | null> => {
  if (!folderId) {
    console.error("Folder ID is required to get sheets.");
    return null;
  }

  try {
    const response = await window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
      orderBy: 'name',
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      return files.map(file => ({ id: file.id!, name: file.name! }));
    }
    return []; // 폴더는 있으나 시트가 없는 경우 빈 배열 반환
  } catch (error) {
    console.error('Error fetching sheets in folder:', error);
    return null;
  }
};
