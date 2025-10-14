/**
 * Encryption.gs
 * 암호화/복호화 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 다중 레이어 암호화 함수들 =====
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

// 텍스트에 특정 암호화 방법 적용
function applyEncryption(text, method, key) {
  try {
    console.log(`암호화 시작: ${method}, 입력: ${text.substring(0, 20)}...`);
    
    if (!text || typeof text !== 'string') {
      console.warn('암호화할 텍스트가 유효하지 않습니다:', text);
      return text || '';
    }

    let result;
    switch (method) {
      case 'Base64':
        try {
          const blob = Utilities.newBlob(text).setContentType('text/plain; charset=utf-8');
          result = Utilities.base64Encode(blob.getBytes());
        } catch (error) {
          console.error('Base64 인코딩 오류:', error);
          result = text;
        }
        break;
      case 'Caesar':
        result = caesarCipher(text, 13);
        break;
      case 'ROT13':
        result = rot13(text);
        break;
      case 'BitShift':
        result = bitShift(text, 7);
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

// 텍스트에 특정 복호화 방법 적용
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
        result = randomInsertDecrypt(text);
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
    
    return result;
  } catch (error) {
    console.error(`복호화 중 오류 발생 (${method}):`, error);
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

// ROT13 암호화: ROT13은 암호화와 복호화가 동일
function rot13Encrypt(text) {
  return rot13(text);
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

// 다중 인코딩: Base64 + 16진수 인코딩
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

// 다중 인코딩 복호화: Base64 부분만 사용
function multiDecode(text) {
  try {
    const parts = text.split('_');
    if (parts.length < 2) {
      console.warn('MultiDecode: 유효하지 않은 형식:', text);
      return text;
    }
    
    const base64Part = parts[0];
    const decoded = Utilities.base64Decode(base64Part);
    return Utilities.newBlob(decoded).getDataAsString();
  } catch (error) {
    console.error('MultiDecode 복호화 오류:', error);
    return text;
  }
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

// Transposition 암호화: 3열로 나누어 세로로 읽기
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

// Transposition 복호화: 3열로 나누어 가로로 읽기
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

// ===== 통합 암복호화 함수들 =====

/**
 * 이메일/연락처 통합 암호화 (Base64)
 */
function encryptEmailMain(email) {
  try {
    console.log('🔐 암호화 시작:', email);
    
    if (!email || typeof email !== 'string') {
      console.warn('유효하지 않은 입력:', email);
      return email || '';
    }
    
    // 기존 암호화 함수 사용 (Base64)
    const result = applyEncryption(email, 'Base64', '');
    console.log('🔐 암호화 완료:', email, '->', result);
    return result;
  } catch (error) {
    console.error('암호화 오류:', error);
    return email || '';
  }
}

/**
 * 이메일/연락처 통합 복호화 (Base64)
 */
function decryptEmailMain(encryptedEmail) {
  try {
    console.log('🔓 복호화 시작:', encryptedEmail);
    
    if (!encryptedEmail || typeof encryptedEmail !== 'string') {
      console.warn('유효하지 않은 입력:', encryptedEmail);
      return encryptedEmail || '';
    }
    
    // 이미 복호화된 전화번호인지 확인 (010-XXXX-XXXX 형식)
    if (/^010-\d{4}-\d{4}$/.test(encryptedEmail)) {
      console.log('이미 복호화된 전화번호:', encryptedEmail);
      return encryptedEmail;
    }
    
    // 기존 복호화 함수 사용 (Base64)
    const result = applyDecryption(encryptedEmail, 'Base64', '');
    console.log('🔓 복호화 완료:', encryptedEmail, '->', result);
    return result;
  } catch (error) {
    console.error('복호화 오류:', error);
    return encryptedEmail || '';
  }
}