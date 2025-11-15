/**
 * InitialSetup.gs
 * 시스템 초기 세팅 함수
 * Hot Potato ERP System
 * 
 * Google Drive에 필요한 폴더와 스프레드시트를 자동으로 생성합니다.
 */

/**
 * 시스템 초기 세팅 실행
 * @returns {Object} 초기화 결과
 */
function initializeSystem() {
  try {
    console.log('🚀 시스템 초기 세팅 시작');
    
    const results = {
      success: true,
      folders: [],
      spreadsheets: [],
      errors: []
    };
    
    // 1. 루트 폴더 찾기 또는 생성
    const rootFolder = getOrCreateRootFolder();
    if (!rootFolder) {
      throw new Error('루트 폴더를 찾거나 생성할 수 없습니다.');
    }
    results.folders.push({ name: 'hot potato', id: rootFolder.getId() });
    console.log('✅ 루트 폴더 확인:', rootFolder.getId());
    
    // 2. 폴더 구조 생성
    const folderStructure = createFolderStructure(rootFolder);
    results.folders.push(...folderStructure);
    
    // 3. 스프레드시트 생성
    const spreadsheetResults = createSpreadsheets(rootFolder, folderStructure);
    results.spreadsheets.push(...spreadsheetResults);
    
    // 4. 스크립트 속성 설정
    const propertiesResult = setScriptProperties();
    results.properties = propertiesResult;
    
    // 에러가 있으면 success를 false로 설정
    if (results.errors.length > 0) {
      results.success = false;
    }
    
    console.log('✅ 시스템 초기 세팅 완료');
    return results;
    
  } catch (error) {
    console.error('❌ 시스템 초기 세팅 오류:', error);
    return {
      success: false,
      message: '시스템 초기 세팅 중 오류가 발생했습니다: ' + error.message,
      errors: [error.message]
    };
  }
}

/**
 * 루트 폴더 찾기 또는 생성
 * @returns {Object} 루트 폴더 객체
 */
function getOrCreateRootFolder() {
  try {
    const rootFolderName = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_NAME') || 'hot potato';
    const folders = DriveApp.getFoldersByName(rootFolderName);
    
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(rootFolderName);
    }
  } catch (error) {
    console.error('❌ 루트 폴더 생성 오류:', error);
    throw error;
  }
}

/**
 * 폴더 구조 생성
 * @param {Object} rootFolder - 루트 폴더 객체
 * @returns {Array} 생성된 폴더 정보 배열
 */
function createFolderStructure(rootFolder) {
  const folders = [];
  
  // 루트 폴더 직하위 폴더들
  const rootFolders = [
    '공지사항문서',
    '회계',
    '결재문서',
    '집행부',
    '채팅',
    '문서',
    '겸임교원',
    '학생',
    '조교'
  ];
  
  // 문서 폴더 하위 폴더들
  const documentSubFolders = [
    '양식',
    '개인 문서',
    '개인 양식',
    '공유 문서'
  ];
  
  // 역할별 폴더 하위 폴더들
  const roleSubFolders = {
    '집행부': ['student', 'calendar_council'],
    '겸임교원': ['calendar_ADprofessor'],
    '학생': ['calendar_student'],
    '조교': ['staff', 'calendar_supp']
  };
  
  // 루트 폴더 직하위 폴더 생성
  const createdFolders = {};
  rootFolders.forEach(folderName => {
    try {
      const folder = getOrCreateFolder(rootFolder, folderName);
      createdFolders[folderName] = folder;
      folders.push({ name: folderName, id: folder.getId(), path: `hot potato/${folderName}` });
      console.log(`✅ 폴더 생성: ${folderName}`);
    } catch (error) {
      console.error(`❌ 폴더 생성 실패: ${folderName}`, error);
    }
  });
  
  // 문서 폴더 하위 폴더 생성
  if (createdFolders['문서']) {
    documentSubFolders.forEach(folderName => {
      try {
        const folder = getOrCreateFolder(createdFolders['문서'], folderName);
        folders.push({ name: folderName, id: folder.getId(), path: `hot potato/문서/${folderName}` });
        console.log(`✅ 폴더 생성: 문서/${folderName}`);
      } catch (error) {
        console.error(`❌ 폴더 생성 실패: 문서/${folderName}`, error);
      }
    });
  }
  
  // 역할별 폴더 하위 폴더 생성 (스프레드시트가 들어갈 폴더는 생성하지 않음 - 스프레드시트 생성 시 자동 생성)
  // 여기서는 폴더만 생성하므로 스킵
  
  return folders;
}

