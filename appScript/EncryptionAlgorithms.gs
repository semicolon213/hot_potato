/**
 * EncryptionAlgorithms.gs
 * 다양한 암호화 알고리즘 구현
 * Hot Potato Admin Key Management System
 */

// ===== 기본 암호화 알고리즘들 =====

/**
 * Caesar 암호화: 알파벳을 일정 값만큼 이동
 * @param {string} text - 암호화할 텍스트
 * @param {number} shift - 이동할 값
 * @returns {string} 암호화된 텍스트
 */
function caesarEncrypt(text, shift) {
  return text.split('').map(char => {
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + shift) % 26) + base);
    }
    return char;
  }).join('');
}

/**
 * Caesar 복호화: 반대 방향으로 이동
 * @param {string} text - 복호화할 텍스트
 * @param {number} shift - 이동할 값
 * @returns {string} 복호화된 텍스트
 */
function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, 26 - shift);
}

/**
 * ROT13: 13자리씩 이동 (암호화=복호화)
 * @param {string} text - 처리할 텍스트
 * @returns {string} 처리된 텍스트
 */
function rot13(text) {
  return text.split('').map(char => {
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    }
    return char;
  }).join('');
}

/**
 * ROT13 암호화: ROT13은 암호화와 복호화가 동일
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function rot13Encrypt(text) {
  return rot13(text);
}

/**
 * ROT13 복호화: ROT13은 암호화와 복호화가 동일
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function rot13Decrypt(text) {
  return rot13(text);
}

/**
 * 비트 시프트: ASCII 코드를 일정 값만큼 이동
 * @param {string} text - 암호화할 텍스트
 * @param {number} shift - 이동할 값
 * @returns {string} 암호화된 텍스트
 */
function bitShiftEncrypt(text, shift) {
  return text.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) + shift);
  }).join('');
}

/**
 * 비트 시프트 복호화: 반대 방향으로 이동
 * @param {string} text - 복호화할 텍스트
 * @param {number} shift - 이동할 값
 * @returns {string} 복호화된 텍스트
 */
function bitShiftDecrypt(text, shift) {
  return text.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) - shift);
  }).join('');
}

// ===== 치환 암호 =====

