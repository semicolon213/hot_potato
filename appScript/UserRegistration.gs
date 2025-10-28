/**
 * UserRegistration.gs
 * 사용자 등록 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 등록 관련 함수들 =====

/**
 * 사용자 등록 요청 처리
 * @param {Object} req - 등록 요청 데이터
 * @returns {Object} 등록 결과
 */
function submitRegistrationRequest(req) {
  try {
    console.log('📝 사용자 등록 요청 처리 시작:', req);
    
    const { name, email, studentId, phone, department, role } = req;
    
    // 필수 필드 검증
    if (!name || !email || !studentId) {
      return {
        success: false,
        message: '이름, 이메일, 학번은 필수 입력 항목입니다.'
      };
    }
    
    // 이메일 형식 검증
    if (!isValidEmail(email)) {
      return {
        success: false,
        message: '유효하지 않은 이메일 형식입니다.'
      };
    }
    
    // 학번 형식 검증
    if (!isValidStudentId(studentId)) {
      return {
        success: false,
        message: '유효하지 않은 학번 형식입니다.'
      };
    }
    
    // 중복 등록 확인
    const existingUser = checkExistingUser(email, studentId);
    if (existingUser.exists) {
      return {
        success: false,
        message: existingUser.message
      };
    }
    
    // 스프레드시트에 사용자 정보 추가
    const addResult = addUserToSpreadsheet({
      name: name,
      email: email,
      student_id: studentId,
      phone: phone || '',
      department: department || '',
      role: role || 'student',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    
    if (!addResult.success) {
      return addResult;
    }
    
    console.log('📝 사용자 등록 요청 처리 완료:', email);
    
    return {
      success: true,
      message: '등록 요청이 제출되었습니다. 관리자의 승인을 기다려주세요.',
      data: {
        email: email,
        studentId: studentId,
        status: 'pending'
      }
    };
    
  } catch (error) {
    console.error('📝 사용자 등록 요청 처리 오류:', error);
    return {
      success: false,
      message: '등록 요청 처리 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일인지 여부
 */
function isValidEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error) {
    console.error('이메일 형식 검증 오류:', error);
    return false;
  }
}

/**
 * 학번 형식 검증
 * @param {string} studentId - 검증할 학번
 * @returns {boolean} 유효한 학번인지 여부
 */
function isValidStudentId(studentId) {
  try {
    if (!studentId || typeof studentId !== 'string') {
      return false;
    }
    
    // 학번 형식: 숫자 8자리 또는 9자리
    const studentIdRegex = /^\d{8,9}$/;
    return studentIdRegex.test(studentId);
  } catch (error) {
    console.error('학번 형식 검증 오류:', error);
    return false;
  }
}

/**
 * 기존 사용자 확인
 * @param {string} email - 사용자 이메일
 * @param {string} studentId - 학번
 * @returns {Object} 중복 확인 결과
 */
function checkExistingUser(email, studentId) {
  try {
    console.log('🔍 기존 사용자 확인 시작:', email, studentId);
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return {
        exists: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    const spreadsheetId = spreadsheet.getId();
    
    const sheetName = 'users';
    const data = getSheetData(spreadsheetId, sheetName, 'A:F');
    
    if (!data || data.length <= 1) {
      return {
        exists: false,
        message: '등록 가능한 사용자입니다.'
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
    
    // 이메일 중복 확인
    const emailExists = users.find(u => u.email === email);
    if (emailExists) {
      return {
        exists: true,
        message: '이미 등록된 이메일입니다.'
      };
    }
    
    // 학번 중복 확인
    const studentIdExists = users.find(u => u.student_id === studentId);
    if (studentIdExists) {
      return {
        exists: true,
        message: '이미 등록된 학번입니다.'
      };
    }
    
    return {
      exists: false,
      message: '등록 가능한 사용자입니다.'
    };
    
  } catch (error) {
    console.error('🔍 기존 사용자 확인 오류:', error);
    return {
      exists: false,
      message: '사용자 확인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 스프레드시트에 사용자 정보 추가
 * @param {Object} userData - 사용자 데이터
 * @returns {Object} 추가 결과
 */
function addUserToSpreadsheet(userData) {
  try {
    console.log('📊 스프레드시트에 사용자 정보 추가 시작:', userData);
    
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
    
    // 시트 존재 확인 및 생성
    if (!checkSheetExists(spreadsheetId, sheetName)) {
      createNewSheet(spreadsheetId, sheetName);
      const header = [['name', 'email', 'student_id', 'phone', 'department', 'role', 'status', 'created_at']];
      appendSheetData(spreadsheetId, sheetName, header);
    }
    
    // 새 행 데이터
    const newRow = [
      userData.name,
      userData.email,
      userData.student_id,
      userData.phone,
      userData.department,
      userData.role,
      userData.status,
      userData.created_at
    ];
    
    // 스프레드시트에 추가
    appendSheetData(spreadsheetId, sheetName, [newRow]);
    
    console.log('📊 스프레드시트에 사용자 정보 추가 완료');
    
    return {
      success: true,
      message: '사용자 정보가 스프레드시트에 추가되었습니다.'
    };
    
  } catch (error) {
    console.error('📊 스프레드시트 추가 오류:', error);
    return {
      success: false,
      message: '스프레드시트 추가 실패: ' + error.message
    };
  }
}

/**
 * 사용자 정보 업데이트
 * @param {string} email - 사용자 이메일
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Object} 업데이트 결과
 */
function updateUserInfo(email, updateData) {
  try {
    console.log('📝 사용자 정보 업데이트 시작:', email, updateData);
    
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
    const data = getSheetData(spreadsheetId, sheetName, 'A:H');
    
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
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      };
    }
    
    // 업데이트할 데이터가 있는 컬럼만 업데이트
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    
    Object.keys(updateData).forEach(key => {
      const columnIndex = header.indexOf(key);
      if (columnIndex !== -1) {
        sheet.getRange(user.rowIndex, columnIndex + 1).setValue(updateData[key]);
      }
    });
    
    console.log('📝 사용자 정보 업데이트 완료:', email);
    
    return {
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
      data: {
        ...user,
        ...updateData
      }
    };
    
  } catch (error) {
    console.error('📝 사용자 정보 업데이트 오류:', error);
    return {
      success: false,
      message: '사용자 정보 업데이트 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 사용자 정보 삭제
 * @param {string} email - 사용자 이메일
 * @returns {Object} 삭제 결과
 */
function deleteUserInfo(email) {
  try {
    console.log('🗑️ 사용자 정보 삭제 시작:', email);
    
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
    const data = getSheetData(spreadsheetId, sheetName, 'A:H');
    
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
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      };
    }
    
    // 행 삭제
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    sheet.deleteRow(user.rowIndex);
    
    console.log('🗑️ 사용자 정보 삭제 완료:', email);
    
    return {
      success: true,
      message: '사용자 정보가 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('🗑️ 사용자 정보 삭제 오류:', error);
    return {
      success: false,
      message: '사용자 정보 삭제 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getUserRegistrationInfo() {
  return {
    version: '1.0.0',
    description: '사용자 등록 관련 함수들',
    functions: [
      'submitRegistrationRequest',
      'isValidEmail',
      'isValidStudentId',
      'checkExistingUser',
      'addUserToSpreadsheet',
      'updateUserInfo',
      'deleteUserInfo'
    ],
    dependencies: ['SpreadsheetUtils.gs', 'CONFIG.gs']
  };
}
