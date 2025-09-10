const { google } = require('googleapis');

// ===== 다중 레이어 암호화 함수들 =====
function generateExtendedMultiLayerKey() {
  const methods = [
    'Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution',
    'Padding', 'MultiEncode', 'RandomInsert',
    'Transposition', 'Reverse', 'Atbash', 'Vigenere', 'RailFence',
    'Columnar', 'Affine', 'Permutation', 'Pattern', 'Mirror',
    'Zigzag', 'Wave', 'Snake'
  ];
  
  const layerCount = Math.floor(Math.random() * 11) + 5;
  const selectedMethods = [];
  
  for (let i = 0; i < layerCount; i++) {
    const randomIndex = Math.floor(Math.random() * methods.length);
    selectedMethods.push(methods[randomIndex]);
  }
  
  const baseKey = `ADMIN_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(2, 15)}`;
  
  let encryptedKey = baseKey;
  for (const method of selectedMethods) {
    encryptedKey = applyEncryption(encryptedKey, method, '');
  }
  
  return {
    key: encryptedKey,
    layers: selectedMethods,
    originalKey: baseKey
  };
}

// 텍스트에 특정 암호화 방법 적용
function applyEncryption(text, method, key) {
  switch (method) {
    case 'Base64':
      return Buffer.from(text).toString('base64');
    case 'Caesar':
      return caesarCipher(text, 13);
    case 'ROT13':
      return rot13(text);
    case 'BitShift':
      return bitShift(text, 7);
    case 'Substitution':
      return substitutionCipher(text);
    case 'Padding':
      return paddingEncrypt(text);
    case 'MultiEncode':
      return multiEncode(text);
    case 'RandomInsert':
      return randomInsert(text);
    case 'Transposition':
      return transpositionCipher(text);
    case 'Reverse':
      return reverseCipher(text);
    case 'Atbash':
      return atbashCipher(text);
    case 'Vigenere':
      return vigenereCipher(text);
    case 'RailFence':
      return railFenceCipher(text);
    case 'Columnar':
      return columnarCipher(text);
    case 'Affine':
      return affineCipher(text);
    case 'Permutation':
      return permutationCipher(text);
    case 'Pattern':
      return patternCipher(text);
    case 'Mirror':
      return mirrorCipher(text);
    case 'Zigzag':
      return zigzagCipher(text);
    case 'Wave':
      return waveCipher(text);
    case 'Snake':
      return snakeCipher(text);
    default:
      return text;
  }
}

// 텍스트에 특정 복호화 방법 적용
function applyDecryption(text, method, key) {
  switch (method) {
    case 'Base64':
      return Buffer.from(text, 'base64').toString();
    case 'Caesar':
      return caesarDecrypt(text, 13);
    case 'ROT13':
      return rot13Decrypt(text);
    case 'BitShift':
      return bitShiftDecrypt(text, 7);
    case 'Substitution':
      return substitutionDecrypt(text);
    case 'Padding':
      return paddingDecrypt(text);
    case 'MultiEncode':
      return multiDecode(text);
    case 'RandomInsert':
      return randomInsertDecrypt(text);
    case 'Transposition':
      return transpositionDecrypt(text);
    case 'Reverse':
      return reverseDecrypt(text);
    case 'Atbash':
      return atbashDecrypt(text);
    case 'Vigenere':
      return vigenereDecrypt(text);
    case 'RailFence':
      return railFenceDecrypt(text);
    case 'Columnar':
      return columnarDecrypt(text);
    case 'Affine':
      return affineDecrypt(text);
    case 'Permutation':
      return permutationDecrypt(text);
    case 'Pattern':
      return patternDecrypt(text);
    case 'Mirror':
      return mirrorDecrypt(text);
    case 'Zigzag':
      return zigzagDecrypt(text);
    case 'Wave':
      return waveDecrypt(text);
    case 'Snake':
      return snakeDecrypt(text);
    default:
      return text;
  }
}

// ===== 개별 암호화/복호화 함수들 =====
// XOR 암호화: 키와 텍스트를 XOR 연산
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

// XOR 복호화: XOR은 암호화와 복호화가 동일
function xorDecrypt(text, key) {
  return xorEncrypt(text, key);
}

// 시저 암호: 알파벳을 일정 거리만큼 이동
function caesarCipher(text, shift) {
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

// 시저 복호화: 반대 방향으로 이동
function caesarDecrypt(text, shift) {
  return caesarCipher(text, 26 - shift);
}

// ROT13: 13자리씩 이동 (암호화=복호화)
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

// ROT13 복호화: ROT13은 암호화와 복호화가 동일
function rot13Decrypt(text) {
  return rot13(text);
}

// 비트 시프트: ASCII 코드를 일정 값만큼 이동
function bitShift(text, shift) {
  return text.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) + shift);
  }).join('');
}

// 비트 시프트 복호화: 반대 방향으로 이동
function bitShiftDecrypt(text, shift) {
  return text.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) - shift);
  }).join('');
}

// 치환 암호: 알파벳을 다른 알파벳으로 교체
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

// 치환 복호화: 역 치환 테이블 사용
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

// 패딩: 텍스트 앞뒤에 랜덤 문자열 추가
function paddingEncrypt(text) {
  const padding = 'PAD_' + Math.random().toString(36).substring(2, 8);
  return padding + text + padding;
}

// 패딩 복호화: PAD_로 시작하고 끝나는 부분 제거
function paddingDecrypt(text) {
  const padMatch = text.match(/^PAD_[a-z0-9]+(.+)PAD_[a-z0-9]+$/);
  return padMatch ? padMatch[1] : text;
}

// 해시 기반: 텍스트 해시값을 앞에 추가
function hashBasedEncrypt(text, key) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(16) + text;
}

// 해시 기반 복호화: 해시 부분 제거
function hashBasedDecrypt(text, key) {
  // 16진수 해시 부분을 제거 (8자리 16진수)
  return text.substring(8);
}

// 압축: ASCII 코드를 16진수로 변환
function compressionEncrypt(text) {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(16);
  }).join('');
}

// 압축 복호화: 16진수를 ASCII로 변환
function compressionDecrypt(text) {
  let result = '';
  for (let i = 0; i < text.length; i += 2) {
    const hex = text.substr(i, 2);
    result += String.fromCharCode(parseInt(hex, 16));
  }
  return result;
}

// 다중 인코딩: Base64 + 16진수 인코딩
function multiEncode(text) {
  return Buffer.from(text).toString('base64') + '_' + Buffer.from(text).toString('hex');
}

// 다중 인코딩 복호화: Base64 부분만 사용
function multiDecode(text) {
  const parts = text.split('_');
  return Buffer.from(parts[0], 'base64').toString();
}

// 랜덤 삽입: 앞뒤에 짧은 랜덤 문자열 추가
function randomInsert(text) {
  const randomChars = Math.random().toString(36).substring(2, 6);
  return randomChars + text + randomChars;
}

// 랜덤 삽입 복호화: 앞뒤 4자리 제거
function randomInsertDecrypt(text) {
  return text.substring(4, text.length - 4);
}

// 체인 암호: XOR을 3번 연속 적용
function chainCipher(text, key) {
  let result = text;
  for (let i = 0; i < 3; i++) {
    result = xorEncrypt(result, key + i);
  }
  return result;
}

// 체인 복호화: 역순으로 XOR 적용
function chainDecrypt(text, key) {
  let result = text;
  for (let i = 2; i >= 0; i--) {
    result = xorDecrypt(result, key + i);
  }
  return result;
}

// 블록 암호: 4글자씩 블록으로 나누어 XOR 암호화
function blockCipher(text, key) {
  const blockSize = 4;
  let result = '';
  for (let i = 0; i < text.length; i += blockSize) {
    const block = text.substr(i, blockSize);
    result += xorEncrypt(block, key);
  }
  return result;
}

// 블록 복호화: 4글자씩 블록으로 나누어 XOR 복호화
function blockDecrypt(text, key) {
  const blockSize = 4;
  let result = '';
  for (let i = 0; i < text.length; i += blockSize) {
    const block = text.substr(i, blockSize);
    result += xorDecrypt(block, key);
  }
  return result;
}

// 스트림 암호: 각 문자를 키와 더해서 암호화
function streamCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const textChar = text.charCodeAt(i);
    result += String.fromCharCode((textChar + keyChar) % 256);
  }
  return result;
}

