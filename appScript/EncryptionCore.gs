/**
 * EncryptionCore.gs
 * 암호화/복호화 핵심 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 암호화 핵심 함수들 =====

/**
 * 텍스트에 특정 암호화 방법 적용
 * @param {string} text - 암호화할 텍스트
 * @param {string} method - 암호화 방법
 * @param {string} key - 암호화 키
 * @returns {string} 암호화된 텍스트
 */
function applyEncryption(text, method, key) {
  try {
    if (!text || typeof text !== 'string') {
      console.warn('암호화할 텍스트가 유효하지 않습니다:', text);
      return text || '';
    }

    let result;
    switch (method) {
      case 'Base64':
        result = Utilities.base64Encode(text);
        break;
      case 'Caesar':
        result = caesarEncrypt(text, 13);
        break;
      case 'ROT13':
        result = rot13Encrypt(text);
        break;
      case 'BitShift':
        result = bitShiftEncrypt(text, 7);
        break;
      case 'Substitution':
        result = substitutionCipher(text);
        break;
      case 'Padding':
        result = paddingEncrypt(text);
        break;
      case 'MultiEncode':
        result = multiEncode(text);
        break;
      case 'RandomInsert':
        result = randomInsert(text);
        break;
      case 'Transposition':
        result = transpositionCipher(text);
        break;
      case 'Reverse':
        result = reverseCipher(text);
        break;
      case 'Atbash':
        result = atbashCipher(text);
        break;
      case 'Vigenere':
        result = vigenereCipher(text);
        break;
      case 'RailFence':
        result = railFenceCipher(text);
        break;
      case 'Columnar':
        result = columnarCipher(text);
        break;
      case 'Affine':
        result = affineCipher(text);
        break;
      case 'Permutation':
        result = permutationCipher(text);
        break;
      case 'Pattern':
        result = patternCipher(text);
        break;
      case 'Mirror':
        result = mirrorCipher(text);
        break;
      case 'Zigzag':
        result = zigzagCipher(text);
        break;
      case 'Wave':
        result = waveCipher(text);
        break;
      case 'Snake':
        result = snakeCipher(text);
        break;
      default:
        console.warn(`알 수 없는 암호화 방법: ${method}`);
        result = text;
    }
    
    // 결과가 유효하지 않으면 원본 반환
    if (result === undefined || result === null) {
      console.warn(`암호화 결과가 유효하지 않음 (${method}):`, result);
      return text;
    }
    
    console.log(`암호화 완료: ${method}, 결과: ${result.substring(0, 20)}...`);
    return result;
  } catch (error) {
    console.error(`암호화 중 오류 발생 (${method}):`, error);
    return text;
  }
}

/**
 * 텍스트에 특정 복호화 방법 적용
 * @param {string} text - 복호화할 텍스트
 * @param {string} method - 복호화 방법
 * @param {string} key - 복호화 키
 * @returns {string} 복호화된 텍스트
 */
function applyDecryption(text, method, key) {
  try {
    if (!text || typeof text !== 'string') {
      console.warn('복호화할 텍스트가 유효하지 않습니다:', text);
      return text || '';
    }

    let result;
    switch (method) {
      case 'Base64':
        try {
          const decoded = Utilities.base64Decode(text);
          result = Utilities.newBlob(decoded).getDataAsString();
        } catch (error) {
          console.error('Base64 복호화 오류:', error);
          result = text;
        }
        break;
      case 'Caesar':
        result = caesarDecrypt(text, 13);
        break;
      case 'ROT13':
        result = rot13Decrypt(text);
        break;
      case 'BitShift':
        result = bitShiftDecrypt(text, 7);
        break;
      case 'Substitution':
        result = substitutionDecrypt(text);
        break;
      case 'Padding':
        result = paddingDecrypt(text);
        break;
      case 'MultiEncode':
        result = multiDecode(text);
        break;
      case 'RandomInsert':
        result = randomExtract(text);
        break;
      case 'Transposition':
        result = transpositionDecrypt(text);
        break;
      case 'Reverse':
        result = reverseDecrypt(text);
        break;
      case 'Atbash':
        result = atbashDecrypt(text);
        break;
      case 'Vigenere':
        result = vigenereDecrypt(text);
        break;
      case 'RailFence':
        result = railFenceDecrypt(text);
        break;
      case 'Columnar':
        result = columnarDecrypt(text);
        break;
      case 'Affine':
        result = affineDecrypt(text);
        break;
      case 'Permutation':
        result = permutationDecrypt(text);
        break;
      case 'Pattern':
        result = patternDecrypt(text);
        break;
      case 'Mirror':
        result = mirrorDecrypt(text);
        break;
      case 'Zigzag':
        result = zigzagDecrypt(text);
        break;
      case 'Wave':
        result = waveDecrypt(text);
        break;
      case 'Snake':
        result = snakeDecrypt(text);
        break;
      default:
        console.warn(`알 수 없는 복호화 방법: ${method}`);
        result = text;
    }
    
    // 결과가 유효하지 않으면 원본 반환
    if (result === undefined || result === null) {
      console.warn(`복호화 결과가 유효하지 않음 (${method}):`, result);
      return text;
    }
    
    console.log(`복호화 완료: ${method}, 결과: ${result.substring(0, 20)}...`);
    return result;
  } catch (error) {
    console.error(`복호화 중 오류 발생 (${method}):`, error);
    return text;
  }
}

