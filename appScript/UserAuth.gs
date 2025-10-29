/**
 * UserAuth.gs
 * 사용자 인증 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 인증 관련 함수들 =====

/**
 * 이메일로 사용자 이름 조회
 * @param {string} email - 사용자 이메일
 * @returns {Object} 사용자 이름 정보
 */
function getUserNameByEmail(email) {
  try {
    console.log('👤 이메일로 사용자 이름 조회 시작:', email);
    
    if (!email) {
      return {
        success: false,
        message: '이메일이 필요합니다.',
        name: email
      };
    }
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.',
        name: email
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
    const sheetName = 'user';  // 스프레드시트의 시트명이 'user'
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');  // G열까지 포함
    
    if (!data || data.length <= 1) {
      console.log('👤 사용자 데이터가 없습니다.');
      return {
        success: true,
        name: email,  // 이름을 찾을 수 없으면 이메일 반환
        message: '사용자 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    console.log('👤 스프레드시트 헤더:', header);
    
    const users = data.slice(1).map(row => {
      const user = {};
      header.forEach((key, index) => {
        user[key] = row[index];
      });
      return user;
    });
    
    console.log('👤 전체 사용자 수:', users.length);
    console.log('👤 첫 번째 사용자 샘플:', users[0]);
    
    // 암호화된 이메일로 비교
    const encryptedEmail = applyEncryption(email, 'Base64', '');
    console.log('👤 원본 이메일:', email);
    console.log('👤 암호화된 이메일:', encryptedEmail);
    
    const user = users.find(u => u.google_member === encryptedEmail);
    
    if (!user) {
      console.log('👤 해당 이메일의 사용자를 찾을 수 없습니다.');
      console.log('👤 사용 가능한 google_member 값들:', users.map(u => u.google_member).slice(0, 3));
      return {
        success: true,
        name: email,  // 사용자를 찾을 수 없으면 이메일 반환
        message: '해당 이메일의 사용자를 찾을 수 없습니다.'
      };
    }
    
    // 사용자 이름 반환 (name_member 컬럼 사용)
    const userName = user.name_member || user.name || user.Name || user.username || user.Username || email;
    
    console.log('👤 사용자 이름 조회 성공:', email, '->', userName);
    
    return {
      success: true,
      name: userName,
      message: '사용자 이름을 성공적으로 조회했습니다.',
      user: user
    };
    
  } catch (error) {
    console.error('👤 사용자 이름 조회 오류:', error);
    return {
      success: false,
      message: '사용자 이름 조회 중 오류가 발생했습니다: ' + error.message,
      name: email  // 오류 시 이메일 반환
    };
  }
}

/**
 * 사용자 상태 확인
 * @param {string} email - 사용자 이메일
 * @returns {Object} 사용자 상태 정보
 */
function checkUserStatus(email) {
  try {
    console.log('👤 사용자 상태 확인 시작:', email);
    
    if (!email) {
      return {
        success: false,
        message: '이메일이 필요합니다.'
      };
    }
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
    const sheetName = 'user';  // 스프레드시트의 시트명이 'user'
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');  // G열까지 포함
    
    if (!data || data.length <= 1) {
      return {
        success: true,
        data: {
          status: 'not_registered',
          message: '등록되지 않은 사용자입니다.'
        }
      };
    }
    
    const header = data[0];
    const users = data.slice(1).map(row => {
      const user = {};
      header.forEach((key, index) => {
        user[key] = row[index];
      });
      return user;
    });
    
    // 암호화된 이메일로 비교
    const encryptedEmail = applyEncryption(email, 'Base64', '');
    const user = users.find(u => u.google_member === encryptedEmail);
    
    if (!user) {
      return {
        success: true,
        data: {
          status: 'not_registered',
          message: '등록되지 않은 사용자입니다.'
        }
      };
    }
    
    // 승인 상태 확인 (Approval 컬럼)
    const isApproved = user.Approval === 'O';
    const isAdmin = user.is_admin === 'O';
    
    return {
      success: true,
      data: {
        status: isApproved ? 'approved' : 'pending',
        message: getStatusMessage(isApproved ? 'approved' : 'pending'),
        user: {
          ...user,
          isApproved: isApproved,
          isAdmin: isAdmin
        }
      }
    };
    
  } catch (error) {
    console.error('👤 사용자 상태 확인 오류:', error);
    return {
      success: false,
      message: '사용자 상태 확인 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 상태 메시지 반환
 * @param {string} status - 사용자 상태
 * @returns {string} 상태 메시지
 */
function getStatusMessage(status) {
  switch (status) {
    case 'approved':
      return '승인된 사용자입니다.';
    case 'pending':
      return '승인 대기 중입니다.';
    case 'rejected':
      return '승인이 거부되었습니다.';
    default:
      return '알 수 없는 상태입니다.';
  }
}

/**
 * 관리자 키 검증
 * @param {string} adminKey - 관리자 키
 * @returns {Object} 검증 결과
 */
function verifyAdminKey(adminKey) {
  try {
    console.log('🔐 관리자 키 검증 시작');
    
    if (!adminKey) {
      return {
        success: false,
        message: '관리자 키가 필요합니다.'
      };
    }
    
    // CONFIG에서 관리자 키 가져오기
    const validAdminKey = getConfig('admin_key');
    
    if (adminKey === validAdminKey) {
      return {
        success: true,
        message: '관리자 키가 유효합니다.'
      };
    } else {
      return {
        success: false,
        message: '유효하지 않은 관리자 키입니다.'
      };
    }
    
  } catch (error) {
    console.error('🔐 관리자 키 검증 오류:', error);
    return {
      success: false,
      message: '관리자 키 검증 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 관리자 키 이메일 전송
 * @param {string} userEmail - 사용자 이메일
 * @returns {Object} 전송 결과
 */
function sendAdminKeyEmail(userEmail) {
  try {
    console.log('📧 관리자 키 이메일 전송 시작:', userEmail);
    
    if (!userEmail) {
      return {
        success: false,
        message: '사용자 이메일이 필요합니다.'
      };
    }
    
    // CONFIG에서 관리자 키 가져오기
    const adminKey = getConfig('admin_key');
    
    if (!adminKey) {
      return {
        success: false,
        message: '관리자 키를 찾을 수 없습니다.'
      };
    }
    
    // 이메일 전송 (Gmail API 사용)
    const subject = 'Hot Potato 관리자 키';
    const body = `
안녕하세요.

Hot Potato 시스템의 관리자 키입니다.

관리자 키: ${adminKey}

이 키를 사용하여 관리자 기능에 접근할 수 있습니다.

주의: 이 키는 개인정보이므로 타인과 공유하지 마세요.

감사합니다.
Hot Potato 시스템
    `;
    
    try {
      GmailApp.sendEmail(userEmail, subject, body);
      console.log('📧 관리자 키 이메일 전송 완료');
      
      return {
        success: true,
        message: '관리자 키가 이메일로 전송되었습니다.'
      };
    } catch (emailError) {
      console.error('📧 이메일 전송 오류:', emailError);
      return {
        success: false,
        message: '이메일 전송에 실패했습니다: ' + emailError.message
      };
    }
    
  } catch (error) {
    console.error('📧 관리자 키 이메일 전송 오류:', error);
    return {
      success: false,
      message: '관리자 키 이메일 전송 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 사용자 세션 검증
 * @param {string} email - 사용자 이메일
 * @param {string} sessionToken - 세션 토큰
 * @returns {Object} 검증 결과
 */
function validateUserSession(email, sessionToken) {
  try {
    console.log('🔐 사용자 세션 검증 시작:', email);
    
    if (!email || !sessionToken) {
      return {
        success: false,
        message: '이메일과 세션 토큰이 필요합니다.'
      };
    }
    
    // 세션 토큰 검증 로직 (간단한 구현)
    const expectedToken = generateSessionToken(email);
    
    if (sessionToken === expectedToken) {
      return {
        success: true,
        message: '유효한 세션입니다.'
      };
    } else {
      return {
        success: false,
        message: '유효하지 않은 세션입니다.'
      };
    }
    
  } catch (error) {
    console.error('🔐 사용자 세션 검증 오류:', error);
    return {
      success: false,
      message: '세션 검증 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 세션 토큰 생성
 * @param {string} email - 사용자 이메일
 * @returns {string} 세션 토큰
 */
function generateSessionToken(email) {
  try {
    const timestamp = new Date().getTime();
    const randomPart = Math.random().toString(36).substring(2);
    const token = `${email}_${timestamp}_${randomPart}`;
    
    // Base64 인코딩
    return Utilities.base64Encode(token);
  } catch (error) {
    console.error('세션 토큰 생성 오류:', error);
    return '';
  }
}

/**
 * 사용자 권한 확인
 * @param {string} email - 사용자 이메일
 * @param {string} requiredRole - 필요한 권한
 * @returns {Object} 권한 확인 결과
 */
function checkUserPermission(email, requiredRole) {
  try {
    console.log('🔐 사용자 권한 확인 시작:', email, requiredRole);
    
    if (!email || !requiredRole) {
      return {
        success: false,
        message: '이메일과 필요한 권한이 필요합니다.'
      };
    }
    
    // 사용자 상태 확인
    const userStatus = checkUserStatus(email);
    if (!userStatus.success || userStatus.data.status !== 'approved') {
      return {
        success: false,
        message: '승인되지 않은 사용자입니다.'
      };
    }
    
    // 사용자 역할 확인
    const user = userStatus.data.user;
    const userRole = user.role || 'student';
    
    // 권한 체크
    const hasPermission = checkRolePermission(userRole, requiredRole);
    
    return {
      success: hasPermission,
      message: hasPermission ? '권한이 있습니다.' : '권한이 없습니다.',
      userRole: userRole,
      requiredRole: requiredRole
    };
    
  } catch (error) {
    console.error('🔐 사용자 권한 확인 오류:', error);
    return {
      success: false,
      message: '권한 확인 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 역할 권한 확인
 * @param {string} userRole - 사용자 역할
 * @param {string} requiredRole - 필요한 역할
 * @returns {boolean} 권한 여부
 */
function checkRolePermission(userRole, requiredRole) {
  const roleHierarchy = {
    'admin': ['admin', 'professor', 'student'],
    'professor': ['professor', 'student'],
    'student': ['student']
  };
  
  return roleHierarchy[userRole] && roleHierarchy[userRole].includes(requiredRole);
}

// ===== 배포 정보 =====
function getUserAuthInfo() {
  return {
    version: '1.0.0',
    description: '사용자 인증 관련 함수들',
    functions: [
      'checkUserStatus',
      'getStatusMessage',
      'verifyAdminKey',
      'sendAdminKeyEmail',
      'validateUserSession',
      'generateSessionToken',
      'checkUserPermission',
      'checkRolePermission'
    ],
    dependencies: ['SpreadsheetUtils.gs', 'CONFIG.gs']
  };
}
