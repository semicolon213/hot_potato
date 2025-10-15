/**
 * UserManagement.gs
 * 사용자 관리 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 메인 엔트리 포인트 함수들 =====

// POST 요청 메인 처리 함수
function doPostAuthInternal(req) {
  try {
    console.log('=== doPostAuthInternal 시작 ===');
    console.log('요청 데이터:', req);
    
    const action = req.action || req.path || '';
    console.log('요청 액션:', action);
    
    let result;
    
    switch (action) {
      case 'getPendingUsers':
        result = handleGetPendingUsers();
        break;
        
      case 'approveUser':
        result = handleApproveUser(req.studentId || req.id);
        break;
        
      case 'rejectUser':
        result = handleRejectUser(req.studentId || req.id);
        break;
        
      case 'verifyAdminKey':
        result = handleVerifyAdminKey(req.adminKey);
        break;
        
      case 'sendAdminKeyEmail':
        result = handleSendAdminKeyEmail(req.userEmail);
        break;
        
      case 'clearUserCache':
        result = handleClearUserCache();
        break;
        
      case 'submitRegistrationRequest':
        result = handleSubmitRegistrationRequest(req);
        break;
        
      case 'checkApprovalStatus':
        result = handleCheckApprovalStatus(req.email);
        break;
        
      case 'checkRegistrationStatus':
        result = handleCheckRegistrationStatus(req.email);
        break;
        
      default:
        result = {
          success: false,
          message: '지원하지 않는 액션입니다: ' + action
        };
    }
    
    console.log('처리 결과:', result);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doPostAuthInternal 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '서버 오류: ' + error.message,
        error: error.message,
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 메인 처리 함수
function doGetAuthInternal(e) {
  try {
    console.log('=== doGetAuthInternal 시작 ===');
    console.log('GET 요청:', e);
    
    const systemInfo = {
      success: true,
      message: 'Hot Potato Admin Key Management System',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(systemInfo))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doGetAuthInternal 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: 'GET 처리 오류: ' + error.message 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 사용자 관리 핸들러 함수들 =====

// 사용자 캐시 무효화 핸들러 (캐시 사용 안함으로 인해 더 이상 필요 없음)
function handleClearUserCache() {
  try {
    console.log('캐시 사용 안함 - 실시간 데이터 처리 중');
    
    return {
      success: true,
      message: '실시간 데이터 처리 중입니다. 캐시를 사용하지 않습니다.'
    };
    
  } catch (error) {
    console.error('캐시 무효화 실패:', error);
    throw error;
  }
}

// 모든 사용자 목록 가져오기 핸들러
function handleGetPendingUsers() {
  try {
    console.log('=== handleGetPendingUsers 호출됨 ===');
    const result = getAllUsers();
    console.log('getAllUsers 결과:', result);
    console.log('반환할 사용자 수:', result.users ? result.users.length : 0);
    
    return {
      success: true,
      users: result.users
    };
    
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
}

// 사용자 승인 핸들러
function handleApproveUser(studentId) {
  try {
    console.log('=== 승인 요청 시작 ===');
    console.log('학번:', studentId);
    
    if (!studentId) {
      throw new Error('학번이 필요합니다.');
    }
    
    console.log('✅ 학번 확인됨:', studentId);
    
    const result = approveUser(studentId);
    
    return {
      success: true,
      message: '사용자가 승인되었습니다.',
      approvalDate: result.approvalDate
    };
    
  } catch (error) {
    console.error('사용자 승인 실패:', error);
    throw error;
  }
}

// 사용자 거부 핸들러
function handleRejectUser(studentId) {
  try {
    console.log('=== 거부 요청 시작 ===');
    console.log('학번:', studentId);
    
    if (!studentId) {
      throw new Error('학번이 필요합니다.');
    }
    
    console.log('✅ 학번 확인됨:', studentId);
    
    const result = rejectUser(studentId);
    
    return {
      success: true,
      message: '사용자가 거부되었습니다.'
    };
    
  } catch (error) {
    console.error('사용자 거부 실패:', error);
    throw error;
  }
}

// 승인 상태 확인 핸들러
function handleCheckApprovalStatus(email) {
  try {
    if (!email) {
      throw new Error('이메일이 필요합니다.');
    }

    const result = checkUserApprovalStatus(email);
    return result;

  } catch (error) {
    console.error('승인 상태 확인 실패:', error);
    throw error;
  }
}

// 사용자 등록 상태 확인 핸들러
function handleCheckRegistrationStatus(email) {
  try {
    console.log('handleCheckRegistrationStatus 호출됨');
    console.log('받은 이메일:', email);

    if (!email) {
      throw new Error('이메일이 필요합니다.');
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('올바른 이메일 형식을 입력해주세요');
    }

    console.log('checkUserRegistrationStatus 함수 호출 시작');
    const result = checkUserRegistrationStatus(email);
    console.log('checkUserRegistrationStatus 결과:', result);
    return result;

  } catch (error) {
    console.error('사용자 등록 상태 확인 실패:', error);
    throw error;
  }
}

// 가입 요청 제출 핸들러
function handleSubmitRegistrationRequest(userData) {
  try {
    console.log('받은 사용자 데이터:', userData);
    
    // 프론트엔드에서 보내는 필드명과 Apps Script에서 기대하는 필드명 매핑
    const userEmail = userData.userEmail || userData.email;
    const userName = userData.userName || userData.name;
    const studentId = userData.studentId;
    const isAdminRequested = userData.isAdminVerified || userData.isAdmin || false;
    const adminKey = userData.adminKey || '';

    console.log('매핑된 데이터:', { userEmail, userName, studentId, isAdminRequested, adminKey });

    if (!userEmail || !userName || !studentId) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    // 관리자로 가입하려는 경우 관리자 키 검증
    let isAdminVerified = false;
    if (isAdminRequested) {
      if (!adminKey) {
        throw new Error('관리자로 가입하려면 관리자 키를 입력해주세요.');
      }
      
      // 관리자 키 검증
      const adminKeyResult = handleVerifyAdminKey(adminKey);
      if (!adminKeyResult.success) {
        throw new Error('관리자 키가 올바르지 않습니다.');
      }
      
      isAdminVerified = true;
      console.log('관리자 키 검증 성공');
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error('올바른 이메일 형식을 입력해주세요');
    }

    // 사용자 데이터를 user 시트에 추가
    const result = addUserRegistrationRequest({
      userEmail,
      userName,
      studentId,
      isAdminVerified: isAdminVerified || false
    });

    return {
      success: true,
      message: '가입 요청이 제출되었습니다. 관리자의 승인을 기다려주세요.'
    };

  } catch (error) {
    console.error('가입 요청 제출 실패:', error);
    throw error;
  }
}

// ===== 관리자 키 검증 함수 =====

// 관리자 키 검증 핸들러
function handleVerifyAdminKey(adminKey) {
  try {
    console.log('관리자 키 검증 요청:', adminKey ? adminKey.substring(0, 10) + '...' : '없음');
    
    if (!adminKey || !adminKey.trim()) {
      return {
        success: false,
        message: '관리자 키를 입력해주세요.'
      };
    }
    
    // KeyManagement.gs의 verifyAdminKey 함수 호출
    const result = verifyAdminKey(adminKey.trim());
    
    return {
      success: result.isValid,
      message: result.message,
      verificationMethod: result.verificationMethod
    };
    
  } catch (error) {
    console.error('관리자 키 검증 핸들러 오류:', error);
    return {
      success: false,
      message: '관리자 키 검증 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 이메일 마이그레이션 관련 함수들 =====

// 기존 데이터 마이그레이션 함수 - 평문 이메일을 ROT13으로 암호화
function migrateExistingEmails() {
  try {
    console.log('기존 이메일 데이터 마이그레이션 시작');
    const { spreadsheetId, spreadsheet } = findHpMemberSheet();
    
    const sheet = spreadsheet.getSheetByName('user');
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    // user 시트에서 모든 사용자 조회
    const data = sheet.getRange('A:Z').getValues();
    
    if (!data || data.length === 0) {
      console.log('마이그레이션할 데이터가 없습니다.');
      return { success: true, migrated: 0 };
    }
    
    let migratedCount = 0;
    
    // 헤더 행 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userEmail = row[3]; // google_member 컬럼 (D열)
      
      // 이메일이 있고, 이미 암호화되지 않은 경우 (암호화된 이메일은 @ 앞에 특정 패턴이 있음)
      if (userEmail && userEmail.trim() !== '' && !isEncryptedEmail(userEmail)) {
        const encryptedEmail = encryptEmailMain(userEmail);
        
        // D열(google_member) 업데이트
        sheet.getRange(`D${i + 1}`).setValue(encryptedEmail);
        
        console.log(`마이그레이션 완료: ${userEmail} -> ${encryptedEmail}`);
        migratedCount++;
      }
    }
    
    console.log(`마이그레이션 완료: 총 ${migratedCount}개 이메일 암호화`);
    return { success: true, migrated: migratedCount };
    
  } catch (error) {
    console.error('이메일 마이그레이션 실패:', error);
    throw new Error('이메일 마이그레이션 중 오류가 발생했습니다.');
  }
}

// 설정 기반 이메일 암호화/복호화 테스트 함수 (전체 이메일 주소)
function testEmailEncryption() {
  const testEmails = [
    'test@example.com',
    'user@gmail.com',
    'admin@hotpotato.org',
    'student@university.edu'
  ];
  
  console.log('=== 이메일 전체 암호화/복호화 테스트 ===');
  
  const config = getCurrentEmailEncryptionConfig();
  console.log('현재 이메일 암호화 설정:', config);
  
  const results = testEmails.map(email => {
    const encrypted = encryptEmail(email);
    const decrypted = decryptEmail(encrypted);
    const isReversible = email === decrypted;
    
    console.log(`이메일: ${email}`);
    console.log(`암호화: ${encrypted}`);
    console.log(`복호화: ${decrypted}`);
    console.log(`가역성: ${isReversible ? '✅' : '❌'}`);
    console.log('---');
    
    return {
      original: email,
      encrypted: encrypted,
      decrypted: decrypted,
      isReversible: isReversible
    };
  });
  
  const allPassed = results.every(r => r.isReversible);
  
  return {
    success: allPassed,
    testResults: results,
    allTestsPassed: allPassed,
    config: config,
    message: allPassed ? '이메일 암호화 테스트가 모두 성공했습니다' : '이메일 암호화 테스트 중 일부가 실패했습니다'
  };
}

// ROT13 암호화/복호화 테스트 함수 (전체 이메일 주소, 하위 호환성 유지)
function testRot13Encryption() {
  const testEmails = [
    'test@example.com',
    'user@gmail.com',
    'admin@hotpotato.org',
    'student@university.edu'
  ];
  
  const results = testEmails.map(email => {
    const encrypted = rot13Encrypt(email);
    const decrypted = decryptEmailMain(encrypted);
    return {
      original: email,
      encrypted: encrypted,
      decrypted: decrypted,
      isReversible: email === decrypted
    };
  });
  
  return {
    success: true,
    testResults: results,
    allTestsPassed: results.every(r => r.isReversible)
  };
}

// ===== 복호화 테스트 함수 =====
// 시트 데이터로 복호화 테스트
function testDecryption() {
  // 실제 받은 키로 테스트
  const encryptedKey = 'ADuG_2?1p09-)1';
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

// ===== 사용자 상태 확인 함수들 =====
// 사용자 승인 상태 확인
function checkUserApprovalStatus(email) {
  try {
    console.log(`사용자 승인 상태 확인: ${email}`);
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    const data = sheet.getRange('A:Z').getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userEmail = row[3]; // google_member 컬럼
      
      if (userEmail && decryptEmailMain(userEmail) === email) {
        const approvalStatus = row[4]; // Approval 컬럼
        const isAdmin = row[5]; // is_admin 컬럼
        
        return {
          success: true,
          email: email,
          approvalStatus: approvalStatus,
          isAdmin: isAdmin === 'O' || isAdmin === 1,
          message: '사용자 승인 상태 확인 완료'
        };
      }
    }
    
    return {
      success: false,
      email: email,
      message: '사용자를 찾을 수 없습니다'
    };
    
  } catch (error) {
    console.error('사용자 승인 상태 확인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '사용자 승인 상태 확인 중 오류가 발생했습니다'
    };
  }
}

// 사용자 등록 상태 확인
function checkUserRegistrationStatus(email) {
  try {
    console.log(`사용자 등록 상태 확인: ${email}`);
    
    const { spreadsheet } = findHpMemberSheet();
    const sheet = spreadsheet.getSheetByName('user');
    
    if (!sheet) {
      throw new Error('user 시트를 찾을 수 없습니다');
    }
    
    const data = sheet.getRange('A:Z').getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userEmail = row[3]; // google_member 컬럼
      
      if (userEmail && decryptEmailMain(userEmail) === email) {
        const noMember = row[0]; // no_member 컬럼
        const active = row[1]; // active 컬럼
        const name = row[2]; // name_member 컬럼
        const approvalStatus = row[4]; // Approval 컬럼
        const isAdminStatus = row[5]; // is_admin 컬럼
        
        // 승인 상태 판단
        let isApproved = false;
        let approvalStatusText = 'not_requested';
        
        if (approvalStatus === '') {
          // 빈칸: 승인요청 안한 사용자
          approvalStatusText = 'not_requested';
        } else if (approvalStatus === 'X') {
          // X: 가입승인 대기
          approvalStatusText = 'pending';
        } else if (approvalStatus === 'O') {
          // O: 가입승인된 사용자
          isApproved = true;
          approvalStatusText = 'approved';
        }
        
        // 관리자 여부 판단
        const isAdmin = isAdminStatus === 'O';
        
        return {
          success: true,
          email: email,
          isRegistered: !!noMember && !!name,
          isActive: active === 1,
          isApproved: isApproved,
          approvalStatus: approvalStatusText,
          isAdmin: isAdmin,
          memberNumber: noMember,
          studentId: noMember,
          name: name,
          message: '사용자 등록 상태 확인 완료'
        };
      }
    }
    
    return {
      success: false,
      email: email,
      message: '사용자를 찾을 수 없습니다'
    };
    
  } catch (error) {
    console.error('사용자 등록 상태 확인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '사용자 등록 상태 확인 중 오류가 발생했습니다'
    };
  }
}
