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
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
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
    console.log('이메일 전송 시작:', { userEmail, adminKey: adminKey.substring(0, 10) + '...', hasToken: !!adminAccessToken });
    
    // 서비스 계정으로 Gmail API 사용 (우선 방식)
    console.log('서비스 계정으로 Gmail API 사용...');
    const serviceAuth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth: serviceAuth });
    return await sendEmailWithGmailAPI(gmail, userEmail, adminKey);
    
  } catch (error) {
    console.error('이메일 전송 실패 상세:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '이메일 전송 중 오류가 발생했습니다';
    if (error.code === 401) {
      errorMessage = 'Gmail API 인증이 필요합니다. 서비스 계정 설정을 확인해주세요.';
    } else if (error.code === 403) {
      errorMessage = 'Gmail API 권한이 없습니다. 서비스 계정에 Gmail 전송 권한이 필요합니다.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'Gmail API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('domain')) {
      errorMessage = 'Gmail API 도메인 위임이 필요합니다. 관리자에게 문의해주세요.';
    }
    
    throw new Error(errorMessage);
  }
}

// Gmail API를 사용한 이메일 전송 함수
async function sendEmailWithGmailAPI(gmail, userEmail, adminKey) {
  // 이메일 내용 구성
  const emailContent = `
안녕하세요!

Hot Potato 관리자 회원가입을 위한 관리자 키입니다.

관리자 키: ${adminKey}

이 키를 사용하여 관리자로 회원가입할 수 있습니다.
키는 매일 자정에 자동으로 갱신됩니다.

감사합니다.
Hot Potato 팀
  `;
  
  // 서비스 계정의 경우 'me' 대신 실제 이메일 주소 사용
  const fromEmail = process.env.SERVICE_ACCOUNT_EMAIL || 'me';
  console.log('발신자 이메일:', fromEmail);
  
  // 이메일 헤더와 본문 구성
  const email = [
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `To: ${userEmail}`,
    `From: ${fromEmail}`,
    'Subject: =?UTF-8?B?' + Buffer.from('Hot Potato 관리자 회원가입 키').toString('base64') + '?=',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(emailContent.trim()).toString('base64')
  ].join('\r\n');
  
  // URL-safe Base64 인코딩
  const encodedEmail = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  console.log('Gmail API 호출 시작...');
  console.log('이메일 정보:', { to: userEmail, from: fromEmail });
  
  // 이메일 전송
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });
  
  console.log('Gmail API 응답:', result.data);
  console.log(`관리자 키 이메일 전송 완료: ${userEmail}`);
  return { success: true, message: '이메일 전송이 완료되었습니다', messageId: result.data.id };
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
    
    // E열(승인 상태)을 'O'로, G열(승인 날짜)을 현재 KST 날짜로 업데이트
    const currentKST = getKSTTime();
    const currentDate = formatKSTTime(currentKST).split(' ')[0]; // YYYY-MM-DD 형식
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `user!E${userRowIndex}:G${userRowIndex}`,
      valueInputOption: 'RAW',
      resource: { 
        values: [['O', '', currentDate]]
      }
    });
    
    console.log(`사용자 승인 완료: ${targetStudentId}, 승인 날짜: ${currentDate}`);
    
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
    
    // D열(Google 계정)을 비우고 E열(승인 상태)을 'R'(거부)로, G열(승인 날짜)을 비우기
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `user!D${userRowIndex}:G${userRowIndex}`,
      valueInputOption: 'RAW',
      resource: { 
        values: [['', 'R', '']]
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

// 관리자 키 이메일 전송 핸들러
async function handleSendAdminKeyEmail(req, res) {
  try {
    console.log('handleSendAdminKeyEmail 호출됨');
    const { userEmail, adminAccessToken } = req.body;
    
    console.log('요청 데이터:', { 
      userEmail, 
      hasToken: !!adminAccessToken,
      tokenLength: adminAccessToken?.length 
    });
    
    if (!userEmail) {
      console.log('이메일 누락');
      return res.status(400).json({
        success: false,
        error: '사용자 이메일을 입력해주세요'
      });
    }
    
    if (!adminAccessToken) {
      console.log('액세스 토큰 누락');
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
    console.log('관리자 키 조회 시작...');
    const auth = await getAuthClient();
    const { spreadsheetId, sheets } = await findHpMemberSheet(auth);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'admin_keys!A2:A2'
    });
    
    console.log('관리자 키 조회 응답:', response.data);
    
    if (!response.data.values || response.data.values.length === 0) {
      console.log('관리자 키를 찾을 수 없음');
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const currentAdminKey = response.data.values[0][0];
    console.log('관리자 키 조회 완료:', currentAdminKey.substring(0, 10) + '...');
    
    // 관리자 계정으로 이메일 전송
    console.log('이메일 전송 함수 호출...');
    const emailResult = await sendAdminKeyEmailWithUserToken(userEmail, currentAdminKey, adminAccessToken);
    console.log('이메일 전송 결과:', emailResult);
    
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