// 스트림 복호화: 각 문자에서 키를 빼서 복호화
function streamDecrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const textChar = text.charCodeAt(i);
    result += String.fromCharCode((textChar - keyChar + 256) % 256);
  }
  return result;
}

// 다중 알파벳: 각 문자마다 다른 시프트 값 사용
function polyalphabeticCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const keyShift = keyChar % 26;
    const char = text.charAt(i);
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      result += String.fromCharCode(((code - base + keyShift) % 26) + base);
    } else {
      result += char;
    }
  }
  return result;
}

// 다중 알파벳 복호화: 반대 방향으로 시프트
function polyalphabeticDecrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const keyShift = keyChar % 26;
    const char = text.charAt(i);
    if (char.match(/[a-zA-Z]/)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      result += String.fromCharCode(((code - base - keyShift + 26) % 26) + base);
    } else {
      result += char;
    }
  }
  return result;
}

// 전치 암호: 3열로 나누어 세로로 읽기
function transpositionCipher(text) {
  const cols = 3;
  let result = '';
  
  // 각 열에 대해 해당 위치의 문자들을 수집
  for (let col = 0; col < cols; col++) {
    for (let i = col; i < text.length; i += cols) {
      result += text[i];
    }
  }
  
  return result;
}

// 전치 복호화: 3열로 나누어 가로로 읽기
function transpositionDecrypt(text) {
  const cols = 3;
  const rows = Math.ceil(text.length / cols);
  const result = Array(text.length).fill('');
  
  // 암호화된 텍스트를 원래 위치에 배치
  let index = 0;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const originalIndex = row * cols + col;
      if (originalIndex < text.length && index < text.length) {
        result[originalIndex] = text[index++];
      }
    }
  }
  
  return result.join('');
}

// 하이브리드: XOR + Base64
function hybridEncrypt(text, key) {
  const xorResult = xorEncrypt(text, key);
  return Buffer.from(xorResult).toString('base64');
}

// 하이브리드 복호화: Base64 디코딩 + XOR
function hybridDecrypt(text, key) {
  const base64Result = Buffer.from(text, 'base64').toString();
  return xorDecrypt(base64Result, key);
}

// 고급 XOR: XOR 연산 사용
function advancedXOR(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const textChar = text.charCodeAt(i);
    const xorResult = textChar ^ keyChar;
    result += String.fromCharCode(xorResult);
  }
  return result;
}

// 고급 XOR 복호화: XOR은 암호화와 복호화가 동일
function advancedXORDecrypt(text, key) {
  return advancedXOR(text, key);
}

// 다중 해시: 해시값에 키 길이 XOR
function multiHash(text, key) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  return (hash ^ key.length).toString(16) + text;
}

// 다중 해시 복호화: 해시 부분 제거
function multiHashDecrypt(text, key) {
  return text.substring(8);
}

// 동적 암호: 키에 텍스트 길이 추가
function dynamicCipher(text, key) {
  const dynamicKey = key + text.length;
  return xorEncrypt(text, dynamicKey);
}

// 동적 복호화: 키에 텍스트 길이 추가하여 복호화
function dynamicDecrypt(text, key) {
  const dynamicKey = key + text.length;
  return xorDecrypt(text, dynamicKey);
}

// 스텔스: 'STEALTH_' 문자열로 감싸기
function stealthCipher(text, key) {
  const stealth = 'STEALTH_' + Math.random().toString(36).substring(2, 6);
  return stealth + xorEncrypt(text, key) + stealth;
}

// 스텔스 복호화: STEALTH_ 부분 제거 후 XOR 복호화
function stealthDecrypt(text, key) {
  const stealthMatch = text.match(/^STEALTH_[a-z0-9]+(.+)STEALTH_[a-z0-9]+$/);
  if (stealthMatch) {
    return xorDecrypt(stealthMatch[1], key);
  }
  return text;
}

// 양자 안전: 'QUANTUM_' + 타임스탬프
function quantumSafeEncrypt(text, key) {
  const quantum = 'QUANTUM_' + Date.now().toString(36);
  return quantum + text + quantum;
}

// 양자 안전 복호화: QUANTUM_ 부분 제거
function quantumSafeDecrypt(text, key) {
  const quantumMatch = text.match(/^QUANTUM_[a-z0-9]+(.+)QUANTUM_[a-z0-9]+$/);
  return quantumMatch ? quantumMatch[1] : text;
}

// 생체 기반: 'BIO_' + 키 길이
function biometricBasedEncrypt(text, key) {
  const biometric = 'BIO_' + key.length.toString(36);
  return biometric + text + biometric;
}

// 생체 기반 복호화: BIO_ 부분 제거
function biometricBasedDecrypt(text, key) {
  const bioMatch = text.match(/^BIO_[a-z0-9]+(.+)BIO_[a-z0-9]+$/);
  return bioMatch ? bioMatch[1] : text;
}

// 신경망: 'NEURAL_' + 랜덤 문자열
function neuralNetworkEncrypt(text, key) {
  const neural = 'NEURAL_' + Math.random().toString(36).substring(2, 5);
  return neural + text + neural;
}

// 신경망 복호화: NEURAL_ 부분 제거
function neuralNetworkDecrypt(text, key) {
  const neuralMatch = text.match(/^NEURAL_[a-z0-9]+(.+)NEURAL_[a-z0-9]+$/);
  return neuralMatch ? neuralMatch[1] : text;
}

// 카오스 이론: 'CHAOS_' + 밀리초
function chaosTheoryEncrypt(text, key) {
  const chaos = 'CHAOS_' + (Date.now() % 1000).toString(36);
  return chaos + text + chaos;
}

// 카오스 이론 복호화: CHAOS_ 부분 제거
function chaosTheoryDecrypt(text, key) {
  const chaosMatch = text.match(/^CHAOS_[a-z0-9]+(.+)CHAOS_[a-z0-9]+$/);
  return chaosMatch ? chaosMatch[1] : text;
}

// ===== 새로운 암호화 함수들 =====
// Reverse 암호화: 문자열 뒤집기
function reverseCipher(text) {
  return text.split('').reverse().join('');
}

// Reverse 복호화: 문자열 뒤집기
function reverseDecrypt(text) {
  return text.split('').reverse().join('');
}

// Atbash 암호화: 알파벳을 뒤집어서 치환
function atbashCipher(text) {
  return text.split('').map(char => {
    if (char >= 'A' && char <= 'Z') {
      return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
    } else if (char >= 'a' && char <= 'z') {
      return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
    }
    return char;
  }).join('');
}

// Atbash 복호화: Atbash와 동일
function atbashDecrypt(text) {
  return atbashCipher(text);
}

// Vigenere 암호화: 키워드 기반 시저 암호
function vigenereCipher(text) {
  const key = 'HOTPOTATO';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const keyChar = key[i % key.length];
    if (char >= 'A' && char <= 'Z') {
      const shift = keyChar.charCodeAt(0) - 65;
      result += String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
    } else if (char >= 'a' && char <= 'z') {
      const shift = keyChar.charCodeAt(0) - 65;
      result += String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
    } else {
      result += char;
    }
  }
  return result;
}

