/**
 * TestBasic.gs
 * 기본 테스트 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 기본 테스트 함수들 =====

/**
 * 간단한 암호화/복호화 테스트
 * @returns {Object} 테스트 결과
 */
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
    const { key, layers, originalKey } = EncryptionKeyManagement.generateExtendedMultiLayerKey();
    console.log('원본 키:', originalKey);
    console.log('생성된 키 (처음 50자):', key.substring(0, 50) + '...');
    console.log('사용된 레이어 수:', layers.length);
    
    // 복호화 테스트
    let decryptedKey = key;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i].trim();
      decryptedKey = applyDecryption(decryptedKey, layer, '');
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
    console.error('❌ 테스트 실패:', error);
    return {
      success: false,
      message: '테스트 실패: ' + error.message
    };
  }
}

/**
 * 암호화 알고리즘 테스트
 * @returns {Object} 테스트 결과
 */
function testEncryptionAlgorithms() {
  console.log('=== 암호화 알고리즘 테스트 ===');
  
  try {
    const testString = 'Test String for Encryption';
    const algorithms = ['Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution'];
    
    const results = {};
    
    for (const algorithm of algorithms) {
      try {
        console.log(`\n--- ${algorithm} 테스트 ---`);
        
        const encrypted = applyEncryption(testString, algorithm, '');
        console.log('암호화:', encrypted);
        
        const decrypted = applyDecryption(encrypted, algorithm, '');
        console.log('복호화:', decrypted);
        
        const isReversible = decrypted === testString;
        console.log('가역성:', isReversible ? '✅ 성공' : '❌ 실패');
        
        results[algorithm] = {
          success: isReversible,
          encrypted: encrypted,
          decrypted: decrypted
        };
        
      } catch (error) {
        console.error(`${algorithm} 테스트 실패:`, error);
        results[algorithm] = {
          success: false,
          error: error.message
        };
      }
    }
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    return {
      success: successCount === totalCount,
      message: `${successCount}/${totalCount} 알고리즘 테스트 성공`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 암호화 알고리즘 테스트 실패:', error);
    return {
      success: false,
      message: '암호화 알고리즘 테스트 실패: ' + error.message
    };
  }
}

/**
 * 다중 레이어 암호화 테스트
 * @returns {Object} 테스트 결과
 */
function testMultiLayerEncryption() {
  console.log('=== 다중 레이어 암호화 테스트 ===');
  
  try {
    const testString = 'Multi Layer Test String';
    const layers = ['Base64', 'Caesar', 'ROT13'];
    
    console.log('원본:', testString);
    console.log('사용할 레이어:', layers);
    
    // 암호화
    const encryptionResult = multiLayerEncrypt(testString, layers);
    
    if (!encryptionResult.success) {
      throw new Error('암호화 실패: ' + encryptionResult.error);
    }
    
    console.log('암호화 결과:', encryptionResult.encryptedText);
    
    // 복호화
    const decryptionResult = multiLayerDecrypt(encryptionResult.encryptedText, layers);
    
    if (!decryptionResult.success) {
      throw new Error('복호화 실패: ' + decryptionResult.error);
    }
    
    console.log('복호화 결과:', decryptionResult.decryptedText);
    
    const isReversible = decryptionResult.decryptedText === testString;
    console.log('가역성:', isReversible ? '✅ 성공' : '❌ 실패');
    
    return {
      success: isReversible,
      message: isReversible ? '다중 레이어 암호화 테스트 성공' : '다중 레이어 암호화 테스트 실패',
      original: testString,
      encrypted: encryptionResult.encryptedText,
      decrypted: decryptionResult.decryptedText,
      layers: layers
    };
    
  } catch (error) {
    console.error('❌ 다중 레이어 암호화 테스트 실패:', error);
    return {
      success: false,
      message: '다중 레이어 암호화 테스트 실패: ' + error.message
    };
  }
}

/**
 * 이메일 암호화 테스트
 * @returns {Object} 테스트 결과
 */
function testEmailEncryption() {
  console.log('=== 이메일 암호화 테스트 ===');
  
  try {
    const testEmail = 'test@example.com';
    const testPhone = '010-1234-5678';
    
    console.log('테스트 이메일:', testEmail);
    console.log('테스트 전화번호:', testPhone);
    
    // 이메일 암호화/복호화
    const encryptedEmail = EncryptionEmail.encryptEmailMain(testEmail);
    const decryptedEmail = EncryptionEmail.decryptEmailMain(encryptedEmail);
    
    console.log('이메일 암호화:', encryptedEmail);
    console.log('이메일 복호화:', decryptedEmail);
    
    // 전화번호 암호화/복호화
    const encryptedPhone = EncryptionEmail.encryptEmailMain(testPhone);
    const decryptedPhone = EncryptionEmail.decryptEmailMain(encryptedPhone);
    
    console.log('전화번호 암호화:', encryptedPhone);
    console.log('전화번호 복호화:', decryptedPhone);
    
    const emailTest = decryptedEmail === testEmail;
    const phoneTest = decryptedPhone === testPhone;
    
    console.log('이메일 테스트:', emailTest ? '✅ 성공' : '❌ 실패');
    console.log('전화번호 테스트:', phoneTest ? '✅ 성공' : '❌ 실패');
    
    return {
      success: emailTest && phoneTest,
      message: emailTest && phoneTest ? '이메일 암호화 테스트 성공' : '이메일 암호화 테스트 실패',
      emailTest: emailTest,
      phoneTest: phoneTest,
      results: {
        email: { original: testEmail, encrypted: encryptedEmail, decrypted: decryptedEmail },
        phone: { original: testPhone, encrypted: encryptedPhone, decrypted: decryptedPhone }
      }
    };
    
  } catch (error) {
    console.error('❌ 이메일 암호화 테스트 실패:', error);
    return {
      success: false,
      message: '이메일 암호화 테스트 실패: ' + error.message
    };
  }
}

/**
 * 전체 기본 테스트 실행
 * @returns {Object} 전체 테스트 결과
 */
function runAllBasicTests() {
  console.log('=== 전체 기본 테스트 실행 ===');
  
  try {
    const results = {
      simpleTest: runSimpleTest(),
      encryptionAlgorithms: testEncryptionAlgorithms(),
      multiLayerEncryption: testMultiLayerEncryption(),
      emailEncryption: testEmailEncryption()
    };
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n=== 테스트 결과 요약 ===`);
    console.log(`성공: ${successCount}/${totalCount}`);
    
    Object.keys(results).forEach(testName => {
      const result = results[testName];
      console.log(`${testName}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    });
    
    return {
      success: successCount === totalCount,
      message: `전체 테스트 결과: ${successCount}/${totalCount} 성공`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 전체 기본 테스트 실패:', error);
    return {
      success: false,
      message: '전체 기본 테스트 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getTestBasicInfo() {
  return {
    version: '1.0.0',
    description: '기본 테스트 함수들',
    functions: [
      'runSimpleTest',
      'testEncryptionAlgorithms',
      'testMultiLayerEncryption',
      'testEmailEncryption',
      'runAllBasicTests'
    ],
    dependencies: [
      'EncryptionCore.gs',
      'EncryptionKeyManagement.gs',
      'EncryptionEmail.gs'
    ]
  };
}
