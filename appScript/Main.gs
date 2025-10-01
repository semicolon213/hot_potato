/**
 * Main.gs
 * 메인 함수들과 POST 요청 처리
 * Hot Potato Admin Key Management System
 */

// ===== POST 요청 처리 메인 함수 =====
function doPost(e) {
  try {
    console.log('=== doPost 호출됨 ===');
    console.log('요청 데이터:', e);
    
    // CORS preflight 요청 처리
    if (e.parameter && e.parameter.method === 'OPTIONS') {
      return createResponse(200, {
        success: true,
        message: 'CORS preflight request handled'
      });
    }
    
    // 요청 데이터 파싱
    let requestData = {};
    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        return createResponse(400, {
          success: false,
          error: '잘못된 JSON 형식입니다.'
        });
      }
    }
    
    console.log('파싱된 요청 데이터:', requestData);
    
    // 액션별 라우팅
    const action = requestData.action || requestData.path || '';
    console.log('요청 액션:', action);
    
    // 지원하는 액션 확인
    const supportedActions = getConfig('supported_actions');
    if (action && !supportedActions.includes(action)) {
      return createResponse(400, {
        success: false,
        error: `지원하지 않는 액션입니다: ${action}`,
        supportedActions: supportedActions
      });
    }
    
    let result;
    
    // 재시도 가능한 함수로 실행
    result = executeWithRetry(() => {
      switch (action) {
        case 'getPendingUsers':
          return handleGetPendingUsers();
        
        case 'approveUser':
          return handleApproveUser(requestData.studentId || requestData.id);
        
        case 'rejectUser':
          return handleRejectUser(requestData.studentId || requestData.id);
        
        case 'verifyAdminKey':
          return verifyAdminKey(requestData.adminKey);
        
        case 'sendAdminKeyEmail':
          return handleSendAdminKeyEmail(requestData.userEmail);
        
        case 'submitRegistrationRequest':
          return handleSubmitRegistrationRequest(requestData);
        
        case 'checkApprovalStatus':
          return handleCheckApprovalStatus(requestData.email);
        
        case 'checkRegistrationStatus':
          return handleCheckRegistrationStatus(requestData.email);
        
        case 'migrateEmails':
          return migrateExistingEmails();
        
        case 'testRot13Encryption':
          return testRot13Encryption();
        
        case 'testEmailEncryption':
          return testEmailEncryption();
        
        case 'testDecryption':
          return { success: true, decryptedKey: testDecryption() };
        
        case 'testEncryption':
          return testEncryptionDecryptionFunctions();
        
        case 'testAdminKey':
          return testAdminKeyGeneration();
        
        case 'testSpreadsheetIntegration':
          return testSpreadsheetIntegration();
        
        case 'testUserManagement':
          return testUserManagement();
        
        case 'testEmailSending':
          return testEmailSending();
        
        case 'testConfigManagement':
          return testConfigManagement();
        
        case 'testAPIEndpoints':
          return testAPIEndpoints();
        
        case 'testAllAppScript':
          return runAllAppScriptTests();
        
        default:
          // 기본: 관리자 키 자동 갱신
          return handleDailyKeyUpdate();
      }
    });
    
    console.log('처리 결과:', result);
    return createResponse(200, result);
    
  } catch (error) {
    console.error('doPost 오류:', error);
    return createResponse(500, {
      success: false,
      error: error.message
    });
  }
}

