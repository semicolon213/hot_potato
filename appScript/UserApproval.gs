/**
 * UserApproval.gs
 * 사용자 승인 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 승인 관련 함수들 =====

/**
 * 모든 사용자 목록 조회 (승인 대기 + 승인된 사용자)
 * @returns {Object} 모든 사용자 목록
 */
function getAllUsers() {
  let spreadsheetId = 'unknown';
  let sheetName = 'unknown';
  
  try {
    console.log('👥 모든 사용자 목록 조회 시작');
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    console.log('📊 스프레드시트 객체:', spreadsheet);
    if (!spreadsheet) {
      console.log('❌ 스프레드시트를 찾을 수 없습니다.');
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    spreadsheetId = spreadsheet.getId();
    console.log('📊 스프레드시트 ID:', spreadsheetId);
    
    sheetName = 'user';
    console.log('📊 시트 이름:', sheetName);
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');
    console.log('📊 가져온 데이터:', data);
    
    if (!data || data.length <= 1) {
      console.log('📊 데이터가 없거나 헤더만 있음:', data);
      return {
        success: true,
        users: [],
        message: '사용자가 없습니다.'
      };
    }
    
    const header = data[0];
    console.log('📊 헤더:', header);
    
    // 빈 행 필터링 (학번이 없거나 이름이 없는 행 제외)
    const validRows = data.slice(1).filter(row => {
      const studentId = row[0]; // no_member
      const name = row[2]; // name_member
      return studentId && studentId !== '' && name && name !== '';
    });
    
    console.log('📊 유효한 데이터 행 수:', validRows.length);
    
    const users = validRows.map((row, index) => {
      const user = {};
      header.forEach((key, hIndex) => {
        user[key] = row[hIndex];
      });
      return {
        ...user,
        rowIndex: index + 2,
        id: user.no_member || `user_${index}`,
        email: user.google_member ? applyDecryption(user.google_member, 'Base64', '') : '',
        studentId: user.no_member || '',
        name: user.name_member || '',
        userType: (() => {
          console.log('🔍 user_type 값 확인:', user.user_type, '타입:', typeof user.user_type);
          return user.user_type || 'student';
        })(),
        isAdmin: user.is_admin === 'O',
        isApproved: user.Approval === 'O',
        requestDate: user.approval_date || new Date().toISOString().split('T')[0],
        approvalDate: user.Approval === 'O' ? user.approval_date : null
      };
    });
    
    console.log('👥 전체 사용자 수:', users.length);
    console.log('👥 사용자 데이터 샘플:', users.slice(0, 2)); // 처음 2개 사용자만 로그
    
    // 승인 상태별로 분류
    const pendingUsers = users.filter(user => user.Approval === 'X');
    const approvedUsers = users.filter(user => user.Approval === 'O');
    const rejectedUsers = users.filter(user => user.Approval === '' || user.Approval === null || user.Approval === undefined);
    
    console.log('👥 승인 대기 중:', pendingUsers.length);
    console.log('👥 승인된 사용자:', approvedUsers.length);
    console.log('👥 승인 거부된 사용자:', rejectedUsers.length);
    
    const response = {
      success: true,
      users: users,
      pendingUsers: pendingUsers,
      approvedUsers: approvedUsers,
      rejectedUsers: rejectedUsers,
      total: users.length,
      message: `전체 ${users.length}명 (승인 대기: ${pendingUsers.length}명, 승인됨: ${approvedUsers.length}명, 거부됨: ${rejectedUsers.length}명)`,
      debug: {
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        rawDataLength: data ? data.length : 0,
        header: header,
        userDataSample: users.slice(0, 2),
        classification: {
          pending: pendingUsers.length,
          approved: approvedUsers.length,
          rejected: rejectedUsers.length
        }
      }
    };
    
    console.log('👥 최종 응답:', response);
    return response;
    
  } catch (error) {
    console.error('👥 모든 사용자 목록 조회 오류:', error);
    return {
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack,
        spreadsheetId: spreadsheetId,
        sheetName: sheetName
      }
    };
  }
}

/**
 * 대기 중인 사용자 목록 조회
 * @returns {Object} 대기 중인 사용자 목록
 */