// Vigenere 복호화: Vigenere의 역과정
function vigenereDecrypt(text) {
  const key = 'HOTPOTATO';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const keyChar = key[i % key.length];
    if (char >= 'A' && char <= 'Z') {
      const shift = keyChar.charCodeAt(0) - 65;
      result += String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
    } else if (char >= 'a' && char <= 'z') {
      const shift = keyChar.charCodeAt(0) - 65;
      result += String.fromCharCode(((char.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
    } else {
      result += char;
    }
  }
  return result;
}

// Rail Fence 암호화: 지그재그 패턴으로 배열
function railFenceCipher(text) {
  const rails = 3;
  const fence = Array(rails).fill().map(() => []);
  let rail = 0;
  let direction = 1;
  
  for (let i = 0; i < text.length; i++) {
    fence[rail].push(text[i]);
    rail += direction;
    if (rail === rails - 1 || rail === 0) {
      direction = -direction;
    }
  }
  
  return fence.flat().join('');
}

// Rail Fence 복호화: 지그재그 패턴 복원
function railFenceDecrypt(text) {
  const rails = 3;
  const fence = Array(rails).fill().map(() => []);
  let rail = 0;
  let direction = 1;
  
  // 각 레일에 몇 개의 문자가 들어가는지 계산
  const railLengths = Array(rails).fill(0);
  for (let i = 0; i < text.length; i++) {
    railLengths[rail]++;
    rail += direction;
    if (rail === rails - 1 || rail === 0) {
      direction = -direction;
    }
  }
  
  // 각 레일에 문자 할당
  let textIndex = 0;
  for (let i = 0; i < rails; i++) {
    fence[i] = text.slice(textIndex, textIndex + railLengths[i]).split('');
    textIndex += railLengths[i];
  }
  
  // 원래 순서로 복원
  let result = '';
  rail = 0;
  direction = 1;
  const railIndices = Array(rails).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    result += fence[rail][railIndices[rail]];
    railIndices[rail]++;
    rail += direction;
    if (rail === rails - 1 || rail === 0) {
      direction = -direction;
    }
  }
  
  return result;
}

// Columnar 암호화: 열 단위로 재배열
function columnarCipher(text) {
  const cols = 4;
  const rows = Math.ceil(text.length / cols);
  const matrix = Array(rows).fill().map(() => Array(cols).fill(''));
  
  let index = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Columnar 복호화: 열 단위 재배열 복원
function columnarDecrypt(text) {
  const cols = 4;
  const rows = Math.ceil(text.length / cols);
  const matrix = Array(rows).fill().map(() => Array(cols).fill(''));
  
  let index = 0;
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Playfair 암호화: 5x5 그리드 기반
function playfairCipher(text) {
  const key = 'HOTPOTATO';
  const grid = createPlayfairGrid(key);
  let result = '';
  
  for (let i = 0; i < text.length; i += 2) {
    const pair = text.slice(i, i + 2);
    if (pair.length === 1) pair += 'X';
    
    const pos1 = findPosition(grid, pair[0]);
    const pos2 = findPosition(grid, pair[1]);
    
    if (pos1.row === pos2.row) {
      result += grid[pos1.row][(pos1.col + 1) % 5];
      result += grid[pos2.row][(pos2.col + 1) % 5];
    } else if (pos1.col === pos2.col) {
      result += grid[(pos1.row + 1) % 5][pos1.col];
      result += grid[(pos2.row + 1) % 5][pos2.col];
    } else {
      result += grid[pos1.row][pos2.col];
      result += grid[pos2.row][pos1.col];
    }
  }
  
  return result;
}

// Playfair 복호화: Playfair의 역과정
function playfairDecrypt(text) {
  const key = 'HOTPOTATO';
  const grid = createPlayfairGrid(key);
  let result = '';
  
  for (let i = 0; i < text.length; i += 2) {
    const pair = text.slice(i, i + 2);
    if (pair.length === 1) pair += 'X';
    
    const pos1 = findPosition(grid, pair[0]);
    const pos2 = findPosition(grid, pair[1]);
    
    if (pos1.row === pos2.row) {
      result += grid[pos1.row][(pos1.col - 1 + 5) % 5];
      result += grid[pos2.row][(pos2.col - 1 + 5) % 5];
    } else if (pos1.col === pos2.col) {
      result += grid[(pos1.row - 1 + 5) % 5][pos1.col];
      result += grid[(pos2.row - 1 + 5) % 5][pos2.col];
    } else {
      result += grid[pos1.row][pos2.col];
      result += grid[pos2.row][pos1.col];
    }
  }
  
  return result;
}

// Playfair 그리드 생성
function createPlayfairGrid(key) {
  const grid = Array(5).fill().map(() => Array(5).fill(''));
  const used = new Set();
  let keyIndex = 0;
  let charIndex = 0;
  
  // 키 채우기
  for (let i = 0; i < key.length; i++) {
    const char = key[i].toUpperCase();
    if (char === 'J') continue; // J는 I로 처리
    if (!used.has(char)) {
      grid[Math.floor(keyIndex / 5)][keyIndex % 5] = char;
      used.add(char);
      keyIndex++;
    }
  }
  
  // 나머지 알파벳 채우기
  for (let i = 0; i < 26; i++) {
    const char = String.fromCharCode(65 + i);
    if (char === 'J') continue;
    if (!used.has(char)) {
      grid[Math.floor(keyIndex / 5)][keyIndex % 5] = char;
      used.add(char);
      keyIndex++;
    }
  }
  
  return grid;
}

// Playfair 위치 찾기
function findPosition(grid, char) {
  const upperChar = char.toUpperCase();
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (grid[i][j] === upperChar) {
        return { row: i, col: j };
      }
    }
  }
  return { row: 0, col: 0 };
}

// Affine 암호화: ax + b (mod 26)
function affineCipher(text) {
  const a = 5; // 5와 26은 서로소
  const b = 8;
  
  return text.split('').map(char => {
    if (char >= 'A' && char <= 'Z') {
      const x = char.charCodeAt(0) - 65;
      const y = (a * x + b) % 26;
      return String.fromCharCode(y + 65);
    } else if (char >= 'a' && char <= 'z') {
      const x = char.charCodeAt(0) - 97;
      const y = (a * x + b) % 26;
      return String.fromCharCode(y + 97);
    }
    return char;
  }).join('');
}

// Affine 복호화: a^(-1)(y - b) (mod 26)
function affineDecrypt(text) {
  const a = 5;
  const b = 8;
  const aInv = 21; // 5 * 21 = 105 ≡ 1 (mod 26)
  
  return text.split('').map(char => {
    if (char >= 'A' && char <= 'Z') {
      const y = char.charCodeAt(0) - 65;
      const x = (aInv * (y - b + 26)) % 26;
      return String.fromCharCode(x + 65);
    } else if (char >= 'a' && char <= 'z') {
      const y = char.charCodeAt(0) - 97;
      const x = (aInv * (y - b + 26)) % 26;
      return String.fromCharCode(x + 97);
    }
    return char;
  }).join('');
}

// Hill 암호화: 2x2 행렬 기반
function hillCipher(text) {
  const matrix = [[2, 3], [1, 4]];
  let result = '';
  
  for (let i = 0; i < text.length; i += 2) {
    const pair = text.slice(i, i + 2);
    if (pair.length === 1) pair += 'X';
    
    const x1 = pair[0].toUpperCase().charCodeAt(0) - 65;
    const x2 = pair[1].toUpperCase().charCodeAt(0) - 65;
    
    const y1 = (matrix[0][0] * x1 + matrix[0][1] * x2) % 26;
    const y2 = (matrix[1][0] * x1 + matrix[1][1] * x2) % 26;
    
    result += String.fromCharCode(y1 + 65);
    result += String.fromCharCode(y2 + 65);
  }
  
  return result;
}

// Hill 복호화: Hill의 역과정
function hillDecrypt(text) {
  const matrix = [[2, 3], [1, 4]];
  const det = (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0] + 26) % 26;
  const detInv = 15; // 15 * 7 = 105 ≡ 1 (mod 26)
  
  const invMatrix = [
    [(matrix[1][1] * detInv) % 26, (-matrix[0][1] * detInv + 26) % 26],
    [(-matrix[1][0] * detInv + 26) % 26, (matrix[0][0] * detInv) % 26]
  ];
  
  let result = '';
  
  for (let i = 0; i < text.length; i += 2) {
    const pair = text.slice(i, i + 2);
    if (pair.length === 1) pair += 'X';
    
    const y1 = pair[0].toUpperCase().charCodeAt(0) - 65;
    const y2 = pair[1].toUpperCase().charCodeAt(0) - 65;
    
    const x1 = (invMatrix[0][0] * y1 + invMatrix[0][1] * y2) % 26;
    const x2 = (invMatrix[1][0] * y1 + invMatrix[1][1] * y2) % 26;
    
    result += String.fromCharCode(x1 + 65);
    result += String.fromCharCode(x2 + 65);
  }
  
  return result;
}

// Permutation 암호화: 문자 순서 변경
function permutationCipher(text) {
  const positions = [2, 0, 3, 1, 4]; // 고정된 순열
  let result = '';
  
  for (let i = 0; i < text.length; i += 5) {
    const block = text.slice(i, i + 5);
    const paddedBlock = block.padEnd(5, 'X');
    for (let j = 0; j < 5; j++) {
      result += paddedBlock[positions[j]];
    }
  }
  
  return result;
}

// Permutation 복호화: 순열 복원
function permutationDecrypt(text) {
  const positions = [2, 0, 3, 1, 4];
  const invPositions = Array(5);
  for (let i = 0; i < 5; i++) {
    invPositions[positions[i]] = i;
  }
  
  let result = '';
  
  for (let i = 0; i < text.length; i += 5) {
    const block = text.slice(i, i + 5);
    for (let j = 0; j < 5; j++) {
      result += block[invPositions[j]];
    }
  }
  
  // 패딩으로 추가된 X 제거
  return result.replace(/X+$/, '');
}