/**
 * 다중 레이어 암호화
 * @param {string} text - 암호화할 텍스트
 * @param {Array} methods - 암호화 방법 배열
 * @returns {Object} 암호화 결과
 */
function multiLayerEncrypt(text, methods) {
  try {
    console.log('다중 레이어 암호화 시작:', methods);
    
    let encryptedText = text;
    const encryptionLog = [];
    
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const beforeEncrypt = encryptedText;
      encryptedText = applyEncryption(encryptedText, method, '');
      
      encryptionLog.push({
        layer: i + 1,
        method: method,
        before: beforeEncrypt.substring(0, 20) + '...',
        after: encryptedText.substring(0, 20) + '...'
      });
      
      console.log(`레이어 ${i + 1}/${methods.length} (${method}):`, beforeEncrypt.substring(0, 20) + '...', '->', encryptedText.substring(0, 20) + '...');
    }
    
    return {
      success: true,
      encryptedText: encryptedText,
      methods: methods,
      log: encryptionLog
    };
    
  } catch (error) {
    console.error('다중 레이어 암호화 오류:', error);
    return {
      success: false,
      error: error.message,
      encryptedText: text
    };
  }
}

/**
 * 다중 레이어 복호화
 * @param {string} encryptedText - 복호화할 텍스트
 * @param {Array} methods - 복호화 방법 배열 (역순)
 * @returns {Object} 복호화 결과
 */
function multiLayerDecrypt(encryptedText, methods) {
  try {
    console.log('다중 레이어 복호화 시작:', methods);
    
    let decryptedText = encryptedText;
    const decryptionLog = [];
    
    // 역순으로 복호화
    for (let i = methods.length - 1; i >= 0; i--) {
      const method = methods[i];
      const beforeDecrypt = decryptedText;
      decryptedText = applyDecryption(decryptedText, method, '');
      
      decryptionLog.push({
        layer: methods.length - i,
        method: method,
        before: beforeDecrypt.substring(0, 20) + '...',
        after: decryptedText.substring(0, 20) + '...'
      });
      
      console.log(`레이어 ${methods.length - i}/${methods.length} (${method}):`, beforeDecrypt.substring(0, 20) + '...', '->', decryptedText.substring(0, 20) + '...');
    }
    
    return {
      success: true,
      decryptedText: decryptedText,
      methods: methods,
      log: decryptionLog
    };
    
  } catch (error) {
    console.error('다중 레이어 복호화 오류:', error);
    return {
      success: false,
      error: error.message,
      decryptedText: encryptedText
    };
  }
}

// ===== 배포 정보 =====
function getEncryptionCoreInfo() {
  return {
    version: '1.0.0',
    description: '암호화/복호화 핵심 함수들',
    functions: [
      'applyEncryption',
      'applyDecryption',
      'multiLayerEncrypt',
      'multiLayerDecrypt'
    ],
    dependencies: ['EncryptionAlgorithms.gs', 'CONFIG.gs']
  };
}
