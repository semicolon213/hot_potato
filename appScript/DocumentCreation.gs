/**
 * DocumentCreation.gs
 * 문서 생성 관련 기능
 * Hot Potato Document Management System
 */

// ===== 문서 생성 관련 함수들 =====

/**
 * 문서 생성 요청 처리
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function handleCreateDocument(req) {
  try {
    console.log('📄 문서 생성 시작:', req);
    
    const { title, templateType, creatorEmail, editors, role, tag } = req;
    
    if (!title || !creatorEmail) {
      return {
        success: false,
        message: '제목과 생성자 이메일이 필요합니다.'
      };
    }
    
    // 모든 문서를 공유 문서 폴더에 저장
    const documentType = 'document';
    console.log('📄 모든 문서를 공유 문서 폴더에 저장:', documentType, 'templateType:', templateType);
    
    // 1. Google Drive API로 새 문서 생성
    const document = createGoogleDocument(title, templateType);
    if (!document.success) {
      return document;
    }
    
    const documentId = document.data.id;
    const documentUrl = document.data.webViewLink;
    
    // 문서 메타데이터에 생성자 정보 및 태그 추가 (Google Drive API 사용)
    // 이메일로 저장하고, 조회 시 이름으로 변환
    let metadataStatus = '';
    let metadataError = null;
    let verifiedProperties = null;
    
    try {
      
      const properties = {
        'creator': creatorEmail,  // 이메일로 저장 (조회 시 이름으로 변환됨)
        'creatorEmail': creatorEmail,  // 원본 이메일도 함께 저장
        'createdDate': new Date().toLocaleString('ko-KR')
      };
      
      if (tag) {
        properties['tag'] = tag;
      }
      
      // Google Drive API로 메타데이터 업데이트
      const updateResult = Drive.Files.update(
        {
          properties: properties
        },
        documentId
      );
      
      metadataStatus = 'success';
      
      // 메타데이터 저장 확인
      try {
        const verifyResult = Drive.Files.get(
          documentId,
          {
            fields: 'properties'
          }
        );
        if (verifyResult && verifyResult.properties) {
          verifiedProperties = verifyResult.properties;
        } else {
          verifiedProperties = { message: 'Properties not available in response' };
        }
      } catch (verifyErr) {
        console.log('메타데이터 확인 실패:', verifyErr.message);
        verifiedProperties = { error: verifyErr.message };
      }
      
    } catch (metadataErr) {
      metadataStatus = 'failed';
      metadataError = metadataErr.message;
    }
    
    // 문서 설명에도 추가 (백업용) - 이메일로 저장
    let descriptionStatus = '';
    let descriptionError = null;
    try {
      const description = `생성자: ${creatorEmail} | 생성일: ${new Date().toLocaleString('ko-KR')}${tag ? ` | Tag: ${tag}` : ''}`;
      
      // Google Drive API로 설명 업데이트
      Drive.Files.update(
        {
          description: description
        },
        documentId
      );
      
      descriptionStatus = 'success';
      Logger.log('문서 설명 설정 성공: ' + description);
    } catch (descError) {
      descriptionStatus = 'failed';
      descriptionError = descError.message;
      Logger.log('문서 설명 설정 실패: ' + descError.message);
    }
    
    // 2. 문서 권한 설정 (소유자: 앱스크립트 소유자, 편집자: 요청자 + 지정된 편집자들)
    const permissionResult = setDocumentPermissions(documentId, creatorEmail, editors || []);
    if (!permissionResult.success) {
      return permissionResult;
    }
    
    // 3. 적절한 폴더에 문서 이동 (필요한 경우에만)
    let moveResult = { success: true, message: '폴더 이동 불필요' };
    if (document.needsFolderMove !== false) {
      console.log('📄 문서 폴더 이동 필요:', document.needsFolderMove);
      moveResult = moveDocumentToFolder(documentId, documentType);
      if (!moveResult.success) {
        console.warn('문서 폴더 이동 실패:', moveResult.message);
        // 폴더 이동 실패해도 문서 생성은 성공으로 처리
      }
    } else {
      console.log('📄 템플릿 복사로 이미 올바른 폴더에 생성됨, 폴더 이동 생략');
    }
    
    // 4. 문서 정보를 스프레드시트에 추가
    const spreadsheetResult = addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role);
    if (!spreadsheetResult.success) {
      console.warn('스프레드시트 추가 실패:', spreadsheetResult.message);
      // 스프레드시트 추가 실패해도 문서 생성은 성공으로 처리
    }
    
    return {
      success: true,
      data: {
        id: documentId,
        documentId: documentId,
        webViewLink: documentUrl,
        documentUrl: documentUrl,
        name: title,
        creatorEmail: creatorEmail,
        editors: editors || []
      },
      message: '문서가 성공적으로 생성되었습니다.',
      debug: {
        metadataStatus: metadataStatus,
        metadataError: metadataError,
        descriptionStatus: descriptionStatus,
        descriptionError: descriptionError,
        tag: tag,
        creatorEmail: creatorEmail,
        creatorName: creatorName,  // 사용자 이름 추가
        documentId: documentId,
        verifiedProperties: verifiedProperties,
        documentType: documentType,
        templateType: templateType,
        folderMoveResult: moveResult,
        permissionResult: permissionResult
      }
    };
    
  } catch (error) {
    console.error('📄 문서 생성 오류:', error);
    return {
      success: false,
      message: '문서 생성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * Google Drive API로 새 문서 생성
 * @param {string} title - 문서 제목
 * @param {string} templateType - 템플릿 타입 또는 documentId
 * @returns {Object} 생성 결과
 */