// ===== GET 요청 처리 함수 (정보 제공) =====
function doGet(e) {
  try {
    console.log('=== doGet 정보 제공 호출됨 ===');
    
    // 간단한 시스템 정보 제공
    const systemInfo = {
      success: true,
      message: 'Hot Potato Admin Key Management System',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      info: {
        type: 'Google Apps Script',
        method: 'POST only',
        description: '관리자 키 관리 및 사용자 관리 시스템'
      },
      endpoints: {
        method: 'POST',
        actions: getConfig('supported_actions') || [],
        note: '모든 기능은 POST 요청으로 사용하세요'
      }
    };
    
    return createResponse(200, systemInfo);
    
  } catch (error) {
    console.error('doGet 정보 제공 오류:', error);
    return createResponse(500, {
      success: false,
      message: 'Hot Potato Admin Key Management System',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}


// ===== 응답 생성 함수 =====
function createResponse(statusCode, data) {
  const response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // CORS 헤더 설정
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '3600'
  });
  
  return response;
}

// ===== 재시도 로직 =====
// 재시도 가능한 함수 실행
function executeWithRetry(func, maxAttempts = null) {
  const attempts = maxAttempts || getConfig('max_retry_attempts');
  let lastError;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return func();
    } catch (error) {
      lastError = error;
      console.warn(`시도 ${i + 1}/${attempts} 실패:`, error.message);
      
      if (i < attempts - 1) {
        // 마지막 시도가 아니면 잠시 대기
        Utilities.sleep(1000 * (i + 1)); // 지수적 백오프
      }
    }
  }
  
  throw lastError;
}

// ===== 관리자 키 검증 핸들러 =====
function handleVerifyAdminKey(adminKey) {
  try {
    if (!adminKey) {
      throw new Error('관리자 키를 입력해주세요');
    }
    
    const result = verifyAdminKey(adminKey);
    
    return {
      success: true,
      ...result
    };
    
  } catch (error) {
    console.error('키 검증 실패:', error);
    throw error;
  }
}

// ===== 관리자 키 이메일 전송 핸들러 =====
function handleSendAdminKeyEmail(userEmail) {
  try {
    console.log('=== handleSendAdminKeyEmail 호출됨 ===');
    console.log('사용자 이메일:', userEmail);
    
    if (!userEmail) {
      throw new Error('사용자 이메일을 입력해주세요');
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error('올바른 이메일 형식을 입력해주세요');
    }
    
    // 관리자 키 조회
    console.log('관리자 키 조회 시작...');
    const keyResult = getDecryptedAdminKey();
    
    if (!keyResult.success) {
      throw new Error('관리자 키 조회에 실패했습니다');
    }
    
    const decryptedKey = keyResult.adminKey;
    const encryptedKey = keyResult.encryptedKey;
    const layersUsed = keyResult.layersUsed;
    
    console.log('관리자 키 조회 성공');
    console.log('복호화된 키:', decryptedKey.substring(0, 20) + '...');
    
    // 이메일 템플릿 생성
    let emailTemplate;
    try {
      emailTemplate = generateEmailTemplate(userEmail, decryptedKey);
      console.log('이메일 템플릿 생성 완료');
    } catch (templateError) {
      console.error('이메일 템플릿 생성 실패:', templateError);
      throw new Error('이메일 템플릿 생성에 실패했습니다: ' + templateError.message);
    }
    
    // 복호화된 키와 이메일 템플릿을 반환
    return {
      success: true,
      message: '관리자 키를 성공적으로 조회했습니다',
      userEmail,
      adminKey: decryptedKey,
      encryptedKey: encryptedKey,
      layersUsed: layersUsed,
      emailTemplate: emailTemplate
    };
    
  } catch (error) {
    console.error('관리자 키 조회 실패:', error);
    throw error;
  }
}

// ===== 테스트 함수들 =====
// 전체 시스템 테스트
function runSystemTest() {
  try {
    console.log('=== 시스템 테스트 시작 ===');
    
    const results = {
      encryption: testEncryptionMethods(),
      keyGeneration: testKeyGeneration(),
      spreadsheet: testSpreadsheetConnection(),
      userManagement: testUserManagement()
    };
    
    const allPassed = Object.values(results).every(result => result.success);
    
    console.log('=== 시스템 테스트 완료 ===');
    console.log('전체 결과:', allPassed ? '성공' : '실패');
    console.log('세부 결과:', results);
    
    return {
      success: allPassed,
      results: results,
      message: allPassed ? '모든 테스트가 성공했습니다' : '일부 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('시스템 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '시스템 테스트 중 오류가 발생했습니다'
    };
  }
}