/**
 * 폴더 찾기 또는 생성
 * @param {Object} parentFolder - 부모 폴더 객체
 * @param {string} folderName - 폴더 이름
 * @returns {Object} 폴더 객체
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

/**
 * 스프레드시트 생성
 * @param {Object} rootFolder - 루트 폴더 객체
 * @param {Array} folderStructure - 폴더 구조 정보
 * @returns {Array} 생성된 스프레드시트 정보 배열
 */
function createSpreadsheets(rootFolder, folderStructure) {
  const results = [];
  
  // 폴더 맵 생성 (빠른 검색을 위해)
  const folderMap = {};
  folderStructure.forEach(f => {
    folderMap[f.path] = DriveApp.getFolderById(f.id);
  });
  
  // 루트 폴더에 생성할 스프레드시트
  const rootSpreadsheets = [
    { name: 'notice', sheetConfigs: createNoticeSheetConfig() },
    { name: 'hp_member', sheetConfigs: createHpMemberSheetConfig() },
    { name: '워크플로우_관리', sheetConfigs: createWorkflowSheetConfig() }
  ];
  
  rootSpreadsheets.forEach(config => {
    try {
      const result = createSpreadsheetInFolder(rootFolder, config.name, config.sheetConfigs);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`❌ 스프레드시트 생성 실패: ${config.name}`, error);
    }
  });
  
  // 문서 폴더에 생성할 스프레드시트
  if (folderMap['hot potato/문서']) {
    try {
      const result = createSpreadsheetInFolder(
        folderMap['hot potato/문서'],
        'static_tag',
        createStaticTagSheetConfig()
      );
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error('❌ 스프레드시트 생성 실패: static_tag', error);
    }
  }
  
  // 역할별 폴더에 생성할 스프레드시트
  const roleSpreadsheets = [
    { folderPath: 'hot potato/교수', name: 'calendar_professor', sheetConfigs: createCalendarSheetConfig() },
    { folderPath: 'hot potato/집행부', name: 'calendar_council', sheetConfigs: createCalendarSheetConfig() },
    { folderPath: 'hot potato/겸임교원', name: 'calendar_ADprofessor', sheetConfigs: createCalendarSheetConfig() },
    { folderPath: 'hot potato/조교', name: 'calendar_supp', sheetConfigs: createCalendarSheetConfig() },
    { folderPath: 'hot potato/학생', name: 'calendar_student', sheetConfigs: createCalendarSheetConfig() },
    { folderPath: 'hot potato/집행부', name: 'student', sheetConfigs: createStudentSheetConfig() },
    { folderPath: 'hot potato/조교', name: 'staff', sheetConfigs: createStaffSheetConfig() }
  ];
  
  roleSpreadsheets.forEach(config => {
    try {
      const folder = folderMap[config.folderPath];
      if (folder) {
        const result = createSpreadsheetInFolder(folder, config.name, config.sheetConfigs);
        if (result) {
          results.push(result);
        }
      } else {
        console.warn(`⚠️ 폴더를 찾을 수 없음: ${config.folderPath}`);
      }
    } catch (error) {
      console.error(`❌ 스프레드시트 생성 실패: ${config.name}`, error);
    }
  });
  
  return results;
}

/**
 * 폴더에 스프레드시트 생성
 * @param {Object} folder - 폴더 객체
 * @param {string} spreadsheetName - 스프레드시트 이름
 * @param {Array} sheetConfigs - 시트 설정 배열 [{name: string, headers: Array}]
 * @returns {Object} 생성된 스프레드시트 정보
 */
function createSpreadsheetInFolder(folder, spreadsheetName, sheetConfigs) {
  // 기존 스프레드시트 확인
  const files = folder.getFilesByName(spreadsheetName);
  if (files.hasNext()) {
    const existingFile = files.next();
    if (existingFile.getMimeType() === MimeType.GOOGLE_SHEETS) {
      console.log(`📊 스프레드시트 이미 존재: ${spreadsheetName}`);
      const spreadsheet = SpreadsheetApp.openById(existingFile.getId());
      // 시트 확인 및 생성
      sheetConfigs.forEach(config => {
        ensureSheetWithHeaders(spreadsheet, config.name, config.headers);
      });
      return { name: spreadsheetName, id: existingFile.getId(), created: false };
    }
  }
  
  // 새 스프레드시트 생성
  console.log(`📊 스프레드시트 생성 시작: ${spreadsheetName}`);
  const spreadsheet = SpreadsheetApp.create(spreadsheetName);
  const spreadsheetId = spreadsheet.getId();
  const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
  
  // 스프레드시트를 폴더로 이동
  folder.addFile(spreadsheetFile);
  DriveApp.getRootFolder().removeFile(spreadsheetFile);
  
  // 기본 시트 삭제 (시트1이 아닌 경우)
  const sheets = spreadsheet.getSheets();
  if (sheets.length > 0 && sheets[0].getName() === '시트1') {
    // 첫 번째 시트가 시트1이고, sheetConfigs에 시트1이 없으면 삭제
    const hasSheet1 = sheetConfigs.some(config => config.name === '시트1');
    if (!hasSheet1) {
      spreadsheet.deleteSheet(sheets[0]);
    }
  }
  
  // 시트 생성 및 헤더 설정
  sheetConfigs.forEach(config => {
    ensureSheetWithHeaders(spreadsheet, config.name, config.headers);
  });
  
  console.log(`✅ 스프레드시트 생성 완료: ${spreadsheetName}`);
  return { name: spreadsheetName, id: spreadsheetId, created: true };
}

