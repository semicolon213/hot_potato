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
    console.log(`캐시 무효화 시도: ${pattern}`);
    const cache = CacheService.getScriptCache();
    cache.remove(pattern);
    console.log(`✅ 캐시 무효화 완료: ${pattern}`);
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
    console.log('getAllUsers 호출됨 - 실시간 데이터 로드 (캐시 사용 안함)');
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) {
      throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    }
    
    const data = sheet.getRange('A:Z').getValues();
    if (!data || data.length === 0) {
      return { success: true, users: [] };
    }
    
    const allUsers = [];
    const { NO_MEMBER, NAME_MEMBER, GOOGLE_MEMBER, APPROVAL, IS_ADMIN, APPROVAL_DATE } = USER_SHEET_COLUMNS;
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const noMember = row[NO_MEMBER];
      const nameMember = row[NAME_MEMBER];
      const encryptedEmail = row[GOOGLE_MEMBER];
      const approvalStatus = row[APPROVAL];
      const isAdmin = row[IS_ADMIN];
      const approvalDate = row[APPROVAL_DATE];
      
      const email = decryptEmailMain(encryptedEmail);
      
      if (email && email.trim() !== '' && (approvalStatus === APPROVAL_STATUS.PENDING || approvalStatus === APPROVAL_STATUS.APPROVED)) {
        const currentKST = getKSTTime();
        const currentDate = formatKSTTime(currentKST).split(' ')[0];
        const displayDate = approvalStatus === APPROVAL_STATUS.APPROVED && approvalDate ? approvalDate : currentDate;
        
        allUsers.push({
          id: noMember,
          email: email,
          studentId: noMember,
          name: nameMember,
          isAdmin: isAdmin === ADMIN_STATUS.YES,
          isApproved: approvalStatus === APPROVAL_STATUS.APPROVED,
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
    
    const result = { success: true, users: allUsers };
    console.log('✅ 사용자 데이터 실시간 처리 완료');
    console.log('처리된 데이터 크기:', JSON.stringify(result).length, 'bytes');
    
    return result;
    
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
}

// 사용자 승인
function approveUser(studentId) {
  try {
    console.log('=== 승인 요청 시작 ===', '학번:', studentId);
    if (!studentId) throw new Error('학번이 필요합니다.');
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    
    const data = sheet.getRange('A:Z').getValues();
    let userRowIndex = -1;
    let isAdminValue = '';
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][USER_SHEET_COLUMNS.NO_MEMBER] === studentId) {
        userRowIndex = i + 1;
        isAdminValue = data[i][USER_SHEET_COLUMNS.IS_ADMIN] || '';
        break;
      }
    }
    
    if (userRowIndex === -1) throw new Error('해당 사용자를 찾을 수 없습니다.');
    
    const currentKST = getKSTTime();
    const currentDate = formatKSTTime(currentKST).split(' ')[0];
    
    const { APPROVAL, IS_ADMIN, APPROVAL_DATE } = USER_SHEET_COLUMNS;
    sheet.getRange(userRowIndex, APPROVAL + 1, 1, 3).setValues([[APPROVAL_STATUS.APPROVED, isAdminValue, currentDate]]);
    
    console.log(`사용자 승인 완료: ${studentId}, 승인 날짜: ${currentDate}, is_admin: ${isAdminValue}`);
    
    return { success: true, message: '사용자가 승인되었습니다.', approvalDate: currentDate };
    
  } catch (error) {
    console.error('사용자 승인 실패:', error);
    throw error;
  }
}

// 사용자 거부
function rejectUser(studentId) {
  try {
    console.log('=== 거부 요청 시작 ===', '학번:', studentId);
    if (!studentId) throw new Error('학번이 필요합니다.');
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    
    const data = sheet.getRange('A:Z').getValues();
    let userRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][USER_SHEET_COLUMNS.NO_MEMBER] === studentId) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) throw new Error('해당 사용자를 찾을 수 없습니다.');
    
    const { GOOGLE_MEMBER, APPROVAL, IS_ADMIN, APPROVAL_DATE } = USER_SHEET_COLUMNS;
    sheet.getRange(userRowIndex, GOOGLE_MEMBER + 1, 1, 4).setValues([['', '', '', '']]);
    
    console.log(`사용자 거부 완료: ${studentId}`);
    
    return { success: true, message: '사용자가 거부되었습니다.' };
    
  } catch (error) {
    console.error('사용자 거부 실패:', error);
    throw error;
  }
}