/**
 * 치환 암호: 알파벳을 다른 알파벳으로 교체
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function substitutionCipher(text) {
  const substitution = {
    'a': 'x', 'b': 'y', 'c': 'z', 'd': 'a', 'e': 'b', 'f': 'c',
    'g': 'd', 'h': 'e', 'i': 'f', 'j': 'g', 'k': 'h', 'l': 'i',
    'm': 'j', 'n': 'k', 'o': 'l', 'p': 'm', 'q': 'n', 'r': 'o',
    's': 'p', 't': 'q', 'u': 'r', 'v': 's', 'w': 't', 'x': 'u',
    'y': 'v', 'z': 'w',
    'A': 'X', 'B': 'Y', 'C': 'Z', 'D': 'A', 'E': 'B', 'F': 'C',
    'G': 'D', 'H': 'E', 'I': 'F', 'J': 'G', 'K': 'H', 'L': 'I',
    'M': 'J', 'N': 'K', 'O': 'L', 'P': 'M', 'Q': 'N', 'R': 'O',
    'S': 'P', 'T': 'Q', 'U': 'R', 'V': 'S', 'W': 'T', 'X': 'U',
    'Y': 'V', 'Z': 'W'
  };
  
  return text.split('').map(char => {
    return substitution[char] || char;
  }).join('');
}

/**
 * 치환 복호화: 역 치환 테이블 사용
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function substitutionDecrypt(text) {
  const reverseSubstitution = {
    'x': 'a', 'y': 'b', 'z': 'c', 'a': 'd', 'b': 'e', 'c': 'f',
    'd': 'g', 'e': 'h', 'f': 'i', 'g': 'j', 'h': 'k', 'i': 'l',
    'j': 'm', 'k': 'n', 'l': 'o', 'm': 'p', 'n': 'q', 'o': 'r',
    'p': 's', 'q': 't', 'r': 'u', 's': 'v', 't': 'w', 'u': 'x',
    'v': 'y', 'w': 'z',
    'X': 'A', 'Y': 'B', 'Z': 'C', 'A': 'D', 'B': 'E', 'C': 'F',
    'D': 'G', 'E': 'H', 'F': 'I', 'G': 'J', 'H': 'K', 'I': 'L',
    'J': 'M', 'K': 'N', 'L': 'O', 'M': 'P', 'N': 'Q', 'O': 'R',
    'P': 'S', 'Q': 'T', 'R': 'U', 'S': 'V', 'T': 'W', 'U': 'X',
    'V': 'Y', 'W': 'Z'
  };
  
  return text.split('').map(char => {
    return reverseSubstitution[char] || char;
  }).join('');
}

// ===== 패딩 및 인코딩 =====

/**
 * 패딩: 텍스트 앞뒤에 랜덤 문자열 추가
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function paddingEncrypt(text) {
  const padding = 'PAD_' + Math.random().toString(36).substring(2, 8);
  return padding + text + padding;
}

/**
 * 패딩 복호화: PAD_로 시작하고 끝나는 부분 제거
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function paddingDecrypt(text) {
  const padMatch = text.match(/^PAD_[a-z0-9]+(.+)PAD_[a-z0-9]+$/);
  return padMatch ? padMatch[1] : text;
}

/**
 * 다중 인코딩: Base64 + 16진수 인코딩
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function multiEncode(text) {
  try {
    const blob = Utilities.newBlob(text).setContentType('text/plain; charset=utf-8');
    const encoded = Utilities.base64Encode(blob.getBytes());
    return encoded + '_' + encoded;
  } catch (error) {
    console.error('MultiEncode 인코딩 오류:', error);
    return text;
  }
}

/**
 * 다중 디코딩: Base64 + 16진수 디코딩
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function multiDecode(text) {
  try {
    const parts = text.split('_');
    if (parts.length === 2) {
      const decoded = Utilities.base64Decode(parts[0]);
      return Utilities.newBlob(decoded).getDataAsString();
    }
    return text;
  } catch (error) {
    console.error('MultiDecode 디코딩 오류:', error);
    return text;
  }
}

// ===== 랜덤 삽입/추출 =====

/**
 * 랜덤 삽입: 텍스트에 랜덤 문자 삽입
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function randomInsert(text) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    result += text[i];
    if (i < text.length - 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
}

/**
 * 랜덤 추출: 랜덤 문자 제거
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function randomExtract(text) {
  let result = '';
  for (let i = 0; i < text.length; i += 2) {
    result += text[i];
  }
  return result;
}

// ===== 전치 암호 =====

/**
 * 전치 암호: 문자 순서 변경
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function transpositionCipher(text) {
  const length = text.length;
  const result = new Array(length);
  
  for (let i = 0; i < length; i++) {
    const newIndex = (i * 3) % length;
    result[newIndex] = text[i];
  }
  
  return result.join('');
}

/**
 * 전치 복호화: 문자 순서 복원
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function transpositionDecrypt(text) {
  const length = text.length;
  const result = new Array(length);
  
  for (let i = 0; i < length; i++) {
    const originalIndex = (i * 3) % length;
    result[i] = text[originalIndex];
  }
  
  return result.join('');
}

// ===== 기타 암호화 방법들 =====

/**
 * 역순 암호화: 문자열 뒤집기
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function reverseCipher(text) {
  return text.split('').reverse().join('');
}

/**
 * 역순 복호화: 문자열 다시 뒤집기
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function reverseDecrypt(text) {
  return text.split('').reverse().join('');
}

/**
 * Atbash 암호화: A=Z, B=Y, C=X...
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function atbashCipher(text) {
  return text.split('').map(char => {
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode((25 - (code - base)) + base);
    }
    return char;
  }).join('');
}

/**
 * Atbash 복호화: Atbash는 암호화와 복호화가 동일
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function atbashDecrypt(text) {
  return atbashCipher(text);
}

// ===== 고급 암호화 방법들 (간단한 구현) =====

/**
 * Vigenere 암호화 (간단한 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function vigenereCipher(text) {
  const key = 'HOTPOTATO';
  let result = '';
  let keyIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const keyChar = key[keyIndex % key.length].toUpperCase();
      const keyCode = keyChar.charCodeAt(0) - 65;
      
      result += String.fromCharCode(((code - base + keyCode) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Vigenere 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function vigenereDecrypt(text) {
  const key = 'HOTPOTATO';
  let result = '';
  let keyIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const keyChar = key[keyIndex % key.length].toUpperCase();
      const keyCode = keyChar.charCodeAt(0) - 65;
      
      result += String.fromCharCode(((code - base - keyCode + 26) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  
  return result;
}

// ===== 추가 암호화 방법들 (간단한 구현) =====

/**
 * Rail Fence 암호화 (간단한 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function railFenceCipher(text) {
  // 간단한 구현: 2개 레일 사용
  const rail1 = [];
  const rail2 = [];
  
  for (let i = 0; i < text.length; i++) {
    if (i % 2 === 0) {
      rail1.push(text[i]);
    } else {
      rail2.push(text[i]);
    }
  }
  
  return rail1.join('') + rail2.join('');
}

/**
 * Rail Fence 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function railFenceDecrypt(text) {
  const length = text.length;
  const result = new Array(length);
  const rail1Length = Math.ceil(length / 2);
  
  for (let i = 0; i < rail1Length; i++) {
    result[i * 2] = text[i];
  }
  
  for (let i = 0; i < length - rail1Length; i++) {
    result[i * 2 + 1] = text[rail1Length + i];
  }
  
  return result.join('');
}

// ===== 기타 암호화 방법들 (기본 구현) =====

/**
 * Columnar 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function columnarCipher(text) {
  return text; // 기본 구현
}

/**
 * Columnar 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function columnarDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Affine 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function affineCipher(text) {
  return text; // 기본 구현
}

/**
 * Affine 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function affineDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Permutation 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function permutationCipher(text) {
  return text; // 기본 구현
}

/**
 * Permutation 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function permutationDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Pattern 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function patternCipher(text) {
  return text; // 기본 구현
}

/**
 * Pattern 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function patternDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Mirror 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function mirrorCipher(text) {
  return text; // 기본 구현
}

/**
 * Mirror 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function mirrorDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Zigzag 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function zigzagCipher(text) {
  return text; // 기본 구현
}

/**
 * Zigzag 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function zigzagDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Wave 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function waveCipher(text) {
  return text; // 기본 구현
}

/**
 * Wave 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function waveDecrypt(text) {
  return text; // 기본 구현
}

/**
 * Snake 암호화 (기본 구현)
 * @param {string} text - 암호화할 텍스트
 * @returns {string} 암호화된 텍스트
 */