// Frequency 암호화: 빈도 기반 치환
function frequencyCipher(text) {
  const freq = {};
  for (let char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const mapping = {};
  const reverseMapping = {};
  
  for (let i = 0; i < sorted.length; i++) {
    mapping[sorted[i][0]] = String.fromCharCode(65 + i);
    reverseMapping[String.fromCharCode(65 + i)] = sorted[i][0];
  }
  
  return text.split('').map(char => mapping[char] || char).join('');
}

// Frequency 복호화: 빈도 기반 치환 복원
function frequencyDecrypt(text) {
  // Frequency 암호화는 비가역적이므로 원본 그대로 반환
  // 실제로는 빈도 분석이 필요하지만 단순화
  return text;
}

// Pattern 암호화: 패턴 기반 재배열
function patternCipher(text) {
  const pattern = [0, 2, 4, 1, 3, 5]; // 6자리 패턴
  let result = '';
  
  for (let i = 0; i < text.length; i += 6) {
    const block = text.slice(i, i + 6);
    const paddedBlock = block.padEnd(6, 'X');
    for (let j = 0; j < 6; j++) {
      result += paddedBlock[pattern[j]];
    }
  }
  
  return result;
}

// Pattern 복호화: 패턴 복원
function patternDecrypt(text) {
  const pattern = [0, 2, 4, 1, 3, 5];
  const invPattern = Array(6);
  for (let i = 0; i < 6; i++) {
    invPattern[pattern[i]] = i;
  }
  
  let result = '';
  
  for (let i = 0; i < text.length; i += 6) {
    const block = text.slice(i, i + 6);
    for (let j = 0; j < 6; j++) {
      result += block[invPattern[j]];
    }
  }
  
  // 패딩으로 추가된 X 제거
  return result.replace(/X+$/, '');
}

// Mirror 암호화: 거울상 반사
function mirrorCipher(text) {
  return text.split('').map(char => {
    if (char >= 'A' && char <= 'Z') {
      return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
    } else if (char >= 'a' && char <= 'z') {
      return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
    }
    return char;
  }).join('');
}

// Mirror 복호화: Mirror와 동일
function mirrorDecrypt(text) {
  return mirrorCipher(text);
}

// Spiral 암호화: 나선형 배열
function spiralCipher(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  let top = 0, bottom = size - 1, left = 0, right = size - 1;
  
  while (top <= bottom && left <= right) {
    for (let i = left; i <= right; i++) {
      result += matrix[top][i];
    }
    top++;
    
    for (let i = top; i <= bottom; i++) {
      result += matrix[i][right];
    }
    right--;
    
    if (top <= bottom) {
      for (let i = right; i >= left; i--) {
        result += matrix[bottom][i];
      }
      bottom--;
    }
    
    if (left <= right) {
      for (let i = bottom; i >= top; i--) {
        result += matrix[i][left];
      }
      left++;
    }
  }
  
  return result;
}

// Spiral 복호화: 나선형 배열 복원
function spiralDecrypt(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  let top = 0, bottom = size - 1, left = 0, right = size - 1;
  
  while (top <= bottom && left <= right && index < text.length) {
    for (let i = left; i <= right && index < text.length; i++) {
      matrix[top][i] = text[index++];
    }
    top++;
    
    for (let i = top; i <= bottom && index < text.length; i++) {
      matrix[i][right] = text[index++];
    }
    right--;
    
    if (top <= bottom) {
      for (let i = right; i >= left && index < text.length; i--) {
        matrix[bottom][i] = text[index++];
      }
      bottom--;
    }
    
    if (left <= right) {
      for (let i = bottom; i >= top && index < text.length; i--) {
        matrix[i][left] = text[index++];
      }
      left++;
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Zigzag 암호화: 지그재그 패턴
function zigzagCipher(text) {
  const rows = 3;
  const zigzag = Array(rows).fill().map(() => []);
  let row = 0;
  let direction = 1;
  
  for (let i = 0; i < text.length; i++) {
    zigzag[row].push(text[i]);
    row += direction;
    if (row === rows - 1 || row === 0) {
      direction = -direction;
    }
  }
  
  return zigzag.flat().join('');
}

// Zigzag 복호화: 지그재그 패턴 복원
function zigzagDecrypt(text) {
  const rows = 3;
  const zigzag = Array(rows).fill().map(() => []);
  let row = 0;
  let direction = 1;
  
  // 각 행에 몇 개의 문자가 들어가는지 계산
  const rowLengths = Array(rows).fill(0);
  for (let i = 0; i < text.length; i++) {
    rowLengths[row]++;
    row += direction;
    if (row === rows - 1 || row === 0) {
      direction = -direction;
    }
  }
  
  // 각 행에 문자 할당
  let textIndex = 0;
  for (let i = 0; i < rows; i++) {
    zigzag[i] = text.slice(textIndex, textIndex + rowLengths[i]).split('');
    textIndex += rowLengths[i];
  }
  
  // 원래 순서로 복원
  let result = '';
  row = 0;
  direction = 1;
  const rowIndices = Array(rows).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    result += zigzag[row][rowIndices[row]];
    rowIndices[row]++;
    row += direction;
    if (row === rows - 1 || row === 0) {
      direction = -direction;
    }
  }
  
  return result;
}

// Diagonal 암호화: 대각선 패턴
function diagonalCipher(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  for (let d = 0; d < size + size - 1; d++) {
    for (let i = 0; i < size; i++) {
      const j = d - i;
      if (j >= 0 && j < size) {
        result += matrix[i][j];
      }
    }
  }
  
  return result;
}

// Diagonal 복호화: 대각선 패턴 복원
function diagonalDecrypt(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let d = 0; d < size + size - 1; d++) {
    for (let i = 0; i < size; i++) {
      const j = d - i;
      if (j >= 0 && j < size && index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Wave 암호화: 파도 패턴
function waveCipher(text) {
  const amplitude = 3;
  const wave = Array(amplitude * 2 + 1).fill().map(() => []);
  
  for (let i = 0; i < text.length; i++) {
    const position = Math.floor(i / 4) % (amplitude * 2);
    wave[position].push(text[i]);
  }
  
  return wave.flat().join('');
}

// Wave 복호화: 파도 패턴 복원
function waveDecrypt(text) {
  const amplitude = 3;
  const wave = Array(amplitude * 2 + 1).fill().map(() => []);
  
  // 각 위치에 몇 개의 문자가 들어가는지 계산
  const positionCounts = Array(amplitude * 2 + 1).fill(0);
  for (let i = 0; i < text.length; i++) {
    const position = Math.floor(i / 4) % (amplitude * 2);
    positionCounts[position]++;
  }
  
  // 각 위치에 문자 할당
  let textIndex = 0;
  for (let i = 0; i < amplitude * 2 + 1; i++) {
    wave[i] = text.slice(textIndex, textIndex + positionCounts[i]).split('');
    textIndex += positionCounts[i];
  }
  
  // 원래 순서로 복원
  let result = '';
  const positionIndices = Array(amplitude * 2 + 1).fill(0);
  for (let i = 0; i < text.length; i++) {
    const position = Math.floor(i / 4) % (amplitude * 2);
    result += wave[position][positionIndices[position]];
    positionIndices[position]++;
  }
  
  return result;
}

// Snake 암호화: 뱀 패턴
function snakeCipher(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    if (i % 2 === 0) {
      for (let j = 0; j < size; j++) {
        result += matrix[i][j];
      }
    } else {
      for (let j = size - 1; j >= 0; j--) {
        result += matrix[i][j];
      }
    }
  }
  
  return result;
}

// Snake 복호화: 뱀 패턴 복원
function snakeDecrypt(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    if (i % 2 === 0) {
      for (let j = 0; j < size; j++) {
        if (index < text.length) {
          matrix[i][j] = text[index++];
        }
      }
    } else {
      for (let j = size - 1; j >= 0; j--) {
        if (index < text.length) {
          matrix[i][j] = text[index++];
        }
      }
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Maze 암호화: 미로 패턴
function mazeCipher(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  let visited = Array(size).fill().map(() => Array(size).fill(false));
  let i = 0, j = 0;
  let direction = 0; // 0: right, 1: down, 2: left, 3: up
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  
  while (result.length < text.length) {
    if (!visited[i][j]) {
      result += matrix[i][j];
      visited[i][j] = true;
    }
    
    const nextI = i + directions[direction][0];
    const nextJ = j + directions[direction][1];
    
    if (nextI >= 0 && nextI < size && nextJ >= 0 && nextJ < size && !visited[nextI][nextJ]) {
      i = nextI;
      j = nextJ;
    } else {
      direction = (direction + 1) % 4;
    }
  }
  
  return result;
}

// Maze 복호화: 미로 패턴 복원
function mazeDecrypt(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  let visited = Array(size).fill().map(() => Array(size).fill(false));
  let i = 0, j = 0;
  let direction = 0;
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  
  while (index < text.length) {
    if (!visited[i][j]) {
      matrix[i][j] = text[index++];
      visited[i][j] = true;
    }
    
    const nextI = i + directions[direction][0];
    const nextJ = j + directions[direction][1];
    
    if (nextI >= 0 && nextI < size && nextJ >= 0 && nextJ < size && !visited[nextI][nextJ]) {
      i = nextI;
      j = nextJ;
    } else {
      direction = (direction + 1) % 4;
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// Labyrinth 암호화: 미로 패턴 (다른 방식)
function labyrinthCipher(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (index < text.length) {
        matrix[i][j] = text[index++];
      }
    }
  }
  
  let result = '';
  let i = 0, j = 0;
  let direction = 0; // 0: right, 1: down, 2: left, 3: up
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const visited = Array(size).fill().map(() => Array(size).fill(false));
  
  while (result.length < text.length) {
    if (!visited[i][j]) {
      result += matrix[i][j];
      visited[i][j] = true;
    }
    
    const nextI = i + directions[direction][0];
    const nextJ = j + directions[direction][1];
    
    if (nextI >= 0 && nextI < size && nextJ >= 0 && nextJ < size && !visited[nextI][nextJ]) {
      i = nextI;
      j = nextJ;
    } else {
      direction = (direction + 1) % 4;
    }
  }
  
  return result;
}

// Labyrinth 복호화: 미로 패턴 복원
function labyrinthDecrypt(text) {
  const size = Math.ceil(Math.sqrt(text.length));
  const matrix = Array(size).fill().map(() => Array(size).fill(''));
  
  let index = 0;
  let i = 0, j = 0;
  let direction = 0;
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const visited = Array(size).fill().map(() => Array(size).fill(false));
  
  while (index < text.length) {
    if (!visited[i][j]) {
      matrix[i][j] = text[index++];
      visited[i][j] = true;
    }
    
    const nextI = i + directions[direction][0];
    const nextJ = j + directions[direction][1];
    
    if (nextI >= 0 && nextI < size && nextJ >= 0 && nextJ < size && !visited[nextI][nextJ]) {
      i = nextI;
      j = nextJ;
    } else {
      direction = (direction + 1) % 4;
    }
  }
  
  let result = '';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += matrix[i][j];
    }
  }
  
  return result;
}

// ===== 테스트 함수 =====
// 시트 데이터로 복호화 테스트
function testDecryption() {
  const encryptedKey = 'STIL_JIEPFVIJVSBTWUZ[_KTRW]W\\P';
  const layersUsed = 'Diagonal, BitShift, RailFence, Permutation, BitShift, Columnar, Permutation, Hill, Reverse, BitShift, Affine, Permutation, Permutation, RailFence, Wave';
  
  console.log('=== 복호화 테스트 시작 ===');
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
      break;
    }
  }
  
  console.log('최종 복호화된 키:', decryptedKey);
  console.log('=== 복호화 테스트 완료 ===');
  
  return decryptedKey;
}

// ===== Google API 관련 함수들 =====
// Google API 인증 클라이언트 가져오기
async function getAuthClient() {
  try {
    console.log('Google API 인증 클라이언트 생성 시작...');
    console.log('서비스 계정 파일 경로:', 'admin-key-service.json');
    console.log('요청된 스코프:', [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ]);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: 'admin-key-service.json',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    
    const client = await auth.getClient();
    console.log('Google API 인증 클라이언트 생성 성공');
    return client;
  } catch (error) {
    console.error('인증 클라이언트 생성 실패:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack
    });
    throw new Error('Google API 인증 실패: ' + error.message);
  }
}

// hp_member 스프레드시트 찾기
async function findHpMemberSheet(auth) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.list({
      q: "name='hp_member' and mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)'
    });
    
    if (!response.data.files || response.data.files.length === 0) {
      throw new Error('hp_member 스프레드시트를 찾을 수 없습니다');
    }
    
    const spreadsheetId = response.data.files[0].id;
    console.log(`hp_member 스프레드시트 찾음: ${spreadsheetId}`);
    
    return { spreadsheetId, sheets: google.sheets({ version: 'v4', auth }) };
  } catch (error) {
    console.error('스프레드시트 찾기 실패:', error);
    throw new Error('hp_member 스프레드시트를 찾을 수 없습니다');
  }
}

// ===== 시간 관련 함수들 =====
// 한국 표준시(KST) 가져오기
function getKSTTime() {
  const now = new Date();
  const kstOffset = 9 * 60; // UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst;
}

// KST 포맷팅
function formatKSTTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} KST`;
}

// ===== CORS 헤더 설정 함수 =====
function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

// ===== 스프레드시트 업데이트 함수 =====
// hp_member의 admin_keys 시트에 새로운 관리자 키 업데이트
async function updateSpreadsheetKey(auth, newKey, layers) {
  try {
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    const now = getKSTTime();
    const expiryKST = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후 KST
    
    // admin_keys 시트의 현재 구조 확인
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A1:Z10'
    });
    
    console.log('현재 admin_keys 시트 데이터:', currentData.data.values);
    
    // 시트 구조에 맞게 업데이트 (KST 시간을 문자열로 저장)
    const updateData = [
      ['unified_admin_key', 'key_expiry', 'last_updated', 'layers_used'],
      [newKey, formatKSTTime(expiryKST), formatKSTTime(now), layers.join(',')]
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'admin_keys!A1:D2',
      valueInputOption: 'RAW',
      resource: { values: updateData }
    });
    
    console.log('Spreadsheet key update complete');
    console.log(`업데이트 시간: ${formatKSTTime(now)}`);
    console.log(`만료 시간: ${formatKSTTime(expiryKST)}`);
    console.log(`사용된 레이어: ${layers.join(', ')}`);
  } catch (error) {
    console.error('Error updating spreadsheet key:', error);
    throw error;
  }
}

// ===== 관리자 키 검증 함수 =====
// 입력된 키가 현재 저장된 관리자 키와 일치하는지 확인
async function verifyAdminKey(inputKey) {
  try {
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // hp_member의 admin_keys 시트에서 현재 키와 레이어 정보 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A2:D2'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const storedKey = response.data.values[0][0];
    const layersUsed = response.data.values[0][3]; // D열: layers_used
    
    console.log('저장된 키:', storedKey.substring(0, 20) + '...');
    console.log('사용된 레이어:', layersUsed);
    
    // 레이어 정보가 있는 경우 복호화 검증 수행
    if (layersUsed) {
      const layers = layersUsed.split(',');
      console.log('레이어 목록:', layers);
      
      // 저장된 키를 레이어 순서의 역순으로 복호화하여 원본 키 추출
      let decryptedKey = storedKey;
      
      // 레이어 순서의 역순으로 복호화 적용 (baseKey 없이)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        decryptedKey = applyDecryption(decryptedKey, layer, '');
      }
      
      console.log('복호화된 저장된 키:', decryptedKey.substring(0, 20) + '...');
      console.log('입력값과 비교:', decryptedKey === inputKey);
      
      const isValid = decryptedKey === inputKey;
      
      console.log(`관리자 키 검증 (복호화 방식): ${isValid ? '성공' : '실패'}`);
      return {
        isValid,
        message: isValid ? '관리자 키가 일치합니다' : '관리자 키가 일치하지 않습니다',
        verificationMethod: 'decryption'
      };
    } else {
      // 레이어 정보가 없는 경우 단순 문자열 비교
    const isValid = inputKey === storedKey;
    
      console.log(`관리자 키 검증 (단순 비교): ${isValid ? '성공' : '실패'}`);
    return {
      isValid,
        message: isValid ? '관리자 키가 일치합니다' : '관리자 키가 일치하지 않습니다',
        verificationMethod: 'simple'
    };
    }
    
  } catch (error) {
    console.error('관리자 키 검증 실패:', error);
    throw new Error('키 검증 중 오류가 발생했습니다');
  }
}

// ===== 관리자 키 조회 함수 (이메일 전송은 프론트엔드에서 처리) =====
async function getDecryptedAdminKey() {
  try {
    console.log('관리자 키 조회 시작...');
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A2:D2'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const currentAdminKey = response.data.values[0][0];
    const layersUsed = response.data.values[0][3];
    
    console.log('관리자 키 조회 완료:', currentAdminKey.substring(0, 10) + '...');
    console.log('사용된 레이어:', layersUsed);
    
    // 복호화된 키 생성
    let decryptedKey = currentAdminKey;
    if (layersUsed) {
      const layers = layersUsed.split(',');
      console.log('레이어 목록:', layers);
      
      // 레이어 순서의 역순으로 복호화 적용 (baseKey 없이)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        decryptedKey = applyDecryption(decryptedKey, layer, '');
      }
      
      console.log('복호화된 키:', decryptedKey.substring(0, 20) + '...');
    }
    
    return {
      success: true,
      adminKey: decryptedKey,
      encryptedKey: currentAdminKey,
      layersUsed: layersUsed
    };
    
  } catch (error) {
    console.error('관리자 키 조회 실패:', error);
    throw error;
  }
}

// ===== 프론트엔드용 이메일 템플릿 생성 함수 =====
function generateEmailTemplate(userEmail, adminKey) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .key-container { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .admin-key { 
            font-family: monospace; 
            font-size: 14px; 
            word-break: break-all; 
            background-color: #fff; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 3px; 
            user-select: all;
            cursor: text;
        }
        .copy-btn { 
            background-color: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px; 
            margin-top: 10px; 
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        .copy-btn:hover { 
            background-color: #0056b3; 
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.4);
        }
        .copy-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Hot Potato 관리자 회원가입 키</h2>
        </div>
        
        <p>안녕하세요!</p>
        
        <p>Hot Potato 관리자 회원가입을 위한 관리자 키입니다.</p>
        
        <div class="key-container">
            <strong>관리자 키:</strong>
            <div class="admin-key" id="adminKey">${adminKey}</div>
            <button class="copy-btn" onclick="copyToClipboard()">복사하기</button>
        </div>
        
        <p>이 키를 사용하여 관리자로 회원가입할 수 있습니다.</p>
        <p>키는 매일 자정에 자동으로 갱신됩니다.</p>
        
        <div class="footer">
            <p>감사합니다.<br>Hot Potato 팀</p>
        </div>
    </div>
    
    <script>
        function copyToClipboard() {
            const keyElement = document.getElementById('adminKey');
            const text = keyElement.textContent;
            
            // 다양한 복사 방법 시도
            if (navigator.clipboard && window.isSecureContext) {
                // 최신 브라우저의 Clipboard API 사용
                navigator.clipboard.writeText(text).then(function() {
                    showCopySuccess();
                }).catch(function(err) {
                    console.error('Clipboard API 복사 실패:', err);
                    fallbackCopy(text);
                });
            } else {
                // 구형 브라우저를 위한 fallback
                fallbackCopy(text);
            }
        }
        
        function fallbackCopy(text) {
            // 텍스트 영역을 생성하여 복사
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopySuccess();
                } else {
                    showCopyError();
                }
            } catch (err) {
                console.error('execCommand 복사 실패:', err);
                showCopyError();
            } finally {
                document.body.removeChild(textArea);
            }
        }
        
        function showCopySuccess() {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '복사됨!';
            btn.style.backgroundColor = '#28a745';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#007bff';
            }, 2000);
        }
        
        function showCopyError() {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '복사 실패';
            btn.style.backgroundColor = '#dc3545';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#007bff';
            }, 2000);
            
            // 사용자에게 수동 복사 안내
            const keyElement = document.getElementById('adminKey');
            keyElement.style.backgroundColor = '#fff3cd';
            keyElement.style.border = '2px solid #ffc107';
            keyElement.style.cursor = 'text';
            keyElement.setAttribute('contenteditable', 'true');
            keyElement.focus();
            
            // 텍스트 선택
            if (window.getSelection) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(keyElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    </script>
</body>
</html>
  `;
  
  return {
    html: emailContent.trim(),
    subject: 'Hot Potato 관리자 회원가입 키',
    subjectEncoded: '=?UTF-8?B?' + Buffer.from('Hot Potato 관리자 회원가입 키').toString('base64') + '?=',
    to: userEmail,
    adminKey: adminKey
  };
}