/**
 * 시트 확인 및 헤더 설정
 * @param {Object} spreadsheet - 스프레드시트 객체
 * @param {string} sheetName - 시트 이름
 * @param {Array} headers - 헤더 배열
 */
function ensureSheetWithHeaders(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    console.log(`📄 시트 생성: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    console.log(`📄 시트 확인: ${sheetName}`);
  }
  
  // 헤더 설정
  if (headers && headers.length > 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    const existingHeaders = headerRange.getValues()[0];
    
    // 헤더가 다르면 업데이트
    let needsUpdate = false;
    if (existingHeaders.length !== headers.length) {
      needsUpdate = true;
    } else {
      for (let i = 0; i < headers.length; i++) {
        if (existingHeaders[i] !== headers[i]) {
          needsUpdate = true;
          break;
        }
      }
    }
    
    if (needsUpdate) {
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
      console.log(`✅ 헤더 설정 완료: ${sheetName}`);
    } else {
      console.log(`✅ 헤더 이미 설정됨: ${sheetName}`);
    }
  }
}

// ===== 시트 설정 함수들 =====

/**
 * notice 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createNoticeSheetConfig() {
  return [{
    name: '시트1',
    headers: [
      'no_notice',
      'writer_notice',
      'writer_email',
      'access_rights',
      'title_notice',
      'content_notice',
      'date',
      'view_count',
      'file_notice',
      'fix_notice'
    ]
  }];
}

/**
 * hp_member 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createHpMemberSheetConfig() {
  return [{
    name: 'user',
    headers: [
      'no_member',
      'user_type',
      'name_member',
      'google_member',
      'Approval',
      'is_admin',
      'approval_date'
    ]
  }];
}

/**
 * 워크플로우_관리 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createWorkflowSheetConfig() {
  return [
    {
      name: 'workflow_documents',
      headers: [
        'workflow_id',
        'workflow_type',
        'document_id',
        'document_title',
        'document_url',
        'workflow_document_id',
        'workflow_document_title',
        'workflow_document_url',
        'attached_document_id',
        'attached_document_title',
        'attached_document_url',
        'requester_email',
        'requester_name',
        'workflow_status',
        'workflow_request_date',
        'current_review_step',
        'current_payment_step',
        'review_line',
        'payment_line',
        'workflow_complete_date',
        'created_at',
        'updated_at'
      ]
    },
    {
      name: 'workflow_history',
      headers: [
        'history_id',
        'workflow_id',
        'document_id',
        'document_title',
        'line_type',
        'step_number',
        'action_type',
        'actor_email',
        'actor_name',
        'actor_position',
        'action_date',
        'opinion',
        'reject_reason',
        'previous_status',
        'new_status',
        'processing_time'
      ]
    },
    {
      name: 'workflow_templates',
      headers: [
        'template_id',
        'template_name',
        'document_tag',
        'review_line',
        'payment_line',
        'is_default',
        'created_date',
        'updated_date',
        'created_by',
        'description'
      ]
    }
  ];
}

/**
 * static_tag 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createStaticTagSheetConfig() {
  return [{
    name: 'tag',
    headers: ['tag']
  }];
}

/**
 * 캘린더 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createCalendarSheetConfig() {
  return [{
    name: '시트1',
    headers: [
      'id_calendar',
      'title_calendar',
      'startDate_calendar',
      'endDate_calendar',
      'description_calendar',
      'colorId_calendar',
      'startDateTime_calendar',
      'endDateTime_calendar',
      'tag_calendar',
      'recurrence_rule_calendar',
      'attendees_calendar'
    ]
  }];
}

/**
 * student 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createStudentSheetConfig() {
  return [
    {
      name: 'info',
      headers: [
        'no',
        'name',
        'address',
        'phone_num',
        'grade',
        'state',
        'council',
        'flunk'
      ]
    },
    {
      name: 'std_issue',
      headers: [
        'no_member',
        'date_issue',
        'type_issue',
        'level_issue',
        'content_issue'
      ]
    }
  ];
}

/**
 * staff 스프레드시트 시트 설정
 * @returns {Array} 시트 설정 배열
 */
function createStaffSheetConfig() {
  return [
    {
      name: 'info',
      headers: [
        'no',
        'pos',
        'name',
        'tel',
        'phone',
        'email',
        'date',
        'note'
      ]
    },
    {
      name: 'committee',
      headers: [
        'sortation',
        'name',
        'tel',
        'email',
        'position',
        'career',
        'company_name',
        'company_position',
        'location',
        'is_family',
        'representative',
        'note'
      ]
    }
  ];
}

/**
 * 공유 문서 폴더 이름 가져오기 (오타 자동 수정 포함)
 * @returns {string} 공유 문서 폴더 이름
 */
function getSharedDocumentFolderName() {
  const properties = PropertiesService.getScriptProperties();
  let folderName = properties.getProperty('SHARED_DOCUMENT_FOLDER_NAME');
  
  // 오타가 있으면 자동 수정
  if (!folderName) {
    const shardValue = properties.getProperty('SHARD_DOCUMENT_FOLDER_NAME');
    if (shardValue) {
      console.log('🔧 오타 수정: SHARD_DOCUMENT_FOLDER_NAME -> SHARED_DOCUMENT_FOLDER_NAME');
      properties.setProperty('SHARED_DOCUMENT_FOLDER_NAME', shardValue);
      properties.deleteProperty('SHARD_DOCUMENT_FOLDER_NAME');
      folderName = shardValue;
      console.log(`✅ 오타 수정 완료: SHARED_DOCUMENT_FOLDER_NAME = ${shardValue}`);
    }
  }
  
  return folderName || '공유 문서';
}

/**
 * 스크립트 속성 설정
 * @returns {Object} 설정 결과
 */
function setScriptProperties() {
  try {
    console.log('⚙️ 스크립트 속성 설정 시작');
    const properties = PropertiesService.getScriptProperties();
    
    // 오타 수정: SHARD_DOCUMENT_FOLDER_NAME -> SHARED_DOCUMENT_FOLDER_NAME (먼저 실행)
    const shardValue = properties.getProperty('SHARD_DOCUMENT_FOLDER_NAME');
    if (shardValue) {
      console.log('🔧 오타 수정: SHARD_DOCUMENT_FOLDER_NAME -> SHARED_DOCUMENT_FOLDER_NAME');
      properties.setProperty('SHARED_DOCUMENT_FOLDER_NAME', shardValue);
      properties.deleteProperty('SHARD_DOCUMENT_FOLDER_NAME');
      console.log(`✅ 오타 수정 완료: SHARED_DOCUMENT_FOLDER_NAME = ${shardValue}`);
    }
    
    const propertiesToSet = {
      // 폴더 이름 설정
      'ROOT_FOLDER_NAME': 'hot potato',
      'DOCUMENT_FOLDER_NAME': '문서',
      'TEMPLATE_FOLDER_NAME': '양식',
      'SHARED_DOCUMENT_FOLDER_NAME': '공유 문서', // 정확한 속성명 (코드에서 사용)
      'PERSONAL_TEMPLATE_FOLDER_NAME': '개인 양식',
      
      // 시트 이름 설정
      'SHEET_NAME_USER': 'user',
      'SHEET_NAME_ADMIN_KEYS': 'admin_keys',
      'NOTICE_SHEET_NAME': '시트1', // 코드에서 기본값으로 사용
      
      // 스태틱 태그 설정
      'STATIC_TAG_SPREADSHEET_NAME': 'static_tag',
      'STATIC_TAG_SHEET_NAME': 'tag',
      
      // 워크플로우 설정
      'WORKFLOW_SPREADSHEET_NAME': '워크플로우_관리'
    };
    
    const setProperties = {};
    for (const key in propertiesToSet) {
      const value = propertiesToSet[key];
      // 기존 값이 있으면 유지, 없으면 설정
      const existingValue = properties.getProperty(key);
      if (!existingValue) {
        properties.setProperty(key, value);
        setProperties[key] = value;
        console.log(`✅ 스크립트 속성 설정: ${key} = ${value}`);
      } else {
        console.log(`ℹ️ 스크립트 속성 이미 존재: ${key} = ${existingValue}`);
        setProperties[key] = existingValue;
      }
    }
    
    console.log('✅ 스크립트 속성 설정 완료');
    return {
      success: true,
      set: setProperties,
      message: '스크립트 속성이 설정되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ 스크립트 속성 설정 오류:', error);
    return {
      success: false,
      message: '스크립트 속성 설정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

