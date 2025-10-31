/**
 * StaticTagManager.gs
 * 기본 태그 관리 기능
 * Hot Potato Document Management System
 */

/**
 * @brief 기본 태그 목록 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과 { success: boolean, data: Array<string> }
 */
function getStaticTags(req) {
  try {
    console.log('🏷️ 기본 태그 목록 조회 시작');
    
    // 스크립트 속성에서 설정 가져오기
    const spreadsheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SPREADSHEET_NAME') || 'static_tag';
    const sheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SHEET_NAME') || 'tag';
    
    console.log('📊 기본 태그 스프레드시트:', spreadsheetName, '시트:', sheetName);
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      return {
        success: false,
        message: `기본 태그 스프레드시트를 찾을 수 없습니다: ${spreadsheetName}`,
        data: []
      };
    }
    
    console.log('📊 스프레드시트 ID:', spreadsheetId);
    
    // 시트 열기
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`,
        data: []
      };
    }
    
    // 태그 데이터 읽기 (A열에서, 헤더 제외)
    const lastRow = sheet.getLastRow();
    console.log('📊 시트 마지막 행:', lastRow);
    
    if (lastRow <= 1) {
      // 헤더만 있거나 빈 시트
      console.log('⚠️ 헤더만 있거나 빈 시트입니다.');
      return {
        success: true,
        data: []
      };
    }
    
    // 데이터 행이 있는 경우에만 범위 읽기
    const dataRowCount = lastRow - 1;
    if (dataRowCount <= 0) {
      console.log('⚠️ 데이터 행이 없습니다.');
      return {
        success: true,
        data: []
      };
    }
    
    console.log('📊 읽을 데이터 행 개수:', dataRowCount);
    const tagRange = sheet.getRange(2, 1, dataRowCount, 1); // A2부터 마지막 행까지
    const tagValues = tagRange.getValues();
    console.log('📊 읽은 태그 값들:', tagValues);
    
    // 빈 셀 제거하고 태그 배열 생성
    const tags = tagValues
      .map(function(row) {
        return row[0] ? String(row[0]).trim() : null;
      })
      .filter(function(tag) {
        return tag !== null && tag !== '';
      });
    
    console.log('🏷️ 기본 태그 조회 완료:', tags.length, '개', tags);
    
    return {
      success: true,
      data: tags
    };
    
  } catch (error) {
    console.error('🏷️ 기본 태그 조회 오류:', error);
    return {
      success: false,
      message: '기본 태그 조회 중 오류가 발생했습니다: ' + error.message,
      data: []
    };
  }
}

/**
 * @brief 기본 태그 추가
 * @param {Object} req - 요청 데이터 { tag: string }
 * @returns {Object} 응답 결과 { success: boolean, message: string }
 */
function addStaticTag(req) {
  try {
    console.log('🏷️ 기본 태그 추가 시작:', req);
    
    // 관리자 확인 (요청에서 이메일 가져오기, 없으면 Session 사용)
    const userEmail = req.userEmail || Session.getActiveUser().getEmail();
    console.log('👤 사용자 이메일:', userEmail);
    const status = checkUserStatus(userEmail);
    if (!status.success || !status.data || !status.data.user || status.data.user.is_admin !== 'O') {
      return {
        success: false,
        message: '기본 태그 관리는 관리자만 가능합니다.'
      };
    }
    
    const newTag = req.tag ? String(req.tag).trim() : '';
    if (!newTag) {
      return {
        success: false,
        message: '태그 이름이 필요합니다.'
      };
    }
    
    // 스크립트 속성에서 설정 가져오기
    const spreadsheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SPREADSHEET_NAME') || 'static_tag';
    const sheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SHEET_NAME') || 'tag';
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      return {
        success: false,
        message: `기본 태그 스프레드시트를 찾을 수 없습니다: ${spreadsheetName}`
      };
    }
    
    // 시트 열기
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // 시트가 없으면 생성
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // 헤더 추가
      sheet.getRange(1, 1).setValue('tag');
    }
    
    // 중복 확인
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // 헤더 제외하고 데이터가 있는 경우에만 중복 확인
      const existingTags = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < existingTags.length; i++) {
        if (String(existingTags[i][0]).trim() === newTag) {
          return {
            success: false,
            message: '이미 존재하는 태그입니다.'
          };
        }
      }
    } else if (lastRow === 1) {
      // 헤더만 있는 경우, 헤더 셀도 확인
      const headerCell = sheet.getRange(1, 1).getValue();
      if (String(headerCell).trim() === newTag) {
        return {
          success: false,
          message: '이미 존재하는 태그입니다.'
        };
      }
    }
    
    // 태그 추가 (appendRow 사용이 더 안전)
    sheet.appendRow([newTag]);
    
    console.log('🏷️ 기본 태그 추가 완료:', newTag);
    
    return {
      success: true,
      message: '기본 태그가 추가되었습니다.'
    };
    
  } catch (error) {
    console.error('🏷️ 기본 태그 추가 오류:', error);
    return {
      success: false,
      message: '기본 태그 추가 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * @brief 기본 태그 수정
 * @param {Object} req - 요청 데이터 { oldTag: string, newTag: string }
 * @returns {Object} 응답 결과 { success: boolean, message: string }
 */
function updateStaticTag(req) {
  try {
    console.log('🏷️ 기본 태그 수정 시작:', req);
    
    // 관리자 확인 (요청에서 이메일 가져오기, 없으면 Session 사용)
    const userEmail = req.userEmail || Session.getActiveUser().getEmail();
    console.log('👤 사용자 이메일:', userEmail);
    const status = checkUserStatus(userEmail);
    if (!status.success || !status.data || !status.data.user || status.data.user.is_admin !== 'O') {
      return {
        success: false,
        message: '기본 태그 관리는 관리자만 가능합니다.'
      };
    }
    
    const oldTag = req.oldTag ? String(req.oldTag).trim() : '';
    const newTag = req.newTag ? String(req.newTag).trim() : '';
    
    if (!oldTag || !newTag) {
      return {
        success: false,
        message: '기존 태그와 새 태그가 필요합니다.'
      };
    }
    
    if (oldTag === newTag) {
      return {
        success: false,
        message: '새 태그는 기존 태그와 달라야 합니다.'
      };
    }
    
    // 스크립트 속성에서 설정 가져오기
    const spreadsheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SPREADSHEET_NAME') || 'static_tag';
    const sheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SHEET_NAME') || 'tag';
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      return {
        success: false,
        message: `기본 태그 스프레드시트를 찾을 수 없습니다: ${spreadsheetName}`
      };
    }
    
    // 시트 열기
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    // 기존 태그 찾기
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: false,
        message: '수정할 태그를 찾을 수 없습니다.'
      };
    }
    
    // 데이터 행이 있는 경우에만 범위 읽기
    const dataRowCount = lastRow - 1;
    if (dataRowCount <= 0) {
      return {
        success: false,
        message: '수정할 태그를 찾을 수 없습니다.'
      };
    }
    
    const tagRange = sheet.getRange(2, 1, dataRowCount, 1);
    const tagValues = tagRange.getValues();
    let foundRow = -1;
    
    for (var i = 0; i < tagValues.length; i++) {
      if (String(tagValues[i][0]).trim() === oldTag) {
        foundRow = i + 2; // 헤더가 1행이므로 +2
        break;
      }
    }
    
    if (foundRow === -1) {
      return {
        success: false,
        message: '수정할 태그를 찾을 수 없습니다.'
      };
    }
    
    // 새 태그 중복 확인
    for (var j = 0; j < tagValues.length; j++) {
      if (j !== i && String(tagValues[j][0]).trim() === newTag) {
        return {
          success: false,
          message: '이미 존재하는 태그입니다.'
        };
      }
    }
    
    // 영향 받는 템플릿 목록 확인 (수정 전)
    var affectedSharedTemplates = [];
    var affectedPersonalTemplates = [];
    try {
      affectedSharedTemplates = findSharedTemplatesByTag(oldTag);
      affectedPersonalTemplates = findPersonalTemplatesByTag(oldTag);
    } catch (error) {
      console.warn('⚠️ 영향 받는 템플릿 확인 중 오류:', error.message);
    }
    
    // 확인 플래그가 없으면 영향 받는 템플릿 목록만 반환
    if (!req.confirm) {
      return {
        success: true,
        message: '영향 받는 템플릿 목록',
        data: {
          affectedSharedTemplates: affectedSharedTemplates,
          affectedPersonalTemplates: affectedPersonalTemplates
        }
      };
    }
    
    // 태그 수정
    sheet.getRange(foundRow, 1).setValue(newTag);
    
    console.log('🏷️ 기본 태그 수정 완료:', oldTag, '->', newTag);
    
    // 공유 템플릿 폴더에서 해당 태그를 사용하는 템플릿들의 메타데이터 업데이트
    try {
      updateSharedTemplatesByTag(oldTag, newTag);
    } catch (templateError) {
      console.warn('⚠️ 공유 템플릿 메타데이터 업데이트 중 오류 (태그 수정은 완료):', templateError.message);
      // 태그 수정은 성공했으므로 경고만 출력
    }
    
    // 개인 템플릿 폴더에서 해당 태그를 사용하는 템플릿들의 메타데이터 업데이트
    try {
      updatePersonalTemplatesByTag(oldTag, newTag);
    } catch (templateError) {
      console.warn('⚠️ 개인 템플릿 메타데이터 업데이트 중 오류 (태그 수정은 완료):', templateError.message);
      // 태그 수정은 성공했으므로 경고만 출력
    }
    
    return {
      success: true,
      message: '기본 태그가 수정되었습니다.',
      data: {
        affectedSharedTemplates: affectedSharedTemplates,
        affectedPersonalTemplates: affectedPersonalTemplates
      }
    };
    
  } catch (error) {
    console.error('🏷️ 기본 태그 수정 오류:', error);
    return {
      success: false,
      message: '기본 태그 수정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * @brief 기본 태그 삭제
 * @param {Object} req - 요청 데이터 { tag: string }
 * @returns {Object} 응답 결과 { success: boolean, message: string }
 */
function deleteStaticTag(req) {
  try {
    console.log('🏷️ 기본 태그 삭제 시작:', req);
    
    // 관리자 확인 (요청에서 이메일 가져오기, 없으면 Session 사용)
    const userEmail = req.userEmail || Session.getActiveUser().getEmail();
    console.log('👤 사용자 이메일:', userEmail);
    const status = checkUserStatus(userEmail);
    if (!status.success || !status.data || !status.data.user || status.data.user.is_admin !== 'O') {
      return {
        success: false,
        message: '기본 태그 관리는 관리자만 가능합니다.'
      };
    }
    
    const tagToDelete = req.tag ? String(req.tag).trim() : '';
    if (!tagToDelete) {
      return {
        success: false,
        message: '삭제할 태그 이름이 필요합니다.'
      };
    }
    
    // 스크립트 속성에서 설정 가져오기
    const spreadsheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SPREADSHEET_NAME') || 'static_tag';
    const sheetName = PropertiesService.getScriptProperties().getProperty('STATIC_TAG_SHEET_NAME') || 'tag';
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      return {
        success: false,
        message: `기본 태그 스프레드시트를 찾을 수 없습니다: ${spreadsheetName}`
      };
    }
    
    // 시트 열기
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    // 태그 찾기
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: false,
        message: '삭제할 태그를 찾을 수 없습니다.'
      };
    }
    
    // 데이터 행이 있는 경우에만 범위 읽기
    const dataRowCount = lastRow - 1;
    if (dataRowCount <= 0) {
      return {
        success: false,
        message: '삭제할 태그를 찾을 수 없습니다.'
      };
    }
    
    const tagRange = sheet.getRange(2, 1, dataRowCount, 1);
    const tagValues = tagRange.getValues();
    let foundRow = -1;
    
    for (var i = 0; i < tagValues.length; i++) {
      if (String(tagValues[i][0]).trim() === tagToDelete) {
        foundRow = i + 2; // 헤더가 1행이므로 +2
        break;
      }
    }
    
    if (foundRow === -1) {
      return {
        success: false,
        message: '삭제할 태그를 찾을 수 없습니다.'
      };
    }
    
    // 영향 받는 템플릿 목록 확인
    var affectedSharedTemplates = [];
    var affectedPersonalTemplates = [];
    try {
      affectedSharedTemplates = findSharedTemplatesByTag(tagToDelete);
      affectedPersonalTemplates = findPersonalTemplatesByTag(tagToDelete);
    } catch (error) {
      console.warn('⚠️ 영향 받는 템플릿 확인 중 오류:', error.message);
    }
    
    // 확인 플래그가 없으면 영향 받는 템플릿 목록만 반환
    if (!req.confirm) {
      return {
        success: true,
        message: '영향 받는 템플릿 목록',
        data: {
          affectedSharedTemplates: affectedSharedTemplates,
          affectedPersonalTemplates: affectedPersonalTemplates
        }
      };
    }
    
    // 태그 삭제 시 템플릿도 삭제할지 확인
    var deleteTemplates = req.deleteTemplates || false;
    
    // 공유 템플릿 처리
    if (affectedSharedTemplates.length > 0) {
      if (deleteTemplates) {
        // 템플릿 삭제
        affectedSharedTemplates.forEach(function(template) {
          try {
            Drive.Files.remove(template.id);
            console.log('🗑️ 공유 템플릿 삭제 완료:', template.name);
          } catch (error) {
            console.error('❌ 공유 템플릿 삭제 실패:', template.name, error.message);
          }
        });
      } else {
        // 개인 템플릿만 "기본"으로 변경하고 공유 템플릿은 그대로 둠
        console.warn('⚠️ 삭제된 태그를 사용하는 공유 템플릿이 있습니다:', affectedSharedTemplates.length, '개');
        console.warn('⚠️ 해당 템플릿들의 태그 메타데이터를 확인하세요.');
      }
    }
    
    // 개인 템플릿 처리
    if (affectedPersonalTemplates.length > 0) {
      if (deleteTemplates) {
        // 템플릿 삭제
        affectedPersonalTemplates.forEach(function(template) {
          try {
            Drive.Files.remove(template.id);
            console.log('🗑️ 개인 템플릿 삭제 완료:', template.name);
          } catch (error) {
            console.error('❌ 개인 템플릿 삭제 실패:', template.name, error.message);
          }
        });
      } else {
        // 태그를 "기본"으로 변경
        updatePersonalTemplatesByTag(tagToDelete, '기본');
      }
    }
    
    // 행 삭제
    sheet.deleteRow(foundRow);
    
    console.log('🏷️ 기본 태그 삭제 완료:', tagToDelete);
    
    return {
      success: true,
      message: '기본 태그가 삭제되었습니다.',
      data: {
        deletedSharedTemplates: deleteTemplates ? affectedSharedTemplates.length : 0,
        deletedPersonalTemplates: deleteTemplates ? affectedPersonalTemplates.length : 0,
        updatedPersonalTemplates: deleteTemplates ? 0 : affectedPersonalTemplates.length
      }
    };
    
  } catch (error) {
    console.error('🏷️ 기본 태그 삭제 오류:', error);
    return {
      success: false,
      message: '기본 태그 삭제 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * @brief 공유 템플릿 폴더에서 특정 태그를 사용하는 템플릿 찾기
 * @param {string} tag - 검색할 태그
 * @returns {Array<Object>} 해당 태그를 사용하는 템플릿 목록
 */
function findSharedTemplatesByTag(tag) {
  try {
    var folderPath = getTemplateFolderPath();
    var folderRes = findOrCreateFolder(folderPath);
    if (!folderRes || !folderRes.success || !folderRes.data || !folderRes.data.id) {
      console.warn('⚠️ 양식 폴더를 찾을 수 없습니다.');
      return [];
    }
    
    var files = Drive.Files.list({
      q: '\'' + folderRes.data.id + '\' in parents and trashed=false',
      fields: 'files(id,name,properties)'
    });
    
    var matchingTemplates = [];
    (files.files || []).forEach(function(file) {
      var p = file.properties || {};
      var fileTag = p.tag || '';
      if (fileTag === tag) {
        matchingTemplates.push({
          id: file.id,
          name: file.name,
          tag: fileTag
        });
      }
    });
    
    return matchingTemplates;
  } catch (error) {
    console.error('❌ 공유 템플릿 태그 검색 오류:', error);
    return [];
  }
}

/**
 * @brief 개인 템플릿 폴더에서 특정 태그를 사용하는 템플릿 찾기
 * @param {string} tag - 검색할 태그
 * @returns {Array<Object>} 해당 태그를 사용하는 템플릿 목록
 */
function findPersonalTemplatesByTag(tag) {
  try {
    // 개인 템플릿 폴더 경로 구성
    const rootFolderName = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_NAME') || 'hot potato';
    const documentFolderName = PropertiesService.getScriptProperties().getProperty('DOCUMENT_FOLDER_NAME') || '문서';
    const personalTemplateFolderName = PropertiesService.getScriptProperties().getProperty('PERSONAL_TEMPLATE_FOLDER_NAME') || '개인 양식';
    const folderPath = rootFolderName + '/' + documentFolderName + '/' + personalTemplateFolderName;
    
    var folderRes = findOrCreateFolder(folderPath);
    if (!folderRes || !folderRes.success || !folderRes.data || !folderRes.data.id) {
      console.warn('⚠️ 개인 양식 폴더를 찾을 수 없습니다.');
      return [];
    }
    
    var files = Drive.Files.list({
      q: '\'' + folderRes.data.id + '\' in parents and trashed=false',
      fields: 'files(id,name,properties)'
    });
    
    var matchingTemplates = [];
    (files.files || []).forEach(function(file) {
      var p = file.properties || {};
      var fileTag = p.tag || '';
      if (fileTag === tag) {
        matchingTemplates.push({
          id: file.id,
          name: file.name,
          tag: fileTag
        });
      }
    });
    
    return matchingTemplates;
  } catch (error) {
    console.error('❌ 개인 템플릿 태그 검색 오류:', error);
    return [];
  }
}

/**
 * @brief 개인 템플릿의 태그 메타데이터 업데이트
 * @param {string} oldTag - 기존 태그
 * @param {string} newTag - 새 태그
 * @returns {boolean} 성공 여부
 */
function updatePersonalTemplatesByTag(oldTag, newTag) {
  try {
    console.log('📝 기본 태그 수정으로 인한 개인 템플릿 메타데이터 업데이트:', oldTag, '->', newTag);
    
    var affectedTemplates = findPersonalTemplatesByTag(oldTag);
    
    if (affectedTemplates.length === 0) {
      console.log('📝 업데이트할 개인 템플릿이 없습니다.');
      return true;
    }
    
    console.log('📝 업데이트할 개인 템플릿 수:', affectedTemplates.length);
    
    // 각 템플릿의 메타데이터 업데이트
    var successCount = 0;
    var failCount = 0;
    
    affectedTemplates.forEach(function(template) {
      try {
        Drive.Files.update({
          properties: {
            tag: newTag
          }
        }, template.id);
        
        successCount++;
        console.log('✅ 개인 템플릿 메타데이터 업데이트 완료:', template.name);
      } catch (error) {
        failCount++;
        console.error('❌ 개인 템플릿 메타데이터 업데이트 실패:', template.name, error.message);
      }
    });
    
    console.log('📝 개인 템플릿 업데이트 완료:', successCount, '성공,', failCount, '실패');
    return failCount === 0;
  } catch (error) {
    console.error('❌ 개인 템플릿 메타데이터 업데이트 오류:', error);
    return false;
  }
}

/**
 * @brief 공유 템플릿의 태그 메타데이터 업데이트
 * @param {string} oldTag - 기존 태그
 * @param {string} newTag - 새 태그
 * @returns {boolean} 성공 여부
 */
function updateSharedTemplatesByTag(oldTag, newTag) {
  try {
    console.log('📝 기본 태그 수정으로 인한 공유 템플릿 메타데이터 업데이트:', oldTag, '->', newTag);
    
    var affectedTemplates = findSharedTemplatesByTag(oldTag);
    
    if (affectedTemplates.length === 0) {
      console.log('📝 업데이트할 공유 템플릿이 없습니다.');
      return true;
    }
    
    console.log('📝 업데이트할 공유 템플릿 수:', affectedTemplates.length);
    
    // 각 템플릿의 메타데이터 업데이트
    var successCount = 0;
    var failCount = 0;
    
    affectedTemplates.forEach(function(template) {
      try {
        // 기존 properties 가져오기
        var file = Drive.Files.get(template.id, { fields: 'properties' });
        var existingProps = file.properties || {};
        
        // 태그만 업데이트 (다른 properties는 유지)
        var updatedProps = {};
        for (var key in existingProps) {
          updatedProps[key] = existingProps[key];
        }
        updatedProps.tag = newTag;
        
        Drive.Files.update({ properties: updatedProps }, template.id);
        successCount++;
        console.log('✅ 공유 템플릿 메타데이터 업데이트 완료:', template.name, '(태그: ' + oldTag + ' -> ' + newTag + ')');
      } catch (fileError) {
        failCount++;
        console.error('❌ 공유 템플릿 메타데이터 업데이트 실패:', template.name, fileError.message);
      }
    });
    
    console.log('📝 공유 템플릿 메타데이터 업데이트 완료:', successCount, '개 성공,', failCount, '개 실패');
    return failCount === 0;
    
  } catch (error) {
    console.error('❌ 공유 템플릿 메타데이터 업데이트 오류:', error);
    return false;
  }
}