// 암호화 방법 테스트
function testEncryptionMethods() {
  try {
    const testString = 'Hello World! 안녕하세요!';
    const testMethods = [
      'Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution', 
      'Padding', 'MultiEncode', 'RandomInsert', 
      'Transposition', 'Reverse', 'Atbash', 'Vigenere', 'RailFence', 
      'Columnar', 'Affine', 'Permutation', 'Pattern', 'Mirror', 
      'Zigzag', 'Wave', 'Snake'
    ];
    
    let allPassed = true;
    const testResults = {};
    
    for (const method of testMethods) {
      try {
        const encrypted = applyEncryption(testString, method, '');
        const decrypted = applyDecryption(encrypted, method, '');
        const isReversible = decrypted === testString;
        
        testResults[method] = {
          success: isReversible,
          original: testString,
          encrypted: encrypted,
          decrypted: decrypted
        };
        
        if (!isReversible) {
          allPassed = false;
        }
      } catch (error) {
        testResults[method] = {
          success: false,
          error: error.message
        };
        allPassed = false;
      }
    }
    
    return {
      success: allPassed,
      testResults: testResults,
      message: allPassed ? '모든 암호화 방법이 정상 작동합니다' : '일부 암호화 방법에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '암호화 테스트 중 오류가 발생했습니다'
    };
  }
}

// 키 생성 테스트
function testKeyGeneration() {
  try {
    const { key, layers, originalKey } = generateExtendedMultiLayerKey();
    
    // 복호화 테스트
    let decryptedKey = key;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i].trim();
      decryptedKey = applyDecryption(decryptedKey, layer, '');
    }
    
    const isReversible = decryptedKey === originalKey;
    
    return {
      success: isReversible,
      originalKey: originalKey,
      encryptedKey: key.substring(0, 50) + '...',
      layers: layers,
      decryptedKey: decryptedKey,
      message: isReversible ? '키 생성 및 복호화가 정상 작동합니다' : '키 복호화에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '키 생성 테스트 중 오류가 발생했습니다'
    };
  }
}

// 스프레드시트 연결 테스트
function testSpreadsheetConnection() {
  try {
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    
    // admin_keys 시트 확인
    const adminKeysSheet = spreadsheet.getSheetByName('admin_keys');
    const userSheet = spreadsheet.getSheetByName('user');
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      adminKeysSheetExists: !!adminKeysSheet,
      userSheetExists: !!userSheet,
      message: '스프레드시트 연결이 정상입니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 연결에 문제가 있습니다'
    };
  }
}

// 사용자 관리 테스트
function testUserManagement() {
  try {
    // ROT13 암호화/복호화 테스트
    const rot13Test = testRot13Encryption();
    
    return {
      success: rot13Test.allTestsPassed,
      rot13Test: rot13Test,
      message: rot13Test.allTestsPassed ? '사용자 관리 기능이 정상 작동합니다' : '사용자 관리 기능에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '사용자 관리 테스트 중 오류가 발생했습니다'
    };
  }
}

// ===== 유틸리티 함수들 =====
// 로그 출력 함수
function logInfo(message, data = null) {
  console.log(`[INFO] ${message}`, data || '');
}

function logError(message, error = null) {
  console.error(`[ERROR] ${message}`, error || '');
}

function logWarning(message, data = null) {
  console.warn(`[WARNING] ${message}`, data || '');
}

// 에러 처리 함수
function handleError(error, context = '') {
  const errorMessage = `[${context}] ${error.message}`;
  logError(errorMessage, error);
  
  return {
    success: false,
    error: error.message,
    context: context,
    timestamp: new Date().toISOString()
  };
}

// 성공 응답 생성 함수
function createSuccessResponse(data = {}, message = '성공') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
}

// 실패 응답 생성 함수
function createErrorResponse(error, message = '실패') {
  return {
    success: false,
    message: message,
    error: error.message || error,
    timestamp: new Date().toISOString()
  };
}
