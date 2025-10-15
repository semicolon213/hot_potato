/**
 * SpreadsheetUtils.gs
 * 스프레드시트 유틸리티 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 스프레드시트 유틸리티 함수들 =====

/**
 * 문서 ID로 행 삭제
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {Array} documentIds - 삭제할 문서 ID 배열
 * @returns {Object} 삭제 결과
 */
function deleteRowsByDocIds(spreadsheetId, sheetName, documentIds) {
  try {
    console.log('🗑️ 문서 ID로 행 삭제 시작:', { spreadsheetId, sheetName, documentIds });
    
    const data = getSheetData(spreadsheetId, sheetName, 'A:Z');
    if (!data || data.length <= 1) {
      return {
        success: true,
        message: '삭제할 데이터가 없습니다.'
      };
    }
    
    const header = data[0];
    const documentIdColumnIndex = header.indexOf('document_id');
    
    if (documentIdColumnIndex === -1) {
      return {
        success: false,
        message: 'document_id 컬럼을 찾을 수 없습니다.'
      };
    }
    
    const rowsToDelete = [];
    
    // 삭제할 행 찾기
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const docId = row[documentIdColumnIndex];
      
      if (documentIds.includes(docId)) {
        rowsToDelete.push(i + 1); // 스프레드시트 행 번호 (1부터 시작)
      }
    }
    
    if (rowsToDelete.length === 0) {
      return {
        success: true,
        message: '삭제할 문서를 찾을 수 없습니다.'
      };
    }
    
    // 행 삭제 (역순으로 삭제하여 인덱스 문제 방지)
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    rowsToDelete.sort((a, b) => b - a).forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
    
    console.log('🗑️ 문서 ID로 행 삭제 완료:', rowsToDelete.length, '행');
    
    return {
      success: true,
      message: `${rowsToDelete.length}개의 문서가 삭제되었습니다.`
    };
    
  } catch (error) {
    console.error('🗑️ 문서 ID로 행 삭제 오류:', error);
    return {
      success: false,
      message: '문서 삭제 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 스프레드시트 데이터 검색
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {string} searchTerm - 검색어
 * @param {string} column - 검색할 컬럼
 * @returns {Array} 검색 결과
 */
function searchSpreadsheetData(spreadsheetId, sheetName, searchTerm, column = null) {
  try {
    console.log('🔍 스프레드시트 데이터 검색 시작:', { spreadsheetId, sheetName, searchTerm, column });
    
    const data = getSheetData(spreadsheetId, sheetName, 'A:Z');
    if (!data || data.length <= 1) {
      return [];
    }
    
    const header = data[0];
    const results = [];
    
    // 검색할 컬럼 인덱스 찾기
    let searchColumnIndex = -1;
    if (column) {
      searchColumnIndex = header.indexOf(column);
      if (searchColumnIndex === -1) {
        console.warn('검색할 컬럼을 찾을 수 없습니다:', column);
        return [];
      }
    }
    
    // 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (searchColumnIndex !== -1) {
        // 특정 컬럼에서 검색
        const cellValue = row[searchColumnIndex];
        if (cellValue && cellValue.toString().toLowerCase().includes(searchTerm.toLowerCase())) {
          const result = {};
          header.forEach((key, index) => {
            result[key] = row[index];
          });
          results.push(result);
        }
      } else {
        // 모든 컬럼에서 검색
        const found = row.some(cellValue => 
          cellValue && cellValue.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (found) {
          const result = {};
          header.forEach((key, index) => {
            result[key] = row[index];
          });
          results.push(result);
        }
      }
    }
    
    console.log('🔍 스프레드시트 데이터 검색 완료:', results.length, '개 결과');
    return results;
    
  } catch (error) {
    console.error('🔍 스프레드시트 데이터 검색 오류:', error);
    return [];
  }
}

/**
 * 스프레드시트 데이터 정렬
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {string} column - 정렬할 컬럼
 * @param {boolean} ascending - 오름차순 여부
 * @returns {boolean} 성공 여부
 */
function sortSpreadsheetData(spreadsheetId, sheetName, column, ascending = true) {
  try {
    console.log('📊 스프레드시트 데이터 정렬 시작:', { spreadsheetId, sheetName, column, ascending });
    
    const data = getSheetData(spreadsheetId, sheetName, 'A:Z');
    if (!data || data.length <= 1) {
      return false;
    }
    
    const header = data[0];
    const columnIndex = header.indexOf(column);
    
    if (columnIndex === -1) {
      console.warn('정렬할 컬럼을 찾을 수 없습니다:', column);
      return false;
    }
    
    // 데이터 정렬 (헤더 제외)
    const dataRows = data.slice(1);
    dataRows.sort((a, b) => {
      const aValue = a[columnIndex];
      const bValue = b[columnIndex];
      
      if (ascending) {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    // 정렬된 데이터로 시트 업데이트
    const sortedData = [header, ...dataRows];
    const range = `A1:${String.fromCharCode(65 + header.length - 1)}${sortedData.length}`;
    
    return setSheetData(spreadsheetId, sheetName, range, sortedData);
    
  } catch (error) {
    console.error('📊 스프레드시트 데이터 정렬 오류:', error);
    return false;
  }
}

/**
 * 스프레드시트 데이터 필터링
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {Object} filters - 필터 조건
 * @returns {Array} 필터링된 데이터
 */
function filterSpreadsheetData(spreadsheetId, sheetName, filters) {
  try {
    console.log('🔍 스프레드시트 데이터 필터링 시작:', { spreadsheetId, sheetName, filters });
    
    const data = getSheetData(spreadsheetId, sheetName, 'A:Z');
    if (!data || data.length <= 1) {
      return [];
    }
    
    const header = data[0];
    const results = [];
    
    // 데이터 필터링
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let matches = true;
      
      // 각 필터 조건 확인
      Object.keys(filters).forEach(column => {
        const columnIndex = header.indexOf(column);
        if (columnIndex !== -1) {
          const cellValue = row[columnIndex];
          const filterValue = filters[column];
          
          if (cellValue !== filterValue) {
            matches = false;
          }
        }
      });
      
      if (matches) {
        const result = {};
        header.forEach((key, index) => {
          result[key] = row[index];
        });
        results.push(result);
      }
    }
    
    console.log('🔍 스프레드시트 데이터 필터링 완료:', results.length, '개 결과');
    return results;
    
  } catch (error) {
    console.error('🔍 스프레드시트 데이터 필터링 오류:', error);
    return [];
  }
}

/**
 * 스프레드시트 데이터 통계
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @param {string} column - 통계할 컬럼
 * @returns {Object} 통계 결과
 */
function getSpreadsheetStats(spreadsheetId, sheetName, column) {
  try {
    console.log('📊 스프레드시트 데이터 통계 시작:', { spreadsheetId, sheetName, column });
    
    const data = getSheetData(spreadsheetId, sheetName, 'A:Z');
    if (!data || data.length <= 1) {
      return {
        total: 0,
        unique: 0,
        mostCommon: null,
        leastCommon: null
      };
    }
    
    const header = data[0];
    const columnIndex = header.indexOf(column);
    
    if (columnIndex === -1) {
      console.warn('통계할 컬럼을 찾을 수 없습니다:', column);
      return null;
    }
    
    const values = data.slice(1).map(row => row[columnIndex]);
    const valueCounts = {};
    
    // 값 카운트
    values.forEach(value => {
      if (value) {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      }
    });
    
    // 통계 계산
    const total = values.length;
    const unique = Object.keys(valueCounts).length;
    
    let mostCommon = null;
    let leastCommon = null;
    let maxCount = 0;
    let minCount = Infinity;
    
    Object.keys(valueCounts).forEach(value => {
      const count = valueCounts[value];
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
      if (count < minCount) {
        minCount = count;
        leastCommon = value;
      }
    });
    
    const stats = {
      total: total,
      unique: unique,
      mostCommon: mostCommon,
      leastCommon: leastCommon,
      valueCounts: valueCounts
    };
    
    console.log('📊 스프레드시트 데이터 통계 완료');
    return stats;
    
  } catch (error) {
    console.error('📊 스프레드시트 데이터 통계 오류:', error);
    return null;
  }
}

/**
 * 스프레드시트 백업 생성
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @returns {Object} 백업 결과
 */
function createSpreadsheetBackup(spreadsheetId) {
  try {
    console.log('💾 스프레드시트 백업 생성 시작:', spreadsheetId);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const backupName = `${spreadsheet.getName()}_backup_${new Date().toISOString().split('T')[0]}`;
    
    // 백업 스프레드시트 생성
    const backupSpreadsheet = SpreadsheetApp.create(backupName);
    
    // 모든 시트 복사
    const sheets = spreadsheet.getSheets();
    sheets.forEach(sheet => {
      const backupSheet = backupSpreadsheet.insertSheet(sheet.getName());
      const data = sheet.getDataRange().getValues();
      backupSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    });
    
    // 원본 시트 삭제
    backupSpreadsheet.deleteSheet(backupSpreadsheet.getSheets()[0]);
    
    console.log('💾 스프레드시트 백업 생성 완료:', backupSpreadsheet.getId());
    
    return {
      success: true,
      message: '백업이 생성되었습니다.',
      backupId: backupSpreadsheet.getId(),
      backupUrl: backupSpreadsheet.getUrl()
    };
    
  } catch (error) {
    console.error('💾 스프레드시트 백업 생성 오류:', error);
    return {
      success: false,
      message: '백업 생성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getSpreadsheetUtilsInfo() {
  return {
    version: '1.0.0',
    description: '스프레드시트 유틸리티 함수들',
    functions: [
      'deleteRowsByDocIds',
      'searchSpreadsheetData',
      'sortSpreadsheetData',
      'filterSpreadsheetData',
      'getSpreadsheetStats',
      'createSpreadsheetBackup'
    ],
    dependencies: ['SpreadsheetCore.gs']
  };
}
