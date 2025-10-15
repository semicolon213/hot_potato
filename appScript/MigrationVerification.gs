/**
 * MigrationVerification.gs
 * 마이그레이션 검증 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 마이그레이션 검증 함수들 =====

/**
 * 전체 마이그레이션 검증
 * @returns {Object} 검증 결과
 */
function verifyMigration() {
  console.log('=== 마이그레이션 검증 시작 ===');
  
  const results = {
    configValidation: verifyConfig(),
    functionAvailability: verifyFunctionAvailability(),
    encryptionTest: verifyEncryptionSystem(),
    spreadsheetConnection: verifySpreadsheetConnection(),
    userManagement: verifyUserManagement(),
    performanceTest: verifyPerformance(),
    errorHandling: verifyErrorHandling()
  };
  
  const allPassed = Object.values(results).every(result => result.success);
  
  console.log('=== 마이그레이션 검증 완료 ===');
  console.log('전체 성공:', allPassed ? '✅' : '❌');
  
  return {
    success: allPassed,
    results: results,
    message: allPassed ? '마이그레이션이 성공적으로 완료되었습니다' : '일부 검증이 실패했습니다'
  };
}

/**
 * 설정 검증
 * @returns {Object} 검증 결과
 */
function verifyConfig() {
  try {
    console.log('설정 검증 중...');
    
    // CONFIG.gs 함수들 확인
    const configFunctions = ['getConfig', 'setSpreadsheetId', 'validateConfig', 'initializeConfig'];
    const missingFunctions = configFunctions.filter(func => typeof eval(func) !== 'function');
    
    if (missingFunctions.length > 0) {
      return {
        success: false,
        error: `누락된 설정 함수들: ${missingFunctions.join(', ')}`,
        message: 'CONFIG.gs 파일이 제대로 로드되지 않았습니다'
      };
    }
    
    // 설정 초기화 테스트
    const initResult = initializeConfig();
    
    return {
      success: initResult,
      message: initResult ? '설정 검증 성공' : '설정 초기화 실패'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '설정 검증 중 오류 발생'
    };
  }
}

/**
 * 함수 가용성 검증
 * @returns {Object} 검증 결과
 */
function verifyFunctionAvailability() {
  try {
    console.log('함수 가용성 검증 중...');
    
    const requiredFunctions = {
      'EncryptionCore.gs': ['applyEncryption', 'applyDecryption'],
      'EncryptionKeyManagement.gs': ['generateExtendedMultiLayerKey'],
      'KeyVerification.gs': ['verifyAdminKey'],
      'KeyGeneration.gs': ['generateAdminKey'],
      'TimeUtils.gs': ['getKSTTime'],
      'SpreadsheetCore.gs': ['getHpMemberSpreadsheet', 'getSheetData'],
      'UserAuth.gs': ['handleCheckUserStatus', 'handleLogin', 'handleLogout'],
      'UserApproval.gs': ['handleGetPendingUsers', 'handleApproveUser', 'handleRejectUser'],
      'UserRegistration.gs': ['handleSubmitRegistrationRequest', 'handleCheckApprovalStatus'],
      'Main.gs': ['doPost', 'doGet', 'executeWithRetry'],
      'TestBasic.gs': ['runSimpleTest', 'runAllBasicTests'],
      'TestSpreadsheet.gs': ['runAllSpreadsheetTests'],
      'TestUserManagement.gs': ['runAllUserManagementTests'],
      'TestDocumentManagement.gs': ['runAllDocumentManagementTests']
    };
    
    const missingFunctions = {};
    let allAvailable = true;
    
    Object.entries(requiredFunctions).forEach(([file, functions]) => {
      const missing = functions.filter(func => typeof eval(func) !== 'function');
      if (missing.length > 0) {
        missingFunctions[file] = missing;
        allAvailable = false;
      }
    });
    
    return {
      success: allAvailable,
      missingFunctions: missingFunctions,
      message: allAvailable ? '모든 필수 함수가 사용 가능합니다' : '일부 함수가 누락되었습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '함수 가용성 검증 중 오류 발생'
    };
  }
}

/**
 * 암호화 시스템 검증
 * @returns {Object} 검증 결과
 */
