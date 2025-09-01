const { google } = require('googleapis');

// ===== 다중 레이어 암호화 함수들 =====
function generateExtendedMultiLayerKey() {
  const methods = [
    'Base64', 'XOR', 'Caesar', 'ROT13', 'BitShift', 'Substitution',
    'Padding', 'HashBased', 'Compression', 'MultiEncode', 'RandomInsert',
    'ChainCipher', 'BlockCipher', 'StreamCipher', 'Polyalphabetic',
    'Transposition', 'Hybrid', 'AdvancedXOR', 'MultiHash', 'DynamicCipher',
    'StealthCipher', 'QuantumSafe', 'BiometricBased', 'NeuralNetwork', 'ChaosTheory'
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
    encryptedKey = applyEncryption(encryptedKey, method, baseKey);
  }
  
  return {
    key: encryptedKey,
    layers: selectedMethods,
    baseKey: baseKey
  };
}

// 텍스트에 특정 암호화 방법 적용
function applyEncryption(text, method, key) {
  switch (method) {
    case 'Base64':
      return Buffer.from(text).toString('base64');
    case 'XOR':
      return xorEncrypt(text, key);
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
    case 'HashBased':
      return hashBasedEncrypt(text, key);
    case 'Compression':
      return compressionEncrypt(text);
    case 'MultiEncode':
      return multiEncode(text);
    case 'RandomInsert':
      return randomInsert(text);
    case 'ChainCipher':
      return chainCipher(text, key);
    case 'BlockCipher':
      return blockCipher(text, key);
    case 'StreamCipher':
      return streamCipher(text, key);
    case 'Polyalphabetic':
      return polyalphabeticCipher(text, key);
    case 'Transposition':
      return transpositionCipher(text);
    case 'Hybrid':
      return hybridEncrypt(text, key);
    case 'AdvancedXOR':
      return advancedXOR(text, key);
    case 'MultiHash':
      return multiHash(text, key);
    case 'DynamicCipher':
      return dynamicCipher(text, key);
    case 'StealthCipher':
      return stealthCipher(text, key);
    case 'QuantumSafe':
      return quantumSafeEncrypt(text, key);
    case 'BiometricBased':
      return biometricBasedEncrypt(text, key);
    case 'NeuralNetwork':
      return neuralNetworkEncrypt(text, key);
    case 'ChaosTheory':
      return chaosTheoryEncrypt(text, key);
    default:
      return text;
  }
}

// ===== 개별 암호화 함수들 =====
// XOR 암호화: 키와 텍스트를 XOR 연산
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
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

// 비트 시프트: ASCII 코드를 일정 값만큼 이동
function bitShift(text, shift) {
  return text.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) + shift);
  }).join('');
}

// 치환 암호: 알파벳을 다른 알파벳으로 교체
function substitutionCipher(text) {
  const substitution = {
    'a': 'x', 'b': 'y', 'c': 'z', 'd': 'a', 'e': 'b', 'f': 'c',
    'g': 'd', 'h': 'e', 'i': 'f', 'j': 'g', 'k': 'h', 'l': 'i',
    'm': 'j', 'n': 'k', 'o': 'l', 'p': 'm', 'q': 'n', 'r': 'o',
    's': 'p', 't': 'q', 'u': 'r', 'v': 's', 'w': 't', 'x': 'u',
    'y': 'v', 'z': 'w'
  };
  
  return text.toLowerCase().split('').map(char => {
    return substitution[char] || char;
  }).join('');
}

// 패딩: 텍스트 앞뒤에 랜덤 문자열 추가
function paddingEncrypt(text) {
  const padding = 'PAD_' + Math.random().toString(36).substring(2, 8);
  return padding + text + padding;
}

// 해시 기반: 텍스트 해시값을 앞에 추가
function hashBasedEncrypt(text, key) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(16) + text;
}

// 압축: ASCII 코드를 16진수로 변환
function compressionEncrypt(text) {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(16);
  }).join('');
}

// 다중 인코딩: Base64 + 16진수 인코딩
function multiEncode(text) {
  return Buffer.from(text).toString('base64') + '_' + Buffer.from(text).toString('hex');
}

// 랜덤 삽입: 앞뒤에 짧은 랜덤 문자열 추가
function randomInsert(text) {
  const randomChars = Math.random().toString(36).substring(2, 6);
  return randomChars + text + randomChars;
}