// ===== 승인 상태 확인 함수 =====
async function checkUserApprovalStatus(email) {
  try {
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // user 시트에서 사용자 정보 조회
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z' // 전체 범위 조회
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return {
        success: true,
        isApproved: false,
        message: '등록되지 않은 사용자입니다.'
      };
    }

    // 디버깅을 위한 로그 추가
    console.log('전체 데이터:', rows);
    console.log('검색할 이메일:', email);
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`행 ${i} 데이터:`, row);
      
      const userEmail = row[3]; // google_member 컬럼 (D열)
      const approvalStatus = row[4]; // Approval 컬럼 (E열)
      const isAdmin = row[5]; // is_admin 컬럼 (F열)
      const studentId = row[0]; // no_member 컬럼 (A열)
      
      console.log(`행 ${i} - 이메일: ${userEmail}, 승인: ${approvalStatus}, 관리자: ${isAdmin}, 학번: ${studentId}`);

      if (userEmail === email) {
        const isApproved = approvalStatus === 'O';
        const isAdminUser = isAdmin === 'O';
        
        console.log(`사용자 찾음! 승인: ${isApproved}, 관리자: ${isAdminUser}`);

        return {
          success: true,
          isApproved: isApproved,
          isAdmin: isAdminUser,
          studentId: studentId || '',
          message: isApproved ? '승인된 사용자입니다.' : '승인 대기 중입니다.'
        };
      }
    }

    // 사용자를 찾지 못한 경우
    return {
      success: true,
      isApproved: false,
      message: '등록되지 않은 사용자입니다.'
    };

  } catch (error) {
    console.error('승인 상태 확인 실패:', error);
    throw new Error('승인 상태 확인 중 오류가 발생했습니다.');
  }
}

