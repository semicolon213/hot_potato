/**
 * ComprehensiveVerification.gs
 * 종합 검증 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 종합 검증 함수들 =====

/**
 * 종합 검증 실행
 * @returns {Object} 종합 검증 결과
 */
function runCompleteVerification() {
  console.log('=== 종합 검증 시작 ===');
  
  const migrationResults = MigrationVerification.verifyMigration();
  const optimizationResults = OptimizationVerification.verifyOptimization();
  
  const overallSuccess = migrationResults.success && optimizationResults.success;
  
  console.log('=== 종합 검증 완료 ===');
  console.log('마이그레이션 성공:', migrationResults.success ? '✅' : '❌');
  console.log('최적화 완료:', optimizationResults.success ? '✅' : '❌');
  console.log('전체 성공:', overallSuccess ? '✅' : '❌');
  
  return {
    success: overallSuccess,
    migration: migrationResults,
    optimization: optimizationResults,
    message: overallSuccess ? '마이그레이션과 최적화가 모두 성공적으로 완료되었습니다' : '일부 검증이 실패했습니다'
  };
}

/**
 * 시스템 상태 종합 확인
 * @returns {Object} 시스템 상태 확인 결과
 */
function checkSystemStatus() {
  console.log('=== 시스템 상태 종합 확인 시작 ===');
  
  try {
    const results = {
      // 기본 시스템 상태
      basicSystem: checkBasicSystemStatus(),
      
      // 암호화 시스템 상태
      encryptionSystem: checkEncryptionSystemStatus(),
      
      // 스프레드시트 시스템 상태
      spreadsheetSystem: checkSpreadsheetSystemStatus(),
      
      // 사용자 관리 시스템 상태
      userManagementSystem: checkUserManagementSystemStatus(),
      
      // 문서 관리 시스템 상태
      documentManagementSystem: checkDocumentManagementSystemStatus(),
      
      // 테스트 시스템 상태
      testSystem: checkTestSystemStatus()
    };
    
    const allSystemsHealthy = Object.values(results).every(result => result.success);
    
    console.log('=== 시스템 상태 종합 확인 완료 ===');
    console.log('전체 시스템 상태:', allSystemsHealthy ? '✅ 정상' : '❌ 문제 있음');
    
    return {
      success: allSystemsHealthy,
      results: results,
      message: allSystemsHealthy ? '모든 시스템이 정상 작동합니다' : '일부 시스템에 문제가 있습니다'
    };
    
  } catch (error) {
    console.error('❌ 시스템 상태 종합 확인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '시스템 상태 종합 확인 중 오류 발생'
    };
  }
}

/**
 * 기본 시스템 상태 확인
 * @returns {Object} 기본 시스템 상태 확인 결과
 */
function checkBasicSystemStatus() {
  try {
    console.log('기본 시스템 상태 확인 중...');
    
    // CONFIG.gs 확인
    const configLoaded = typeof CONFIG !== 'undefined' && typeof CONFIG.getDocumentFolderPath === 'function';
    
    // Main.gs 확인
    const mainLoaded = typeof doPost === 'function' && typeof doGet === 'function';
    
    // TimeUtils.gs 확인
    const timeUtilsLoaded = typeof TimeUtils.getKSTTime === 'function';
    
    const allBasicLoaded = configLoaded && mainLoaded && timeUtilsLoaded;
    
    return {
      success: allBasicLoaded,
      configLoaded: configLoaded,
      mainLoaded: mainLoaded,
      timeUtilsLoaded: timeUtilsLoaded,
      message: allBasicLoaded ? '기본 시스템이 정상 로드되었습니다' : '기본 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '기본 시스템 상태 확인 중 오류 발생'
    };
  }
}

/**
 * 암호화 시스템 상태 확인
 * @returns {Object} 암호화 시스템 상태 확인 결과
 */