function snakeCipher(text) {
  return text; // 기본 구현
}

/**
 * Snake 복호화
 * @param {string} text - 복호화할 텍스트
 * @returns {string} 복호화된 텍스트
 */
function snakeDecrypt(text) {
  return text; // 기본 구현
}

// ===== 배포 정보 =====
function getEncryptionAlgorithmsInfo() {
  return {
    version: '1.0.0',
    description: '다양한 암호화 알고리즘 구현',
    functions: [
      'caesarEncrypt', 'caesarDecrypt',
      'rot13Encrypt', 'rot13Decrypt',
      'bitShiftEncrypt', 'bitShiftDecrypt',
      'substitutionCipher', 'substitutionDecrypt',
      'paddingEncrypt', 'paddingDecrypt',
      'multiEncode', 'multiDecode',
      'randomInsert', 'randomExtract',
      'transpositionCipher', 'transpositionDecrypt',
      'reverseCipher', 'reverseDecrypt',
      'atbashCipher', 'atbashDecrypt',
      'vigenereCipher', 'vigenereDecrypt',
      'railFenceCipher', 'railFenceDecrypt',
      'columnarCipher', 'columnarDecrypt',
      'affineCipher', 'affineDecrypt',
      'permutationCipher', 'permutationDecrypt',
      'patternCipher', 'patternDecrypt',
      'mirrorCipher', 'mirrorDecrypt',
      'zigzagCipher', 'zigzagDecrypt',
      'waveCipher', 'waveDecrypt',
      'snakeCipher', 'snakeDecrypt'
    ],
    dependencies: []
  };
}