// ===== 관리자 패널 관련 함수들 =====

// 모든 사용자 목록 가져오기 (승인 대기 + 승인된 사용자)
async function handleGetPendingUsers(req, res) {
  try {
    console.log('handleGetPendingUsers 호출됨');
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // user 시트에서 모든 사용자 조회
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        users: []
      });
    }
    
    const allUsers = [];
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const studentId = row[0]; // A열: 학번/교번
      const active = row[1]; // B열: 활성화 상태
      const name = row[2]; // C열: 이름
      const email = row[3]; // D열: Google 계정 이메일
      const approvalStatus = row[4]; // E열: 승인 상태
      const isAdmin = row[5]; // F열: 관리자 여부
      const approvalDate = row[6]; // G열: 승인 날짜
      
      // Google 계정이 연결된 사용자만 포함 (승인 대기 + 승인된 사용자)
      if (email && email.trim() !== '' && (approvalStatus === 'X' || approvalStatus === 'O')) {
        // 승인된 사용자는 승인일, 승인 대기 사용자는 요청일 표시
        const currentKST = getKSTTime();
        const currentDate = formatKSTTime(currentKST).split(' ')[0]; // YYYY-MM-DD 형식
        const displayDate = approvalStatus === 'O' && approvalDate ? approvalDate : currentDate;
        
        allUsers.push({
          id: studentId,
          email: email,
          studentId: studentId,
          name: name,
          isAdmin: isAdmin === 'O',
          isApproved: approvalStatus === 'O',
          requestDate: displayDate,
          approvalDate: approvalDate || null
        });
      }
    }
    
    console.log(`총 사용자 ${allUsers.length}명 발견 (승인 대기 + 승인된 사용자)`);
    console.log('사용자 목록:', allUsers.map(user => ({
      name: user.name,
      email: user.email,
      isApproved: user.isApproved,
      requestDate: user.requestDate,
      approvalDate: user.approvalDate
    })));
    
    res.json({
      success: true,
      users: allUsers
    });
    
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 사용자 승인
async function handleApproveUser(req, res) {
  try {
    console.log('=== 승인 요청 시작 ===');
    console.log('전체 요청 body:', JSON.stringify(req.body, null, 2));
    
    const { studentId, id, action } = req.body;
    const targetStudentId = studentId || id; // id 또는 studentId 둘 다 지원
    
    console.log('파싱된 데이터:', { 
      studentId, 
      id, 
      action, 
      targetStudentId,
      hasStudentId: !!studentId,
      hasId: !!id,
      hasAction: !!action
    });
    
    if (!targetStudentId) {
      console.log('❌ 학번이 없음 - 오류 반환');
      return res.status(400).json({
        success: false,
        error: '학번이 필요합니다.'
      });
    }
    
    console.log('✅ 학번 확인됨:', targetStudentId);
    
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // user 시트에서 해당 사용자 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z'
    });
    
    const rows = response.data.values;
    let userRowIndex = -1;
    let isAdminValue = ''; // 기존 is_admin 값 저장
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === targetStudentId) {
        userRowIndex = i + 1;
        isAdminValue = row[5] || ''; // F열(is_admin) 값 저장
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '해당 사용자를 찾을 수 없습니다.'
      });
    }
    
    // E열(승인 상태)을 'O'로, F열(is_admin)을 기존 값 유지, G열(승인 날짜)을 현재 KST 날짜로 업데이트
    const currentKST = getKSTTime();
    const currentDate = formatKSTTime(currentKST).split(' ')[0]; // YYYY-MM-DD 형식
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `user!E${userRowIndex}:G${userRowIndex}`,
      valueInputOption: 'RAW',
      resource: { 
        values: [['O', isAdminValue, currentDate]]
      }
    });
    
    console.log(`사용자 승인 완료: ${targetStudentId}, 승인 날짜: ${currentDate}, is_admin: ${isAdminValue}`);
    
    res.json({
      success: true,
      message: '사용자가 승인되었습니다.',
      approvalDate: currentDate
    });
    
  } catch (error) {
    console.error('사용자 승인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 사용자 거부
async function handleRejectUser(req, res) {
  try {
    console.log('=== 거부 요청 시작 ===');
    console.log('전체 요청 body:', JSON.stringify(req.body, null, 2));
    
    const { studentId, id, action } = req.body;
    const targetStudentId = studentId || id; // id 또는 studentId 둘 다 지원
    
    console.log('파싱된 데이터:', { 
      studentId, 
      id, 
      action, 
      targetStudentId,
      hasStudentId: !!studentId,
      hasId: !!id,
      hasAction: !!action
    });
    
    if (!targetStudentId) {
      console.log('❌ 학번이 없음 - 오류 반환');
      return res.status(400).json({
        success: false,
        error: '학번이 필요합니다.'
      });
    }
    
    console.log('✅ 학번 확인됨:', targetStudentId);
    
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // user 시트에서 해당 사용자 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z'
    });
    
    const rows = response.data.values;
    let userRowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === targetStudentId) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '해당 사용자를 찾을 수 없습니다.'
      });
    }
    
    // D열(Google 계정), E열(승인 상태), F열(is_admin), G열(승인 날짜)을 모두 비우기
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `user!D${userRowIndex}:G${userRowIndex}`,
      valueInputOption: 'RAW',
      resource: { 
        values: [['', '', '', '']]
      }
    });
    
    console.log(`사용자 거부 완료: ${targetStudentId}`);
    
    res.json({
      success: true,
      message: '사용자가 거부되었습니다.'
    });
    
  } catch (error) {
    console.error('사용자 거부 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ===== 사용자 등록 상태 확인 함수 =====
// Google 로그인 후 가입 요청 전에 사용자 상태를 확인하는 함수
async function checkUserRegistrationStatus(email) {
  try {
    console.log('checkUserRegistrationStatus 시작, 이메일:', email);
    const auth = await getAuthClient();
    console.log('인증 클라이언트 생성 완료');
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    console.log('스프레드시트 찾기 완료, ID:', spreadsheetId);
    
    // user 시트에서 사용자 정보 조회
    console.log('user 시트 데이터 조회 시작');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z' // 전체 범위 조회
    });
    console.log('user 시트 데이터 조회 완료');

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return {
        success: true,
        isRegistered: false,
        isApproved: false,
        message: '등록되지 않은 사용자입니다. 가입 요청을 진행할 수 있습니다.'
      };
    }

    console.log('전체 사용자 데이터:', rows);
    console.log('검색할 이메일:', email);
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`행 ${i} 데이터:`, row);
      
      const userEmail = row[3]; // google_member 컬럼 (D열)
      const approvalStatus = row[4]; // Approval 컬럼 (E열)
      const isAdmin = row[5]; // is_admin 컬럼 (F열)
      const studentId = row[0]; // no_member 컬럼 (A열)
      const name = row[2]; // name_member 컬럼 (C열)
      
      console.log(`행 ${i} - 이메일: ${userEmail}, 승인: ${approvalStatus}, 관리자: ${isAdmin}, 학번: ${studentId}, 이름: ${name}`);

      if (userEmail === email) {
        const isApproved = approvalStatus === 'O';
        const isAdminUser = isAdmin === 'O';
        
        console.log(`사용자 찾음! 승인: ${isApproved}, 관리자: ${isAdminUser}`);

        if (isApproved) {
          return {
            success: true,
            isRegistered: true,
            isApproved: true,
            isAdmin: isAdminUser,
            studentId: studentId || '',
            name: name || '',
            message: '이미 승인된 회원입니다. 로그인을 진행하세요.'
          };
        } else {
          return {
            success: true,
            isRegistered: true,
            isApproved: false,
            isAdmin: isAdminUser,
            studentId: studentId || '',
            name: name || '',
            message: '가입 요청이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.'
          };
        }
      }
    }

    // 사용자를 찾지 못한 경우 (새로운 사용자)
    return {
      success: true,
      isRegistered: false,
      isApproved: false,
      message: '등록되지 않은 사용자입니다. 가입 요청을 진행할 수 있습니다.'
    };

  } catch (error) {
    console.error('사용자 등록 상태 확인 실패:', error);
    throw new Error('사용자 등록 상태 확인 중 오류가 발생했습니다.');
  }
}