// ===== 사용자 등록 상태 확인 함수 =====
function checkUserRegistrationStatus(email) {
  try {
    console.log('checkUserRegistrationStatus 시작, 이메일:', email);
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    
    const data = sheet.getRange('A:Z').getValues();
    if (!data || data.length === 0) {
      return { success: true, isRegistered: false, isApproved: false, message: '등록되지 않은 사용자입니다. 가입 요청을 진행할 수 있습니다.' };
    }
    
    const { NO_MEMBER, USER_TYPE, NAME_MEMBER, GOOGLE_MEMBER, APPROVAL, IS_ADMIN } = USER_SHEET_COLUMNS;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const encryptedUserEmail = row[GOOGLE_MEMBER];
      const userEmail = encryptedUserEmail ? decryptEmailMain(encryptedUserEmail) : '';

      if (userEmail === email) {
        const approvalStatus = row[APPROVAL];
        const isAdmin = row[IS_ADMIN];
        const studentId = row[NO_MEMBER];
        const name = row[NAME_MEMBER];
        const userType = row[USER_TYPE];
        
        const isApproved = approvalStatus === APPROVAL_STATUS.APPROVED;
        const isAdminUser = isAdmin === ADMIN_STATUS.YES;

        return {
          success: true,
          isRegistered: true,
          isApproved: isApproved,
          isAdmin: isAdminUser,
          studentId: studentId || '',
          name: name || '',
          userType: userType || '',
          message: isApproved ? '이미 승인된 회원입니다. 로그인을 진행하세요.' : '가입 요청이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.'
        };
      }
    }

    return { success: true, isRegistered: false, isApproved: false, message: '등록되지 않은 사용자입니다. 가입 요청을 진행할 수 있습니다.' };

  } catch (error) {
    console.error('사용자 등록 상태 확인 실패:', error);
    throw new Error('사용자 등록 상태 확인 중 오류가 발생했습니다.');
  }
}

function checkUserApprovalStatus(email) {
  try {
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);

    const data = sheet.getRange('A:Z').getValues();
    if (!data || data.length === 0) {
      return { success: true, isApproved: false, message: '등록되지 않은 사용자입니다.' };
    }

    const { NO_MEMBER, USER_TYPE, GOOGLE_MEMBER, APPROVAL, IS_ADMIN } = USER_SHEET_COLUMNS;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const encryptedUserEmail = row[GOOGLE_MEMBER];
      const userEmail = decryptEmail(encryptedUserEmail);

      if (userEmail === email) {
        const approvalStatus = row[APPROVAL];
        const isAdmin = row[IS_ADMIN];
        const studentId = row[NO_MEMBER];
        const userType = row[USER_TYPE];
        
        const isApproved = approvalStatus === APPROVAL_STATUS.APPROVED;
        const isAdminUser = isAdmin === ADMIN_STATUS.YES;

        return {
          success: true,
          isApproved: isApproved,
          isAdmin: isAdminUser,
          studentId: studentId || '',
          userType: userType || '',
          message: isApproved ? '승인된 사용자입니다.' : '승인 대기 중입니다.'
        };
      }
    }

    return { success: true, isApproved: false, message: '등록되지 않은 사용자입니다.' };

  } catch (error) {
    console.error('승인 상태 확인 실패:', error);
    throw new Error('승인 상태 확인 중 오류가 발생했습니다.');
  }
}

