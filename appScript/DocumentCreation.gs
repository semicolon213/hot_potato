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
    
    const { title, templateType, creatorEmail, editors, role } = req;
    
    if (!title || !creatorEmail) {
      return {
        success: false,
        message: '제목과 생성자 이메일이 필요합니다.'
      };
    }
    
    // 1. Google Drive API로 새 문서 생성
    const document = createGoogleDocument(title, templateType);
    if (!document.success) {
      return document;
    }
    
    const documentId = document.data.id;
    const documentUrl = document.data.webViewLink;
    
    // 2. 문서 권한 설정 (소유자: 앱스크립트 소유자, 편집자: 요청자 + 지정된 편집자들)
    const permissionResult = DocumentPermissions.setDocumentPermissions(documentId, creatorEmail, editors || []);
    if (!permissionResult.success) {
      return permissionResult;
    }
    
    // 3. hot potato/문서 폴더에 문서 이동
    const moveResult = DocumentFolder.moveDocumentToFolder(documentId);
    if (!moveResult.success) {
      console.warn('문서 폴더 이동 실패:', moveResult.message);
      // 폴더 이동 실패해도 문서 생성은 성공으로 처리
    }
    
    // 4. 문서 정보를 스프레드시트에 추가
    const spreadsheetResult = DocumentSpreadsheet.addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role);
    if (!spreadsheetResult.success) {
      console.warn('스프레드시트 추가 실패:', spreadsheetResult.message);
      // 스프레드시트 추가 실패해도 문서 생성은 성공으로 처리
    }
    
    return {
      success: true,
      data: {
        documentId: documentId,
        documentUrl: documentUrl,
        name: title,
        creatorEmail: creatorEmail,
        editors: editors || []
      },
      message: '문서가 성공적으로 생성되었습니다.'
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
        // 기존 문서를 복사
        const copiedFile = Drive.Files.copy({
          fileId: templateType,
          name: title
        });
        
        console.log('📄 템플릿 복사 성공:', copiedFile.id);
        
        return {
          success: true,
          data: {
            id: copiedFile.id,
            name: title,
            webViewLink: `https://docs.google.com/document/d/${copiedFile.id}/edit`
          }
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
        title: file.name,
        webViewLink: `https://docs.google.com/document/d/${file.id}/edit`
      }
    };
    
  } catch (error) {
    console.error('📄 Google 문서 생성 오류:', error);
    return {
      success: false,
      message: 'Google 문서 생성 실패: ' + error.message
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
      'createGoogleDocument'
    ],
    dependencies: ['DocumentPermissions.gs', 'DocumentFolder.gs', 'DocumentSpreadsheet.gs', 'CONFIG.gs']
  };
}
