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
      const email = decryptEmailMain(encryptedEmail); // 복호화된 이메일
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
    
    // 캐시 사용 안함 - 실시간 데이터 처리
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
    
    // 캐시 사용 안함 - 실시간 데이터 처리
    
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
    
    // 캐시 사용 안함 - 실시간 데이터 처리
    
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
      // ROT13으로 복호화하여 비교 (Cloud Run과 동일한 방식)
      const userEmail = encryptedUserEmail ? decryptEmailMain(encryptedUserEmail) : '';
      const approvalStatus = row[4]; // Approval 컬럼 (E열)
      const isAdmin = row[5]; // is_admin 컬럼 (F열)
      const studentId = row[0]; // no_member 컬럼 (A열)
      const name = row[2]; // name_member 컬럼 (C열)
      
      console.log(`행 ${i} - 암호화된 이메일: ${encryptedUserEmail}, ROT13 복호화: ${userEmail}, 검색 이메일: ${email}, 승인: ${approvalStatus}, 관리자: ${isAdmin}, 학번: ${studentId}, 이름: ${name}`);

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
    console.log('=== addUserRegistrationRequest 시작 ===');
    console.log('받은 사용자 데이터:', userData);
    console.log('사용자 이메일:', userData.userEmail);
    console.log('사용자 이름:', userData.userName);
    console.log('학번:', userData.studentId);
    
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
    console.log('검색할 학번:', userData.studentId);
    console.log('학번 타입:', typeof userData.studentId);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = row[0]; // A열: 학번/교번
      console.log(`행 ${i} - 시트 학번: "${studentId}" (타입: ${typeof studentId}), 검색 학번: "${userData.studentId}" (타입: ${typeof userData.studentId})`);
      
      if (studentId == userData.studentId) { // == 사용하여 타입 무관 비교
        userRowIndex = i + 1; // 시트 행 번호 (1부터 시작)
        console.log(`학번 일치! 행 ${userRowIndex}에서 발견`);
        break;
      }
    }
    
    // 승인 상태와 관리자 상태 변수 선언
    let approvalStatus = 'X'; // 기본값: 승인 대기
    let isAdminStatus = 'X'; // 기본값: 일반 사용자
    
    if (userRowIndex === -1) {
      // 학번이 일치하는 사용자를 찾을 수 없음
      throw new Error('해당 학번의 사용자 정보를 찾을 수 없습니다. 학번과 이름을 확인해주세요.');
    } else {
      // 기존 사용자 발견 - 학번과 이름이 일치하는지 확인
      const existingName = data[userRowIndex - 1][2]; // C열: 이름
      console.log(`기존 사용자 발견 - 학번: ${userData.studentId}, 기존 이름: ${existingName}, 입력된 이름: ${userData.userName}`);
      
      if (existingName !== userData.userName) {
        throw new Error('학번과 이름이 일치하지 않습니다. 학번과 이름을 확인해주세요.');
      }
      
      // D열(google_member)에 이미 이메일이 있는지 확인
      const existingEmail = data[userRowIndex - 1][3]; // D열: google_member
      if (existingEmail && existingEmail.trim() !== '') {
        throw new Error('이미 가입된 사용자입니다.');
      }
      
      // 가입 요청 처리
      approvalStatus = 'X'; // 승인 대기
      isAdminStatus = userData.isAdminVerified ? 'O' : 'X';
      
      // D열(google_member), E열(승인 상태), F열(관리자 여부) 업데이트
      // 통합 암호화 방식 사용 (Base64)
      const encryptedEmail = encryptEmailMain(userData.userEmail);
      sheet.getRange(`D${userRowIndex}:F${userRowIndex}`).setValues([[encryptedEmail, approvalStatus, isAdminStatus]]);
      console.log(`사용자 가입 요청 완료: ${userData.studentId} (${userData.userEmail}) - 승인 대기: ${approvalStatus}, 관리자: ${isAdminStatus}`);
    }
    
    console.log(`사용자 가입 요청 업데이트: ${userData.studentId} (${userData.userEmail}) - 승인: ${approvalStatus}, 관리자: ${isAdminStatus}`);
    
    // 캐시 사용 안함 - 실시간 데이터 처리
    
    return {
      success: true,
      message: '가입 요청이 제출되었습니다.'
    };
    
  } catch (error) {
    console.error('사용자 가입 요청 업데이트 실패:', error);
    console.error('오류 상세 정보:', error.message);
    console.error('오류 스택:', error.stack);
    throw new Error('가입 요청 처리 중 오류가 발생했습니다: ' + error.message);
  }
}

// ===== 데이터 정리 함수 =====
// 잘못된 Approval 값 정리 (1 -> X)
function cleanupInvalidApprovalValues() {
  try {
    console.log('=== 잘못된 Approval 값 정리 시작 ===');
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    const data = sheet.getRange('A:Z').getValues();
    let fixedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const approvalStatus = row[4]; // E열: Approval
      
      if (approvalStatus === 1 || approvalStatus === '1') {
        console.log(`행 ${i + 1}의 잘못된 Approval 값 발견: ${approvalStatus} -> X로 수정`);
        sheet.getRange(`E${i + 1}`).setValue('X');
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
