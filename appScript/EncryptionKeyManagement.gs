/**
 * EncryptionKeyManagement.gs
 * 암호화 키 관리 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 키 생성 및 관리 함수들 =====

/**
 * 확장된 다중 레이어 키 생성
 * @returns {Object} 생성된 키 정보
 */
function generateExtendedMultiLayerKey() {
  try {
    console.log('=== 관리자 키 생성 시작 ===');
    
    // CONFIG에서 암호화 방법들 가져오기
    const methods = getConfig('encryption_methods');
    const layerConfig = getConfig('layer_config');
    
    console.log('사용 가능한 암호화 방법들:', methods);
    console.log('레이어 설정:', layerConfig);
    
    const layerCount = Math.floor(Math.random() * (layerConfig.MAX_LAYERS - layerConfig.MIN_LAYERS + 1)) + layerConfig.MIN_LAYERS;
    const selectedMethods = [];
    
    for (let i = 0; i < layerCount; i++) {
      const randomIndex = Math.floor(Math.random() * methods.length);
      selectedMethods.push(methods[randomIndex]);
    }
    
    console.log('선택된 레이어 수:', layerCount);
    console.log('선택된 암호화 방법들:', selectedMethods);
    
    // 안전한 랜덤 문자열 생성
    const randomPart1 = Math.random().toString(36).substring(2);
    const randomPart2 = Math.random().toString(36).substring(2);
    const randomPart = randomPart1 + randomPart2;
    const dateStr = new Date().toISOString().split('T')[0];
    const baseKey = `ADMIN_${dateStr}_${randomPart.substring(0, 13)}`;
    
    console.log('랜덤 부분 1:', randomPart1);
    console.log('랜덤 부분 2:', randomPart2);
    console.log('날짜 문자열:', dateStr);
    console.log('기본 키:', baseKey);
    
    let encryptedKey = baseKey;
    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const beforeEncrypt = encryptedKey;
      encryptedKey = applyEncryption(encryptedKey, method, '');
      console.log(`암호화 ${i + 1}/${selectedMethods.length} (${method}):`, beforeEncrypt.substring(0, 20) + '...', '->', encryptedKey.substring(0, 20) + '...');
      
      if (!encryptedKey || encryptedKey === 'undefined' || encryptedKey.includes('undefined')) {
        console.error(`암호화 실패: ${method}에서 undefined 반환`);
        throw new Error(`암호화 실패: ${method}에서 undefined 반환`);
      }
    }
    
    console.log('최종 암호화된 키:', encryptedKey.substring(0, 50) + '...');
    console.log('=== 관리자 키 생성 완료 ===');
    
    return {
      key: encryptedKey,
      layers: selectedMethods,
      originalKey: baseKey
    };
  } catch (error) {
    console.error('관리자 키 생성 오류:', error);
    throw error;
  }
}

/**
 * 키 검증
 * @param {string} encryptedKey - 암호화된 키
 * @param {Array} methods - 암호화 방법 배열
 * @returns {Object} 검증 결과
 */
function validateEncryptedKey(encryptedKey, methods) {
  try {
    console.log('=== 키 검증 시작 ===');
    console.log('암호화된 키:', encryptedKey.substring(0, 50) + '...');
    console.log('암호화 방법들:', methods);
    
    // 역순으로 복호화
    let decryptedKey = encryptedKey;
    for (let i = methods.length - 1; i >= 0; i--) {
      const method = methods[i];
      const beforeDecrypt = decryptedKey;
      decryptedKey = applyDecryption(decryptedKey, method, '');
      console.log(`복호화 ${methods.length - i}/${methods.length} (${method}):`, beforeDecrypt.substring(0, 20) + '...', '->', decryptedKey.substring(0, 20) + '...');
    }
    
    console.log('최종 복호화된 키:', decryptedKey);
    
    // 키 형식 검증
    const isValidFormat = decryptedKey.startsWith('ADMIN_') && decryptedKey.includes('_');
    
    return {
      success: isValidFormat,
      decryptedKey: decryptedKey,
      isValidFormat: isValidFormat,
      message: isValidFormat ? '키가 유효합니다' : '키 형식이 올바르지 않습니다'
    };
    
  } catch (error) {
    console.error('키 검증 오류:', error);
    return {
      success: false,
      error: error.message,
      message: '키 검증 중 오류가 발생했습니다'
    };
  }
}