function createGoogleDocument(title, templateType) {
  try {
    console.log('📄 Google 문서 생성 시도:', { title, templateType });
    
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      console.error('📄 Drive API가 정의되지 않았습니다');
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다. Google Apps Script에서 Drive API를 활성화해주세요.'
      };
    }
    
    // 빈 문서인 경우
    if (templateType === 'empty') {
      console.log('📄 빈 문서 생성 (템플릿 없음)');
    }
    // templateType이 documentId인 경우 (템플릿 복사)
    else if (templateType && templateType.length > 20 && !templateType.includes('http')) {
      console.log('📄 커스텀 템플릿 복사 시도:', templateType);
      
      try {
        // CONFIG.gs에서 문서 폴더 경로 가져오기
        const sharedDocumentPath = getSharedDocumentFolderPath(); // 'hot potato/문서/공유 문서'
        
        console.log('📄 CONFIG에서 가져온 공유 문서 폴더 경로:', sharedDocumentPath);
        
        // 공유 문서 폴더 찾기 또는 생성
        const folder = findOrCreateFolder(sharedDocumentPath);
        
        if (!folder.success) {
          console.error('📄 공유 문서 폴더 찾기/생성 실패:', folder.message);
          throw new Error('공유 문서 폴더를 찾을 수 없습니다: ' + folder.message);
        }
        
        // 기존 문서를 복사 (직접 공유 문서 폴더에 생성)
        const copiedFile = Drive.Files.copy(
          {
            name: title,
            parents: [folder.data.id]
          },
          templateType
        );
        
        console.log('📄 템플릿 복사 성공 (CONFIG 기반 공유 문서 폴더에 직접 생성):', copiedFile.id);
        
        return {
          success: true,
          data: {
            id: copiedFile.id,
            name: title,
            webViewLink: `https://docs.google.com/document/d/${copiedFile.id}/edit`
          },
          needsFolderMove: false  // 이미 올바른 폴더에 생성됨
        };
      } catch (copyError) {
        console.error('📄 템플릿 복사 실패:', copyError);
        // 복사 실패 시 빈 문서로 생성
      }
    }
    
    // 기본 문서 생성 또는 복사 실패 시
    console.log('📄 빈 문서 생성 시도');
    const file = Drive.Files.create({
      name: title,
      mimeType: 'application/vnd.google-apps.document'
    });
    
    console.log('📄 Google 문서 생성 성공:', file.id);
    
    return {
      success: true,
      data: {
        id: file.id,
        name: file.name,
        webViewLink: `https://docs.google.com/document/d/${file.id}/edit`
      },
      needsFolderMove: true  // 빈 문서는 폴더 이동 필요
    };
    
  } catch (error) {
    console.error('📄 Google 문서 생성 오류:', error);
    return {
      success: false,
      message: 'Google 문서 생성 실패: ' + error.message
    };
  }
}