function checkEncryptionSystemStatus() {
  try {
    console.log('암호화 시스템 상태 확인 중...');
    
    // EncryptionCore.gs 확인
    const encryptionCoreLoaded = typeof applyEncryption === 'function' && 
                                 typeof applyDecryption === 'function';
    
    // EncryptionKeyManagement.gs 확인
    const keyManagementLoaded = typeof EncryptionKeyManagement.generateExtendedMultiLayerKey === 'function';
    
    // EncryptionEmail.gs 확인
    const emailEncryptionLoaded = typeof EncryptionEmail.encryptEmailMain === 'function' && 
                                  typeof EncryptionEmail.decryptEmailMain === 'function';
    
    const allEncryptionLoaded = encryptionCoreLoaded && keyManagementLoaded && emailEncryptionLoaded;
    
    return {
      success: allEncryptionLoaded,
      encryptionCoreLoaded: encryptionCoreLoaded,
      keyManagementLoaded: keyManagementLoaded,
      emailEncryptionLoaded: emailEncryptionLoaded,
      message: allEncryptionLoaded ? '암호화 시스템이 정상 로드되었습니다' : '암호화 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '암호화 시스템 상태 확인 중 오류 발생'
    };
  }
}

/**
 * 스프레드시트 시스템 상태 확인
 * @returns {Object} 스프레드시트 시스템 상태 확인 결과
 */
function checkSpreadsheetSystemStatus() {
  try {
    console.log('스프레드시트 시스템 상태 확인 중...');
    
    // SpreadsheetCore.gs 확인
    const spreadsheetCoreLoaded = typeof SpreadsheetCore.getHpMemberSpreadsheet === 'function' && 
                                  typeof SpreadsheetCore.getSheetData === 'function';
    
    // SpreadsheetCache.gs 확인
    const spreadsheetCacheLoaded = typeof SpreadsheetCache.getCachedData === 'function' && 
                                   typeof SpreadsheetCache.setCachedData === 'function';
    
    // SpreadsheetUtils.gs 확인
    const spreadsheetUtilsLoaded = typeof SpreadsheetUtils.getSpreadsheetId === 'function';
    
    const allSpreadsheetLoaded = spreadsheetCoreLoaded && spreadsheetCacheLoaded && spreadsheetUtilsLoaded;
    
    return {
      success: allSpreadsheetLoaded,
      spreadsheetCoreLoaded: spreadsheetCoreLoaded,
      spreadsheetCacheLoaded: spreadsheetCacheLoaded,
      spreadsheetUtilsLoaded: spreadsheetUtilsLoaded,
      message: allSpreadsheetLoaded ? '스프레드시트 시스템이 정상 로드되었습니다' : '스프레드시트 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 시스템 상태 확인 중 오류 발생'
    };
  }
}

/**
 * 사용자 관리 시스템 상태 확인
 * @returns {Object} 사용자 관리 시스템 상태 확인 결과
 */
function checkUserManagementSystemStatus() {
  try {
    console.log('사용자 관리 시스템 상태 확인 중...');
    
    // UserAuth.gs 확인
    const userAuthLoaded = typeof UserAuth.handleCheckUserStatus === 'function' && 
                           typeof UserAuth.handleLogin === 'function';
    
    // UserApproval.gs 확인
    const userApprovalLoaded = typeof UserApproval.handleGetPendingUsers === 'function' && 
                               typeof UserApproval.handleApproveUser === 'function';
    
    // UserRegistration.gs 확인
    const userRegistrationLoaded = typeof UserRegistration.handleSubmitRegistrationRequest === 'function' && 
                                   typeof UserRegistration.handleCheckApprovalStatus === 'function';
    
    const allUserManagementLoaded = userAuthLoaded && userApprovalLoaded && userRegistrationLoaded;
    
    return {
      success: allUserManagementLoaded,
      userAuthLoaded: userAuthLoaded,
      userApprovalLoaded: userApprovalLoaded,
      userRegistrationLoaded: userRegistrationLoaded,
      message: allUserManagementLoaded ? '사용자 관리 시스템이 정상 로드되었습니다' : '사용자 관리 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '사용자 관리 시스템 상태 확인 중 오류 발생'
    };
  }
}

/**
 * 문서 관리 시스템 상태 확인
 * @returns {Object} 문서 관리 시스템 상태 확인 결과
 */
