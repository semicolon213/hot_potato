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
      const result = handleCreateDocument(req);
      console.log('📄 문서 생성 결과:', result);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
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
      'handleDeleteDocuments' // DocumentManagement.gs에서 정의
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

// ===== 이메일/연락처 암복호화 함수들 =====
// Encryption.gs의 encryptEmailMain, decryptEmailMain 함수를 사용합니다.