// 체인 암호: XOR을 3번 연속 적용
function chainCipher(text, key) {
  let result = text;
  for (let i = 0; i < 3; i++) {
    result = xorEncrypt(result, key + i);
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

// 전치 암호: 3열로 나누어 세로로 읽기
function transpositionCipher(text) {
  const cols = 3;
  let result = '';
  for (let col = 0; col < cols; col++) {
    for (let i = col; i < text.length; i += cols) {
      result += text.charAt(i);
    }
  }
  return result;
}

// 하이브리드: XOR + Base64
function hybridEncrypt(text, key) {
  const xorResult = xorEncrypt(text, key);
  return Buffer.from(xorResult).toString('base64');
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

// 다중 해시: 해시값에 키 길이 XOR
function multiHash(text, key) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  return (hash ^ key.length).toString(16) + text;
}

// 동적 암호: 키에 텍스트 길이 추가
function dynamicCipher(text, key) {
  const dynamicKey = key + text.length;
  return xorEncrypt(text, dynamicKey);
}

// 스텔스: 'STEALTH_' 문자열로 감싸기
function stealthCipher(text, key) {
  const stealth = 'STEALTH_' + Math.random().toString(36).substring(2, 6);
  return stealth + xorEncrypt(text, key) + stealth;
}

// 양자 안전: 'QUANTUM_' + 타임스탬프
function quantumSafeEncrypt(text, key) {
  const quantum = 'QUANTUM_' + Date.now().toString(36);
  return quantum + text + quantum;
}

// 생체 기반: 'BIO_' + 키 길이
function biometricBasedEncrypt(text, key) {
  const biometric = 'BIO_' + key.length.toString(36);
  return biometric + text + biometric;
}

// 신경망: 'NEURAL_' + 랜덤 문자열
function neuralNetworkEncrypt(text, key) {
  const neural = 'NEURAL_' + Math.random().toString(36).substring(2, 5);
  return neural + text + neural;
}

// 카오스 이론: 'CHAOS_' + 밀리초
function chaosTheoryEncrypt(text, key) {
  const chaos = 'CHAOS_' + (Date.now() % 1000).toString(36);
  return chaos + text + chaos;
}

// ===== Google API 관련 함수들 =====
// Google API 인증 클라이언트 가져오기
async function getAuthClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'admin-key-service.json',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]
    });
    return await auth.getClient();
  } catch (error) {
    console.error('인증 클라이언트 생성 실패:', error);
    throw new Error('Google API 인증 실패');
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
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiryKST = getKSTTime();
    
    // admin_keys 시트의 현재 구조 확인
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A1:Z10'
    });
    
    console.log('현재 admin_keys 시트 데이터:', currentData.data.values);
    
    // 시트 구조에 맞게 업데이트
    const updateData = [
      ['unified_admin_key', 'key_expiry', 'last_updated', 'layers_used'],
      [newKey, expiryKST.toISOString(), now, layers.join(',')]
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'admin_keys!A1:D2',
      valueInputOption: 'RAW',
      resource: { values: updateData }
    });
    
    console.log('Spreadsheet key update complete');
    console.log(`업데이트 시간: ${now}`);
    console.log(`만료 시간: ${expiryKST}`);
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
    
    // hp_member의 admin_keys 시트에서 현재 키 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A2:A2'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const storedKey = response.data.values[0][0];
    
    // 키 일치 여부 확인
    const isValid = inputKey === storedKey;
    
    console.log(`관리자 키 검증: ${isValid ? '성공' : '실패'}`);
    return {
      isValid,
      message: isValid ? '관리자 키가 일치합니다' : '관리자 키가 일치하지 않습니다'
    };
    
  } catch (error) {
    console.error('관리자 키 검증 실패:', error);
    throw new Error('키 검증 중 오류가 발생했습니다');
  }
}

// ===== 관리자 계정으로 이메일 전송 함수 =====
async function sendAdminKeyEmailWithUserToken(userEmail, adminKey, adminAccessToken) {
  try {
    // 관리자의 액세스 토큰으로 Gmail API 사용
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: adminAccessToken
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 이메일 내용 구성
    const emailContent = `
      안녕하세요!
      
      관리자 회원가입을 위한 관리자 키입니다.
      
      관리자 키: ${adminKey}
      
      이 키를 사용하여 관리자로 회원가입할 수 있습니다.
      키는 매일 자정에 자동으로 갱신됩니다.
      
      감사합니다.
    `;
    
    // Base64 인코딩된 이메일 생성
    const email = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${userEmail}`,
      'From: me',  // 관리자 계정에서 전송
      'Subject: 관리자 회원가입 키',
      '',
      emailContent
    ].join('\r\n');
    
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    
    // 이메일 전송
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    console.log(`관리자 키 이메일 전송 완료: ${userEmail}`);
    return { success: true, message: '이메일 전송이 완료되었습니다' };
    
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    throw new Error('이메일 전송 중 오류가 발생했습니다');
  }
}

// ===== 승인 상태 확인 함수 =====
async function checkUserApprovalStatus(email) {
  try {
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    // hp_member 시트에서 사용자 정보 조회
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'hp_member!A:Z' // 전체 범위 조회
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
      
      const userEmail = row[5]; // google_member 컬럼 (F열)
      const approvalStatus = row[6]; // Approval 컬럼 (G열)
      const isAdmin = row[7]; // is_admin 컬럼 (H열)
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

// ===== Cloud Functions Export =====
// 관리자 키 자동 갱신 (Cloud Scheduler용)
exports.dailyKeyUpdate = async (req, res) => {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
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
};

// 관리자 키 검증
exports.verifyAdminKey = async (req, res) => {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
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
};

// 관리자 키 이메일 전송 (관리자 계정으로)
exports.sendAdminKeyEmail = async (req, res) => {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
  try {
    const { userEmail, adminAccessToken } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: '사용자 이메일을 입력해주세요'
      });
    }
    
    if (!adminAccessToken) {
      return res.status(400).json({
        success: false,
        error: '관리자 인증이 필요합니다'
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
    
    // hp_member의 admin_keys 시트에서 현재 저장된 관리자 키 가져오기
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A2:A2'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const currentAdminKey = response.data.values[0][0];
    
    // 관리자 계정으로 이메일 전송
    await sendAdminKeyEmailWithUserToken(userEmail, currentAdminKey, adminAccessToken);
    
    res.json({
      success: true,
      message: '관리자 키가 이메일로 전송되었습니다',
      userEmail
    });
    
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 승인 상태 확인 API
exports.checkApprovalStatus = async (req, res) => {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
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
};
