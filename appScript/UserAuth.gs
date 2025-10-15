/**
 * UserAuth.gs
 * 사용자 인증 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 인증 관련 함수들 =====

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
    
    // 스프레드시트에서 사용자 정보 조회
    const spreadsheetId = getSheetIdByName(ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME);
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    
    const sheetName = 'users';
    const data = getSheetData(spreadsheetId, sheetName, 'A:F');
    
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
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return {
        success: true,
        data: {
          status: 'not_registered',
          message: '등록되지 않은 사용자입니다.'
        }
      };
    }
    
    return {
      success: true,
      data: {
        status: user.status || 'pending',
        message: getStatusMessage(user.status),
        user: user
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
