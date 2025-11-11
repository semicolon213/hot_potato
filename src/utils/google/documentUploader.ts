/**
 * @file documentUploader.ts
 * @brief 문서 업로드 유틸리티
 * @details 공유 문서 및 개인 문서 업로드를 처리하는 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { apiClient } from '../api/apiClient';
import { findPersonalDocumentFolder } from './googleSheetUtils';
import { ENV_CONFIG } from '../../config/environment';

/**
 * 파일을 Base64로 변환
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * MIME 타입을 Google 문서 타입으로 변환
 * PDF는 Google 형식으로 변환 불가능하므로 원본 MIME 타입 유지
 */
const getGoogleMimeType = (mimeType: string): string => {
  const lower = mimeType.toLowerCase();
  // PDF는 Google 형식으로 변환 불가능하므로 원본 MIME 타입 유지
  if (lower.includes('pdf')) {
    return mimeType; // PDF는 원본 MIME 타입 유지
  } else if (lower.includes('sheet') || lower.includes('excel') || lower.includes('spreadsheetml')) {
    return 'application/vnd.google-apps.spreadsheet';
  }
  return 'application/vnd.google-apps.document';
};

/**
 * 공유 문서 업로드
 * @param file - 업로드할 파일
 * @param fileName - 파일명
 * @param tag - 태그
 * @param creatorEmail - 생성자 이메일
 * @param editors - 편집자 이메일 배열
 */
export const uploadSharedDocument = async (
  file: File,
  fileName: string,
  tag: string,
  creatorEmail: string,
  editors: string[] = []
): Promise<{ success: boolean; message?: string; documentId?: string; url?: string }> => {
  try {
    console.log('📤 공유 문서 업로드 시작:', { fileName, tag, creatorEmail, editors });

    // 파일을 Base64로 변환
    const fileContentBase64 = await fileToBase64(file);

    // Apps Script API를 통해 공유 문서 업로드 및 권한 설정
    // 먼저 파일을 업로드하고, 그 다음 권한을 설정하는 방식으로 진행
    // Apps Script의 uploadSharedDocument 액션을 호출
    const result = await apiClient.request('uploadSharedDocument', {
      fileName,
      fileMimeType: file.type,
      fileContentBase64,
      meta: {
        title: fileName,
        description: '',
        tag,
        creatorEmail
      },
      editors,
      role: 'student'
    });

    if (result.success && result.data) {
      const data = result.data as { id: string; webViewLink?: string };
      console.log('✅ 공유 문서 업로드 완료:', data);
      return {
        success: true,
        documentId: data.id,
        url: data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`
      };
    } else {
      throw new Error(result.message || '업로드 실패');
    }
  } catch (error) {
    console.error('❌ 공유 문서 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 개인 문서 업로드
 * @param file - 업로드할 파일
 * @param fileName - 파일명
 * @param tag - 태그
 * @param creatorEmail - 생성자 이메일
 */
export const uploadPersonalDocument = async (
  file: File,
  fileName: string,
  tag: string,
  creatorEmail: string
): Promise<{ success: boolean; message?: string; documentId?: string; url?: string }> => {
  const gapi = (window as any).gapi;
  
  if (!gapi?.client?.drive) {
    return {
      success: false,
      message: 'Google Drive API가 초기화되지 않았습니다.'
    };
  }

  try {
    console.log('📤 개인 문서 업로드 시작:', { fileName, tag, creatorEmail });

    // 개인 문서 폴더 찾기
    const folderId = await findPersonalDocumentFolder();
    if (!folderId) {
      return {
        success: false,
        message: '개인 문서 폴더를 찾을 수 없습니다.'
      };
    }

    // 파일을 FormData로 변환
    const formData = new FormData();
    formData.append('file', file);
    
    // 파일 메타데이터 설정
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: getGoogleMimeType(file.type)
    };

    // Google Drive API로 파일 업로드 (multipart upload)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';

    // 메타데이터 부분
    const metadataPart = JSON.stringify(metadata);
    const metadataBody = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      metadataPart;

    // 파일 데이터 부분
    const fileData = await file.arrayBuffer();
    const fileBody = delimiter +
      'Content-Type: ' + file.type + '\r\n\r\n';

    // 전체 요청 본문 구성
    const body = new Blob([
      metadataBody,
      fileBody,
      new Uint8Array(fileData),
      closeDelim
    ]);

    // 토큰 가져오기 (tokenManager 사용)
    const token = tokenManager.get();
    if (!token) {
      return {
        success: false,
        message: 'Google 인증 토큰이 없습니다.'
      };
    }

    // 업로드 실행
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('업로드 응답 오류:', errorText);
      throw new Error(`업로드 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const documentId = result.id;

    // 업로드된 파일에 메타데이터(태그, 생성자) 추가
    // 이메일로 저장하고, 조회 시 이름으로 변환됨
    try {
      await gapi.client.drive.files.update({
        fileId: documentId,
        resource: {
          properties: {
            tag: tag,
            creator: creatorEmail,  // 이메일로 저장 (조회 시 이름으로 변환됨)
            creatorEmail: creatorEmail,  // 원본 이메일도 함께 저장
            createdDate: new Date().toISOString()
          }
        }
      });
      console.log('✅ 파일 메타데이터 설정 완료');
    } catch (metaError) {
      console.warn('⚠️ 메타데이터 설정 실패 (파일은 업로드됨):', metaError);
    }

    console.log('✅ 개인 문서 업로드 완료:', result);
    return {
      success: true,
      documentId: result.id,
      url: result.webViewLink || `https://docs.google.com/document/d/${result.id}/edit`
    };
  } catch (error) {
    console.error('❌ 개인 문서 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
    };
  }
};