// ===== 사용자 가입 요청 추가 함수 =====
function addUserRegistrationRequest(userData) {
  try {
    console.log('=== addUserRegistrationRequest 시작 ===', userData);
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    
    const data = sheet.getRange('A:Z').getValues();
    if (!data || data.length === 0) throw new Error('user 시트에 데이터가 없습니다.');
    
    const { NO_MEMBER, NAME_MEMBER, GOOGLE_MEMBER, APPROVAL, IS_ADMIN } = USER_SHEET_COLUMNS;
    let userRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][NO_MEMBER] == userData.studentId) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      throw new Error('해당 학번의 사용자 정보를 찾을 수 없습니다. 학번과 이름을 확인해주세요.');
    }
    
    const existingName = data[userRowIndex - 1][NAME_MEMBER];
    if (existingName !== userData.userName) {
      throw new Error('학번과 이름이 일치하지 않습니다. 학번과 이름을 확인해주세요.');
    }
    
    const existingEmail = data[userRowIndex - 1][GOOGLE_MEMBER];
    if (existingEmail && existingEmail.trim() !== '') {
      throw new Error('이미 가입된 사용자입니다.');
    }
    
    const approvalStatus = APPROVAL_STATUS.PENDING;
    const isAdminStatus = userData.isAdminVerified ? ADMIN_STATUS.YES : ADMIN_STATUS.NO;
    const encryptedEmail = encryptEmailMain(userData.userEmail);
    
    sheet.getRange(userRowIndex, GOOGLE_MEMBER + 1, 1, 3).setValues([[encryptedEmail, approvalStatus, isAdminStatus]]);
    console.log(`사용자 가입 요청 완료: ${userData.studentId} (${userData.userEmail}) - 승인 대기: ${approvalStatus}, 관리자: ${isAdminStatus}`);
    
    return { success: true, message: '가입 요청이 제출되었습니다.' };
    
  } catch (error) {
    console.error('사용자 가입 요청 업데이트 실패:', error.message, error.stack);
    throw new Error('가입 요청 처리 중 오류가 발생했습니다: ' + error.message);
  }
}

// ===== 데이터 정리 함수 =====
function cleanupInvalidApprovalValues() {
  try {
    console.log('=== 잘못된 Approval 값 정리 시작 ===');
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.USER);
    if (!sheet) throw new Error(`'${SHEET_NAMES.USER}' 시트를 찾을 수 없습니다`);
    
    const data = sheet.getRange('A:Z').getValues();
    let fixedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const approvalStatus = data[i][USER_SHEET_COLUMNS.APPROVAL];
      if (approvalStatus === 1 || approvalStatus === '1') {
        console.log(`행 ${i + 1}의 잘못된 Approval 값 발견: ${approvalStatus} -> X로 수정`);
        sheet.getRange(i + 1, USER_SHEET_COLUMNS.APPROVAL + 1).setValue(APPROVAL_STATUS.PENDING);
        fixedCount++;
      }
    }
    
    console.log(`총 ${fixedCount}개의 잘못된 Approval 값을 수정했습니다.`);
    return { success: true, fixedCount };
    
  } catch (error) {
    console.error('Approval 값 정리 실패:', error);
    throw error;
  }
}

// ===== 이메일 암호화/복호화 함수들 (Main.gs로 이동됨) =====
// 이 함수들은 Main.gs의 encryptEmailMain, decryptEmailMain으로 통합되었습니다.
// 하위 호환성을 위해 래퍼 함수로 유지합니다.

function encryptEmail(email) {
  // Main.gs의 통합 암호화 함수 호출
  return encryptEmailMain(email);
}

function decryptEmail(encryptedEmail) {
  // Main.gs의 통합 복호화 함수 호출
  return decryptEmailMain(encryptedEmail);
}

// 이메일이 이미 암호화되었는지 확인하는 함수 (간단한 패턴 기반)
function isEncryptedEmail(email) {
  if (!email) return false;
  
  // Base64 암호화된 데이터는 일반적으로 길고 특수문자를 포함
  // 일반적인 이메일 패턴과 전화번호 패턴을 제외
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^010-\d{4}-\d{4}$/;
  
  // 이메일이나 전화번호 패턴이면 암호화되지 않음
  if (emailPattern.test(email) || phonePattern.test(email)) {
    return false;
  }
  
  // 길이가 20자 이상이고 특수문자를 포함하면 암호화된 것으로 간주
  return email.length > 20 && /[^a-zA-Z0-9@.-]/.test(email);
}

// ===== 하위 호환성 함수들 (Main.gs로 통합됨) =====
// 이 함수들은 Main.gs의 통합 함수로 대체되었습니다.

function rot13Encrypt(text) {
  // Main.gs의 통합 암호화 함수 호출
  return encryptEmailMain(text);
}

function rot13Decrypt(text) {
  // Main.gs의 통합 복호화 함수 호출
  return decryptEmailMain(text);
}