/**
 * 공유 문서 업로드 (파일 업로드 + 권한 설정 + 폴더 이동)
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function uploadSharedDocument(req) {
  try {
    console.log('📤 공유 문서 업로드 시작:', req);
    
    if (!req || !req.fileName || !req.fileContentBase64) {
      return { success: false, message: 'fileName과 fileContentBase64가 필요합니다.' };
    }
    
    const { fileName, fileMimeType, fileContentBase64, meta, editors, role } = req;
    const { title, tag, creatorEmail } = meta || {};
    
    if (!title || !creatorEmail) {
      return { success: false, message: '제목과 생성자 이메일이 필요합니다.' };
    }
    
    // 입력 검증/정규화
    const sanitize = function(s) {
      if (!s) return '';
      s = String(s);
      s = s.replace(/[<>"'\\]/g, '');
      return s.substring(0, 200);
    };
    
    const safeTitle = sanitize(title || fileName);
    const safeTag = sanitize(tag || '기본');
    const mime = fileMimeType || '';
    
    // 지원 파일 형식 확인
    const allowed = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-excel',
      'application/pdf'
    ];
    if (mime && allowed.indexOf(mime) === -1) {
      return { success: false, message: '지원되지 않는 파일 형식입니다.' };
    }
    
    if (fileContentBase64.length > 12 * 1024 * 1024) { // ~12MB base64 길이 보호
      return { success: false, message: '파일이 너무 큽니다.' };
    }
    
    if (typeof Drive === 'undefined') {
      return { success: false, message: 'Drive API가 활성화되지 않았습니다.' };
    }
    
    // Base64 디코딩 및 Blob 생성
    const bytes = Utilities.base64Decode(fileContentBase64);
    const blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', fileName);
    
    // 공유 문서 폴더 찾기
    const folderPath = getSharedDocumentFolderPath();
    const folderRes = findOrCreateFolder(folderPath);
    if (!folderRes || !folderRes.success || !folderRes.data || !folderRes.data.id) {
      return { success: false, message: '공유 문서 폴더를 찾을 수 없습니다.' };
    }
    
    // Google 문서 타입 결정 (양식 업로드와 동일한 로직)
    let targetGoogleMime = 'application/vnd.google-apps.document';
    const lower = (mime || '').toLowerCase();
    // PDF는 Google 형식으로 변환 불가능하므로 원본 MIME 타입 유지
    if (lower.indexOf('pdf') !== -1) {
      targetGoogleMime = mime; // PDF는 원본 MIME 타입 유지
    } else if (lower.indexOf('sheet') !== -1 || lower.indexOf('excel') !== -1 || lower.indexOf('spreadsheetml') !== -1) {
      targetGoogleMime = 'application/vnd.google-apps.spreadsheet';
    }
    
    // 파일 업로드
    const created = Drive.Files.create({
      name: safeTitle,
      mimeType: targetGoogleMime,
      parents: [folderRes.data.id]
    }, blob);
    
    const documentId = created.id;
    
    // 메타데이터 설정 (이메일로 저장, 조회 시 이름으로 변환됨)
    const properties = {
      'creator': creatorEmail,  // 이메일로 저장
      'creatorEmail': creatorEmail,
      'createdDate': new Date().toLocaleString('ko-KR'),
      'tag': safeTag
    };
    
    Drive.Files.update({
      properties: properties
    }, documentId);
    
    // 문서 설명 설정 (이메일로 저장)
    const description = `생성자: ${creatorEmail} | 생성일: ${new Date().toLocaleString('ko-KR')} | Tag: ${safeTag}`;
    Drive.Files.update({
      description: description
    }, documentId);
    
    // 권한 설정
    if (editors && editors.length > 0) {
      const permissionResult = setDocumentPermissions(documentId, creatorEmail, editors);
      if (!permissionResult.success) {
        console.warn('권한 설정 실패:', permissionResult.message);
      }
    }
    
    // 문서 정보를 스프레드시트에 추가
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    const spreadsheetResult = addDocumentToSpreadsheet(documentId, safeTitle, creatorEmail, documentUrl, role || 'student');
    if (!spreadsheetResult.success) {
      console.warn('스프레드시트 추가 실패:', spreadsheetResult.message);
    }
    
    // 문서 URL 가져오기
    const fileInfo = Drive.Files.get(documentId, { fields: 'webViewLink' });
    
    return {
      success: true,
      data: {
        id: documentId,
        documentId: documentId,
        webViewLink: fileInfo.webViewLink || documentUrl,
        documentUrl: documentUrl,
        name: safeTitle,
        creatorEmail: creatorEmail,
        editors: editors || []
      },
      message: '문서가 성공적으로 업로드되었습니다.'
    };
  } catch (error) {
    console.error('공유 문서 업로드 오류:', error);
    return {
      success: false,
      message: '업로드 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getDocumentCreationInfo() {
  return {
    version: '1.0.0',
    description: '문서 생성 관련 기능',
    functions: [
      'handleCreateDocument',
      'createGoogleDocument',
      'uploadSharedDocument'
    ],
    dependencies: ['DocumentPermissions.gs', 'DocumentFolder.gs', 'DocumentSpreadsheet.gs', 'CONFIG.gs']
  };
}
