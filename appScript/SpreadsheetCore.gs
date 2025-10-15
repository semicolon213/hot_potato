/**
 * SpreadsheetCore.gs
 * 스프레드시트 핵심 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 스프레드시트 핵심 함수들 =====

/**
 * hp_member 스프레드시트 가져오기 (연결된 스프레드시트 사용)
 * @returns {Object} 스프레드시트 객체
 */
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

/**
 * hp_member 스프레드시트 ID 가져오기 (하위 호환성 유지)
 * @returns {string} 스프레드시트 ID
 */
function getHpMemberSpreadsheetId() {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    return spreadsheet.getId();
  } catch (error) {
    console.error('스프레드시트 ID 가져오기 실패:', error);
    return null;
  }
}

/**
 * 스프레드시트 데이터 읽기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {string} range - 범위 (예: 'A1:Z100')
 * @returns {Array} 데이터 배열
 */
function getSheetData(spreadsheetId, sheetName, range) {
  try {
    console.log('📊 스프레드시트 데이터 읽기 시작:', { spreadsheetId, sheetName, range });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.warn('시트를 찾을 수 없습니다:', sheetName);
      return null;
    }
    
    const data = sheet.getRange(range).getValues();
    console.log('📊 스프레드시트 데이터 읽기 완료:', data.length, '행');
    
    return data;
    
  } catch (error) {
    console.error('📊 스프레드시트 데이터 읽기 오류:', error);
    return null;
  }
}

/**
 * 스프레드시트 데이터 쓰기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {string} range - 범위 (예: 'A1:Z100')
 * @param {Array} data - 데이터 배열
 * @returns {boolean} 성공 여부
 */
function setSheetData(spreadsheetId, sheetName, range, data) {
  try {
    console.log('📊 스프레드시트 데이터 쓰기 시작:', { spreadsheetId, sheetName, range });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.warn('시트를 찾을 수 없습니다:', sheetName);
      return false;
    }
    
    sheet.getRange(range).setValues(data);
    console.log('📊 스프레드시트 데이터 쓰기 완료');
    
    return true;
    
  } catch (error) {
    console.error('📊 스프레드시트 데이터 쓰기 오류:', error);
    return false;
  }
}

/**
 * 스프레드시트에 데이터 추가
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {Array} data - 추가할 데이터 배열
 * @returns {boolean} 성공 여부
 */
function appendSheetData(spreadsheetId, sheetName, data) {
  try {
    console.log('📊 스프레드시트 데이터 추가 시작:', { spreadsheetId, sheetName });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.warn('시트를 찾을 수 없습니다:', sheetName);
      return false;
    }
    
    // 데이터가 2차원 배열인지 확인
    if (Array.isArray(data) && Array.isArray(data[0])) {
      // 여러 행 추가
      data.forEach(row => {
        sheet.appendRow(row);
      });
    } else {
      // 단일 행 추가
      sheet.appendRow(data);
    }
    
    console.log('📊 스프레드시트 데이터 추가 완료');
    return true;
    
  } catch (error) {
    console.error('📊 스프레드시트 데이터 추가 오류:', error);
    return false;
  }
}

/**
 * 시트 존재 확인
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @returns {boolean} 시트 존재 여부
 */
function checkSheetExists(spreadsheetId, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    return sheet !== null;
  } catch (error) {
    console.error('시트 존재 확인 오류:', error);
    return false;
  }
}

/**
 * 새 시트 생성
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @returns {boolean} 성공 여부
 */
function createNewSheet(spreadsheetId, sheetName) {
  try {
    console.log('📊 새 시트 생성 시작:', { spreadsheetId, sheetName });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.insertSheet(sheetName);
    
    console.log('📊 새 시트 생성 완료:', sheetName);
    return true;
    
  } catch (error) {
    console.error('📊 새 시트 생성 오류:', error);
    return false;
  }
}

/**
 * 시트 삭제
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @returns {boolean} 성공 여부
 */
function deleteSheet(spreadsheetId, sheetName) {
  try {
    console.log('📊 시트 삭제 시작:', { spreadsheetId, sheetName });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (sheet) {
      spreadsheet.deleteSheet(sheet);
      console.log('📊 시트 삭제 완료:', sheetName);
      return true;
    } else {
      console.warn('삭제할 시트를 찾을 수 없습니다:', sheetName);
      return false;
    }
    
  } catch (error) {
    console.error('📊 시트 삭제 오류:', error);
    return false;
  }
}

/**
 * 시트 이름 변경
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} oldName - 기존 시트 이름
 * @param {string} newName - 새 시트 이름
 * @returns {boolean} 성공 여부
 */
function renameSheet(spreadsheetId, oldName, newName) {
  try {
    console.log('📊 시트 이름 변경 시작:', { spreadsheetId, oldName, newName });
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(oldName);
    
    if (sheet) {
      sheet.setName(newName);
      console.log('📊 시트 이름 변경 완료:', oldName, '->', newName);
      return true;
    } else {
      console.warn('이름을 변경할 시트를 찾을 수 없습니다:', oldName);
      return false;
    }
    
  } catch (error) {
    console.error('📊 시트 이름 변경 오류:', error);
    return false;
  }
}

/**
 * 스프레드시트 정보 가져오기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @returns {Object} 스프레드시트 정보
 */
function getSpreadsheetInfo(spreadsheetId) {
  try {
    console.log('📊 스프레드시트 정보 가져오기 시작:', spreadsheetId);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheets = spreadsheet.getSheets();
    
    const info = {
      id: spreadsheet.getId(),
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl(),
      sheetCount: sheets.length,
      sheets: sheets.map(sheet => ({
        name: sheet.getName(),
        id: sheet.getSheetId(),
        rowCount: sheet.getLastRow(),
        columnCount: sheet.getLastColumn()
      }))
    };
    
    console.log('📊 스프레드시트 정보 가져오기 완료');
    return info;
    
  } catch (error) {
    console.error('📊 스프레드시트 정보 가져오기 오류:', error);
    return null;
  }
}

// ===== 배포 정보 =====
function getSpreadsheetCoreInfo() {
  return {
    version: '1.0.0',
    description: '스프레드시트 핵심 함수들',
    functions: [
      'getHpMemberSpreadsheet',
      'getHpMemberSpreadsheetId',
      'getSheetData',
      'setSheetData',
      'appendSheetData',
      'checkSheetExists',
      'createNewSheet',
      'deleteSheet',
      'renameSheet',
      'getSpreadsheetInfo'
    ],
    dependencies: ['CONFIG.gs']
  };
}
