/**
 * TestSpreadsheet.gs
 * 스프레드시트 관련 테스트 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 스프레드시트 테스트 함수들 =====

/**
 * 스프레드시트 연결 테스트
 * @returns {Object} 테스트 결과
 */
function testSpreadsheetConnection() {
  console.log('=== 스프레드시트 연결 테스트 ===');
  
  try {
    const spreadsheetId = SpreadsheetCore.getHpMemberSpreadsheetId();
    console.log('스프레드시트 ID:', spreadsheetId);
    
    if (!spreadsheetId) {
      throw new Error('스프레드시트 ID를 찾을 수 없습니다');
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = spreadsheet.getName();
    console.log('스프레드시트 이름:', sheetName);
    
    return {
      success: true,
      message: '스프레드시트 연결 성공',
      spreadsheetId: spreadsheetId,
      sheetName: sheetName
    };
    
  } catch (error) {
    console.error('❌ 스프레드시트 연결 실패:', error);
    return {
      success: false,
      message: '스프레드시트 연결 실패: ' + error.message
    };
  }
}

/**
 * 시트 데이터 읽기 테스트
 * @returns {Object} 테스트 결과
 */
function testSheetDataReading() {
  console.log('=== 시트 데이터 읽기 테스트 ===');
  
  try {
    const sheetData = SpreadsheetCore.getSheetData('HP_Member');
    
    if (!sheetData || !Array.isArray(sheetData)) {
      throw new Error('시트 데이터를 읽을 수 없습니다');
    }
    
    console.log('읽은 데이터 행 수:', sheetData.length);
    console.log('첫 번째 행 (헤더):', sheetData[0]);
    
    if (sheetData.length > 1) {
      console.log('두 번째 행 (샘플):', sheetData[1]);
    }
    
    return {
      success: true,
      message: '시트 데이터 읽기 성공',
      rowCount: sheetData.length,
      headers: sheetData[0] || [],
      sampleData: sheetData[1] || null
    };
    
  } catch (error) {
    console.error('❌ 시트 데이터 읽기 실패:', error);
    return {
      success: false,
      message: '시트 데이터 읽기 실패: ' + error.message
    };
  }
}

/**
 * 시트 데이터 추가 테스트
 * @returns {Object} 테스트 결과
 */
function testSheetDataAppending() {
  console.log('=== 시트 데이터 추가 테스트 ===');
  
  try {
    const testData = [
      'TEST_' + new Date().getTime(),
      'test@example.com',
      'Test User',
      '010-0000-0000',
      'Test Department',
      'Test Position',
      'Test Status',
      new Date().toISOString()
    ];
    
    console.log('추가할 테스트 데이터:', testData);
    
    const result = SpreadsheetCore.appendSheetData('HP_Member', testData);
    
    if (!result.success) {
      throw new Error('데이터 추가 실패: ' + result.message);
    }
    
    console.log('데이터 추가 성공');
    
    return {
      success: true,
      message: '시트 데이터 추가 성공',
      testData: testData
    };
    
  } catch (error) {
    console.error('❌ 시트 데이터 추가 실패:', error);
    return {
      success: false,
      message: '시트 데이터 추가 실패: ' + error.message
    };
  }
}

/**
 * 시트 데이터 업데이트 테스트
 * @returns {Object} 테스트 결과
 */
function testSheetDataUpdating() {
  console.log('=== 시트 데이터 업데이트 테스트 ===');
  
  try {
    const testData = [
      'UPDATED_' + new Date().getTime(),
      'updated@example.com',
      'Updated User',
      '010-1111-1111',
      'Updated Department',
      'Updated Position',
      'Updated Status',
      new Date().toISOString()
    ];
    
    console.log('업데이트할 테스트 데이터:', testData);
    
    const result = SpreadsheetCore.updateSheetData('HP_Member', testData, 0);
    
    if (!result.success) {
      throw new Error('데이터 업데이트 실패: ' + result.message);
    }
    
    console.log('데이터 업데이트 성공');
    
    return {
      success: true,
      message: '시트 데이터 업데이트 성공',
      testData: testData
    };
    
  } catch (error) {
    console.error('❌ 시트 데이터 업데이트 실패:', error);
    return {
      success: false,
      message: '시트 데이터 업데이트 실패: ' + error.message
    };
  }
}

/**
 * 시트 존재 확인 테스트
 * @returns {Object} 테스트 결과
 */
function testSheetExistence() {
  console.log('=== 시트 존재 확인 테스트 ===');
  
  try {
    const existingSheet = SpreadsheetCore.checkSheetExists('HP_Member');
    const nonExistingSheet = SpreadsheetCore.checkSheetExists('NonExistingSheet');
    
    console.log('HP_Member 시트 존재:', existingSheet);
    console.log('NonExistingSheet 시트 존재:', nonExistingSheet);
    
    return {
      success: true,
      message: '시트 존재 확인 테스트 성공',
      results: {
        existingSheet: existingSheet,
        nonExistingSheet: nonExistingSheet
      }
    };
    
  } catch (error) {
    console.error('❌ 시트 존재 확인 테스트 실패:', error);
    return {
      success: false,
      message: '시트 존재 확인 테스트 실패: ' + error.message
    };
  }
}

/**
 * 새 시트 생성 테스트
 * @returns {Object} 테스트 결과
 */
function testNewSheetCreation() {
  console.log('=== 새 시트 생성 테스트 ===');
  
  try {
    const testSheetName = 'TestSheet_' + new Date().getTime();
    console.log('생성할 시트 이름:', testSheetName);
    
    const result = SpreadsheetCore.createNewSheet(testSheetName);
    
    if (!result.success) {
      throw new Error('시트 생성 실패: ' + result.message);
    }
    
    console.log('시트 생성 성공');
    
    // 생성된 시트 확인
    const exists = SpreadsheetCore.checkSheetExists(testSheetName);
    console.log('생성된 시트 존재 확인:', exists);
    
    return {
      success: true,
      message: '새 시트 생성 테스트 성공',
      sheetName: testSheetName,
      created: result.success,
      exists: exists
    };
    
  } catch (error) {
    console.error('❌ 새 시트 생성 테스트 실패:', error);
    return {
      success: false,
      message: '새 시트 생성 테스트 실패: ' + error.message
    };
  }
}

/**
 * 전체 스프레드시트 테스트 실행
 * @returns {Object} 전체 테스트 결과
 */
function runAllSpreadsheetTests() {
  console.log('=== 전체 스프레드시트 테스트 실행 ===');
  
  try {
    const results = {
      connection: testSpreadsheetConnection(),
      dataReading: testSheetDataReading(),
      dataAppending: testSheetDataAppending(),
      dataUpdating: testSheetDataUpdating(),
      sheetExistence: testSheetExistence(),
      newSheetCreation: testNewSheetCreation()
    };
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n=== 스프레드시트 테스트 결과 요약 ===`);
    console.log(`성공: ${successCount}/${totalCount}`);
    
    Object.keys(results).forEach(testName => {
      const result = results[testName];
      console.log(`${testName}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    });
    
    return {
      success: successCount === totalCount,
      message: `스프레드시트 테스트 결과: ${successCount}/${totalCount} 성공`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 전체 스프레드시트 테스트 실패:', error);
    return {
      success: false,
      message: '전체 스프레드시트 테스트 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getTestSpreadsheetInfo() {
  return {
    version: '1.0.0',
    description: '스프레드시트 관련 테스트 함수들',
    functions: [
      'testSpreadsheetConnection',
      'testSheetDataReading',
      'testSheetDataAppending',
      'testSheetDataUpdating',
      'testSheetExistence',
      'testNewSheetCreation',
      'runAllSpreadsheetTests'
    ],
    dependencies: [
      'SpreadsheetCore.gs'
    ]
  };
}