// ===== 사용자 가입 요청 추가 함수 =====
// user 시트에 새로운 사용자 가입 요청 추가
async function addUserRegistrationRequest(userData) {
  try {
    console.log('addUserRegistrationRequest 호출됨:', userData);
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // user 시트에서 기존 사용자 정보 찾기
    console.log('user 시트에서 기존 사용자 정보 조회');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'user!A:Z'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('user 시트에 데이터가 없습니다.');
    }
    
    // 해당 학번의 사용자 찾기 (A열: 학번/교번)
    let userRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const studentId = row[0]; // A열: 학번/교번
      
      if (studentId === userData.studentId) {
        userRowIndex = i + 1; // 시트 행 번호 (1부터 시작)
        break;
      }
    }
    
    if (userRowIndex === -1) {
      throw new Error('해당 학번의 사용자를 찾을 수 없습니다. 학번을 확인해주세요.');
    }
    
    // 기존 사용자 발견 - D열(google_member)에 구글 계정 이메일 추가
    const approvalStatus = 'X'; // 승인 대기
    const isAdminStatus = userData.isAdminVerified ? 'O' : 'X';
    
    // D열(google_member), E열(승인 상태), F열(관리자 여부) 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `user!D${userRowIndex}:F${userRowIndex}`,
      valueInputOption: 'RAW',
      resource: { 
        values: [[userData.userEmail, approvalStatus, isAdminStatus]]
      }
    });
    
    console.log(`사용자 가입 요청 업데이트: ${userData.studentId} (${userData.userEmail}) - 승인: ${approvalStatus}, 관리자: ${isAdminStatus}`);
    
  } catch (error) {
    console.error('사용자 가입 요청 업데이트 실패:', error);
    throw new Error('가입 요청 처리 중 오류가 발생했습니다.');
  }
}

// ===== Cloud Functions Export =====
// 테스트 엔드포인트
exports.testDecryption = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    console.log('복호화 테스트 시작');
    const result = testDecryption();
    
    res.status(200).json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 메인 라우터 함수 (모든 요청을 처리)