function checkDocumentManagementSystemStatus() {
  try {
    console.log('문서 관리 시스템 상태 확인 중...');
    
    // DocumentCreation.gs 확인
    const documentCreationLoaded = typeof DocumentCreation.createGoogleDocument === 'function';
    
    // DocumentPermissions.gs 확인
    const documentPermissionsLoaded = typeof DocumentPermissions.setDocumentPermissions === 'function';
    
    // DocumentFolder.gs 확인
    const documentFolderLoaded = typeof DocumentFolder.moveDocumentToFolder === 'function';
    
    // DocumentSpreadsheet.gs 확인
    const documentSpreadsheetLoaded = typeof DocumentSpreadsheet.addDocumentToSpreadsheet === 'function';
    
    // DocumentTemplates.gs 확인
    const documentTemplatesLoaded = typeof DocumentTemplates.getTemplatesFromFolder === 'function';
    
    const allDocumentManagementLoaded = documentCreationLoaded && documentPermissionsLoaded && 
                                       documentFolderLoaded && documentSpreadsheetLoaded && documentTemplatesLoaded;
    
    return {
      success: allDocumentManagementLoaded,
      documentCreationLoaded: documentCreationLoaded,
      documentPermissionsLoaded: documentPermissionsLoaded,
      documentFolderLoaded: documentFolderLoaded,
      documentSpreadsheetLoaded: documentSpreadsheetLoaded,
      documentTemplatesLoaded: documentTemplatesLoaded,
      message: allDocumentManagementLoaded ? '문서 관리 시스템이 정상 로드되었습니다' : '문서 관리 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '문서 관리 시스템 상태 확인 중 오류 발생'
    };
  }
}

/**
 * 테스트 시스템 상태 확인
 * @returns {Object} 테스트 시스템 상태 확인 결과
 */
function checkTestSystemStatus() {
  try {
    console.log('테스트 시스템 상태 확인 중...');
    
    // TestBasic.gs 확인
    const testBasicLoaded = typeof TestBasic.runSimpleTest === 'function' && 
                            typeof TestBasic.runAllBasicTests === 'function';
    
    // TestSpreadsheet.gs 확인
    const testSpreadsheetLoaded = typeof TestSpreadsheet.runAllSpreadsheetTests === 'function';
    
    // TestUserManagement.gs 확인
    const testUserManagementLoaded = typeof TestUserManagement.runAllUserManagementTests === 'function';
    
    // TestDocumentManagement.gs 확인
    const testDocumentManagementLoaded = typeof TestDocumentManagement.runAllDocumentManagementTests === 'function';
    
    const allTestLoaded = testBasicLoaded && testSpreadsheetLoaded && 
                          testUserManagementLoaded && testDocumentManagementLoaded;
    
    return {
      success: allTestLoaded,
      testBasicLoaded: testBasicLoaded,
      testSpreadsheetLoaded: testSpreadsheetLoaded,
      testUserManagementLoaded: testUserManagementLoaded,
      testDocumentManagementLoaded: testDocumentManagementLoaded,
      message: allTestLoaded ? '테스트 시스템이 정상 로드되었습니다' : '테스트 시스템 로드에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '테스트 시스템 상태 확인 중 오류 발생'
    };
  }
}

// ===== 배포 정보 =====
function getComprehensiveVerificationInfo() {
  return {
    version: '1.0.0',
    description: '종합 검증 함수들',
    functions: [
      'runCompleteVerification',
      'checkSystemStatus',
      'checkBasicSystemStatus',
      'checkEncryptionSystemStatus',
      'checkSpreadsheetSystemStatus',
      'checkUserManagementSystemStatus',
      'checkDocumentManagementSystemStatus',
      'checkTestSystemStatus'
    ],
    dependencies: [
      'MigrationVerification.gs',
      'OptimizationVerification.gs',
      'CONFIG.gs',
      'Main.gs',
      'TimeUtils.gs',
      'EncryptionCore.gs',
      'EncryptionKeyManagement.gs',
      'EncryptionEmail.gs',
      'SpreadsheetCore.gs',
      'SpreadsheetCache.gs',
      'SpreadsheetUtils.gs',
      'UserAuth.gs',
      'UserApproval.gs',
      'UserRegistration.gs',
      'GroupManagement.gs',
      'DocumentCreation.gs',
      'DocumentPermissions.gs',
      'DocumentFolder.gs',
      'DocumentSpreadsheet.gs',
      'DocumentTemplates.gs',
      'TestBasic.gs',
      'TestSpreadsheet.gs',
      'TestUserManagement.gs',
      'TestDocumentManagement.gs'
    ]
  };
}
