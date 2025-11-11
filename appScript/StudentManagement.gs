/**
 * StudentManagement.gs
 * 학생 관리 관련 함수들
 * Hot Potato ERP System
 */

/**
 * 학생 유급 여부 조회
 * @param {string} studentId - 학번
 * @param {string} spreadsheetId - 학생 스프레드시트 ID
 * @returns {Object} 유급 여부 정보
 */
function getStudentRetainedStatus(studentId, spreadsheetId) {
  try {
    console.log('📚 학생 유급 여부 조회 시작:', { studentId, spreadsheetId });
    
    if (!studentId || !spreadsheetId) {
      return {
        success: false,
        message: '학번과 스프레드시트 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = 'info'; // 학생 정보 시트 이름
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: '학생 정보 시트를 찾을 수 없습니다.'
      };
    }
    
    // 헤더 행 찾기
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const studentIdColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('학번') || h.toString().includes('no_student') || h.toString().includes('no'))
    );
    const retainedColIndex = headerRow.findIndex(h => 
      h && (h.toString().toLowerCase().includes('flunk') || h.toString().includes('유급') || h.toString().includes('retained') || h.toString().includes('is_retained'))
    );
    
    if (studentIdColIndex === -1) {
      return {
        success: false,
        message: '학번 컬럼을 찾을 수 없습니다.'
      };
    }
    
    // 유급 컬럼이 없으면 생성 (H열)
    let finalRetainedColIndex;
    if (retainedColIndex === -1) {
      const newColIndex = 8; // H열
      sheet.getRange(1, newColIndex).setValue('flunk');
      console.log('✅ 유급 컬럼 추가됨 (H열)');
      finalRetainedColIndex = 8; // 1-based index
    } else {
      finalRetainedColIndex = retainedColIndex + 1; // 1-based index
    }
    
    // 학생 찾기
    const data = sheet.getDataRange().getValues();
    let studentRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][studentIdColIndex] && String(data[i][studentIdColIndex]).trim() === String(studentId).trim()) {
        studentRowIndex = i + 1; // 1-based index
        break;
      }
    }
    
    if (studentRowIndex === -1) {
      return {
        success: false,
        message: '해당 학번의 학생을 찾을 수 없습니다.'
      };
    }
    
    // 유급 여부 읽기 (O 또는 숫자 값이면 유급으로 간주)
    const retainedValue = sheet.getRange(studentRowIndex, finalRetainedColIndex).getValue();
    const retainedStr = String(retainedValue || '').trim();
    const isRetained = retainedStr === 'O' || retainedStr === 'TRUE' || retainedStr !== '';
    
    console.log('✅ 유급 여부 조회 완료:', { studentId, isRetained, retainedValue: retainedStr });
    
    return {
      success: true,
      data: {
        isRetained: isRetained ? 'O' : '',
        studentId: studentId
      }
    };
    
  } catch (error) {
    console.error('❌ 학생 유급 여부 조회 실패:', error);
    return {
      success: false,
      message: '유급 여부 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 학생 유급 여부 업데이트
 * @param {string} studentId - 학번
 * @param {string} spreadsheetId - 학생 스프레드시트 ID
 * @param {boolean} isRetained - 유급 여부
 * @returns {Object} 업데이트 결과
 */
function updateStudentRetained(studentId, spreadsheetId, isRetained) {
  try {
    console.log('📚 학생 유급 여부 업데이트 시작:', { studentId, spreadsheetId, isRetained });
    
    if (!studentId || !spreadsheetId) {
      return {
        success: false,
        message: '학번과 스프레드시트 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = 'info'; // 학생 정보 시트 이름
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: '학생 정보 시트를 찾을 수 없습니다.'
      };
    }
    
    // 헤더 행 찾기
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const studentIdColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('학번') || h.toString().includes('no_student') || h.toString().includes('no'))
    );
    let retainedColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('유급') || h.toString().includes('retained') || h.toString().includes('is_retained'))
    );
    
    if (studentIdColIndex === -1) {
      return {
        success: false,
        message: '학번 컬럼을 찾을 수 없습니다.'
      };
    }
    
    // 유급 컬럼이 없으면 생성
    if (retainedColIndex === -1) {
      // H열(8번째 컬럼)에 유급 컬럼 추가
      const newColIndex = 8; // H열
      sheet.getRange(1, newColIndex).setValue('유급');
      retainedColIndex = newColIndex - 1; // 0-based index
      console.log('✅ 유급 컬럼 추가됨 (H열)');
    }
    
    const finalRetainedColIndex = retainedColIndex + 1; // 1-based index
    
    // 학생 찾기
    const data = sheet.getDataRange().getValues();
    let studentRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][studentIdColIndex] && String(data[i][studentIdColIndex]).trim() === String(studentId).trim()) {
        studentRowIndex = i + 1; // 1-based index
        break;
      }
    }
    
    if (studentRowIndex === -1) {
      return {
        success: false,
        message: '해당 학번의 학생을 찾을 수 없습니다.'
      };
    }
    
    // 유급 여부 업데이트
    const retainedValue = isRetained ? 'O' : '';
    sheet.getRange(studentRowIndex, finalRetainedColIndex).setValue(retainedValue);
    
    console.log('✅ 유급 여부 업데이트 완료:', { studentId, isRetained, row: studentRowIndex, col: finalRetainedColIndex });
    
    return {
      success: true,
      message: isRetained ? '유급으로 표시되었습니다.' : '유급 표시가 해제되었습니다.',
      data: {
        studentId: studentId,
        isRetained: retainedValue
      }
    };
    
  } catch (error) {
    console.error('❌ 학생 유급 여부 업데이트 실패:', error);
    return {
      success: false,
      message: '유급 여부 업데이트 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 학생 학년 업데이트 (매년 첫날 트리거용)
 * @param {string} spreadsheetId - 학생 스프레드시트 ID
 * @returns {Object} 업데이트 결과
 */
function updateStudentGrades(spreadsheetId) {
  try {
    console.log('📚 학생 학년 업데이트 시작:', { spreadsheetId, date: new Date().toISOString() });
    
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = 'info'; // 학생 정보 시트 이름
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: '학생 정보 시트를 찾을 수 없습니다.'
      };
    }
    
    // 헤더 행 찾기
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const studentIdColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('학번') || h.toString().includes('no_student') || h.toString().includes('no'))
    );
    const gradeColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('학년') || h.toString().includes('grade'))
    );
    const stateColIndex = headerRow.findIndex(h => 
      h && (h.toString().includes('상태') || h.toString().includes('state'))
    );
    let retainedColIndex = headerRow.findIndex(h => 
      h && (h.toString().toLowerCase().includes('flunk') || h.toString().includes('유급') || h.toString().includes('retained') || h.toString().includes('is_retained'))
    );
    
    if (studentIdColIndex === -1 || gradeColIndex === -1 || stateColIndex === -1) {
      return {
        success: false,
        message: '필수 컬럼(학번, 학년, 상태)을 찾을 수 없습니다.'
      };
    }
    
    // 유급 컬럼이 없으면 생성 (H열)
    if (retainedColIndex === -1) {
      const newColIndex = 8; // H열
      sheet.getRange(1, newColIndex).setValue('flunk');
      retainedColIndex = newColIndex - 1; // 0-based index
      console.log('✅ 유급 컬럼 추가됨 (H열)');
    }
    
    // 데이터 읽기
    const data = sheet.getDataRange().getValues();
    let updatedCount = 0;
    let graduatedCount = 0;
    let skippedCount = 0;
    let retainedResetCount = 0;
    
    // 1단계: 모든 학생의 유급 여부 초기화 (졸업, 휴학 제외)
    console.log('🔄 유급 여부 초기화 시작...');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = row[studentIdColIndex];
      const currentState = String(row[stateColIndex] || '').trim();
      
      // 학번이 없으면 건너뛰기
      if (!studentId || String(studentId).trim() === '') {
        continue;
      }
      
      // 졸업하거나 휴학인 학생은 유급 여부 초기화하지 않음
      if (currentState === '졸업' || currentState === '휴학') {
        continue;
      }
      
      // 유급 여부 초기화 (빈 값으로 설정)
      const currentRetainedValue = String(row[retainedColIndex] || '').trim();
      if (currentRetainedValue !== '') {
        sheet.getRange(i + 1, retainedColIndex + 1).setValue('');
        retainedResetCount++;
        console.log('🔄 유급 여부 초기화:', { studentId });
      }
    }
    console.log('✅ 유급 여부 초기화 완료:', retainedResetCount, '명');
    
    // 2단계: 학년 업데이트 (유급이 초기화되었으므로 이제 유급 체크는 하지 않음)
    console.log('📚 학년 업데이트 시작...');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = row[studentIdColIndex];
      const currentGrade = String(row[gradeColIndex] || '').trim();
      const currentState = String(row[stateColIndex] || '').trim();
      
      // 학번이 없으면 건너뛰기
      if (!studentId || String(studentId).trim() === '') {
        continue;
      }
      
      // 상태가 휴학인 학생은 건너뛰기 (유급은 이미 초기화됨)
      if (currentState === '휴학') {
        skippedCount++;
        console.log('⏭️ 건너뛰기:', { studentId, reason: '휴학' });
        continue;
      }
      
      // 학년이 숫자가 아니면 건너뛰기
      const gradeNum = parseInt(currentGrade);
      if (isNaN(gradeNum)) {
        skippedCount++;
        continue;
      }
      
      // 3학년인 경우 졸업 처리
      if (gradeNum === 3) {
        // 학년을 "-"로 표기하고 상태를 "졸업"으로 변경
        sheet.getRange(i + 1, gradeColIndex + 1).setValue('-');
        sheet.getRange(i + 1, stateColIndex + 1).setValue('졸업');
        graduatedCount++;
        console.log('🎓 졸업 처리:', { studentId, previousGrade: gradeNum });
      } else {
        // 학년 +1
        const newGrade = gradeNum + 1;
        sheet.getRange(i + 1, gradeColIndex + 1).setValue(String(newGrade));
        updatedCount++;
        console.log('📈 학년 업데이트:', { studentId, previousGrade: gradeNum, newGrade: newGrade });
      }
    }
    
    console.log('✅ 학생 학년 업데이트 완료:', {
      retainedReset: retainedResetCount,
      updated: updatedCount,
      graduated: graduatedCount,
      skipped: skippedCount,
      total: data.length - 1
    });
    
    return {
      success: true,
      message: `학년 업데이트 완료: ${retainedResetCount}명 유급 여부 초기화, ${updatedCount}명 학년 증가, ${graduatedCount}명 졸업 처리, ${skippedCount}명 건너뛰기`,
      data: {
        retainedResetCount: retainedResetCount,
        updatedCount: updatedCount,
        graduatedCount: graduatedCount,
        skippedCount: skippedCount,
        totalStudents: data.length - 1
      }
    };
    
  } catch (error) {
    console.error('❌ 학생 학년 업데이트 실패:', error);
    return {
      success: false,
      message: '학년 업데이트 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 학생 학년 업데이트 트리거 함수 (매년 1월 자동 실행용)
 * 트리거로 실행될 때 한국 시간을 확인하여 1월인 경우에만 실행합니다.
 * 월 단위 타이머로 매월 1일에 실행되도록 설정하면, 1월에만 실제로 학년이 업데이트됩니다.
 * @returns {Object} 업데이트 결과
 */
function handleAnnualGradeUpdate() {
  try {
    console.log('🔄 === 매년 학년 업데이트 트리거 시작 ===');
    
    // 한국 시간(KST, UTC+9) 가져오기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9를 밀리초로 변환
    const kstTime = new Date(now.getTime() + kstOffset);
    const currentMonth = kstTime.getUTCMonth() + 1; // getUTCMonth()는 0-11이므로 +1
    const currentDate = kstTime.getUTCDate();
    
    console.log('⏰ 한국 시간:', kstTime.toISOString());
    console.log('📅 현재 월:', currentMonth, '일:', currentDate);
    
    // 1월이 아니면 실행하지 않음
    if (currentMonth !== 1) {
      console.log('⏭️ 1월이 아니므로 학년 업데이트를 건너뜁니다. (현재 월: ' + currentMonth + '월)');
      return {
        success: true,
        message: `현재 ${currentMonth}월이므로 학년 업데이트를 건너뜁니다. (1월에만 실행됩니다.)`,
        skipped: true
      };
    }
    
    // 1월 1일이 아니면 실행하지 않음 (선택사항 - 원하면 주석 해제)
    // if (currentDate !== 1) {
    //   console.log('⏭️ 1월 1일이 아니므로 학년 업데이트를 건너뜁니다.');
    //   return {
    //     success: true,
    //     message: '1월 1일에만 실행됩니다.',
    //     skipped: true
    //   };
    // }
    
    console.log('✅ 1월이므로 학년 업데이트를 실행합니다.');
    
    // 학생 스프레드시트 이름 (CONFIG에서 가져오거나 기본값 사용)
    const studentSpreadsheetName = 'student'; // 학생 스프레드시트 이름
    
    // 스프레드시트 ID 찾기
    let spreadsheetId = getSheetIdByName(studentSpreadsheetName);
    
    if (!spreadsheetId) {
      console.error('❌ 학생 스프레드시트를 찾을 수 없습니다:', studentSpreadsheetName);
      return {
        success: false,
        message: `학생 스프레드시트 '${studentSpreadsheetName}'를 찾을 수 없습니다.`
      };
    }
    
    console.log('✅ 학생 스프레드시트 ID 찾기 성공:', spreadsheetId);
    
    // 학년 업데이트 실행
    const result = updateStudentGrades(spreadsheetId);
    
    console.log('🎉 === 매년 학년 업데이트 트리거 완료 ===');
    console.log('📊 결과:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ 매년 학년 업데이트 트리거 실패:', error);
    return {
      success: false,
      message: '매년 학년 업데이트 중 오류가 발생했습니다: ' + error.message
    };
  }
}