function getPendingUsers() {
  try {
    console.log('👥 대기 중인 사용자 목록 조회 시작');
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
    const sheetName = 'user';  // 'users'가 아니라 'user'
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');  // G열까지 포함
    
    if (!data || data.length <= 1) {
      return {
        success: true,
        users: [],  // data 대신 users로 변경
        message: '대기 중인 사용자가 없습니다.'
      };
    }
    
    const header = data[0];
    
    // 빈 행 필터링 (학번이 없거나 이름이 없는 행 제외)
    const validRows = data.slice(1).filter(row => {
      const studentId = row[0]; // no_member
      const name = row[2]; // name_member
      return studentId && studentId !== '' && name && name !== '';
    });
    
    const users = validRows.map((row, index) => {
      const user = {};
      header.forEach((key, hIndex) => {
        user[key] = row[hIndex];
      });
      return {
        ...user,
        rowIndex: index + 2 // 스프레드시트 행 번호 (헤더 제외)
      };
    });
    
    // 승인 대기 중인 사용자만 필터링 (Approval 컬럼이 'X'인 경우)
    const pendingUsers = users.filter(user => user.Approval === 'X');
    
    console.log('👥 승인 대기 중인 사용자 수:', pendingUsers.length);
    
    return {
      success: true,
      users: pendingUsers,
      total: pendingUsers.length,
      message: `${pendingUsers.length}명의 승인 대기 중인 사용자가 있습니다.`
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
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
    const sheetName = 'user'; // 'users'에서 'user'로 변경
    const data = getSheetData(spreadsheetId, sheetName, 'A:G'); // G열까지 포함
    
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
    
    // no_member 필드로 사용자 찾기
    const user = users.find(u => String(u.no_member || '').trim() === String(studentId).trim());
    
    if (!user) {
      console.log('❌ 사용자 찾기 실패:', studentId);
      console.log('❌ 사용자 목록:', users.map(u => ({ no_member: u.no_member, name: u.name_member })));
      return {
        success: false,
        message: '해당 학생을 찾을 수 없습니다.'
      };
    }
    
    // Approval 컬럼 확인
    if (user.Approval === 'O') {
      return {
        success: false,
        message: '이미 승인된 사용자입니다.'
      };
    }
    
    // Approval 컬럼을 'O'로 업데이트하고 approval_date 설정
    const approvalColumnIndex = header.indexOf('Approval');
    const dateColumnIndex = header.indexOf('approval_date');
    
    if (approvalColumnIndex !== -1) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      // Approval 컬럼 업데이트
      sheet.getRange(user.rowIndex, approvalColumnIndex + 1).setValue('O');
      
      // approval_date 컬럼 업데이트 (현재 날짜)
      if (dateColumnIndex !== -1) {
        const currentDate = new Date().toISOString().split('T')[0];
        sheet.getRange(user.rowIndex, dateColumnIndex + 1).setValue(currentDate);
      }
      
      console.log('✅ 사용자 승인 완료:', studentId);
      
      return {
        success: true,
        message: '사용자가 승인되었습니다.',
        user: {
          ...user,
          Approval: 'O',
          approval_date: new Date().toISOString().split('T')[0]
        }
      };
    } else {
      return {
        success: false,
        message: 'Approval 컬럼을 찾을 수 없습니다.'
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
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
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
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
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

function handlePinnedAnnouncementRequest(req) {
  try {
    console.log('📌 고정 공지사항 승인 요청 처리 시작:', req);
    const { writer_id, userType, author, title } = req;

    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return { success: false, message: '스프레드시트를 찾을 수 없습니다.' };
    }

    const sheet = spreadsheet.getSheetByName('user');
    if (!sheet) {
      return { success: false, message: 'user 시트를 찾을 수 없습니다.' };
    }

    const newRow = [
      writer_id, // no_member
      userType, // user_type
      '고정공지사항', // name_member
      author, // google_member
      'X', // Approval
      'X', // is_admin
      new Date() // approval_date
    ];

    sheet.appendRow(newRow);

    return { success: true, message: '고정 공지사항 승인 요청이 추가되었습니다.' };
  } catch (error) {
    console.error('📌 고정 공지사항 승인 요청 처리 오류:', error);
    return { success: false, message: '고정 공지사항 승인 요청 처리 중 오류가 발생했습니다: ' + error.message };
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
