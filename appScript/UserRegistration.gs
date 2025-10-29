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
    console.log('📝 추출된 데이터:', { name, email, studentId, phone, department, role });
    
    // 필수 필드 검증
    if (!name || !email || !studentId) {
      console.log('❌ 필수 필드 누락:', { name: !!name, email: !!email, studentId: !!studentId });
      return {
        success: false,
        message: '이름, 이메일, 학번은 필수 입력 항목입니다.'
      };
    }
    
    // 이메일 형식 검증
    if (!isValidEmail(email)) {
      console.log('❌ 이메일 형식 오류:', email);
      return {
        success: false,
        message: '유효하지 않은 이메일 형식입니다.'
      };
    }
    
    // 학번 형식 검증
    console.log('🔍 학번 검증 시작:', studentId);
    if (!isValidStudentId(studentId)) {
      console.log('❌ 학번 형식 오류:', studentId);
      return {
        success: false,
        message: '유효하지 않은 학번 형식입니다.'
      };
    }
    
    // 학번과 이름 매칭 검증
    const nameMatchResult = validateStudentIdNameMatch(studentId, name);
    if (!nameMatchResult.isValid) {
      console.log('❌ 학번과 이름이 일치하지 않음:', nameMatchResult.message);
      return {
        success: false,
        message: nameMatchResult.message,
        debug: nameMatchResult.debug
      };
    }
    
    // 중복 등록 확인
    const existingUser = checkExistingUser(email, studentId);
    if (existingUser.exists) {
      console.log('❌ 중복 사용자:', existingUser.message);
      return {
        success: false,
        message: existingUser.message
      };
    }
    
    // 기존 사용자 행 업데이트
    const updateResult = addUserToSpreadsheet({
      name: name,
      email: email,
      student_id: studentId,
      isAdmin: role === 'admin' || false
    });
    
    if (!updateResult.success) {
      return {
        success: false,
        message: updateResult.message,
        debug: updateResult.debug
      };
    }
    
    console.log('📝 사용자 등록 요청 처리 완료:', email);
    
    return {
      success: true,
      message: '등록 요청이 제출되었습니다. 관리자의 승인을 기다려주세요.',
      data: {
        email: email,
        studentId: studentId,
        status: 'pending'
      },
      debug: updateResult.debug
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
 * 학번과 이름 매칭 검증
 * @param {string} studentId - 학번
 * @param {string} name - 이름
 * @returns {Object} 매칭 결과
 */
function validateStudentIdNameMatch(studentId, name) {
  const debugInfo = {
    step: 'validateStudentIdNameMatch 시작',
    input: { studentId, name },
    spreadsheet: null,
    data: null,
    users: null,
    headers: null,
    matchedUser: null,
    comparison: []
  };
  
  try {
    console.log('🔍 학번과 이름 매칭 검증 시작:', studentId, name);
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      debugInfo.step = '스프레드시트 연결 실패';
      return {
        isValid: false,
        message: '스프레드시트를 찾을 수 없습니다.',
        debug: debugInfo
      };
    }
    const spreadsheetId = spreadsheet.getId();
    debugInfo.spreadsheet = { id: spreadsheetId, name: spreadsheet.getName() };
    
    const sheetName = 'user';  // 실제 사용자 데이터가 있는 시트
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');
    debugInfo.data = { sheetName, rowCount: data ? data.length : 0, headers: data ? data[0] : null };
    
    if (!data || data.length <= 1) {
      debugInfo.step = '사용자 데이터 없음';
      return {
        isValid: false,
        message: '등록된 사용자 데이터가 없습니다. 관리자에게 문의하세요.',
        debug: debugInfo
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
    debugInfo.users = { count: users.length, sample: users[0] };
    
    // 실제 스프레드시트 헤더 사용
    debugInfo.headers = header;
    
    // 학번과 이름으로 사용자 찾기
    const matchedUser = users.find(u => {
      // 실제 스프레드시트 구조: A열=no_member, B열=user_type, C열=name_member
      const userStudentId = String(u['no_member'] || '').trim();
      const userName = String(u['name_member'] || '').trim();
      const inputStudentId = String(studentId).trim();
      const inputName = String(name).trim();
      const isMatch = userStudentId === inputStudentId && userName === inputName;
      
      debugInfo.comparison.push({
        userStudentId,
        inputStudentId,
        userName,
        inputName,
        isMatch,
        userData: u
      });
      
      console.log('🔍 비교:', userStudentId, 'vs', inputStudentId, userName, 'vs', inputName, '일치:', isMatch);
      return isMatch;
    });
    
    debugInfo.matchedUser = matchedUser;
    
    if (!matchedUser) {
      debugInfo.step = '학번과 이름 매칭 실패';
      return {
        isValid: false,
        message: '등록되지 않은 학번이거나 학번과 이름이 일치하지 않습니다. 정보를 확인해주세요.',
        debug: debugInfo
      };
    }
    
    debugInfo.nameComparison = { 
      note: '학번과 이름 모두 일치함',
      inputName: name 
    };
    
    debugInfo.step = '매칭 성공';
    return {
      isValid: true,
      message: '학번과 이름이 일치합니다.',
      debug: debugInfo
    };
    
  } catch (error) {
    debugInfo.step = '오류 발생';
    debugInfo.error = error.message;
    console.error('🔍 학번과 이름 매칭 검증 오류:', error);
    return {
      isValid: false,
      message: '학번과 이름 검증 중 오류가 발생했습니다.',
      debug: debugInfo
    };
  }
}

/**
 * 학번 검증 테스트 함수
 */
function testStudentIdValidation() {
  const testCases = [
    '28034562',
    '2803456',
    '280345621',
    '280345621234567',
    '28034562a',
    ' 28034562 ',
    '2803456-2',
    '',
    null,
    undefined,
    28034562
  ];
  
  console.log('🧪 학번 검증 테스트 시작');
  testCases.forEach((testCase, index) => {
    console.log(`테스트 ${index + 1}:`, testCase, '타입:', typeof testCase);
    const result = isValidStudentId(testCase);
    console.log(`결과: ${result}`);
    console.log('---');
  });
}

/**
 * 학번 형식 검증
 * @param {string} studentId - 검증할 학번
 * @returns {boolean} 유효한 학번인지 여부
 */
function isValidStudentId(studentId) {
  try {
    console.log('🔍 학번 검증 시작:', studentId, '타입:', typeof studentId);
    
    if (!studentId) {
      console.log('❌ 학번이 없음');
      return false;
    }
    
    // 학번을 문자열로 변환
    const studentIdStr = String(studentId);
    console.log('🔍 변환된 학번:', studentIdStr);
    
    // 학번 형식: 숫자 8자리부터 15자리까지
    const studentIdRegex = /^\d{8,15}$/;
    const isValid = studentIdRegex.test(studentIdStr);
    console.log('🔍 학번 검증 결과:', isValid, '학번:', studentIdStr);
    
    return isValid;
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
    
    const sheetName = 'user';  // 'users'에서 'user'로 변경
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
  const debugInfo = {
    step: 'addUserToSpreadsheet 시작',
    userData: userData,
    spreadsheet: null,
    data: null,
    users: null,
    targetUserIndex: null,
    actualRowNumber: null,
    columnIndexes: null,
    updateRanges: null,
    updateResults: []
  };
  
  try {
    console.log('📊 기존 사용자 행 업데이트 시작:', userData);
    
    // 연결된 스프레드시트 사용
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      debugInfo.step = '스프레드시트 연결 실패';
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.',
        debug: debugInfo
      };
    }
    const spreadsheetId = spreadsheet.getId();
    debugInfo.spreadsheet = { id: spreadsheetId, name: spreadsheet.getName() };
    
    const sheetName = 'user';
    const data = getSheetData(spreadsheetId, sheetName, 'A:G');
    debugInfo.data = { sheetName, rowCount: data ? data.length : 0, headers: data ? data[0] : null };
    
    if (!data || data.length <= 1) {
      debugInfo.step = '사용자 데이터 없음';
      return {
        success: false,
        message: '사용자 데이터를 찾을 수 없습니다.',
        debug: debugInfo
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
    debugInfo.users = { count: users.length, sample: users[0] };
    
    // 실제 스프레드시트 헤더 사용
    console.log('📊 실제 헤더:', header);
    
    // 학번과 이름으로 기존 사용자 찾기
    const targetUserIndex = users.findIndex(u => {
      const userStudentId = String(u['no_member'] || '').trim();
      const userName = String(u['name_member'] || '').trim();
      const inputStudentId = String(userData.student_id).trim();
      const inputName = String(userData.name).trim();
      
      console.log('📊 비교:', userStudentId, 'vs', inputStudentId, userName, 'vs', inputName);
      return userStudentId === inputStudentId && userName === inputName;
    });
    
    debugInfo.targetUserIndex = targetUserIndex;
    
    if (targetUserIndex === -1) {
      debugInfo.step = '사용자 찾기 실패';
      return {
        success: false,
        message: '해당 학번에 일치하는 사용자를 찾을 수 없습니다.',
        debug: debugInfo
      };
    }
    
    // 실제 행 번호 (헤더 포함)
    const actualRowNumber = targetUserIndex + 2;
    debugInfo.actualRowNumber = actualRowNumber;
    
    // 이메일 암호화
    const encryptedEmail = applyEncryption(userData.email, 'Base64', '');
    
    // 실제 헤더 기준으로 컬럼 찾기
    const emailColumnIndex = header.findIndex(h => h.includes('google_member') || h.includes('이메일') || h.includes('email'));
    const approvalColumnIndex = header.findIndex(h => h.includes('Approval') || h.includes('승인') || h.includes('approval'));
    const adminColumnIndex = header.findIndex(h => h.includes('is_admin') || h.includes('관리자') || h.includes('admin'));
    const dateColumnIndex = header.findIndex(h => h.includes('approval_date') || h.includes('등록') || h.includes('date'));
    
    debugInfo.columnIndexes = { 
      emailColumnIndex, 
      approvalColumnIndex, 
      adminColumnIndex, 
      dateColumnIndex,
      header: header 
    };
    
    console.log('📊 컬럼 인덱스:', debugInfo.columnIndexes);
    
    // 컬럼 인덱스 검증
    if (emailColumnIndex === -1 || approvalColumnIndex === -1 || adminColumnIndex === -1 || dateColumnIndex === -1) {
      debugInfo.step = '컬럼 찾기 실패';
      console.error('📊 컬럼을 찾을 수 없음:', debugInfo.columnIndexes);
      return {
        success: false,
        message: '스프레드시트 컬럼을 찾을 수 없습니다.',
        debug: debugInfo
      };
    }
    
    // 업데이트할 데이터
    const updateData = [
      [encryptedEmail],  // google_member 컬럼
      ['X'],             // Approval 컬럼 (초기값 X)
      [userData.isAdmin ? 'O' : 'X'],  // is_admin 컬럼
      ['']               // approval_date 컬럼 (승인 시에만 채움)
    ];
    
    // 각 열별로 업데이트
    const ranges = [
      `${sheetName}!${String.fromCharCode(65 + emailColumnIndex)}${actualRowNumber}`,    // google_member
      `${sheetName}!${String.fromCharCode(65 + approvalColumnIndex)}${actualRowNumber}`,  // Approval
      `${sheetName}!${String.fromCharCode(65 + adminColumnIndex)}${actualRowNumber}`,    // is_admin
      `${sheetName}!${String.fromCharCode(65 + dateColumnIndex)}${actualRowNumber}`      // approval_date
    ];
    
    debugInfo.updateRanges = ranges;
    
    console.log('📊 업데이트할 범위:', ranges);
    console.log('📊 업데이트할 데이터:', updateData);
    
    for (let i = 0; i < ranges.length; i++) {
      console.log(`📊 업데이트 ${i + 1}:`, ranges[i], '=', updateData[i][0]);
      
      try {
        // 직접 스프레드시트 API 사용
        const sheet = spreadsheet.getSheetByName(sheetName);
        const range = sheet.getRange(ranges[i]);
        range.setValue(updateData[i][0]);
        
        debugInfo.updateResults.push({
          range: ranges[i],
          data: updateData[i][0],
          result: true,
          method: 'direct_api'
        });
        
        console.log(`📊 업데이트 성공 ${i + 1}:`, ranges[i]);
      } catch (error) {
        console.error(`📊 업데이트 실패 ${i + 1}:`, error);
        debugInfo.updateResults.push({
          range: ranges[i],
          data: updateData[i][0],
          result: false,
          error: error.message,
          method: 'direct_api'
        });
      }
    }
    
    debugInfo.step = '업데이트 완료';
    console.log('📊 기존 사용자 행 업데이트 완료:', actualRowNumber);
    
    return {
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
      debug: debugInfo
    };
    
  } catch (error) {
    debugInfo.step = '오류 발생';
    debugInfo.error = error.message;
    console.error('📊 사용자 행 업데이트 오류:', error);
    return {
      success: false,
      message: '사용자 정보 업데이트 실패: ' + error.message,
      debug: debugInfo
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
