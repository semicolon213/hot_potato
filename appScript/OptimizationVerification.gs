/**
 * OptimizationVerification.gs
 * 최적화 확인 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 최적화 확인 함수들 =====

/**
 * 전체 최적화 확인
 * @returns {Object} 최적화 확인 결과
 */
function verifyOptimization() {
  console.log('=== 최적화 확인 시작 ===');
  
  const results = {
    cachingSystem: verifyCachingSystem(),
    configOptimization: verifyConfigOptimization()
  };
  
  const allOptimized = Object.values(results).every(result => result.success);
  
  console.log('=== 최적화 확인 완료 ===');
  console.log('전체 최적화:', allOptimized ? '✅' : '❌');
  
  return {
    success: allOptimized,
    results: results,
    message: allOptimized ? '모든 최적화가 완료되었습니다' : '일부 최적화가 필요합니다'
  };
}

/**
 * 캐싱 시스템 확인
 * @returns {Object} 캐싱 시스템 확인 결과
 */
function verifyCachingSystem() {
  try {
    console.log('캐싱 시스템 확인 중...');
    
    const testData = { test: 'caching verification' };
    const cacheKey = 'test_cache_key';
    
    // 캐시 저장 테스트
    SpreadsheetCache.setCachedData(cacheKey, testData, 60); // 60초 만료
    
    // 캐시 읽기 테스트
    const cachedData = SpreadsheetCache.getCachedData(cacheKey);
    const cacheWorking = cachedData && cachedData.test === testData.test;
    
    // 캐시 무효화 테스트
    SpreadsheetCache.clearCache(cacheKey);
    const cacheInvalidated = !SpreadsheetCache.getCachedData(cacheKey);
    
    return {
      success: cacheWorking && cacheInvalidated,
      cacheWorking: cacheWorking,
      cacheInvalidated: cacheInvalidated,
      message: (cacheWorking && cacheInvalidated) ? '캐싱 시스템이 정상 작동합니다' : '캐싱 시스템에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '캐싱 시스템 확인 중 오류 발생'
    };
  }
}

/**
 * 설정 최적화 확인
 * @returns {Object} 설정 최적화 확인 결과
 */
function verifyConfigOptimization() {
  try {
    console.log('설정 최적화 확인 중...');
    
    // 설정 값들이 제대로 로드되는지 확인
    const documentFolderPath = CONFIG.getDocumentFolderPath();
    const templateFolderPath = CONFIG.getTemplateFolderPath();
    const defaultRole = CONFIG.getDefaultRole();
    const documentStatus = CONFIG.getDocumentStatus();
    
    const configsLoaded = !!(documentFolderPath && templateFolderPath && defaultRole && documentStatus);
    
    // 환경별 설정 확인
    const envConfig = getEnvironmentConfig();
    const envConfigLoaded = !!(envConfig && envConfig.enableLogging !== undefined);
    
    return {
      success: configsLoaded && envConfigLoaded,
      configsLoaded: configsLoaded,
      envConfigLoaded: envConfigLoaded,
      message: (configsLoaded && envConfigLoaded) ? '설정 최적화가 완료되었습니다' : '설정 최적화에 문제가 있습니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '설정 최적화 확인 중 오류 발생'
    };
  }
}

/**
 * 성능 최적화 확인
 * @returns {Object} 성능 최적화 확인 결과
 */
function verifyPerformanceOptimization() {
  try {
    console.log('성능 최적화 확인 중...');
    
    const startTime = new Date().getTime();
    
    // 스프레드시트 데이터 읽기 성능 테스트
    const testIterations = 10;
    let allSuccessful = true;
    
    for (let i = 0; i < testIterations; i++) {
      try {
        const sheetData = SpreadsheetCore.getSheetData('HP_Member');
        if (!sheetData || !Array.isArray(sheetData)) {
          allSuccessful = false;
          break;
        }
      } catch (error) {
        allSuccessful = false;
        break;
      }
    }
    
    const endTime = new Date().getTime();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / testIterations;
    
    // 성능 기준: 평균 100ms 이하
    const performancePassed = avgTime <= 100;
    
    return {
      success: allSuccessful && performancePassed,
      allSuccessful: allSuccessful,
      totalTime: totalTime,
      avgTime: avgTime,
      iterations: testIterations,
      performancePassed: performancePassed,
      message: (allSuccessful && performancePassed) ? '성능 최적화가 완료되었습니다' : '성능 최적화가 필요합니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '성능 최적화 확인 중 오류 발생'
    };
  }
}

/**
 * 메모리 사용량 최적화 확인
 * @returns {Object} 메모리 사용량 최적화 확인 결과
 */
function verifyMemoryOptimization() {
  try {
    console.log('메모리 사용량 최적화 확인 중...');
    
    // 캐시 크기 확인
    const cacheSize = SpreadsheetCache.getCacheSize();
    const maxCacheSize = 1000; // 최대 캐시 크기
    
    // 메모리 사용량이 적절한지 확인
    const memoryOptimized = cacheSize <= maxCacheSize;
    
    return {
      success: memoryOptimized,
      cacheSize: cacheSize,
      maxCacheSize: maxCacheSize,
      memoryOptimized: memoryOptimized,
      message: memoryOptimized ? '메모리 사용량이 최적화되었습니다' : '메모리 사용량 최적화가 필요합니다'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '메모리 사용량 최적화 확인 중 오류 발생'
    };
  }
}

/**
 * 전체 최적화 확인 (확장)
 * @returns {Object} 전체 최적화 확인 결과
 */
function verifyFullOptimization() {
  console.log('=== 전체 최적화 확인 시작 ===');
  
  const results = {
    cachingSystem: verifyCachingSystem(),
    configOptimization: verifyConfigOptimization(),
    performanceOptimization: verifyPerformanceOptimization(),
    memoryOptimization: verifyMemoryOptimization()
  };
  
  const allOptimized = Object.values(results).every(result => result.success);
  
  console.log('=== 전체 최적화 확인 완료 ===');
  console.log('전체 최적화:', allOptimized ? '✅' : '❌');
  
  return {
    success: allOptimized,
    results: results,
    message: allOptimized ? '모든 최적화가 완료되었습니다' : '일부 최적화가 필요합니다'
  };
}

// ===== 배포 정보 =====
function getOptimizationVerificationInfo() {
  return {
    version: '1.0.0',
    description: '최적화 확인 함수들',
    functions: [
      'verifyOptimization',
      'verifyCachingSystem',
      'verifyConfigOptimization',
      'verifyPerformanceOptimization',
      'verifyMemoryOptimization',
      'verifyFullOptimization'
    ],
    dependencies: [
      'SpreadsheetCache.gs',
      'SpreadsheetCore.gs',
      'CONFIG.gs'
    ]
  };
}
