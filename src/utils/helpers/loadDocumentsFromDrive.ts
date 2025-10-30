/**
 * @file loadDocumentsFromDrive.ts
 * @brief Google Drive에서 문서 로드 유틸리티
 * @details 공유 문서 및 개인 문서 폴더에서 직접 문서를 로드합니다.
 */

import { generateDocumentNumber } from "./documentNumberGenerator";
import type { DocumentInfo, GoogleFile } from "../../types/documents";
import { formatDateTime } from "./timeUtils";
import { apiClient } from "../api/apiClient";

export interface FileWithDescription {
  id: string;
  name: string;
  description?: string;
}

/**
 * 이메일을 사용자 이름으로 변환
 * @param email - 이메일 주소
 * @returns 사용자 이름 또는 원본 이메일
 */
async function convertEmailToName(email: string): Promise<string> {
  try {
    // 이메일 형식이 아닌 경우 그대로 반환
    if (!email || !email.includes('@')) {
      return email;
    }
    
    const response = await apiClient.getUserNameByEmail(email);
    console.log('👤 API 응답:', response);
    
    const resolvedName = (response as any).name || (response as any).data?.name;
    if (response.success && resolvedName) {
      console.log('👤 사용자 이름 변환 성공:', email, '->', resolvedName);
      return resolvedName;
    }
    
    console.log('👤 사용자 이름 변환 실패, 원본 이메일 반환:', email);
    return email; // 변환 실패 시 원본 이메일 반환
  } catch (error) {
    console.warn('이메일을 사용자 이름으로 변환 실패:', email, error);
    return email; // 오류 시 원본 이메일 반환
  }
}

/**
 * 공유 문서 폴더에서 문서 로드
 * @returns 문서 목록
 */
export const loadSharedDocuments = async (): Promise<DocumentInfo[]> => {
  try {
    const result = await apiClient.getDocuments({ role: 'shared' });
    if (!result.success) {
      console.warn('공유 문서 API 실패:', result.message || result.error);
      return [];
    }

    const rows = (result.data || []) as any[];
    const documents: DocumentInfo[] = rows.map((row: any, index: number) => {
      const mimeType = row.mimeType || row.type || '';
      const created = row.createdTime || row.created_at || undefined;
      const id = row.id || row.documentId || row.fileId || '';
      const url = row.url || row.webViewLink || (id ? `https://docs.google.com/document/d/${id}/edit` : '');
      return {
        id,
        documentNumber: row.documentNumber || generateDocumentNumber(mimeType, 'shared', id, created),
        title: row.title || row.name || '',
        creator: row.creator || row.author || '',
        creatorEmail: row.authorEmail || row.creatorEmail || '',
        lastModified: row.lastModified || row.modifiedTime || formatDateTime(new Date().toISOString()),
        url,
        documentType: 'shared',
        mimeType,
        tag: row.tag || '공용',
        originalIndex: index,
      };
    });

    return documents;
  } catch (error) {
    console.error('공유 문서 로드(API) 오류:', error);
    return [];
  }
};

/**
 * 개인 문서 폴더에서 문서 로드
 * @returns 문서 목록
 */
export const loadPersonalDocuments = async (): Promise<DocumentInfo[]> => {
  const gapi = (window as any).gapi;
  
  if (!gapi?.client?.drive) {
    console.error('Google Drive API가 초기화되지 않았습니다.');
    return [];
  }

  try {
    // 1단계: hot potato 폴더 찾기
    const hotPotatoResponse = await gapi.client.drive.files.list({
      q: "'root' in parents and name='hot potato' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log('hot potato 폴더를 찾을 수 없습니다');
      return [];
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];

    // 2단계: 문서 폴더 찾기
    const documentResponse = await gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!documentResponse.result.files || documentResponse.result.files.length === 0) {
      console.log('문서 폴더를 찾을 수 없습니다');
      return [];
    }

    const documentFolder = documentResponse.result.files[0];

    // 3단계: 개인 문서 폴더 찾기
    const personalDocResponse = await gapi.client.drive.files.list({
      q: `'${documentFolder.id}' in parents and name='개인 문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!personalDocResponse.result.files || personalDocResponse.result.files.length === 0) {
      console.log('개인 문서 폴더를 찾을 수 없습니다');
      return [];
    }

    const personalDocFolder = personalDocResponse.result.files[0];

    // 4단계: 개인 문서 폴더에서 파일 목록 가져오기 (메타데이터 포함)
    const filesResponse = await gapi.client.drive.files.list({
      q: `'${personalDocFolder.id}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc'
    });

    if (!filesResponse.result.files || filesResponse.result.files.length === 0) {
      console.log('개인 문서 폴더가 비어있습니다');
      return [];
    }

    const documents: DocumentInfo[] = [];
    for (let i = 0; i < filesResponse.result.files.length; i++) {
      const file = filesResponse.result.files[i];

      let fileWithProperties;
      try {
        const detailResponse = await gapi.client.drive.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties'
        });
        fileWithProperties = detailResponse.result;
      } catch (error) {
        console.warn(`개인 파일 ${file.name} 상세 정보 가져오기 실패:`, error);
        fileWithProperties = file;
      }

      const metadataCreator = fileWithProperties.properties?.creatorEmail || fileWithProperties.properties?.creator;
      const metadataTag = fileWithProperties.properties?.tag;

      const rawCreator = metadataCreator || fileWithProperties.owners?.[0]?.displayName || fileWithProperties.owners?.[0]?.emailAddress || '알 수 없음';
      const creatorName = await convertEmailToName(rawCreator);

      documents.push({
        id: fileWithProperties.id || '',
        documentNumber: generateDocumentNumber(fileWithProperties.mimeType || '', 'personal', fileWithProperties.id, fileWithProperties.createdTime),
        title: fileWithProperties.name || '',
        creator: creatorName,
        lastModified: formatDateTime(fileWithProperties.modifiedTime || new Date().toISOString()),
        url: fileWithProperties.webViewLink || (fileWithProperties.id ? `https://docs.google.com/document/d/${fileWithProperties.id}/edit` : ''),
        documentType: 'personal',
        mimeType: fileWithProperties.mimeType || '',
        originalIndex: i,
        tag: metadataTag || '개인'
      });
    }

    return documents;
  } catch (error) {
    console.error('개인 문서 로드 오류:', error);
    return [];
  }
};

/**
 * 모든 문서 로드 (공유 + 개인)
 * @returns 문서 목록
 */
export const loadAllDocuments = async (): Promise<DocumentInfo[]> => {
  const [sharedDocs, personalDocs] = await Promise.all([
    loadSharedDocuments(),
    loadPersonalDocuments()
  ]);

  const allDocs = [...sharedDocs, ...personalDocs];
  console.log('전체 문서 로드 완료:', allDocs.length, '개');
  return allDocs;
};

