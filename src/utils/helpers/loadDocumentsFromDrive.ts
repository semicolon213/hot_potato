/**
 * @file loadDocumentsFromDrive.ts
 * @brief Google Drive에서 문서 로드 유틸리티
 * @details 공유 문서 및 개인 문서 폴더에서 직접 문서를 로드합니다.
 */

import { generateDocumentNumber } from "./documentNumberGenerator";
import type { DocumentInfo, GoogleFile } from "../../types/documents";
import { formatDateTime } from "./timeUtils";
import { apiClient } from "../api/apiClient";
import type { DocumentInfoResponse, DocumentsListResponse, UserNameResponse } from "../../types/api/apiResponses";
import { getCacheManager } from "../cache/cacheManager";
import { generateCacheKey, getCacheTTL, getActionCategory } from "../cache/cacheUtils";

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
    console.log('👤 API 응답 전체:', JSON.stringify(response, null, 2));
    
    // Apps Script가 직접 { success, name, message } 형태로 반환하므로
    // response.data가 아니라 response 자체를 확인
    if (response.success && response.data) {
      const userNameResponse = response.data as UserNameResponse;
      const resolvedName = userNameResponse?.name;
      if (resolvedName && resolvedName !== email) {
        console.log('👤 사용자 이름 변환 성공:', email, '->', resolvedName);
        return resolvedName;
      }
    }
    
    // 응답 구조가 다른 경우를 대비해 직접 name 필드 확인
    const userNameResponse = response as Partial<UserNameResponse>;
    if (response.success && userNameResponse.name && userNameResponse.name !== email) {
      console.log('👤 사용자 이름 변환 성공 (직접 name 필드):', email, '->', userNameResponse.name);
      return userNameResponse.name;
    }
    
    console.log('👤 사용자 이름 변환 실패, 원본 이메일 반환:', email, 'response:', response);
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

    const rows = (result.data || []) as DocumentInfoResponse[];
    const documents: DocumentInfo[] = await Promise.all(
      rows.map(async (row: DocumentInfoResponse, index: number) => {
        const mimeType = row.mimeType || row.type || '';
        const created = row.createdTime || row.created_at || undefined;
        const id = row.id || row.documentId || row.fileId || '';
        const url = row.url || row.webViewLink || (id ? `https://docs.google.com/document/d/${id}/edit` : '');
        
        // creator나 author가 이메일인 경우 이름으로 변환
        const rawCreator = row.creator || row.author || '';
        let creatorName = rawCreator;
        if (rawCreator && rawCreator.includes('@')) {
          // 이메일 형식이면 이름으로 변환 시도
          creatorName = await convertEmailToName(rawCreator);
        }
        
        // 날짜 포맷팅 (ISO 형식이면 포맷팅, 이미 포맷팅된 경우 그대로 사용)
        const rawModifiedTime = row.lastModified || row.modifiedTime || new Date().toISOString();
        const formattedModifiedTime = rawModifiedTime.includes('T') || rawModifiedTime.includes('Z') 
          ? formatDateTime(rawModifiedTime) 
          : rawModifiedTime;
        
        return {
          id,
          documentNumber: row.documentNumber || generateDocumentNumber(mimeType, 'shared', id, created),
          title: row.title || row.name || '',
          creator: creatorName,
          creatorEmail: row.authorEmail || row.creatorEmail || (rawCreator.includes('@') ? rawCreator : ''),
          lastModified: formattedModifiedTime,
          url,
          documentType: 'shared',
          mimeType,
          tag: row.tag || '공용',
          originalIndex: index,
        };
      })
    );

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
  const gapi = window.gapi;
  
  if (!gapi?.client?.drive) {
    console.error('Google Drive API가 초기화되지 않았습니다.');
    return [];
  }

  try {
    const { ENV_CONFIG } = await import('../../config/environment');
    const rootFolderName = ENV_CONFIG.ROOT_FOLDER_NAME;
    const documentFolderName = ENV_CONFIG.DOCUMENT_FOLDER_NAME;
    const personalDocFolderName = ENV_CONFIG.PERSONAL_DOCUMENT_FOLDER_NAME;

    // 1단계: 루트 폴더 찾기
    const hotPotatoResponse = await gapi.client.drive.files.list({
      q: `'root' in parents and name='${rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log(`${rootFolderName} 폴더를 찾을 수 없습니다`);
      return [];
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];

    // 2단계: 문서 폴더 찾기
    const documentResponse = await gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='${documentFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!documentResponse.result.files || documentResponse.result.files.length === 0) {
      console.log(`${documentFolderName} 폴더를 찾을 수 없습니다`);
      return [];
    }

    const documentFolder = documentResponse.result.files[0];

    // 3단계: 개인 문서 폴더 찾기
    const personalDocResponse = await gapi.client.drive.files.list({
      q: `'${documentFolder.id}' in parents and name='${personalDocFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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

      // creator (사용자 이름)를 우선적으로 확인, 없으면 creatorEmail 사용
      const metadataCreator = fileWithProperties.properties?.creator || fileWithProperties.properties?.creatorEmail;
      const metadataTag = fileWithProperties.properties?.tag;

      // creator가 이미 이름인 경우 그대로 사용, 이메일인 경우에만 변환
      let creatorName: string;
      let creatorEmail: string = '';
      
      if (metadataCreator) {
        // creator가 이메일 형식인지 확인
        if (metadataCreator.includes('@')) {
          // 이메일 형식이면 이름으로 변환 시도
          creatorEmail = metadataCreator;
          creatorName = await convertEmailToName(metadataCreator);
        } else {
          // 이미 이름이면 그대로 사용
          creatorName = metadataCreator;
          // properties에서 creatorEmail 찾기
          creatorEmail = fileWithProperties.properties?.creatorEmail || '';
        }
      } else {
        // 메타데이터에 creator가 없으면 owners에서 가져와서 변환
        const rawCreator = fileWithProperties.owners?.[0]?.displayName || fileWithProperties.owners?.[0]?.emailAddress || '알 수 없음';
        if (rawCreator.includes('@')) {
          creatorEmail = rawCreator;
        }
        creatorName = await convertEmailToName(rawCreator);
      }

      // creatorEmail이 없으면 owners에서 이메일 가져오기
      if (!creatorEmail && fileWithProperties.owners?.[0]?.emailAddress) {
        creatorEmail = fileWithProperties.owners[0].emailAddress;
      }

      documents.push({
        id: fileWithProperties.id || '',
        documentNumber: generateDocumentNumber(fileWithProperties.mimeType || '', 'personal', fileWithProperties.id, fileWithProperties.createdTime),
        title: fileWithProperties.name || '',
        creator: creatorName,
        creatorEmail: creatorEmail,
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
 * 모든 문서 로드 (공유 + 개인) - 캐싱 지원
 * @returns 문서 목록
 */
export const loadAllDocuments = async (): Promise<DocumentInfo[]> => {
  const cacheManager = getCacheManager();
  const action = 'getAllDocuments';
  const category = getActionCategory(action);
  const cacheKey = generateCacheKey(category, action, {});
  
  // 캐시에서 먼저 확인
  const cachedData = await cacheManager.get<DocumentInfo[]>(cacheKey);
  if (cachedData) {
    console.log('📄 캐시에서 문서 로드:', cachedData.length, '개');
    return cachedData;
  }

  // 캐시 미스 시 실제 로드
  console.log('📄 문서 로드 시작 (캐시 미스)...');
  const [sharedDocs, personalDocs] = await Promise.all([
    loadSharedDocuments(),
    loadPersonalDocuments()
  ]);

  const allDocs = [...sharedDocs, ...personalDocs];
  console.log('📄 전체 문서 로드 완료:', allDocs.length, '개');
  
  // 캐시에 저장
  const ttl = getCacheTTL(action);
  await cacheManager.set(cacheKey, allDocs, ttl);
  console.log('📄 문서 캐시 저장 완료 (TTL:', ttl / 1000 / 60, '분)');
  
  return allDocs;
};

