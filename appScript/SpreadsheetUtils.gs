/**
 * SpreadsheetUtils.gs
 * Google Sheets 연동 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 스프레드시트 관련 함수들 =====
// hp_member 스프레드시트 가져오기 (연결된 스프레드시트 사용)
function getHpMemberSpreadsheet() {
  try {
    // Apps Script 프로젝트에 연결된 스프레드시트 사용
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (spreadsheet) {
      console.log('연결된 스프레드시트 사용:', spreadsheet.getName());
      return spreadsheet;
    }
  } catch (error) {
    console.warn('연결된 스프레드시트를 찾을 수 없습니다:', error.message);
  }
  
  // 연결된 스프레드시트가 없으면 CONFIG에서 ID로 찾기
  const spreadsheetId = getSpreadsheetId();
  if (spreadsheetId && spreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE') {
    console.log('CONFIG의 스프레드시트 ID 사용:', spreadsheetId);
    return SpreadsheetApp.openById(spreadsheetId);
  }
  
  throw new Error('스프레드시트를 찾을 수 없습니다. Apps Script 프로젝트에 스프레드시트를 연결하거나 CONFIG.gs에서 스프레드시트 ID를 설정하세요.');
}

// hp_member 스프레드시트 ID 가져오기 (하위 호환성 유지)
function getHpMemberSpreadsheetId() {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    return spreadsheet.getId();
  } catch (error) {
    console.error('스프레드시트 ID 가져오기 실패:', error);
    return null;
  }
}

// ===== 캐싱 관련 함수들 =====
// 캐시에서 데이터 가져오기
function getCachedData(key) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('캐시 읽기 실패:', error);
  }
  return null;
}

// 데이터를 캐시에 저장
function setCachedData(key, data, expirationSeconds = null) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheExpiry = expirationSeconds || (getConfig('cache_expiry_minutes') * 60);
    cache.put(key, JSON.stringify(data), cacheExpiry);
  } catch (error) {
    console.warn('캐시 저장 실패:', error);
  }
}

// 캐시 무효화
function invalidateCache(pattern) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(pattern);
  } catch (error) {
    console.warn('캐시 무효화 실패:', error);
  }
}

// hp_member 스프레드시트 찾기
function findHpMemberSheet() {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    const spreadsheetId = spreadsheet.getId();
    
    if (!spreadsheet) {
      throw new Error('hp_member 스프레드시트를 찾을 수 없습니다');
    }
    
    console.log(`hp_member 스프레드시트 찾음: ${spreadsheetId}`);
    
    return { 
      spreadsheetId, 
      spreadsheet: spreadsheet,
      sheets: spreadsheet
    };
  } catch (error) {
    console.error('스프레드시트 찾기 실패:', error);
    throw new Error('hp_member 스프레드시트를 찾을 수 없습니다');
  }
}

// ===== 사용자 데이터 관련 함수들 =====
// 모든 사용자 목록 가져오기 (승인 대기 + 승인된 사용자)
function getAllUsers() {
  try {
    console.log('getAllUsers 호출됨');
    
    // 캐시에서 데이터 확인
    const cacheKey = 'all_users';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('캐시에서 사용자 데이터 로드');
      return cachedData;
    }
    
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    
    const sheet = spreadsheet.getSheetByName('user');
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 모든 사용자 조회
    const data = sheet.getRange('A:Z').getValues();
    
    if (!data || data.length === 0) {
      return {
        success: true,
        users: []
      };
    }
    
    const allUsers = [];
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = row[0]; // A열: 학번/교번
      const active = row[1]; // B열: 활성화 상태
      const name = row[2]; // C열: 이름
      const encryptedEmail = row[3]; // D열: Google 계정 이메일 (암호화됨)
      const email = rot13Decrypt(encryptedEmail); // 복호화된 이메일
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
    
    const result = {
      success: true,
      users: allUsers
    };
    
    // 결과를 캐시에 저장
    setCachedData(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
}

// 사용자 승인
function approveUser(studentId) {
  try {
    console.log('=== 승인 요청 시작 ===');
    console.log('학번:', studentId);
    
    if (!studentId) {
      throw new Error('학번이 필요합니다.');
    }
    
    console.log('✅ 학번 확인됨:', studentId);
    
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 해당 사용자 찾기
    const data = sheet.getRange('A:Z').getValues();
    let userRowIndex = -1;
    let isAdminValue = ''; // 기존 is_admin 값 저장
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === studentId) {
        userRowIndex = i + 1;
        isAdminValue = row[5] || ''; // F열(is_admin) 값 저장
        break;
      }
    }
    
    if (userRowIndex === -1) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    // E열(승인 상태)을 'O'로, F열(is_admin)을 기존 값 유지, G열(승인 날짜)을 현재 KST 날짜로 업데이트
    const currentKST = getKSTTime();
    const currentDate = formatKSTTime(currentKST).split(' ')[0]; // YYYY-MM-DD 형식
    sheet.getRange(`E${userRowIndex}:G${userRowIndex}`).setValues([['O', isAdminValue, currentDate]]);
    
    console.log(`사용자 승인 완료: ${studentId}, 승인 날짜: ${currentDate}, is_admin: ${isAdminValue}`);
    
    // 사용자 데이터 캐시 무효화
    invalidateCache('all_users');
    
    return {
      success: true,
      message: '사용자가 승인되었습니다.',
      approvalDate: currentDate
    };
    
  } catch (error) {
    console.error('사용자 승인 실패:', error);
    throw error;
  }
}

// 사용자 거부
function rejectUser(studentId) {
  try {
    console.log('=== 거부 요청 시작 ===');
    console.log('학번:', studentId);
    
    if (!studentId) {
      throw new Error('학번이 필요합니다.');
    }
    
    console.log('✅ 학번 확인됨:', studentId);
    
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 해당 사용자 찾기
    const data = sheet.getRange('A:Z').getValues();
    let userRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === studentId) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    // D열(Google 계정), E열(승인 상태), F열(is_admin), G열(승인 날짜)을 모두 비우기
    sheet.getRange(`D${userRowIndex}:G${userRowIndex}`).setValues([['', '', '', '']]);
    
    console.log(`사용자 거부 완료: ${studentId}`);
    
    // 사용자 데이터 캐시 무효화
    invalidateCache('all_users');
    
    return {
      success: true,
      message: '사용자가 거부되었습니다.'
    };
    
  } catch (error) {
    console.error('사용자 거부 실패:', error);
    throw error;
  }
}

// ===== 사용자 등록 상태 확인 함수 =====
// Google 로그인 후 가입 요청 전에 사용자 상태를 확인하는 함수
function checkUserRegistrationStatus(email) {
  try {
    console.log('checkUserRegistrationStatus 시작, 이메일:', email);
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    console.log('스프레드시트 찾기 완료, ID:', spreadsheetId);
    
    const sheet = spreadsheet.getSheetByName('user');
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 사용자 정보 조회
    console.log('user 시트 데이터 조회 시작');
    const data = sheet.getRange('A:Z').getValues();
    console.log('user 시트 데이터 조회 완료');

    if (!data || data.length === 0) {
      return {
        success: true,
        isRegistered: false,
        isApproved: false,
        message: '등록되지 않은 사용자입니다. 가입 요청을 진행할 수 있습니다.'
      };
    }

    console.log('전체 사용자 데이터:', data);
    console.log('검색할 이메일:', email);
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`행 ${i} 데이터:`, row);
      
      const encryptedUserEmail = row[3]; // google_member 컬럼 (D열) - 암호화된 이메일
      const userEmail = decryptEmail(encryptedUserEmail); // 복호화된 이메일
      const approvalStatus = row[4]; // Approval 컬럼 (E열)
      const isAdmin = row[5]; // is_admin 컬럼 (F열)
      const studentId = row[0]; // no_member 컬럼 (A열)
      const name = row[2]; // name_member 컬럼 (C열)
      
      console.log(`행 ${i} - 암호화된 이메일: ${encryptedUserEmail}, 복호화된 이메일: ${userEmail}, 승인: ${approvalStatus}, 관리자: ${isAdmin}, 학번: ${studentId}, 이름: ${name}`);

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

// 승인 상태 확인 함수
function checkUserApprovalStatus(email) {
  try {
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 사용자 정보 조회
    const data = sheet.getRange('A:Z').getValues();

    if (!data || data.length === 0) {
      return {
        success: true,
        isApproved: false,
        message: '등록되지 않은 사용자입니다.'
      };
    }

    // 디버깅을 위한 로그 추가
    console.log('전체 데이터:', data);
    console.log('검색할 이메일:', email);
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`행 ${i} 데이터:`, row);
      
      const encryptedUserEmail = row[3]; // google_member 컬럼 (D열) - 암호화된 이메일
      const userEmail = decryptEmail(encryptedUserEmail); // 복호화된 이메일
      const approvalStatus = row[4]; // Approval 컬럼 (E열)
      const isAdmin = row[5]; // is_admin 컬럼 (F열)
      const studentId = row[0]; // no_member 컬럼 (A열)
      
      console.log(`행 ${i} - 암호화된 이메일: ${encryptedUserEmail}, 복호화된 이메일: ${userEmail}, 승인: ${approvalStatus}, 관리자: ${isAdmin}, 학번: ${studentId}`);

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

// ===== 사용자 가입 요청 추가 함수 =====
// user 시트에 새로운 사용자 가입 요청 추가
function addUserRegistrationRequest(userData) {
  try {
    console.log('addUserRegistrationRequest 호출됨:', userData);
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    
    const sheet = spreadsheet.getSheetByName('user');
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 기존 사용자 정보 찾기
    console.log('user 시트에서 기존 사용자 정보 조회');
    const data = sheet.getRange('A:Z').getValues();
    
    if (!data || data.length === 0) {
      throw new Error('user 시트에 데이터가 없습니다.');
    }
    
    // 해당 학번의 사용자 찾기 (A열: 학번/교번)
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
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
    // 이메일 주소를 설정된 방법으로 암호화하여 저장
    const encryptedEmail = encryptEmail(userData.userEmail);
    sheet.getRange(`D${userRowIndex}:F${userRowIndex}`).setValues([[encryptedEmail, approvalStatus, isAdminStatus]]);
    
    console.log(`사용자 가입 요청 업데이트: ${userData.studentId} (${userData.userEmail}) - 승인: ${approvalStatus}, 관리자: ${isAdminStatus}`);
    
    return {
      success: true,
      message: '가입 요청이 제출되었습니다.'
    };
    
  } catch (error) {
    console.error('사용자 가입 요청 업데이트 실패:', error);
    throw new Error('가입 요청 처리 중 오류가 발생했습니다.');
  }
}

// ===== 이메일 암호화/복호화 함수들 =====
// 설정 기반 이메일 암호화 함수
function encryptEmail(email) {
  if (!email || !getConfig('use_email_encryption')) return email;
  
  const config = getCurrentEmailEncryptionConfig();
  let encryptedEmail = email;
  
  if (config.layers === 1) {
    // 단일 레이어 암호화
    encryptedEmail = applyEncryption(email, config.method, '');
  } else {
    // 다중 레이어 암호화
    for (let i = 0; i < config.layers; i++) {
      const method = config.layerMethods[i % config.layerMethods.length];
      encryptedEmail = applyEncryption(encryptedEmail, method, '');
    }
  }
  
  console.log(`이메일 암호화 완료: ${email} -> ${encryptedEmail.substring(0, 20)}...`);
  return encryptedEmail;
}

// 설정 기반 이메일 복호화 함수
function decryptEmail(encryptedEmail) {
  if (!encryptedEmail || !getConfig('use_email_encryption')) return encryptedEmail;
  
  const config = getCurrentEmailEncryptionConfig();
  let decryptedEmail = encryptedEmail;
  
  if (config.layers === 1) {
    // 단일 레이어 복호화
    decryptedEmail = applyDecryption(encryptedEmail, config.method, '');
  } else {
    // 다중 레이어 복호화 (역순으로 적용)
    for (let i = config.layers - 1; i >= 0; i--) {
      const method = config.layerMethods[i % config.layerMethods.length];
      decryptedEmail = applyDecryption(decryptedEmail, method, '');
    }
  }
  
  console.log(`이메일 복호화 완료: ${encryptedEmail.substring(0, 20)}... -> ${decryptedEmail}`);
  return decryptedEmail;
}

// 이메일이 이미 암호화되었는지 확인하는 함수
function isEncryptedEmail(email) {
  if (!email || !email.includes('@')) return false;
  
  const config = getCurrentEmailEncryptionConfig();
  const patterns = config.identificationPatterns[config.method] || [];
  
  // 설정된 패턴으로 암호화된 이메일인지 확인
  return patterns.some(pattern => email.includes(pattern));
}

// ===== 기존 ROT13 함수들 (하위 호환성 유지) =====
// ROT13 암호화 함수
function rot13Encrypt(text) {
  if (!text) return text;
  return rot13(text);
}

// ROT13 복호화 함수 (ROT13은 암호화와 복호화가 동일)
function rot13Decrypt(text) {
  if (!text) return text;
  return rot13(text);
}
