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
    
    // 암복호화 액션 처리
    if (req.action === 'encryptEmail') {
      console.log('🔐 암호화 요청 받음:', req.data);
        const encrypted = EncryptionEmail.encryptEmailMain(req.data);
      console.log('🔐 암호화 결과:', encrypted);
      const response = {
        success: true, 
        data: encrypted,
        debug: {
          original: req.data,
          encrypted: encrypted,
          source: 'Encryption.gs encryptEmailMain',
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
        const decrypted = EncryptionEmail.decryptEmailMain(req.data);
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
        const document = DocumentCreation.createGoogleDocument(title, templateType);
        if (!document.success) {
          return ContentService
            .createTextOutput(JSON.stringify(document))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        const documentId = document.data.id;
        const documentUrl = document.data.webViewLink;
        
        // 문서 권한 설정
        const permissionResult = DocumentPermissions.setDocumentPermissions(documentId, creatorEmail, editors || []);
        if (!permissionResult.success) {
          return ContentService
            .createTextOutput(JSON.stringify(permissionResult))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        // hot potato/문서 폴더에 문서 이동
        const moveResult = DocumentFolder.moveDocumentToFolder(documentId);
        if (!moveResult.success) {
          console.warn('문서 폴더 이동 실패:', moveResult.message);
        }
        
        // 문서 정보를 스프레드시트에 추가
        const spreadsheetResult = DocumentSpreadsheet.addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role);
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
      const result = DocumentSpreadsheet.handleGetDocuments(req);
      console.log('📄 문서 목록 조회 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 문서 삭제 액션 처리
    if (req.action === 'deleteDocuments') {
      console.log('🗑️ 문서 삭제 요청 받음:', req);
      const result = DocumentSpreadsheet.handleDeleteDocuments(req);
      console.log('🗑️ 문서 삭제 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 템플릿 목록 조회 액션 처리
    if (req.action === 'getTemplates') {
      console.log('📄 템플릿 목록 조회 요청 받음:', req);
      
      // Drive API 확인
      if (typeof Drive === 'undefined') {
        console.error('📄 Drive API가 정의되지 않았습니다');
        const errorResult = {
          success: false,
          message: 'Drive API가 활성화되지 않았습니다. Google Apps Script에서 Drive API를 활성화해주세요.',
          debugInfo: ['❌ Drive API가 정의되지 않았습니다']
        };
        return ContentService
          .createTextOutput(JSON.stringify(errorResult))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const result = DocumentTemplates.getTemplatesFromFolder();
      console.log('📄 템플릿 목록 조회 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Drive API 연결 테스트 액션 처리
    if (req.action === 'testDriveApi') {
      console.log('🔧 Drive API 테스트 요청 받음:', req);
      const result = DocumentTests.testDriveApiConnection();
      console.log('🔧 Drive API 테스트 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 템플릿 폴더 디버깅 테스트 액션 처리
    if (req.action === 'testTemplateFolderDebug') {
      console.log('🔍 템플릿 폴더 디버깅 테스트 요청 받음:', req);
      const result = DocumentTemplates.testTemplateFolderDebug();
      console.log('🔍 템플릿 폴더 디버깅 테스트 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 특정 폴더 ID 테스트 액션 처리
    if (req.action === 'testSpecificFolder') {
      console.log('🔍 특정 폴더 ID 테스트 요청 받음:', req);
      const result = DocumentTemplates.testSpecificFolder();
      console.log('🔍 특정 폴더 ID 테스트 결과:', result);
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

// ===== 테스트 함수들 (Encryption.gs에서 제공) =====

// ===== 배포 정보 =====
function getDeploymentInfo() {
  return {
    version: '1.16.0',
    description: '메인 엔트리 포인트 - 요청 라우팅 및 함수 호출만 담당',
    functions: [
      'doPost',
      'doGet', 
      'parseRequest',
      'callUserManagementPost',
      'callUserManagementGet',
      'testMain',
      'verifyAdminKeyData'
    ],
  dependencies: [
    'UserAuth.gs',
    'UserApproval.gs',
    'UserRegistration.gs',
    'SpreadsheetCore.gs',
    'SpreadsheetCache.gs',
    'SpreadsheetUtils.gs',
    'EncryptionCore.gs',
    'EncryptionAlgorithms.gs',
    'EncryptionKeyManagement.gs',
    'EncryptionEmail.gs',
    'CONFIG.gs',
    'KeyVerification.gs',
    'KeyGeneration.gs',
    'TimeUtils.gs',
    'DocumentCreation.gs',
    'DocumentPermissions.gs',
    'DocumentFolder.gs',
    'DocumentSpreadsheet.gs',
    'DocumentTemplates.gs',
    'DocumentTests.gs',
    'TestBasic.gs',
    'TestSpreadsheet.gs',
    'TestUserManagement.gs',
    'TestDocumentManagement.gs',
    'MigrationVerification.gs',
    'OptimizationVerification.gs',
    'ComprehensiveVerification.gs'
  ],
    notes: [
      '문서 생성: DocumentCreation.gs에서 처리',
      '문서 권한: DocumentPermissions.gs에서 처리',
      '폴더 관리: DocumentFolder.gs에서 처리',
      '스프레드시트: DocumentSpreadsheet.gs에서 처리',
      '템플릿 관리: DocumentTemplates.gs에서 처리',
      '테스트: DocumentTests.gs에서 처리',
      '암호화 핵심: EncryptionCore.gs에서 처리',
      '암호화 알고리즘: EncryptionAlgorithms.gs에서 처리',
      '암호화 키 관리: EncryptionKeyManagement.gs에서 처리',
      '이메일 암호화: EncryptionEmail.gs에서 처리',
      '사용자 인증: UserAuth.gs에서 처리',
      '사용자 승인: UserApproval.gs에서 처리',
      '사용자 등록: UserRegistration.gs에서 처리',
      '스프레드시트 핵심: SpreadsheetCore.gs에서 처리',
      '스프레드시트 캐시: SpreadsheetCache.gs에서 처리',
      '스프레드시트 유틸: SpreadsheetUtils.gs에서 처리',
      '키 검증: KeyVerification.gs에서 처리',
      '키 생성: KeyGeneration.gs에서 처리',
      '시간 유틸: TimeUtils.gs에서 처리',
      '설정: CONFIG.gs에서 관리',
      '기본 테스트: TestBasic.gs에서 처리',
      '스프레드시트 테스트: TestSpreadsheet.gs에서 처리',
      '사용자 관리 테스트: TestUserManagement.gs에서 처리',
      '문서 관리 테스트: TestDocumentManagement.gs에서 처리',
      '마이그레이션 검증: MigrationVerification.gs에서 처리',
      '최적화 확인: OptimizationVerification.gs에서 처리',
      '종합 검증: ComprehensiveVerification.gs에서 처리'
    ]
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

// ===== 문서 관리 함수들 (DocumentManagement.gs에서 호출) =====