function verifyEncryptionSystem() {
  try {
    console.log('암호화 시스템 검증 중...');
    
    // 기본 암호화/복호화 테스트
    const testString = 'Migration Test String';
    const methods = ['Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution'];
    
    let allPassed = true;
    const testResults = {};
    
    for (const method of methods) {
      try {
        const encrypted = EncryptionCore.applyEncryption(testString, method, '');
        const decrypted = EncryptionCore.applyDecryption(encrypted, method, '');
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
    
    // 키 생성 테스트
    let keyGenerationTest = false;
    try {
      const { key, layers, originalKey } = EncryptionKeyManagement.generateExtendedMultiLayerKey();
      
      let decryptedKey = key;
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        decryptedKey = EncryptionCore.applyDecryption(decryptedKey, layer, '');
      }
      
      keyGenerationTest = decryptedKey === originalKey;
    } catch (error) {
      console.error('키 생성 테스트 실패:', error);
    }
    
    return {
      success: allPassed && keyGenerationTest,
      encryptionTests: testResults,
      keyGenerationTest: keyGenerationTest,
      message: (allPassed && keyGenerationTest) ? '암호화 시스템이 정상 작동합니다' : '암호화 시스템에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '암호화 시스템 검증 중 오류 발생'
    };
  }
}

/**
 * 스프레드시트 연결 검증
 * @returns {Object} 검증 결과
 */
function verifySpreadsheetConnection() {
  try {
    console.log('스프레드시트 연결 검증 중...');
    
    const spreadsheetId = SpreadsheetCore.getHpMemberSpreadsheetId();
    
    if (!spreadsheetId) {
      return {
        success: false,
        error: '스프레드시트 ID를 찾을 수 없습니다',
        message: '스프레드시트 연결에 문제가 있습니다'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const adminKeysSheet = spreadsheet.getSheetByName('admin_keys');
    const userSheet = spreadsheet.getSheetByName('user');
    
    const sheetsExist = !!(adminKeysSheet && userSheet);
    
    // 데이터 읽기 테스트
    let dataReadTest = false;
    try {
      if (adminKeysSheet) {
        adminKeysSheet.getRange('A1:D2').getValues();
      }
      if (userSheet) {
        userSheet.getRange('A1:Z10').getValues();
      }
      dataReadTest = true;
    } catch (error) {
      console.error('데이터 읽기 테스트 실패:', error);
    }
    
    return {
      success: sheetsExist && dataReadTest,
      spreadsheetId: spreadsheetId,
      adminKeysSheetExists: !!adminKeysSheet,
      userSheetExists: !!userSheet,
      dataReadTest: dataReadTest,
      message: (sheetsExist && dataReadTest) ? '스프레드시트 연결이 정상입니다' : '스프레드시트 연결에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 연결 검증 중 오류 발생'
    };
  }
}

/**
 * 사용자 관리 검증
 * @returns {Object} 검증 결과
 */
function verifyUserManagement() {
  try {
    console.log('사용자 관리 검증 중...');
    
    // 사용자 관리 함수들 테스트
    let userManagementTest = false;
    try {
      // 함수들이 에러 없이 호출되는지 확인
      UserApproval.handleGetPendingUsers();
      userManagementTest = true;
    } catch (error) {
      console.error('사용자 관리 함수 테스트 실패:', error);
    }
    
    return {
      success: userManagementTest,
      userManagementTest: userManagementTest,
      message: userManagementTest ? '사용자 관리 시스템이 정상 작동합니다' : '사용자 관리 시스템에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '사용자 관리 검증 중 오류 발생'
    };
  }
}

/**
 * 성능 검증
 * @returns {Object} 검증 결과
 */
function verifyPerformance() {
  try {
    console.log('성능 검증 중...');
    
    const startTime = new Date().getTime();
    
    // 암호화 성능 테스트
    const testString = 'Performance test string for migration verification';
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      const encrypted = EncryptionCore.applyEncryption(testString, 'Base64', '');
      const decrypted = EncryptionCore.applyDecryption(encrypted, 'Base64', '');
    }
    
    const endTime = new Date().getTime();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    // 성능 기준: 평균 10ms 이하
    const performancePassed = avgTime <= 10;
    
    return {
      success: performancePassed,
      totalTime: totalTime,
      avgTime: avgTime,
      iterations: iterations,
      performancePassed: performancePassed,
      message: performancePassed ? '성능이 기준을 만족합니다' : '성능이 기준을 만족하지 않습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '성능 검증 중 오류 발생'
    };
  }
}

/**
 * 에러 처리 검증
 * @returns {Object} 검증 결과
 */
function verifyErrorHandling() {
  try {
    console.log('에러 처리 검증 중...');
    
    // 잘못된 액션으로 POST 요청 테스트
    const testData = {
      action: 'invalidAction',
      data: {}
    };
    
    let errorHandlingTest = false;
    try {
      // doPost 함수가 에러를 적절히 처리하는지 확인
      const result = doPost({ postData: { contents: JSON.stringify(testData) } });
      errorHandlingTest = true;
    } catch (error) {
      console.error('에러 처리 테스트 실패:', error);
    }
    
    // 재시도 로직 테스트
    let retryTest = false;
    try {
      let attemptCount = 0;
      const result = executeWithRetry(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('테스트 에러');
        }
        return { success: true };
      }, 3);
      retryTest = result.success;
    } catch (error) {
      console.error('재시도 로직 테스트 실패:', error);
    }
    
    return {
      success: errorHandlingTest && retryTest,
      errorHandlingTest: errorHandlingTest,
      retryTest: retryTest,
      message: (errorHandlingTest && retryTest) ? '에러 처리가 정상 작동합니다' : '에러 처리에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '에러 처리 검증 중 오류 발생'
    };
  }
}

// ===== 배포 정보 =====
function getMigrationVerificationInfo() {
  return {
    version: '1.0.0',
    description: '마이그레이션 검증 함수들',
    functions: [
      'verifyMigration',
      'verifyConfig',
      'verifyFunctionAvailability',
      'verifyEncryptionSystem',
      'verifySpreadsheetConnection',
      'verifyUserManagement',
      'verifyPerformance',
      'verifyErrorHandling'
    ],
    dependencies: [
      'EncryptionCore.gs',
      'EncryptionKeyManagement.gs',
      'KeyVerification.gs',
      'KeyGeneration.gs',
      'TimeUtils.gs',
      'SpreadsheetCore.gs',
      'UserAuth.gs',
      'UserApproval.gs',
      'UserRegistration.gs',
      'Main.gs',
      'TestBasic.gs',
      'TestSpreadsheet.gs',
      'TestUserManagement.gs',
      'TestDocumentManagement.gs'
    ]
  };
}