exports.dailyKeyUpdate = async (req, res) => {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
  try {
    // 요청 경로에 따라 적절한 함수 호출
    const path = req.path || req.url || '';
    console.log(`요청 경로: ${path}`);
    console.log(`요청 body:`, req.body);
    
    // 경로별 라우팅 (action 기반 라우팅을 먼저 처리)
    if (path.includes('/getPendingUsers') || (req.body && req.body.action === 'getPendingUsers')) {
      return await handleGetPendingUsers(req, res);
    } else if (path.includes('/approveUser') || (req.body && req.body.action === 'approveUser')) {
      return await handleApproveUser(req, res);
    } else if (path.includes('/rejectUser') || (req.body && req.body.action === 'rejectUser')) {
      return await handleRejectUser(req, res);
    } else if (path.includes('/verifyAdminKey') || (req.body && req.body.adminKey)) {
      return await handleVerifyAdminKey(req, res);
    } else if (path.includes('/sendAdminKeyEmail') || (req.body && req.body.userEmail && req.body.adminAccessToken)) {
      return await handleSendAdminKeyEmail(req, res);
    } else if (path.includes('/submitRegistrationRequest') || (req.body && req.body.studentId && !req.body.action)) {
      return await handleSubmitRegistrationRequest(req, res);
    } else if (path.includes('/checkApprovalStatus') || (req.body && req.body.email && req.body.studentId !== undefined)) {
      return await handleCheckApprovalStatus(req, res);
    } else if (path.includes('/checkRegistrationStatus') || (req.body && req.body.email && !req.body.studentId)) {
      return await handleCheckRegistrationStatus(req, res);
    } else {
      // 기본: 관리자 키 자동 갱신
      return await handleDailyKeyUpdate(req, res);
    }
    
  } catch (error) {
    console.error('라우팅 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// 관리자 키 자동 갱신 핸들러
async function handleDailyKeyUpdate(req, res) {
  try {
    const kstTime = getKSTTime();
    console.log(`[${kstTime}] 확장된 다중 레이어 관리자 키 자동 갱신 시작`);
    
    const auth = await getAuthClient();
    const { key, layers } = generateExtendedMultiLayerKey();
    
    await updateSpreadsheetKey(auth, key, layers);
    
    console.log(`[${getKSTTime()}] 스프레드시트 키 업데이트 완료`);
    console.log(`생성된 키: ${key.substring(0, 20)}...`);
    console.log(`사용된 레이어: ${layers.join(', ')}`);
    
    res.json({ 
      success: true, 
      message: "키 갱신 완료",
      key: key.substring(0, 20) + "...",
      layers: layers
    });
    
  } catch (error) {
    console.error('키 갱신 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// 관리자 키 검증 핸들러
async function handleVerifyAdminKey(req, res) {
  try {
    const { adminKey } = req.body;
    
    if (!adminKey) {
      return res.status(400).json({
        success: false,
        error: '관리자 키를 입력해주세요'
      });
    }
    
    const result = await verifyAdminKey(adminKey);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('키 검증 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 관리자 키 이메일 전송 핸들러 (복호화된 키 반환)
async function handleSendAdminKeyEmail(req, res) {
  try {
    console.log('=== handleSendAdminKeyEmail 호출됨 ===');
    console.log('요청 메서드:', req.method);
    console.log('요청 URL:', req.url);
    console.log('요청 헤더:', req.headers);
    console.log('요청 본문:', req.body);
    
    const { userEmail, adminAccessToken } = req.body;
    
    console.log('파싱된 데이터:', { 
      userEmail, 
      hasToken: !!adminAccessToken,
      tokenLength: adminAccessToken?.length,
      tokenPreview: adminAccessToken ? adminAccessToken.substring(0, 20) + '...' : 'undefined'
    });
    
    if (!userEmail) {
      console.log('❌ 이메일 누락');
      return res.status(400).json({
        success: false,
        error: '사용자 이메일을 입력해주세요'
      });
    }
    
    if (!adminAccessToken) {
      console.log('❌ 액세스 토큰 누락');
      return res.status(400).json({
        success: false,
        error: '관리자 인증이 필요합니다'
      });
    }
    
    console.log('✅ 모든 필수 데이터 확인 완료');
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요'
      });
    }
    
    // hp_member의 admin_keys 시트에서 현재 저장된 관리자 키와 레이어 정보 가져오기
    console.log('관리자 키 조회 시작...');
    let auth, spreadsheetId, sheets;
    
    try {
      auth = await getAuthClient();
      console.log('Google API 인증 성공');
      
      const result = await findHpMemberSheet(auth);
      spreadsheetId = result.spreadsheetId;
      sheets = result.sheets;
      console.log('hp_member 시트 찾기 성공, spreadsheetId:', spreadsheetId);
    } catch (authError) {
      console.error('Google API 인증 또는 시트 찾기 실패:', authError);
      throw new Error('Google Sheets 접근에 실패했습니다: ' + authError.message);
    }
    
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
      spreadsheetId,
        range: 'admin_keys!A2:E2'
    });
    console.log('관리자 키 조회 응답:', response.data);
    } catch (sheetError) {
      console.error('Google Sheets 데이터 조회 실패:', sheetError);
      throw new Error('관리자 키 데이터를 가져오는데 실패했습니다: ' + sheetError.message);
    }
    
    if (!response.data.values || response.data.values.length === 0) {
      console.log('관리자 키를 찾을 수 없음');
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const currentAdminKey = response.data.values[0][0];
    const layersUsed = response.data.values[0][3]; // D열: layers_used
    
    console.log('관리자 키 조회 완료:', currentAdminKey.substring(0, 10) + '...');
    console.log('사용된 레이어:', layersUsed);
    
    // 복호화된 키 생성
    let decryptedKey = currentAdminKey;
    try {
      if (layersUsed) {
        const layers = layersUsed.split(',');
        console.log('레이어 목록:', layers);
        
        // 레이어 순서의 역순으로 복호화 적용 (baseKey 없이)
        for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i].trim();
          console.log(`복호화 레이어 ${i}: ${layer}`);
          decryptedKey = applyDecryption(decryptedKey, layer, '');
          console.log(`복호화 후: ${decryptedKey.substring(0, 20)}...`);
        }
        
        console.log('복호화된 키:', decryptedKey.substring(0, 20) + '...');
      } else {
        console.log('레이어 정보가 없어 원본 키 사용');
        decryptedKey = currentAdminKey;
      }
    } catch (decryptError) {
      console.error('키 복호화 실패:', decryptError);
      throw new Error('관리자 키 복호화에 실패했습니다: ' + decryptError.message);
    }
    
    // 이메일 템플릿 생성
    let emailTemplate;
    try {
      emailTemplate = generateEmailTemplate(userEmail, decryptedKey);
      console.log('이메일 템플릿 생성 완료');
    } catch (templateError) {
      console.error('이메일 템플릿 생성 실패:', templateError);
      throw new Error('이메일 템플릿 생성에 실패했습니다: ' + templateError.message);
    }
    
    // 복호화된 키와 이메일 템플릿을 프론트엔드로 반환 (이메일 전송은 프론트엔드에서 처리)
    res.json({
      success: true,
      message: '관리자 키를 성공적으로 조회했습니다',
      userEmail,
      adminKey: decryptedKey,
      encryptedKey: currentAdminKey,
      layersUsed: layersUsed,
      emailTemplate: emailTemplate
    });
    
  } catch (error) {
    console.error('관리자 키 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 승인 상태 확인 핸들러
async function handleCheckApprovalStatus(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일이 필요합니다.'
      });
    }

    const result = await checkUserApprovalStatus(email);
    res.json(result);

  } catch (error) {
    console.error('승인 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 사용자 등록 상태 확인 핸들러
async function handleCheckRegistrationStatus(req, res) {
  try {
    console.log('handleCheckRegistrationStatus 호출됨');
    const { email } = req.body;
    console.log('받은 이메일:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일이 필요합니다.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요'
      });
    }

    console.log('checkUserRegistrationStatus 함수 호출 시작');
    const result = await checkUserRegistrationStatus(email);
    console.log('checkUserRegistrationStatus 결과:', result);
    res.json(result);

  } catch (error) {
    console.error('사용자 등록 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


// 가입 요청 제출 핸들러 (새로 추가)
async function handleSubmitRegistrationRequest(req, res) {
  try {
    const { userEmail, userName, studentId, isAdminVerified } = req.body;

    if (!userEmail || !userName || !studentId) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요'
      });
    }

    // 사용자 데이터를 user 시트에 추가
    await addUserRegistrationRequest({
      userEmail,
      userName,
      studentId,
      isAdminVerified: isAdminVerified || false
    });

    res.json({
      success: true,
      message: '가입 요청이 제출되었습니다. 관리자의 승인을 기다려주세요.'
    });

  } catch (error) {
    console.error('가입 요청 제출 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ===== 추가 Export =====
module.exports = {
  ...module.exports,
  generateExtendedMultiLayerKey,
  applyEncryption,
  applyDecryption
};
