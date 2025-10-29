/**
 * @file loadDocumentsFromDrive.ts
 * @brief Google Drive에서 문서 로드 유틸리티
 * @details 공유 문서 및 개인 문서 폴더에서 직접 문서를 로드합니다.
 */

import { generateDocumentNumber } from "./documentNumberGenerator";
import type { DocumentInfo, GoogleFile } from "../../types/documents";
import { findPersonalDocumentFolder } from "../google/googleSheetUtils";
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
    
    if (response.success && response.name) {
      console.log('👤 사용자 이름 변환 성공:', email, '->', response.name);
      return response.name;
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
  const gapi = window.gapi;
  
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

    // 3단계: 공유 문서 폴더 찾기
    const sharedDocResponse = await gapi.client.drive.files.list({
      q: `'${documentFolder.id}' in parents and name='공유 문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!sharedDocResponse.result.files || sharedDocResponse.result.files.length === 0) {
      console.log('공유 문서 폴더를 찾을 수 없습니다');
      return [];
    }

    const sharedDocFolder = sharedDocResponse.result.files[0];

    // 4단계: 공유 문서 폴더에서 파일 목록 가져오기 (메타데이터 포함)
    const filesResponse = await gapi.client.drive.files.list({
      q: `'${sharedDocFolder.id}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc'
    });

    if (!filesResponse.result.files || filesResponse.result.files.length === 0) {
      console.log('공유 문서 폴더가 비어있습니다');
      return [];
    }

    // 파일 정보를 DocumentInfo로 변환
    const documents: DocumentInfo[] = [];
    
    for (let i = 0; i < filesResponse.result.files.length; i++) {
      const file = filesResponse.result.files[i];
      
      // 각 파일의 상세 정보를 개별적으로 가져오기 (properties 포함)
      let fileWithProperties;
      try {
        const detailResponse = await gapi.client.drive.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties'
        });
        fileWithProperties = detailResponse.result;
      } catch (error) {
        console.warn(`파일 ${file.name} 상세 정보 가져오기 실패:`, error);
        fileWithProperties = file; // 기본 정보만 사용
      }
      
      // 메타데이터에서 정보 추출
      const metadataCreator = fileWithProperties.properties?.creator;
      const metadataTag = fileWithProperties.properties?.tag;
      
      console.log(`📄 파일 ${i + 1} 메타데이터:`, {
        fileName: fileWithProperties.name,
        properties: fileWithProperties.properties,
        metadataCreator,
        metadataTag
      });
      
      // 생성자 이름 변환 (이메일인 경우 사용자 이름으로 변환)
      const rawCreator = metadataCreator || fileWithProperties.owners?.[0]?.displayName || fileWithProperties.owners?.[0]?.emailAddress || '알 수 없음';
      const creatorName = await convertEmailToName(rawCreator);
      
      documents.push({
        id: fileWithProperties.id || '',
        documentNumber: generateDocumentNumber(fileWithProperties.mimeType || '', 'shared', fileWithProperties.id, fileWithProperties.createdTime),
        title: fileWithProperties.name || '', // 원본 파일명 그대로 사용
        creator: creatorName, // 변환된 사용자 이름 사용
        lastModified: formatDateTime(fileWithProperties.modifiedTime || new Date().toISOString()),
        createdTime: fileWithProperties.createdTime || '', // 생성 시간 추가
        url: fileWithProperties.webViewLink || '',
        documentType: 'shared',
        mimeType: fileWithProperties.mimeType || '',
        originalIndex: i,
        tag: metadataTag || '공용' // 메타데이터 태그 또는 기본 '공용' 태그
      });
    }

    console.log('공유 문서 로드 완료:', documents.length, '개');
    return documents;

  } catch (error) {
    console.error('공유 문서 로드 오류:', error);
    return [];
  }
};

/**
 * 개인 문서 폴더에서 문서 로드
 * @returns 문서 목록
 */
export const loadPersonalDocuments = async (): Promise<DocumentInfo[]> => {
  const gapi = window.gapi;
  
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

    // 3단계: 개인 문서 폴더 찾기 (기존 유틸리티 사용)
    const personalDocFolderId = await findPersonalDocumentFolder();

    if (!personalDocFolderId) {
      console.log('개인 문서 폴더를 찾을 수 없습니다');
      return [];
    }

    // 4단계: 개인 문서 폴더에서 파일 목록 가져오기 (메타데이터 포함)
    const filesResponse = await gapi.client.drive.files.list({
      q: `'${personalDocFolderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc'
    });

    if (!filesResponse.result.files || filesResponse.result.files.length === 0) {
      console.log('개인 문서 폴더가 비어있습니다');
      return [];
    }

    // 파일 정보를 DocumentInfo로 변환
    const documents: DocumentInfo[] = [];
    
    for (let i = 0; i < filesResponse.result.files.length; i++) {
      const file = filesResponse.result.files[i];
      
      // 각 파일의 상세 정보를 개별적으로 가져오기 (properties 포함)
      let fileWithProperties;
      try {
        const detailResponse = await gapi.client.drive.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,description,properties'
        });
        fileWithProperties = detailResponse.result;
      } catch (error) {
        console.warn(`개인 파일 ${file.name} 상세 정보 가져오기 실패:`, error);
        fileWithProperties = file; // 기본 정보만 사용
      }
      
      // 메타데이터에서 정보 추출
      const metadataCreator = fileWithProperties.properties?.creator;
      const metadataTag = fileWithProperties.properties?.tag;
      
      console.log(`📄 개인 파일 ${i + 1} 메타데이터:`, {
        fileName: fileWithProperties.name,
        properties: fileWithProperties.properties,
        metadataCreator,
        metadataTag
      });
      
      // 생성자 이름 변환 (이메일인 경우 사용자 이름으로 변환)
      const rawCreator = metadataCreator || fileWithProperties.owners?.[0]?.displayName || fileWithProperties.owners?.[0]?.emailAddress || '알 수 없음';
      const creatorName = await convertEmailToName(rawCreator);
      
      documents.push({
        id: fileWithProperties.id || '',
        documentNumber: generateDocumentNumber(fileWithProperties.mimeType || '', 'personal', fileWithProperties.id, fileWithProperties.createdTime),
        title: fileWithProperties.name || '', // 원본 파일명 그대로 사용
        creator: creatorName, // 변환된 사용자 이름 사용
        lastModified: formatDateTime(fileWithProperties.modifiedTime || new Date().toISOString()),
        url: fileWithProperties.webViewLink || '',
        documentType: 'personal',
        mimeType: fileWithProperties.mimeType || '',
        originalIndex: i,
        tag: metadataTag || '개인' // 메타데이터 태그 또는 기본 '개인' 태그
      });
    }

    console.log('개인 문서 로드 완료:', documents.length, '개');
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

