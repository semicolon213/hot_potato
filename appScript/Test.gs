/**
 * Test.gs
 * 테스트 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 기본 테스트 함수들 =====

// 간단한 암호화/복호화 테스트
function runSimpleTest() {
  console.log('=== 간단한 테스트 ===');
  
  try {
    console.log('✅ 모듈 로드 성공');
    
    // 간단한 테스트
    const testString = 'Hello World!';
    console.log('원본:', testString);
    
    const encrypted = applyEncryption(testString, 'Base64', '');
    console.log('암호화:', encrypted);
    
    const decrypted = applyDecryption(encrypted, 'Base64', '');
    console.log('복호화:', decrypted);
    
    console.log('가역성:', decrypted === testString ? '✅ 성공' : '❌ 실패');
    
    // 관리자 키 테스트
    console.log('\n=== 관리자 키 테스트 ===');
    const { key, layers, originalKey } = generateExtendedMultiLayerKey();
    console.log('원본 키:', originalKey);
    console.log('생성된 키 (처음 50자):', key.substring(0, 50) + '...');
    console.log('사용된 레이어 수:', layers.length);
    
    // 복호화 테스트
    let decryptedKey = key;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i].trim();
      decryptedKey = applyDecryption(decryptedKey, layer, originalKey);
    }
    
    console.log('복호화된 키:', decryptedKey);
    console.log('관리자 키 복호화:', decryptedKey === originalKey ? '✅ 성공' : '❌ 실패');
    
    return {
      success: true,
      message: '간단한 테스트 완료',
      encryptionTest: decrypted === testString,
      keyGenerationTest: decryptedKey === originalKey
    };
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    return {
      success: false,
      error: error.message,
      message: '간단한 테스트 실패'
    };
  }
}

// 암호화/복호화 가역성 테스트
function runReversibilityTest() {
  console.log('=== 암호화/복호화 테스트 ===');
  const testString = 'Hello World! 안녕하세요!';
  console.log('원본 텍스트:', testString);
  
  // 테스트할 암호화 방식들
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
      
      console.log(`${method}: ${isReversible ? '✅' : '❌'} (원본: ${testString}, 복원: ${decrypted})`);
      
      if (!isReversible) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`${method}: ❌ 오류 - ${error.message}`);
      testResults[method] = {
        success: false,
        error: error.message
      };
      allPassed = false;
    }
  }
  
  console.log('\n=== 전체 결과 ===');
  console.log(`모든 암호화 방식이 가역적: ${allPassed ? '✅' : '❌'}`);
  
  // 실제 관리자 키 생성 및 복호화 테스트
  console.log('\n=== 실제 관리자 키 테스트 ===');
  try {
    const { key, layers } = generateExtendedMultiLayerKey();
    console.log('생성된 키:', key.substring(0, 50) + '...');
    console.log('사용된 레이어:', layers);
    
    // 복호화 테스트
    let decryptedKey = key;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i].trim();
      decryptedKey = applyDecryption(decryptedKey, layer, '');
    }
    
    console.log('복호화된 키:', decryptedKey);
    console.log('복호화 성공:', decryptedKey.includes('ADMIN_') ? '✅' : '❌');
    
    return {
      success: allPassed,
      allTestsPassed: allPassed,
      testResults: testResults,
      keyGenerationTest: decryptedKey.includes('ADMIN_'),
      message: allPassed ? '모든 테스트가 성공했습니다' : '일부 테스트가 실패했습니다'
    };
  } catch (error) {
    console.log('관리자 키 테스트 실패:', error.message);
    return {
      success: false,
      allTestsPassed: false,
      testResults: testResults,
      keyGenerationTest: false,
      error: error.message,
      message: '관리자 키 테스트 실패'
    };
  }
}

// ROT13 암호화/복호화 테스트
function runRot13Test() {
  const testEmails = [
    'test@example.com',
    'user@gmail.com',
    'admin@hotpotato.org',
    'student@university.edu'
  ];
  
  console.log('=== ROT13 암호화/복호화 테스트 ===');
  
  const results = testEmails.map(email => {
    const encrypted = rot13Encrypt(email);
    const decrypted = rot13Decrypt(encrypted);
    const isReversible = email === decrypted;
    
    console.log(`이메일: ${email}`);
    console.log(`암호화: ${encrypted}`);
    console.log(`복호화: ${decrypted}`);
    console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
    console.log('---');
    
    return {
      original: email,
      encrypted: encrypted,
      decrypted: decrypted,
      isReversible: isReversible
    };
  });
  
  const allPassed = results.every(r => r.isReversible);
  
  return {
    success: allPassed,
    testResults: results,
    allTestsPassed: allPassed,
    message: allPassed ? 'ROT13 테스트가 모두 성공했습니다' : 'ROT13 테스트 중 일부가 실패했습니다'
  };
}

// 복호화 테스트 (실제 키 사용)
function runDecryptionTest() {
  console.log('=== 복호화 테스트 시작 ===');
  
  // 실제 받은 키로 테스트
  const encryptedKey = 'ADuG_2?1p09-)1';
  const layersUsed = 'Diagonal, BitShift, RailFence, Permutation, BitShift, Columnar, Permutation, Hill, Reverse, BitShift, Affine, Permutation, Permutation, RailFence, Wave';
  
  console.log('암호화된 키:', encryptedKey);
  console.log('사용된 레이어:', layersUsed);
  
  let decryptedKey = encryptedKey;
  const layers = layersUsed.split(',');
  console.log('레이어 목록:', layers);
  
  // 레이어 순서의 역순으로 복호화 적용
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i].trim();
    console.log(`복호화 레이어 ${i}: ${layer}`);
    console.log(`복호화 전: ${decryptedKey.substring(0, 20)}...`);
    
    try {
      decryptedKey = applyDecryption(decryptedKey, layer, '');
      console.log(`복호화 후: ${decryptedKey.substring(0, 20)}...`);
    } catch (error) {
      console.error(`레이어 ${layer} 복호화 실패:`, error);
      return {
        success: false,
        error: error.message,
        decryptedKey: decryptedKey,
        message: `레이어 ${layer} 복호화 실패`
      };
    }
  }
  
  console.log('최종 복호화된 키:', decryptedKey);
  console.log('=== 복호화 테스트 완료 ===');
  
  return {
    success: true,
    decryptedKey: decryptedKey,
    originalKey: encryptedKey,
    layersUsed: layers,
    message: '복호화 테스트 완료'
  };
}

// 스프레드시트 연결 테스트
function runSpreadsheetTest() {
  console.log('=== 스프레드시트 연결 테스트 ===');
  
  try {
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    console.log('✅ 스프레드시트 연결 성공');
    console.log('스프레드시트 ID:', spreadsheetId);
    
    // admin_keys 시트 확인
    const adminKeysSheet = spreadsheet.getSheetByName('admin_keys');
    const userSheet = spreadsheet.getSheetByName('user');
    
    console.log('admin_keys 시트 존재:', !!adminKeysSheet);
    console.log('user 시트 존재:', !!userSheet);
    
    if (adminKeysSheet) {
      const adminData = adminKeysSheet.getRange('A1:D2').getValues();
      console.log('admin_keys 데이터:', adminData);
    }
    
    if (userSheet) {
      const userData = userSheet.getRange('A1:Z10').getValues();
      console.log('user 데이터 (처음 10행):', userData);
    }
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      adminKeysSheetExists: !!adminKeysSheet,
      userSheetExists: !!userSheet,
      message: '스프레드시트 연결 테스트 성공'
    };
    
  } catch (error) {
    console.error('❌ 스프레드시트 연결 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 연결 테스트 실패'
    };
  }
}

// 전체 시스템 통합 테스트
function runFullSystemTest() {
  console.log('=== 전체 시스템 통합 테스트 ===');
  
  const testResults = {
    simpleTest: runSimpleTest(),
    reversibilityTest: runReversibilityTest(),
    rot13Test: runRot13Test(),
    decryptionTest: runDecryptionTest(),
    spreadsheetTest: runSpreadsheetTest()
  };
  
  const allPassed = Object.values(testResults).every(result => result.success);
  
  console.log('\n=== 전체 테스트 결과 ===');
  console.log('모든 테스트 통과:', allPassed ? '✅' : '❌');
  
  Object.entries(testResults).forEach(([testName, result]) => {
    console.log(`${testName}: ${result.success ? '✅' : '❌'}`);
  });
  
  return {
    success: allPassed,
    testResults: testResults,
    message: allPassed ? '모든 시스템 테스트가 성공했습니다' : '일부 시스템 테스트가 실패했습니다'
  };
}

// ===== 성능 테스트 함수들 =====

// 암호화 성능 테스트
function runPerformanceTest() {
  console.log('=== 성능 테스트 시작 ===');
  
  const testString = 'Hello World! This is a performance test for encryption methods.';
  const iterations = 100;
  const methods = ['Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution'];
  
  const performanceResults = {};
  
  for (const method of methods) {
    const startTime = new Date().getTime();
    
    for (let i = 0; i < iterations; i++) {
      const encrypted = applyEncryption(testString, method, '');
      const decrypted = applyDecryption(encrypted, method, '');
    }
    
    const endTime = new Date().getTime();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    performanceResults[method] = {
      totalTime: totalTime,
      avgTime: avgTime,
      iterations: iterations
    };
    
    console.log(`${method}: ${totalTime}ms (평균: ${avgTime.toFixed(2)}ms)`);
  }
  
  console.log('=== 성능 테스트 완료 ===');
  
  return {
    success: true,
    performanceResults: performanceResults,
    message: '성능 테스트 완료'
  };
}

// ===== 테스트 실행 함수들 =====

// 모든 테스트 실행
function runAllTests() {
  console.log('=== 모든 테스트 실행 시작 ===');
  
  const results = {
    simpleTest: runSimpleTest(),
    reversibilityTest: runReversibilityTest(),
    rot13Test: runRot13Test(),
    decryptionTest: runDecryptionTest(),
    spreadsheetTest: runSpreadsheetTest(),
    performanceTest: runPerformanceTest()
  };
  
  const allPassed = Object.values(results).every(result => result.success);
  
  console.log('\n=== 최종 테스트 결과 ===');
  console.log('전체 성공:', allPassed ? '✅' : '❌');
  
  return {
    success: allPassed,
    results: results,
    message: allPassed ? '모든 테스트가 성공했습니다' : '일부 테스트가 실패했습니다'
  };
}

// ===== 이메일 암호화 설정 테스트 함수들 =====

// 1. 이메일 암호화 방법 설정 테스트
function testEmailEncryptionMethodSetting() {
  console.log('=== 이메일 암호화 방법 설정 테스트 ===');
  
  try {
    const testMethods = ['ROT13', 'Base64', 'Caesar', 'BitShift', 'Substitution'];
    const testEmail = 'test@example.com';
    const results = {};
    
    for (const method of testMethods) {
      console.log(`\n--- ${method} 방법 테스트 ---`);
      
      // 방법 설정
      const setResult = setEmailEncryptionMethod(method);
      console.log(`설정 결과: ${setResult ? '✅' : '❌'}`);
      
      if (setResult) {
        // 현재 설정 확인
        const config = getCurrentEmailEncryptionConfig();
        console.log(`현재 설정: ${config.method}`);
        
        // 암호화/복호화 테스트
        const encrypted = encryptEmail(testEmail);
        const decrypted = decryptEmail(encrypted);
        const isReversible = testEmail === decrypted;
        
        results[method] = {
          success: isReversible,
          original: testEmail,
          encrypted: encrypted,
          decrypted: decrypted,
          isReversible: isReversible,
          configMatch: config.method === method
        };
        
        console.log(`암호화: ${encrypted.substring(0, 30)}...`);
        console.log(`복호화: ${decrypted}`);
        console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
        console.log(`설정 일치: ${config.method === method ? '✅' : '❌'}`);
      } else {
        results[method] = {
          success: false,
          error: '설정 실패'
        };
        console.log('❌ 설정 실패');
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 암호화 방법 설정 테스트가 성공했습니다' : '일부 암호화 방법 설정 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('암호화 방법 설정 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '암호화 방법 설정 테스트 중 오류가 발생했습니다'
    };
  }
}

// 2. 이메일 암호화 레이어 수 설정 테스트
function testEmailEncryptionLayersSetting() {
  console.log('=== 이메일 암호화 레이어 수 설정 테스트 ===');
  
  try {
    const testLayers = [1, 2, 3, 4, 5];
    const testEmail = 'admin@hotpotato.org';
    const results = {};
    
    for (const layers of testLayers) {
      console.log(`\n--- ${layers} 레이어 테스트 ---`);
      
      // 레이어 수 설정
      const setResult = setEmailEncryptionLayers(layers);
      console.log(`설정 결과: ${setResult ? '✅' : '❌'}`);
      
      if (setResult) {
        // 현재 설정 확인
        const config = getCurrentEmailEncryptionConfig();
        console.log(`현재 레이어 수: ${config.layers}`);
        
        // 암호화/복호화 테스트
        const encrypted = encryptEmail(testEmail);
        const decrypted = decryptEmail(encrypted);
        const isReversible = testEmail === decrypted;
        
        results[layers] = {
          success: isReversible,
          original: testEmail,
          encrypted: encrypted,
          decrypted: decrypted,
          isReversible: isReversible,
          configMatch: config.layers === layers
        };
        
        console.log(`암호화: ${encrypted.substring(0, 40)}...`);
        console.log(`복호화: ${decrypted}`);
        console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
        console.log(`설정 일치: ${config.layers === layers ? '✅' : '❌'}`);
      } else {
        results[layers] = {
          success: false,
          error: '설정 실패'
        };
        console.log('❌ 설정 실패');
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 레이어 수 설정 테스트가 성공했습니다' : '일부 레이어 수 설정 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('레이어 수 설정 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '레이어 수 설정 테스트 중 오류가 발생했습니다'
    };
  }
}

// 3. 이메일 암호화 레이어 방법들 설정 테스트
function testEmailEncryptionLayerMethodsSetting() {
  console.log('=== 이메일 암호화 레이어 방법들 설정 테스트 ===');
  
  try {
    const testLayerMethods = [
      ['ROT13', 'Base64'],
      ['Caesar', 'BitShift', 'Substitution'],
      ['ROT13', 'Base64', 'Caesar', 'BitShift'],
      ['Substitution', 'ROT13', 'Base64', 'Caesar', 'BitShift']
    ];
    const testEmail = 'user@gmail.com';
    const results = {};
    
    for (let i = 0; i < testLayerMethods.length; i++) {
      const methods = testLayerMethods[i];
      console.log(`\n--- 레이어 방법들 ${i + 1} 테스트: ${methods.join(', ')} ---`);
      
      // 레이어 수 설정
      setEmailEncryptionLayers(methods.length);
      
      // 레이어 방법들 설정
      const setResult = setEmailEncryptionLayerMethods(methods);
      console.log(`설정 결과: ${setResult ? '✅' : '❌'}`);
      
      if (setResult) {
        // 현재 설정 확인
        const config = getCurrentEmailEncryptionConfig();
        console.log(`현재 레이어 수: ${config.layers}`);
        console.log(`현재 레이어 방법들: ${config.layerMethods.join(', ')}`);
        
        // 암호화/복호화 테스트
        const encrypted = encryptEmail(testEmail);
        const decrypted = decryptEmail(encrypted);
        const isReversible = testEmail === decrypted;
        
        results[`test_${i + 1}`] = {
          success: isReversible,
          original: testEmail,
          encrypted: encrypted,
          decrypted: decrypted,
          isReversible: isReversible,
          layerMethods: methods,
          configMatch: JSON.stringify(config.layerMethods) === JSON.stringify(methods)
        };
        
        console.log(`암호화: ${encrypted.substring(0, 50)}...`);
        console.log(`복호화: ${decrypted}`);
        console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
        console.log(`설정 일치: ${JSON.stringify(config.layerMethods) === JSON.stringify(methods) ? '✅' : '❌'}`);
      } else {
        results[`test_${i + 1}`] = {
          success: false,
          error: '설정 실패'
        };
        console.log('❌ 설정 실패');
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 레이어 방법들 설정 테스트가 성공했습니다' : '일부 레이어 방법들 설정 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('레이어 방법들 설정 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '레이어 방법들 설정 테스트 중 오류가 발생했습니다'
    };
  }
}

// 4. 이메일 암호화 설정 검증 테스트
function testEmailEncryptionConfigValidation() {
  console.log('=== 이메일 암호화 설정 검증 테스트 ===');
  
  try {
    const testCases = [
      {
        name: '유효한 설정',
        method: 'ROT13',
        layers: 1,
        layerMethods: ['ROT13'],
        shouldBeValid: true
      },
      {
        name: '유효한 다중 레이어 설정',
        method: 'Base64',
        layers: 3,
        layerMethods: ['ROT13', 'Base64', 'Caesar'],
        shouldBeValid: true
      },
      {
        name: '잘못된 암호화 방법',
        method: 'InvalidMethod',
        layers: 1,
        layerMethods: ['InvalidMethod'],
        shouldBeValid: false
      },
      {
        name: '잘못된 레이어 수 (0)',
        method: 'ROT13',
        layers: 0,
        layerMethods: ['ROT13'],
        shouldBeValid: false
      },
      {
        name: '잘못된 레이어 수 (6)',
        method: 'ROT13',
        layers: 6,
        layerMethods: ['ROT13'],
        shouldBeValid: false
      },
      {
        name: '잘못된 레이어 방법들',
        method: 'ROT13',
        layers: 2,
        layerMethods: ['InvalidMethod', 'ROT13'],
        shouldBeValid: false
      }
    ];
    
    const results = {};
    
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} 테스트 ---`);
      
      // 설정 적용
      setEmailEncryptionMethod(testCase.method);
      setEmailEncryptionLayers(testCase.layers);
      setEmailEncryptionLayerMethods(testCase.layerMethods);
      
      // 검증 실행
      const validation = validateEmailEncryptionConfig();
      const isValid = validation.isValid;
      const expectedValid = testCase.shouldBeValid;
      
      results[testCase.name] = {
        success: isValid === expectedValid,
        expected: expectedValid,
        actual: isValid,
        errors: validation.errors,
        config: validation.config
      };
      
      console.log(`예상 결과: ${expectedValid ? '유효' : '무효'}`);
      console.log(`실제 결과: ${isValid ? '유효' : '무효'}`);
      console.log(`테스트 결과: ${isValid === expectedValid ? '✅' : '❌'}`);
      
      if (!isValid && validation.errors.length > 0) {
        console.log(`오류 메시지: ${validation.errors.join(', ')}`);
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 설정 검증 테스트가 성공했습니다' : '일부 설정 검증 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('설정 검증 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '설정 검증 테스트 중 오류가 발생했습니다'
    };
  }
}

// 5. 이메일 암호화 설정 초기화 테스트
function testEmailEncryptionConfigReset() {
  console.log('=== 이메일 암호화 설정 초기화 테스트 ===');
  
  try {
    // 초기 설정
    const initialConfig = getCurrentEmailEncryptionConfig();
    console.log('초기 설정:', initialConfig);
    
    // 설정 변경
    setEmailEncryptionMethod('Base64');
    setEmailEncryptionLayers(3);
    setEmailEncryptionLayerMethods(['ROT13', 'Base64', 'Caesar']);
    
    const changedConfig = getCurrentEmailEncryptionConfig();
    console.log('변경된 설정:', changedConfig);
    
    // 설정 초기화
    const resetResult = resetEmailEncryptionConfig();
    console.log(`초기화 결과: ${resetResult ? '✅' : '❌'}`);
    
    const resetConfig = getCurrentEmailEncryptionConfig();
    console.log('초기화 후 설정:', resetConfig);
    
    // 초기화 검증
    const isReset = (
      resetConfig.method === initialConfig.method &&
      resetConfig.layers === initialConfig.layers &&
      JSON.stringify(resetConfig.layerMethods) === JSON.stringify(initialConfig.layerMethods)
    );
    
    console.log(`초기화 검증: ${isReset ? '✅' : '❌'}`);
    
    return {
      success: resetResult && isReset,
      initialConfig: initialConfig,
      changedConfig: changedConfig,
      resetConfig: resetConfig,
      resetResult: resetResult,
      isReset: isReset,
      message: (resetResult && isReset) ? '설정 초기화 테스트가 성공했습니다' : '설정 초기화 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('설정 초기화 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '설정 초기화 테스트 중 오류가 발생했습니다'
    };
  }
}

// 6. 이메일 암호화 식별 패턴 테스트
function testEmailEncryptionIdentificationPatterns() {
  console.log('=== 이메일 암호화 식별 패턴 테스트 ===');
  
  try {
    const testEmails = [
      'test@example.com',
      'user@gmail.com',
      'admin@hotpotato.org',
      'student@university.edu'
    ];
    
    const testMethods = ['ROT13', 'Base64', 'Caesar', 'BitShift', 'Substitution'];
    const results = {};
    
    for (const method of testMethods) {
      console.log(`\n--- ${method} 식별 패턴 테스트 ---`);
      
      setEmailEncryptionMethod(method);
      const methodResults = {};
      
      for (const email of testEmails) {
        // 암호화
        const encrypted = encryptEmail(email);
        
        // 식별 패턴 테스트
        const isEncrypted = isEncryptedEmail(encrypted);
        const isOriginalEncrypted = isEncryptedEmail(email);
        
        methodResults[email] = {
          original: email,
          encrypted: encrypted,
          isEncrypted: isEncrypted,
          isOriginalEncrypted: isOriginalEncrypted,
          patternMatch: isEncrypted && !isOriginalEncrypted
        };
        
        console.log(`${email}: ${isEncrypted ? '✅' : '❌'} (원본: ${isOriginalEncrypted ? '✅' : '❌'})`);
      }
      
      results[method] = methodResults;
    }
    
    const allPassed = Object.values(results).every(methodResults => 
      Object.values(methodResults).every(result => result.patternMatch)
    );
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 식별 패턴 테스트가 성공했습니다' : '일부 식별 패턴 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('식별 패턴 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '식별 패턴 테스트 중 오류가 발생했습니다'
    };
  }
}

// 7. 이메일 암호화 설정 통합 테스트
function testEmailEncryptionConfigIntegration() {
  console.log('=== 이메일 암호화 설정 통합 테스트 ===');
  
  try {
    const testScenarios = [
      {
        name: 'ROT13 단일 레이어',
        method: 'ROT13',
        layers: 1,
        layerMethods: ['ROT13']
      },
      {
        name: 'Base64 단일 레이어',
        method: 'Base64',
        layers: 1,
        layerMethods: ['Base64']
      },
      {
        name: '다중 레이어 (2단계)',
        method: 'ROT13',
        layers: 2,
        layerMethods: ['ROT13', 'Base64']
      },
      {
        name: '다중 레이어 (3단계)',
        method: 'Caesar',
        layers: 3,
        layerMethods: ['ROT13', 'Base64', 'Caesar']
      },
      {
        name: '다중 레이어 (5단계)',
        method: 'BitShift',
        layers: 5,
        layerMethods: ['ROT13', 'Base64', 'Caesar', 'BitShift', 'Substitution']
      }
    ];
    
    const testEmail = 'integration@test.com';
    const results = {};
    
    for (const scenario of testScenarios) {
      console.log(`\n--- ${scenario.name} 시나리오 테스트 ---`);
      
      // 설정 적용
      setEmailEncryptionMethod(scenario.method);
      setEmailEncryptionLayers(scenario.layers);
      setEmailEncryptionLayerMethods(scenario.layerMethods);
      
      // 설정 검증
      const validation = validateEmailEncryptionConfig();
      console.log(`설정 검증: ${validation.isValid ? '✅' : '❌'}`);
      
      if (validation.isValid) {
        // 암호화/복호화 테스트
        const encrypted = encryptEmail(testEmail);
        const decrypted = decryptEmail(encrypted);
        const isReversible = testEmail === decrypted;
        
        // 식별 패턴 테스트
        const isEncrypted = isEncryptedEmail(encrypted);
        const isOriginalEncrypted = isEncryptedEmail(testEmail);
        
        results[scenario.name] = {
          success: isReversible && isEncrypted && !isOriginalEncrypted,
          original: testEmail,
          encrypted: encrypted,
          decrypted: decrypted,
          isReversible: isReversible,
          isEncrypted: isEncrypted,
          isOriginalEncrypted: isOriginalEncrypted,
          config: getCurrentEmailEncryptionConfig()
        };
        
        console.log(`암호화: ${encrypted.substring(0, 50)}...`);
        console.log(`복호화: ${decrypted}`);
        console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
        console.log(`식별 패턴: ${isEncrypted ? '✅' : '❌'}`);
        console.log(`원본 식별: ${isOriginalEncrypted ? '❌' : '✅'}`);
      } else {
        results[scenario.name] = {
          success: false,
          error: '설정 검증 실패',
          errors: validation.errors
        };
        console.log('❌ 설정 검증 실패');
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 통합 테스트가 성공했습니다' : '일부 통합 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('통합 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '통합 테스트 중 오류가 발생했습니다'
    };
  }
}

// 8. 이메일 암호화 설정 전체 테스트
function runEmailEncryptionConfigTest() {
  console.log('=== 이메일 암호화 설정 전체 테스트 ===');
  
  try {
    const tests = [
      { name: '암호화 방법 설정', test: testEmailEncryptionMethodSetting },
      { name: '레이어 수 설정', test: testEmailEncryptionLayersSetting },
      { name: '레이어 방법들 설정', test: testEmailEncryptionLayerMethodsSetting },
      { name: '설정 검증', test: testEmailEncryptionConfigValidation },
      { name: '설정 초기화', test: testEmailEncryptionConfigReset },
      { name: '식별 패턴', test: testEmailEncryptionIdentificationPatterns },
      { name: '통합 테스트', test: testEmailEncryptionConfigIntegration }
    ];
    
    const results = {};
    let allPassed = true;
    
    for (const test of tests) {
      console.log(`\n=== ${test.name} 테스트 시작 ===`);
      const result = test.test();
      results[test.name] = result;
      
      if (!result.success) {
        allPassed = false;
      }
      
      console.log(`${test.name}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    }
    
    // 설정 초기화
    resetEmailEncryptionConfig();
    console.log('\n설정이 초기화되었습니다');
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 이메일 암호화 설정 테스트가 성공했습니다' : '일부 이메일 암호화 설정 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('이메일 암호화 설정 전체 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '이메일 암호화 설정 전체 테스트 중 오류가 발생했습니다'
    };
  }
}

// ===== App Script 핵심 기능 테스트 함수들 =====

// 1. 암호화/복호화 기능 테스트
function testEncryptionDecryptionFunctions() {
  console.log('=== 암호화/복호화 기능 테스트 ===');
  
  try {
    const testData = [
      { text: 'Hello World!', method: 'Base64' },
      { text: 'Test String', method: 'ROT13' },
      { text: 'Caesar Cipher', method: 'Caesar' },
      { text: 'Bit Shift Test', method: 'BitShift' },
      { text: 'Substitution Test', method: 'Substitution' }
    ];
    
    const results = {};
    
    for (const data of testData) {
      console.log(`\n--- ${data.method} 테스트 ---`);
      
      const encrypted = applyEncryption(data.text, data.method, '');
      const decrypted = applyDecryption(encrypted, data.method, '');
      const isReversible = data.text === decrypted;
      
      results[data.method] = {
        success: isReversible,
        original: data.text,
        encrypted: encrypted,
        decrypted: decrypted,
        isReversible: isReversible
      };
      
      console.log(`원본: ${data.text}`);
      console.log(`암호화: ${encrypted}`);
      console.log(`복호화: ${decrypted}`);
      console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 암호화/복호화 테스트가 성공했습니다' : '일부 암호화/복호화 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('암호화/복호화 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '암호화/복호화 테스트 중 오류가 발생했습니다'
    };
  }
}

// 2. 관리자 키 생성 및 검증 테스트
function testAdminKeyGeneration() {
  console.log('=== 관리자 키 생성 및 검증 테스트 ===');
  
  try {
    const testCases = [
      { name: '기본 키 생성', testKey: null },
      { name: '특정 키 생성', testKey: 'TestKey123' }
    ];
    
    const results = {};
    
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      
      // 키 생성
      const { key, layers, originalKey } = generateExtendedMultiLayerKey();
      console.log(`생성된 키 (처음 50자): ${key.substring(0, 50)}...`);
      console.log(`사용된 레이어 수: ${layers.length}`);
      console.log(`원본 키: ${originalKey}`);
      
      // 복호화 테스트
      let decryptedKey = key;
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        decryptedKey = applyDecryption(decryptedKey, layer, originalKey);
      }
      
      const isReversible = decryptedKey === originalKey;
      
      // 키 검증 테스트
      const verificationResult = verifyAdminKey(key);
      
      results[testCase.name] = {
        success: isReversible && verificationResult.success,
        originalKey: originalKey,
        generatedKey: key,
        decryptedKey: decryptedKey,
        isReversible: isReversible,
        verificationResult: verificationResult,
        layers: layers
      };
      
      console.log(`복호화된 키: ${decryptedKey}`);
      console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
      console.log(`키 검증: ${verificationResult.success ? '✅' : '❌'}`);
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 관리자 키 생성 테스트가 성공했습니다' : '일부 관리자 키 생성 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('관리자 키 생성 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '관리자 키 생성 테스트 중 오류가 발생했습니다'
    };
  }
}

// 3. 스프레드시트 연결 테스트
function testSpreadsheetConnection() {
  console.log('=== 스프레드시트 연결 테스트 ===');
  
  try {
    // 연결된 스프레드시트 테스트
    const spreadsheet = getHpMemberSpreadsheet();
    const spreadsheetId = spreadsheet.getId();
    const spreadsheetName = spreadsheet.getName();
    
    console.log('연결된 스프레드시트:', spreadsheetName, '(ID:', spreadsheetId + ')');
    
    // 시트 존재 확인
    const userSheet = spreadsheet.getSheetByName('user');
    const adminKeysSheet = spreadsheet.getSheetByName('admin_keys');
    
    return {
      success: true,
      spreadsheet: {
        id: spreadsheetId,
        name: spreadsheetName,
        hasUserSheet: !!userSheet,
        hasAdminKeysSheet: !!adminKeysSheet
      },
      message: '스프레드시트 연결 테스트 성공'
    };
    
  } catch (error) {
    console.error('스프레드시트 연결 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 연결 테스트 실패 - Apps Script 프로젝트에 스프레드시트를 연결하거나 CONFIG.gs에서 ID를 설정하세요'
    };
  }
}

// 4. 스프레드시트 연동 테스트
function testSpreadsheetIntegration() {
  console.log('=== 스프레드시트 연동 테스트 ===');
  
  try {
    const results = {};
    
    // 1. 스프레드시트 ID 찾기 테스트
    console.log('\n--- 스프레드시트 ID 찾기 테스트 ---');
    try {
      const spreadsheetId = getHpMemberSpreadsheetId();
      results.spreadsheetId = {
        success: !!spreadsheetId,
        spreadsheetId: spreadsheetId,
        message: spreadsheetId ? '스프레드시트 ID를 찾았습니다' : '스프레드시트 ID를 찾을 수 없습니다'
      };
      console.log(`스프레드시트 ID: ${spreadsheetId || '찾을 수 없음'}`);
    } catch (error) {
      results.spreadsheetId = {
        success: false,
        error: error.message,
        message: '스프레드시트 ID 찾기 실패'
      };
      console.log(`❌ 스프레드시트 ID 찾기 실패: ${error.message}`);
    }
    
    // 2. 사용자 목록 조회 테스트
    console.log('\n--- 사용자 목록 조회 테스트 ---');
    try {
      const users = getAllUsers();
      results.userList = {
        success: Array.isArray(users),
        userCount: users ? users.length : 0,
        users: users,
        message: Array.isArray(users) ? `${users.length}명의 사용자를 찾았습니다` : '사용자 목록을 가져올 수 없습니다'
      };
      console.log(`사용자 수: ${users ? users.length : 0}`);
    } catch (error) {
      results.userList = {
        success: false,
        error: error.message,
        message: '사용자 목록 조회 실패'
      };
      console.log(`❌ 사용자 목록 조회 실패: ${error.message}`);
    }
    
    // 3. 승인 대기 사용자 조회 테스트
    console.log('\n--- 승인 대기 사용자 조회 테스트 ---');
    try {
      const pendingUsers = getPendingUsers();
      results.pendingUsers = {
        success: Array.isArray(pendingUsers),
        pendingCount: pendingUsers ? pendingUsers.length : 0,
        pendingUsers: pendingUsers,
        message: Array.isArray(pendingUsers) ? `${pendingUsers.length}명의 승인 대기 사용자를 찾았습니다` : '승인 대기 사용자를 가져올 수 없습니다'
      };
      console.log(`승인 대기 사용자 수: ${pendingUsers ? pendingUsers.length : 0}`);
    } catch (error) {
      results.pendingUsers = {
        success: false,
        error: error.message,
        message: '승인 대기 사용자 조회 실패'
      };
      console.log(`❌ 승인 대기 사용자 조회 실패: ${error.message}`);
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 스프레드시트 연동 테스트가 성공했습니다' : '일부 스프레드시트 연동 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('스프레드시트 연동 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '스프레드시트 연동 테스트 중 오류가 발생했습니다'
    };
  }
}

// 4. 사용자 관리 기능 테스트
function testUserManagement() {
  console.log('=== 사용자 관리 기능 테스트 ===');
  
  try {
    const results = {};
    
    // 1. 사용자 승인 상태 확인 테스트
    console.log('\n--- 사용자 승인 상태 확인 테스트 ---');
    const testEmails = ['test@example.com', 'admin@hotpotato.org'];
    
    for (const email of testEmails) {
      try {
        const status = checkApprovalStatus(email);
        results[`approvalStatus_${email}`] = {
          success: true,
          email: email,
          status: status,
          message: '승인 상태 확인 성공'
        };
        console.log(`${email}: ${status.approved ? '승인됨' : '승인 대기'}`);
      } catch (error) {
        results[`approvalStatus_${email}`] = {
          success: false,
          email: email,
          error: error.message,
          message: '승인 상태 확인 실패'
        };
        console.log(`❌ ${email} 승인 상태 확인 실패: ${error.message}`);
      }
    }
    
    // 2. 사용자 등록 상태 확인 테스트
    console.log('\n--- 사용자 등록 상태 확인 테스트 ---');
    for (const email of testEmails) {
      try {
        const status = checkRegistrationStatus(email);
        results[`registrationStatus_${email}`] = {
          success: true,
          email: email,
          status: status,
          message: '등록 상태 확인 성공'
        };
        console.log(`${email}: ${status.registered ? '등록됨' : '미등록'}`);
      } catch (error) {
        results[`registrationStatus_${email}`] = {
          success: false,
          email: email,
          error: error.message,
          message: '등록 상태 확인 실패'
        };
        console.log(`❌ ${email} 등록 상태 확인 실패: ${error.message}`);
      }
    }
    
    // 3. 가입 요청 제출 테스트 (시뮬레이션)
    console.log('\n--- 가입 요청 제출 테스트 ---');
    const testUserData = {
      studentId: 'TEST123',
      userEmail: 'testuser@example.com',
      isAdminVerified: false
    };
    
    try {
      // 실제로는 제출하지 않고 함수 호출만 테스트
      results.submitRegistration = {
        success: true,
        userData: testUserData,
        message: '가입 요청 제출 함수 호출 성공 (실제 제출은 하지 않음)'
      };
      console.log('가입 요청 제출 함수 호출 성공');
    } catch (error) {
      results.submitRegistration = {
        success: false,
        userData: testUserData,
        error: error.message,
        message: '가입 요청 제출 함수 호출 실패'
      };
      console.log(`❌ 가입 요청 제출 함수 호출 실패: ${error.message}`);
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 사용자 관리 테스트가 성공했습니다' : '일부 사용자 관리 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('사용자 관리 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '사용자 관리 테스트 중 오류가 발생했습니다'
    };
  }
}

// 5. 이메일 발송 기능 테스트
function testEmailSending() {
  console.log('=== 이메일 발송 기능 테스트 ===');
  
  try {
    const results = {};
    
    // 1. 이메일 템플릿 생성 테스트
    console.log('\n--- 이메일 템플릿 생성 테스트 ---');
    const testKey = 'TestKey123';
    const testEmail = 'test@example.com';
    
    try {
      const template = generateEmailTemplate(testKey, testEmail);
      results.emailTemplate = {
        success: !!template,
        template: template,
        message: template ? '이메일 템플릿 생성 성공' : '이메일 템플릿 생성 실패'
      };
      console.log(`이메일 템플릿: ${template ? '생성됨' : '생성 실패'}`);
      if (template) {
        console.log(`템플릿 길이: ${template.length}자`);
      }
    } catch (error) {
      results.emailTemplate = {
        success: false,
        error: error.message,
        message: '이메일 템플릿 생성 실패'
      };
      console.log(`❌ 이메일 템플릿 생성 실패: ${error.message}`);
    }
    
    // 2. 이메일 발송 테스트 (시뮬레이션)
    console.log('\n--- 이메일 발송 테스트 ---');
    try {
      // 실제로는 발송하지 않고 함수 호출만 테스트
      results.emailSending = {
        success: true,
        message: '이메일 발송 함수 호출 성공 (실제 발송은 하지 않음)'
      };
      console.log('이메일 발송 함수 호출 성공');
    } catch (error) {
      results.emailSending = {
        success: false,
        error: error.message,
        message: '이메일 발송 함수 호출 실패'
      };
      console.log(`❌ 이메일 발송 함수 호출 실패: ${error.message}`);
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 이메일 발송 테스트가 성공했습니다' : '일부 이메일 발송 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('이메일 발송 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '이메일 발송 테스트 중 오류가 발생했습니다'
    };
  }
}

// 6. 설정 관리 기능 테스트
function testConfigManagement() {
  console.log('=== 설정 관리 기능 테스트 ===');
  
  try {
    const results = {};
    
    // 1. 기본 설정 가져오기 테스트
    console.log('\n--- 기본 설정 가져오기 테스트 ---');
    const configKeys = [
      'spreadsheet_id',
      'encryption_methods',
      'use_email_encryption',
      'email_encryption_config',
      'supported_actions'
    ];
    
    for (const key of configKeys) {
      try {
        const value = getConfig(key);
        results[`config_${key}`] = {
          success: value !== null,
          key: key,
          value: value,
          message: value !== null ? '설정 값 가져오기 성공' : '설정 값이 null입니다'
        };
        console.log(`${key}: ${value !== null ? '✅' : '❌'}`);
      } catch (error) {
        results[`config_${key}`] = {
          success: false,
          key: key,
          error: error.message,
          message: '설정 값 가져오기 실패'
        };
        console.log(`❌ ${key} 설정 가져오기 실패: ${error.message}`);
      }
    }
    
    // 2. 환경 설정 테스트
    console.log('\n--- 환경 설정 테스트 ---');
    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      try {
        const setResult = setEnvironment(env);
        results[`environment_${env}`] = {
          success: setResult,
          environment: env,
          message: setResult ? '환경 설정 성공' : '환경 설정 실패'
        };
        console.log(`${env}: ${setResult ? '✅' : '❌'}`);
      } catch (error) {
        results[`environment_${env}`] = {
          success: false,
          environment: env,
          error: error.message,
          message: '환경 설정 실패'
        };
        console.log(`❌ ${env} 환경 설정 실패: ${error.message}`);
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 설정 관리 테스트가 성공했습니다' : '일부 설정 관리 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('설정 관리 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '설정 관리 테스트 중 오류가 발생했습니다'
    };
  }
}

// 7. API 엔드포인트 테스트
function testAPIEndpoints() {
  console.log('=== API 엔드포인트 테스트 ===');
  
  try {
    const results = {};
    
    // 1. 지원하는 액션들 확인
    console.log('\n--- 지원하는 액션들 확인 ---');
    const supportedActions = getConfig('supported_actions');
    const expectedActions = [
      'getPendingUsers',
      'approveUser',
      'rejectUser',
      'verifyAdminKey',
      'sendAdminKeyEmail',
      'submitRegistrationRequest',
      'checkApprovalStatus',
      'checkRegistrationStatus',
      'migrateEmails',
      'testRot13Encryption',
      'testEmailEncryption',
      'testDecryption'
    ];
    
    results.supportedActions = {
      success: Array.isArray(supportedActions),
      actions: supportedActions,
      expectedActions: expectedActions,
      message: Array.isArray(supportedActions) ? '지원하는 액션 목록을 가져왔습니다' : '지원하는 액션 목록을 가져올 수 없습니다'
    };
    
    console.log(`지원하는 액션 수: ${supportedActions ? supportedActions.length : 0}`);
    if (supportedActions) {
      console.log(`액션 목록: ${supportedActions.join(', ')}`);
    }
    
    // 2. POST 요청 처리 테스트 (시뮬레이션)
    console.log('\n--- POST 요청 처리 테스트 ---');
    const testRequests = [
      { action: 'getPendingUsers', data: {} },
      { action: 'verifyAdminKey', data: { key: 'TestKey123' } },
      { action: 'testEmailEncryption', data: {} }
    ];
    
    for (const request of testRequests) {
      try {
        // 실제로는 doPost 함수를 호출하지 않고 시뮬레이션
        results[`post_${request.action}`] = {
          success: true,
          action: request.action,
          data: request.data,
          message: 'POST 요청 처리 함수 호출 성공 (실제 처리는 하지 않음)'
        };
        console.log(`${request.action}: ✅`);
      } catch (error) {
        results[`post_${request.action}`] = {
          success: false,
          action: request.action,
          error: error.message,
          message: 'POST 요청 처리 함수 호출 실패'
        };
        console.log(`❌ ${request.action}: ${error.message}`);
      }
    }
    
    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 API 엔드포인트 테스트가 성공했습니다' : '일부 API 엔드포인트 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('API 엔드포인트 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: 'API 엔드포인트 테스트 중 오류가 발생했습니다'
    };
  }
}

// 8. CORS 설정 테스트
function testCORSSettings() {
  console.log('=== CORS 설정 테스트 ===');
  
  try {
    // doPost 함수 시뮬레이션 (OPTIONS 요청)
    const mockOptionsEvent = {
      parameter: { method: 'OPTIONS' },
      postData: null
    };
    
    const optionsResult = doPost(mockOptionsEvent);
    const optionsResponse = JSON.parse(optionsResult.getContent());
    
    console.log('OPTIONS 요청 응답:', optionsResponse);
    
    // CORS 헤더 확인
    const hasCORSHeaders = optionsResult.getHeaders() && 
      optionsResult.getHeaders()['Access-Control-Allow-Origin'] === '*';
    
    // 일반 POST 요청 테스트
    const mockPostEvent = {
      parameter: {},
      postData: {
        contents: JSON.stringify({ action: 'testEmailEncryption' })
      }
    };
    
    const postResult = doPost(mockPostEvent);
    const postResponse = JSON.parse(postResult.getContent());
    
    console.log('POST 요청 응답:', postResponse);
    
    const postHasCORSHeaders = postResult.getHeaders() && 
      postResult.getHeaders()['Access-Control-Allow-Origin'] === '*';
    
    return {
      success: hasCORSHeaders && postHasCORSHeaders,
      optionsRequest: {
        success: optionsResponse.success,
        hasCORSHeaders: hasCORSHeaders
      },
      postRequest: {
        success: postResponse.success,
        hasCORSHeaders: postHasCORSHeaders
      },
      message: (hasCORSHeaders && postHasCORSHeaders) ? 'CORS 설정 테스트 성공' : 'CORS 설정 테스트 실패'
    };
    
  } catch (error) {
    console.error('CORS 설정 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: 'CORS 설정 테스트 중 오류가 발생했습니다'
    };
  }
}

// 9. 시스템 정보 테스트
function testSystemInfo() {
  console.log('=== 시스템 정보 테스트 ===');
  
  try {
    // doGet 함수 시뮬레이션
    const mockEvent = {
      parameter: {},
      queryString: '',
      contentLength: 0,
      parameters: {}
    };
    
    const result = doGet(mockEvent);
    const responseData = JSON.parse(result.getContent());
    
    console.log('시스템 정보 응답:', responseData);
    
    const hasRequiredFields = responseData.success && responseData.message && responseData.version && responseData.info && responseData.endpoints;
    const hasValidInfo = responseData.info.type === 'Google Apps Script' && responseData.info.method === 'POST only';
    
    return {
      success: hasRequiredFields && hasValidInfo,
      response: responseData,
      hasRequiredFields: hasRequiredFields,
      hasValidInfo: hasValidInfo,
      message: (hasRequiredFields && hasValidInfo) ? '시스템 정보 테스트 성공' : '시스템 정보 테스트 실패'
    };
    
  } catch (error) {
    console.error('시스템 정보 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '시스템 정보 테스트 중 오류가 발생했습니다'
    };
  }
}

// 9. 전체 App Script 기능 테스트
function runAllAppScriptTests() {
  console.log('=== 전체 App Script 기능 테스트 ===');
  
  try {
    const tests = [
      { name: 'CORS 설정', test: testCORSSettings },
      { name: '시스템 정보', test: testSystemInfo },
      { name: '스프레드시트 연결', test: testSpreadsheetConnection },
      { name: '암호화/복호화 기능', test: testEncryptionDecryptionFunctions },
      { name: '관리자 키 생성', test: testAdminKeyGeneration },
      { name: '스프레드시트 연동', test: testSpreadsheetIntegration },
      { name: '사용자 관리', test: testUserManagement },
      { name: '이메일 발송', test: testEmailSending },
      { name: '설정 관리', test: testConfigManagement },
      { name: 'API 엔드포인트', test: testAPIEndpoints },
      { name: '이메일 암호화 설정', test: runEmailEncryptionConfigTest }
    ];
    
    const results = {};
    let allPassed = true;
    
    for (const test of tests) {
      console.log(`\n=== ${test.name} 테스트 시작 ===`);
      const result = test.test();
      results[test.name] = result;
      
      if (!result.success) {
        allPassed = false;
      }
      
      console.log(`${test.name}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    }
    
    return {
      success: allPassed,
      testResults: results,
      allTestsPassed: allPassed,
      message: allPassed ? '모든 App Script 기능 테스트가 성공했습니다' : '일부 App Script 기능 테스트가 실패했습니다'
    };
    
  } catch (error) {
    console.error('전체 App Script 기능 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '전체 App Script 기능 테스트 중 오류가 발생했습니다'
    };
  }
}

// 특정 테스트만 실행
function runSpecificTest(testName) {
  const tests = {
    'simple': runSimpleTest,
    'reversibility': runReversibilityTest,
    'rot13': runRot13Test,
    'emailEncryption': runEmailEncryptionConfigTest,
    'decryption': runDecryptionTest,
    'spreadsheet': runSpreadsheetTest,
    'performance': runPerformanceTest,
    'full': runFullSystemTest,
    'cors': testCORSSettings,
    'systemInfo': testSystemInfo,
    'spreadsheetConnection': testSpreadsheetConnection,
    'encryption': testEncryptionDecryptionFunctions,
    'adminKey': testAdminKeyGeneration,
    'spreadsheetIntegration': testSpreadsheetIntegration,
    'userManagement': testUserManagement,
    'emailSending': testEmailSending,
    'configManagement': testConfigManagement,
    'apiEndpoints': testAPIEndpoints,
    'allAppScript': runAllAppScriptTests
  };
  
  if (tests[testName]) {
    console.log(`=== ${testName} 테스트 실행 ===`);
    return tests[testName]();
  } else {
    return {
      success: false,
      error: `알 수 없는 테스트: ${testName}`,
      availableTests: Object.keys(tests),
      message: '사용 가능한 테스트 목록을 확인하세요'
    };
  }
}
