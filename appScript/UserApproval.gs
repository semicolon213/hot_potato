/**
 * UserApproval.gs
 * 사용자 승인 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 승인 관련 함수들 =====

/**
 * 대기 중인 사용자 목록 조회
 * @returns {Object} 대기 중인 사용자 목록
 */
function getPendingUsers() {
  try {
    console.log('👥 대기 중인 사용자 목록 조회 시작');
    
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
        data: [],
        message: '대기 중인 사용자가 없습니다.'
      };
    }
    
    const header = data[0];
    const users = data.slice(1).map((row, index) => {
      const user = {};
      header.forEach((key, hIndex) => {
        user[key] = row[hIndex];
      });
      return {
        ...user,
        rowIndex: index + 2 // 스프레드시트 행 번호 (헤더 제외)
      };
    });
    
    // 대기 중인 사용자만 필터링
    const pendingUsers = users.filter(user => user.status === 'pending');
    
    console.log('👥 대기 중인 사용자 수:', pendingUsers.length);
    
    return {
      success: true,
      data: pendingUsers,
      total: pendingUsers.length,
      message: `${pendingUsers.length}명의 대기 중인 사용자가 있습니다.`
    };
    
  } catch (error) {
    console.error('👥 대기 중인 사용자 목록 조회 오류:', error);
    return {
      success: false,
      message: '대기 중인 사용자 목록 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 사용자 승인
 * @param {string} studentId - 학생 ID
 * @returns {Object} 승인 결과
 */
function approveUser(studentId) {
  try {
    console.log('✅ 사용자 승인 시작:', studentId);
    
    if (!studentId) {
      return {
        success: false,
        message: '학생 ID가 필요합니다.'
      };
    }
    
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
        success: false,
        message: '사용자 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const users = data.slice(1).map((row, index) => {
      const user = {};
      header.forEach((key, hIndex) => {
        user[key] = row[hIndex];
      });
      return {
        ...user,
        rowIndex: index + 2
      };
    });
    
    const user = users.find(u => u.student_id === studentId);
    
    if (!user) {
      return {
        success: false,
        message: '해당 학생을 찾을 수 없습니다.'
      };
    }
    
    if (user.status !== 'pending') {
      return {
        success: false,
        message: '이미 처리된 사용자입니다.'
      };
    }
    
    // 사용자 상태를 'approved'로 업데이트
    const updatedData = [...data];
    const statusColumnIndex = header.indexOf('status');
    
    if (statusColumnIndex !== -1) {
      updatedData[user.rowIndex - 1][statusColumnIndex] = 'approved';
      
      // 스프레드시트 업데이트
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
      sheet.getRange(user.rowIndex, statusColumnIndex + 1).setValue('approved');
      
      console.log('✅ 사용자 승인 완료:', studentId);
      
      return {
        success: true,
        message: '사용자가 승인되었습니다.',
        user: {
          ...user,
          status: 'approved'
        }
      };
    } else {
      return {
        success: false,
        message: '상태 컬럼을 찾을 수 없습니다.'
      };
    }
    
  } catch (error) {
    console.error('✅ 사용자 승인 오류:', error);
    return {
      success: false,
      message: '사용자 승인 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 사용자 거부
 * @param {string} studentId - 학생 ID
 * @returns {Object} 거부 결과
 */
function rejectUser(studentId) {
  try {
    console.log('❌ 사용자 거부 시작:', studentId);
    
    if (!studentId) {
      return {
        success: false,
        message: '학생 ID가 필요합니다.'
      };
    }
    
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
        success: false,
        message: '사용자 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const users = data.slice(1).map((row, index) => {
      const user = {};
      header.forEach((key, hIndex) => {
        user[key] = row[hIndex];
      });
      return {
        ...user,
        rowIndex: index + 2
      };
    });
    
    const user = users.find(u => u.student_id === studentId);
    
    if (!user) {
      return {
        success: false,
        message: '해당 학생을 찾을 수 없습니다.'
      };
    }
    
    if (user.status !== 'pending') {
      return {
        success: false,
        message: '이미 처리된 사용자입니다.'
      };
    }
    
    // 사용자 상태를 'rejected'로 업데이트
    const updatedData = [...data];
    const statusColumnIndex = header.indexOf('status');
    
    if (statusColumnIndex !== -1) {
      updatedData[user.rowIndex - 1][statusColumnIndex] = 'rejected';
      
      // 스프레드시트 업데이트
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
      sheet.getRange(user.rowIndex, statusColumnIndex + 1).setValue('rejected');
      
      console.log('❌ 사용자 거부 완료:', studentId);
      
      return {
        success: true,
        message: '사용자가 거부되었습니다.',
        user: {
          ...user,
          status: 'rejected'
        }
      };
    } else {
      return {
        success: false,
        message: '상태 컬럼을 찾을 수 없습니다.'
      };
    }
    
  } catch (error) {
    console.error('❌ 사용자 거부 오류:', error);
    return {
      success: false,
      message: '사용자 거부 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 사용자 승인 상태 확인
 * @param {string} email - 사용자 이메일
 * @returns {Object} 승인 상태 확인 결과
 */
function checkApprovalStatus(email) {
  try {
    console.log('🔍 사용자 승인 상태 확인 시작:', email);
    
    if (!email) {
      return {
        success: false,
        message: '이메일이 필요합니다.'
      };
    }
    
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
        message: getApprovalStatusMessage(user.status),
        user: user
      }
    };
    
  } catch (error) {
    console.error('🔍 사용자 승인 상태 확인 오류:', error);
    return {
      success: false,
      message: '승인 상태 확인 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 승인 상태 메시지 반환
 * @param {string} status - 승인 상태
 * @returns {string} 상태 메시지
 */
function getApprovalStatusMessage(status) {
  switch (status) {
    case 'approved':
      return '승인이 완료되었습니다. 시스템을 이용할 수 있습니다.';
    case 'pending':
      return '승인 대기 중입니다. 관리자의 승인을 기다려주세요.';
    case 'rejected':
      return '승인이 거부되었습니다. 관리자에게 문의하세요.';
    default:
      return '알 수 없는 상태입니다.';
  }
}

/**
 * 사용자 캐시 초기화
 * @returns {Object} 초기화 결과
 */
function clearUserCache() {
  try {
    console.log('🗑️ 사용자 캐시 초기화 시작');
    
    // 캐시 초기화 로직 (현재는 로그만 출력)
    console.log('🗑️ 사용자 캐시 초기화 완료');
    
    return {
      success: true,
      message: '사용자 캐시가 초기화되었습니다.'
    };
    
  } catch (error) {
    console.error('🗑️ 사용자 캐시 초기화 오류:', error);
    return {
      success: false,
      message: '사용자 캐시 초기화 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getUserApprovalInfo() {
  return {
    version: '1.0.0',
    description: '사용자 승인 관련 함수들',
    functions: [
      'getPendingUsers',
      'approveUser',
      'rejectUser',
      'checkApprovalStatus',
      'getApprovalStatusMessage',
      'clearUserCache'
    ],
    dependencies: ['SpreadsheetUtils.gs', 'CONFIG.gs']
  };
}
