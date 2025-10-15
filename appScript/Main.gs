/**
 * Main.gs
 * 메인 엔트리 포인트 - UserManagement.gs 연동
 * Hot Potato Admin Key Management System
 */

// ===== 메인 엔트리 포인트 =====
function doPost(e) {
  try {
    console.log('🚀 === 메인 doPost 시작 ===');
    console.log('📥 요청 데이터:', e);
    
    // 요청 데이터 파싱
    const req = parseRequest(e);
    console.log('📋 파싱된 요청:', req);
    console.log('🎯 액션:', req.action);
    
    // 암복호화 액션 직접 처리
    if (req.action === 'encryptEmail') {
      console.log('🔐 암호화 요청 받음:', req.data);
      const encrypted = encryptEmailMain(req.data);
      console.log('🔐 암호화 결과:', encrypted);
      const response = {
        success: true, 
        data: encrypted,
        debug: {
          original: req.data,
          encrypted: encrypted,
          source: 'Main.gs encryptEmailMain',
          timestamp: new Date().toISOString()
        }
      };
      console.log('🔐 최종 응답:', response);
      return ContentService
        .createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (req.action === 'decryptEmail') {
      console.log('🔓 복호화 요청 받음:', req.data);
      const decrypted = decryptEmailMain(req.data);
      console.log('🔓 복호화 결과:', decrypted);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: decrypted }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 문서 생성 액션 처리
    if (req.action === 'createDocument') {
      console.log('📄 문서 생성 요청 받음:', req);
      
      try {
        const { title, templateType, creatorEmail, editors, role } = req;
        
        if (!title || !creatorEmail) {
          return ContentService
            .createTextOutput(JSON.stringify({
              success: false,
              message: '제목과 생성자 이메일이 필요합니다.'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        // Google Drive API로 새 문서 생성
        const document = createGoogleDocument(title, templateType);
        if (!document.success) {
          return ContentService
            .createTextOutput(JSON.stringify(document))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        const documentId = document.data.id;
        const documentUrl = document.data.webViewLink;
        
        // 문서 권한 설정
        const permissionResult = setDocumentPermissions(documentId, creatorEmail, editors || []);
        if (!permissionResult.success) {
          return ContentService
            .createTextOutput(JSON.stringify(permissionResult))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        // hot_potato/문서 폴더에 문서 이동
        const moveResult = moveDocumentToFolder(documentId);
        if (!moveResult.success) {
          console.warn('문서 폴더 이동 실패:', moveResult.message);
        }
        
        // 문서 정보를 스프레드시트에 추가
        const spreadsheetResult = addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role);
        if (!spreadsheetResult.success) {
          console.warn('스프레드시트 추가 실패:', spreadsheetResult.message);
        }
        
        const result = {
          success: true,
          data: {
            documentId: documentId,
            documentUrl: documentUrl,
            title: title,
            creatorEmail: creatorEmail,
            editors: editors || []
          },
          message: '문서가 성공적으로 생성되었습니다.'
        };
        
        console.log('📄 문서 생성 결과:', result);
        return ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
          
      } catch (error) {
        console.error('📄 문서 생성 오류:', error);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '문서 생성 중 오류가 발생했습니다: ' + error.message
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 문서 목록 조회 액션 처리
    if (req.action === 'getDocuments') {
      console.log('📄 문서 목록 조회 요청 받음:', req);
      const result = handleGetDocuments(req);
      console.log('📄 문서 목록 조회 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 문서 삭제 액션 처리
    if (req.action === 'deleteDocuments') {
      console.log('🗑️ 문서 삭제 요청 받음:', req);
      const result = handleDeleteDocuments(req);
      console.log('🗑️ 문서 삭제 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 템플릿 목록 조회 액션 처리
    if (req.action === 'getTemplates') {
      console.log('📄 템플릿 목록 조회 요청 받음:', req);
      const result = getTemplatesFromFolder();
      console.log('📄 템플릿 목록 조회 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    
    // 사용자 인증 관련 액션들
    if (req.action === 'checkUserStatus') {
      console.log('👤 사용자 상태 확인 요청:', req.email);
      const result = handleCheckRegistrationStatus(req.email);
      console.log('👤 사용자 상태 확인 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (req.action === 'registerUser') {
      console.log('📝 사용자 등록 요청:', req);
      const result = handleSubmitRegistrationRequest(req);
      console.log('📝 사용자 등록 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (req.action === 'verifyAdminKey') {
      console.log('🔑 관리자 키 검증 요청:', req.adminKey);
      const result = verifyAdminKeyData(req.adminKey);
      console.log('🔑 관리자 키 검증 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 인증 관련 액션 처리
    if (req.action === 'checkApprovalStatus') {
      console.log('사용자 승인 상태 확인 요청:', req.email);
      const result = callUserManagementPost(req);
      console.log('사용자 승인 상태 확인 응답:', result);
      return result;
    }
    
    // UserManagement.gs의 doPostAuthInternal 함수 호출
    const result = callUserManagementPost(req);
    console.log('UserManagement.gs 응답:', result);
    
    return result;
  } catch (error) {
    console.error('메인 doPost 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '서버 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 요청 데이터 파싱 =====
function parseRequest(e) {
  let req = {};
  
  if (e.postData && e.postData.contents) {
    try {
      // JSON 형태의 요청 처리
      req = JSON.parse(e.postData.contents);
    } catch (jsonError) {
      try {
        // URL 인코딩된 형태의 요청 처리
        const params = e.postData.contents.split('&');
        for (const param of params) {
          const [key, value] = param.split('=');
          if (key && value) {
            req[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
      } catch (urlError) {
        console.error('요청 파싱 오류:', urlError);
        req = {};
      }
    }
  }
  
  // 쿼리 파라미터도 추가
  if (e.parameter) {
    for (const key in e.parameter) {
      if (e.parameter.hasOwnProperty(key)) {
        req[key] = e.parameter[key];
      }
    }
  }
  
  return req;
}

// ===== UserManagement.gs 함수 호출 래퍼 =====
function callUserManagementPost(req) {
  try {
    // UserManagement.gs의 doPostAuthInternal 함수를 직접 호출
    return doPostAuthInternal(req);
  } catch (error) {
    console.error('UserManagement.gs 호출 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '인증 처리 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== GET 요청 처리 =====
function doGet(e) {
  try {
    console.log('=== 메인 doGet 시작 ===');
    console.log('GET 요청:', e);
    
    // UserManagement.gs의 doGetAuthInternal 함수 호출
    return callUserManagementGet(e);
  } catch (error) {
    console.error('메인 doGet 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '서버 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== UserManagement.gs GET 함수 호출 래퍼 =====
function callUserManagementGet(e) {
  try {
    // UserManagement.gs의 doGetAuthInternal 함수를 직접 호출
    return doGetAuthInternal(e);
  } catch (error) {
    console.error('UserManagement.gs GET 호출 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'GET 처리 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 유틸리티 함수들 =====
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 테스트 함수 =====
function testMain() {
  console.log('=== 메인 테스트 시작 ===');
  
  // 테스트 요청 데이터
  const testReq = {
    action: 'test',
    message: '메인 함수 테스트'
  };
  
  try {
    const result = callUserManagementPost(testReq);
    console.log('테스트 결과:', result);
    return result;
  } catch (error) {
    console.error('테스트 오류:', error);
    return { success: false, message: '테스트 실패: ' + error.message };
  }
}

// ===== 통합 암호화 테스트 함수 =====
function testUnifiedEncryption() {
  console.log('=== 통합 암호화 테스트 시작 ===');
  
  const testData = [
    '010-3283-7936', // 전화번호
    'test@example.com', // 이메일
    'user123@domain.co.kr' // 복잡한 이메일
  ];
  
  const results = [];
  
  for (const data of testData) {
    console.log(`\n테스트 데이터: ${data}`);
    
    try {
      // 암호화 테스트
      const encrypted = encryptEmail(data);
      console.log('암호화 결과:', encrypted);
      
      // 복호화 테스트
      const decrypted = decryptEmail(encrypted);
      console.log('복호화 결과:', decrypted);
      
      // 검증
      const isValid = data === decrypted;
      console.log('테스트 결과:', isValid ? '성공' : '실패');
      
      results.push({
        original: data,
        encrypted: encrypted,
        decrypted: decrypted,
        success: isValid
      });
    } catch (error) {
      console.error('테스트 오류:', error);
      results.push({
        original: data,
        success: false,
        error: error.message
      });
    }
  }
  
  const allSuccess = results.every(r => r.success);
  console.log(`\n전체 테스트 결과: ${allSuccess ? '성공' : '실패'}`);
  
  return {
    success: allSuccess,
    results: results,
    message: allSuccess ? '통합 암호화 테스트 성공' : '통합 암호화 테스트 실패'
  };
}

// ===== 간단한 전화번호 암호화 테스트 =====
function testPhoneEncryptionSimple() {
  console.log('🧪 === 전화번호 암호화 테스트 시작 ===');
  
  const phone = '010-3283-7936';
  console.log('📱 원본 전화번호:', phone);
  
  try {
    const encrypted = encryptEmailMain(phone);
    console.log('🔐 암호화 결과:', encrypted);
    
    const decrypted = decryptEmailMain(encrypted);
    console.log('🔓 복호화 결과:', decrypted);
    
    const success = phone === decrypted;
    console.log('✅ 테스트 결과:', success ? '성공' : '실패');
    
    if (!success) {
      console.error('❌ 암호화/복호화 실패!');
      console.error('원본:', phone);
      console.error('암호화:', encrypted);
      console.error('복호화:', decrypted);
    }
    
    return {
      success: success,
      original: phone,
      encrypted: encrypted,
      decrypted: decrypted
    };
  } catch (error) {
    console.error('💥 테스트 오류:', error);
    return { success: false, error: error.message };
  }
}

// ===== 배포 정보 =====
function getDeploymentInfo() {
  return {
    version: '1.15.0',
    description: '메인 엔트리 포인트 - 통합 사용자 인증 + Base64 암호화 + 문서 관리 시스템',
    functions: [
      'doPost',
      'doGet', 
      'parseRequest',
      'doPostAuthInternal',
      'doGetAuthInternal',
      'testMain',
      'testUnifiedEncryption',
      'testPhoneEncryptionSimple',
      'encryptEmailMain', // Encryption.gs에서 정의
      'decryptEmailMain', // Encryption.gs에서 정의
      'verifyAdminKeyData',
      'checkApprovalStatus',
      'handleCreateDocument', // DocumentManagement.gs에서 정의
      'handleGetDocuments', // DocumentManagement.gs에서 정의
      'handleDeleteDocuments', // DocumentManagement.gs에서 정의
      'getTemplatesFromFolder', // 동적 템플릿 로드
      'createGoogleDocument', // 문서 생성
      'setDocumentPermissions', // 권한 설정
      'moveDocumentToFolder', // 폴더 이동
      'findOrCreateFolder', // 폴더 관리
      'addDocumentToSpreadsheet', // 스프레드시트 추가
      'getSheetIdByName' // 스프레드시트 ID 찾기
    ],
    dependencies: ['UserManagement.gs', 'SpreadsheetUtils.gs', 'Encryption.gs', 'CONFIG.gs', 'KeyManagement.gs', 'DocumentManagement.gs']
  };
}

// ===== 사용자 인증 관련 함수들 =====
// UserManagement.gs의 기존 함수들을 사용합니다.

/**
 * 관리자 키 검증
 */
function verifyAdminKeyData(adminKey) {
  try {
    console.log('🔑 관리자 키 검증 시작');
    
    // 관리자 키 검증 로직 (기존 KeyManagement.gs 활용)
    const isValid = verifyAdminKey(adminKey);
    
    console.log('🔑 관리자 키 검증 결과:', isValid);
    
    return {
      success: isValid,
      isValid: isValid,
      message: isValid ? '유효한 관리자 키입니다' : '유효하지 않은 관리자 키입니다'
    };
    
  } catch (error) {
    console.error('🔑 관리자 키 검증 오류:', error);
    return { success: false, isValid: false, error: error.message };
  }
}


// ===== 문서 관련 함수들은 DocumentManagement.gs로 이동됨 =====

// ===== 문서 생성 관련 함수들 =====

/**
 * Google Drive API로 새 문서 생성
 * @param {string} title - 문서 제목
 * @param {string} templateType - 템플릿 타입 또는 documentId
 * @returns {Object} 생성 결과
 */
function createGoogleDocument(title, templateType) {
  try {
    console.log('📄 Google 문서 생성 시도:', { title, templateType });
    
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
          title: title
        });
        
        console.log('📄 템플릿 복사 성공:', copiedFile.id);
        
        return {
          success: true,
          data: {
            id: copiedFile.id,
            title: title,
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
    const file = Drive.Files.insert({
      title: title,
      mimeType: 'application/vnd.google-apps.document'
    });
    
    console.log('📄 Google 문서 생성 성공:', file.id);
    
    return {
      success: true,
      data: {
        id: file.id,
        title: file.title,
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

/**
 * 문서 권한 설정
 * @param {string} documentId - 문서 ID
 * @param {string} creatorEmail - 생성자 이메일
 * @param {Array} editors - 편집자 이메일 배열
 * @returns {Object} 설정 결과
 */
function setDocumentPermissions(documentId, creatorEmail, editors) {
  try {
    console.log('📄 문서 권한 설정 시작:', { documentId, creatorEmail, editors });
    
    // 생성자에게 편집 권한 부여
    Drive.Permissions.insert({
      fileId: documentId,
      resource: {
        role: 'writer',
        type: 'user',
        value: creatorEmail
      }
    });
    
    // 추가 편집자들에게 권한 부여
    if (editors && editors.length > 0) {
      for (const editor of editors) {
        try {
          Drive.Permissions.insert({
            fileId: documentId,
            resource: {
              role: 'writer',
              type: 'user',
              value: editor
            }
          });
        } catch (editorError) {
          console.warn('편집자 권한 설정 실패:', editor, editorError);
        }
      }
    }
    
    console.log('📄 문서 권한 설정 완료');
    return { success: true };
    
  } catch (error) {
    console.error('📄 문서 권한 설정 오류:', error);
    return {
      success: false,
      message: '문서 권한 설정 실패: ' + error.message
    };
  }
}

/**
 * 문서를 hot_potato/문서 폴더로 이동
 * @param {string} documentId - 문서 ID
 * @returns {Object} 이동 결과
 */
function moveDocumentToFolder(documentId) {
  try {
    console.log('📄 문서 폴더 이동 시작:', documentId);
    
    // hot_potato/문서 폴더 찾기 또는 생성
    const folder = findOrCreateFolder('hot_potato/문서');
    if (!folder.success) {
      return folder;
    }
    
    // 문서를 폴더로 이동
    Drive.Files.update({
      fileId: documentId,
      addParents: folder.data.id,
      removeParents: 'root'
    });
    
    console.log('📄 문서 폴더 이동 완료');
    return { success: true };
    
  } catch (error) {
    console.error('📄 문서 폴더 이동 오류:', error);
    return {
      success: false,
      message: '문서 폴더 이동 실패: ' + error.message
    };
  }
}

/**
 * 폴더 찾기 또는 생성
 * @param {string} folderPath - 폴더 경로
 * @returns {Object} 폴더 정보
 */
function findOrCreateFolder(folderPath) {
  try {
    console.log('📁 폴더 찾기/생성 시작:', folderPath);
    
    if (!folderPath || typeof folderPath !== 'string') {
      console.error('📁 잘못된 폴더 경로:', folderPath);
      return {
        success: false,
        message: '잘못된 폴더 경로입니다'
      };
    }
    
    const pathParts = folderPath.split('/');
    let currentFolderId = 'root';
    
    for (const part of pathParts) {
      if (!part) continue;
      
      console.log('📁 폴더 검색 중:', part, 'in', currentFolderId);
      
      // 현재 폴더에서 하위 폴더 검색
      const folders = Drive.Files.list({
        q: `'${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and title='${part}' and trashed=false`,
        fields: 'items(id,title)'
      });
      
      console.log('📁 검색 결과:', folders);
      
      if (folders.items && folders.items.length > 0) {
        currentFolderId = folders.items[0].id;
        console.log('📁 기존 폴더 발견:', part, currentFolderId);
      } else {
        // 폴더 생성
        console.log('📁 새 폴더 생성 시도:', part);
        const newFolder = Drive.Files.insert({
          resource: {
            title: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [{ id: currentFolderId }]
          }
        });
        currentFolderId = newFolder.id;
        console.log('📁 새 폴더 생성 완료:', part, currentFolderId);
      }
    }
    
    console.log('📁 폴더 찾기/생성 완료:', folderPath, currentFolderId);
    
    return {
      success: true,
      data: {
        id: currentFolderId,
        path: folderPath
      }
    };
    
  } catch (error) {
    console.error('📁 폴더 찾기/생성 오류:', error);
    return {
      success: false,
      message: '폴더 찾기/생성 실패: ' + error.message
    };
  }
}

/**
 * 문서 정보를 스프레드시트에 추가
 * @param {string} documentId - 문서 ID
 * @param {string} title - 문서 제목
 * @param {string} creatorEmail - 생성자 이메일
 * @param {string} documentUrl - 문서 URL
 * @param {string} role - 사용자 역할
 * @returns {Object} 추가 결과
 */
function addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role) {
  try {
    console.log('📄 스프레드시트 추가 시작:', { documentId, title, creatorEmail, role });
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName('hot_potato_DB');
    if (!spreadsheetId) {
      console.error('📄 hot_potato_DB 스프레드시트를 찾을 수 없습니다');
      return {
        success: false,
        message: 'hot_potato_DB 스프레드시트를 찾을 수 없습니다'
      };
    }
    
    // 현재 날짜/시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    // 새 행 데이터
    const newRow = [
      timestamp,           // A: 생성일시
      title,              // B: 제목
      creatorEmail,       // C: 생성자
      documentUrl,        // D: URL
      documentId,         // E: 문서 ID
      role,               // F: 역할
      'active'            // G: 상태
    ];
    
    // documents 시트에 데이터 추가
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('documents');
    if (sheet) {
      sheet.appendRow(newRow);
      console.log('📄 스프레드시트 추가 완료');
      return { success: true };
    } else {
      console.error('📄 documents 시트를 찾을 수 없습니다');
      return {
        success: false,
        message: 'documents 시트를 찾을 수 없습니다'
      };
    }
    
  } catch (error) {
    console.error('📄 스프레드시트 추가 오류:', error);
    return {
      success: false,
      message: '스프레드시트 추가 실패: ' + error.message
    };
  }
}

/**
 * 스프레드시트 이름으로 ID 찾기
 * @param {string} sheetName - 스프레드시트 이름
 * @returns {string|null} 스프레드시트 ID 또는 null
 */
function getSheetIdByName(sheetName) {
  try {
    console.log('📊 스프레드시트 ID 찾기:', sheetName);
    
    const files = Drive.Files.list({
      q: `title='${sheetName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'items(id,title)'
    });
    
    if (files.items && files.items.length > 0) {
      const spreadsheetId = files.items[0].id;
      console.log('📊 스프레드시트 ID 발견:', spreadsheetId);
      return spreadsheetId;
    } else {
      console.warn('📊 스프레드시트를 찾을 수 없습니다:', sheetName);
      return null;
    }
  } catch (error) {
    console.error('📊 스프레드시트 ID 찾기 오류:', error);
    return null;
  }
}

/**
 * hot potato/문서/양식 폴더에서 템플릿 목록 가져오기
 * @returns {Object} 템플릿 목록 결과
 */
function getTemplatesFromFolder() {
  try {
    console.log('📄 템플릿 폴더에서 파일 목록 가져오기 시작');
    
    // hot_potato/문서/양식 폴더 찾기
    const folder = findOrCreateFolder('hot_potato/문서/양식');
    console.log('📄 폴더 찾기 결과:', folder);
    
    if (!folder || !folder.success) {
      const errorMessage = folder ? folder.message : '폴더 찾기 함수가 null을 반환했습니다';
      console.error('📄 폴더 찾기 실패:', errorMessage);
      return {
        success: false,
        message: '템플릿 폴더를 찾을 수 없습니다: ' + errorMessage
      };
    }
    
    // 폴더 내의 Google Docs 파일들 가져오기
    const files = Drive.Files.list({
      q: `'${folder.data.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'items(id,title,description,modifiedDate,owners)',
      orderBy: 'title'
    });
    
    if (!files.items || files.items.length === 0) {
      console.log('📄 템플릿 폴더에 문서가 없습니다');
      return {
        success: true,
        data: [],
        message: '템플릿 폴더에 문서가 없습니다'
      };
    }
    
    // 템플릿 정보 파싱
    const templates = files.items.map(file => {
      // 파일 제목에서 태그 추출 (예: "회의 / 회의록 / 회의 내용을 기록하는 템플릿" -> "회의")
      const titleParts = file.title.split(' / ');
      const tag = titleParts.length > 1 ? titleParts[0] : '기본';
      const displayTitle = titleParts.length > 1 ? titleParts[1] : file.title;
      const description = titleParts.length > 2 ? titleParts[2] : (file.description || '템플릿 파일');
      
      return {
        id: file.id,
        type: file.id, // documentId를 type으로 사용
        title: displayTitle,
        description: description,
        tag: tag,
        fullTitle: file.title,
        modifiedDate: file.modifiedDate,
        owner: file.owners && file.owners.length > 0 ? file.owners[0].displayName : 'Unknown'
      };
    });
    
    console.log('📄 템플릿 목록 가져오기 성공:', templates.length, '개');
    
    return {
      success: true,
      data: templates,
      message: `${templates.length}개의 템플릿을 찾았습니다`
    };
    
  } catch (error) {
    console.error('📄 템플릿 목록 가져오기 오류:', error);
    return {
      success: false,
      message: '템플릿 목록을 가져오는 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 이메일/연락처 암복호화 함수들 =====
// Encryption.gs의 encryptEmailMain, decryptEmailMain 함수를 사용합니다.