/**
 * 키 복호화
 * @param {string} encryptedKey - 암호화된 키
 * @param {Array} methods - 암호화 방법 배열
 * @returns {string} 복호화된 키
 */
function decryptKey(encryptedKey, methods) {
  try {
    console.log('=== 키 복호화 시작 ===');
    
    let decryptedKey = encryptedKey;
    for (let i = methods.length - 1; i >= 0; i--) {
      const method = methods[i];
      decryptedKey = applyDecryption(decryptedKey, method, '');
    }
    
    console.log('키 복호화 완료:', decryptedKey);
    return decryptedKey;
    
  } catch (error) {
    console.error('키 복호화 오류:', error);
    throw error;
  }
}

/**
 * 키 재암호화
 * @param {string} originalKey - 원본 키
 * @param {Array} newMethods - 새로운 암호화 방법 배열
 * @returns {Object} 재암호화된 키 정보
 */
function reencryptKey(originalKey, newMethods) {
  try {
    console.log('=== 키 재암호화 시작 ===');
    
    let encryptedKey = originalKey;
    for (let i = 0; i < newMethods.length; i++) {
      const method = newMethods[i];
      encryptedKey = applyEncryption(encryptedKey, method, '');
    }
    
    return {
      success: true,
      key: encryptedKey,
      layers: newMethods,
      originalKey: originalKey
    };
    
  } catch (error) {
    console.error('키 재암호화 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 키 강도 분석
 * @param {string} encryptedKey - 암호화된 키
 * @param {Array} methods - 암호화 방법 배열
 * @returns {Object} 키 강도 분석 결과
 */
function analyzeKeyStrength(encryptedKey, methods) {
  try {
    console.log('=== 키 강도 분석 시작 ===');
    
    const analysis = {
      keyLength: encryptedKey.length,
      layerCount: methods.length,
      methods: methods,
      complexity: 0,
      strength: 'weak'
    };
    
    // 복잡도 계산
    analysis.complexity = methods.length * 10;
    
    // 키 길이에 따른 보너스
    if (encryptedKey.length > 50) {
      analysis.complexity += 20;
    } else if (encryptedKey.length > 30) {
      analysis.complexity += 10;
    }
    
    // 강도 평가
    if (analysis.complexity >= 80) {
      analysis.strength = 'very_strong';
    } else if (analysis.complexity >= 60) {
      analysis.strength = 'strong';
    } else if (analysis.complexity >= 40) {
      analysis.strength = 'medium';
    } else {
      analysis.strength = 'weak';
    }
    
    return {
      success: true,
      analysis: analysis
    };
    
  } catch (error) {
    console.error('키 강도 분석 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 키 백업 생성
 * @param {string} encryptedKey - 암호화된 키
 * @param {Array} methods - 암호화 방법 배열
 * @returns {Object} 백업 정보
 */
function createKeyBackup(encryptedKey, methods) {
  try {
    console.log('=== 키 백업 생성 시작 ===');
    
    const backup = {
      encryptedKey: encryptedKey,
      methods: methods,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return {
      success: true,
      backup: backup,
      message: '키 백업이 생성되었습니다'
    };
    
  } catch (error) {
    console.error('키 백업 생성 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 키 백업 복원
 * @param {Object} backup - 백업 정보
 * @returns {Object} 복원 결과
 */
function restoreKeyBackup(backup) {
  try {
    console.log('=== 키 백업 복원 시작 ===');
    
    if (!backup.encryptedKey || !backup.methods) {
      return {
        success: false,
        message: '백업 정보가 올바르지 않습니다'
      };
    }
    
    // 키 검증
    const validation = validateEncryptedKey(backup.encryptedKey, backup.methods);
    
    return {
      success: validation.success,
      key: backup.encryptedKey,
      methods: backup.methods,
      validation: validation
    };
    
  } catch (error) {
    console.error('키 백업 복원 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ===== 배포 정보 =====
function getEncryptionKeyManagementInfo() {
  return {
    version: '1.0.0',
    description: '암호화 키 관리 관련 함수들',
    functions: [
      'generateExtendedMultiLayerKey',
      'validateEncryptedKey',
      'decryptKey',
      'reencryptKey',
      'analyzeKeyStrength',
      'createKeyBackup',
      'restoreKeyBackup'
    ],
    dependencies: ['EncryptionCore.gs', 'CONFIG.gs']
  };
}
