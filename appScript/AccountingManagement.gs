/**
 * AccountingManagement.gs
 * 회계 기능 관련 서버 함수
 * Hot Potato Accounting Management System
 */

// ===== 회계 폴더 초기화 =====

/**
 * 회계 폴더 초기화 (없으면 생성)
 * @returns {string} 회계 폴더 ID
 */
function initializeAccountingFolder() {
  try {
    console.log('📁 회계 폴더 초기화 시작');
    
    // 루트 폴더 찾기
    const rootFolderName = 'hot potato'; // 환경변수에서 가져오기
    const accountingFolderName = '회계';
    
    const rootFolder = DriveApp.getFoldersByName(rootFolderName).next();
    
    // 회계 폴더 찾기 또는 생성
    let accountingFolder;
    const folders = rootFolder.getFoldersByName(accountingFolderName);
    
    if (folders.hasNext()) {
      accountingFolder = folders.next();
      console.log('✅ 기존 회계 폴더 발견:', accountingFolder.getId());
    } else {
      accountingFolder = rootFolder.createFolder(accountingFolderName);
      console.log('✅ 새 회계 폴더 생성:', accountingFolder.getId());
    }
    
    return accountingFolder.getId();
    
  } catch (error) {
    console.error('❌ 회계 폴더 초기화 오류:', error);
    throw new Error('회계 폴더 초기화 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * 역할 코드를 그룹 이메일로 변환
 * @param {Array<string>} roleCodes - 역할 코드 배열 (예: ['std_council', 'professor'])
 * @returns {Array<string>} 그룹 이메일 배열
 */
function convertRoleCodesToGroupEmails(roleCodes) {
  try {
    if (!roleCodes || !Array.isArray(roleCodes) || roleCodes.length === 0) {
      return [];
    }
    
    // CONFIG.gs의 getGroupEmailByRole 함수 사용
    return roleCodes
      .map(role => {
        if (typeof getGroupEmailByRole === 'function') {
          return getGroupEmailByRole(role);
        } else {
          // 직접 매핑 (CONFIG.gs 함수가 없는 경우)
          const roleToEmail = {
            'student': 'student_hp@googlegroups.com',
            'std_council': 'std_council_hp@googlegroups.com',
            'supp': 'hp_supp@googlegroups.com',
            'professor': 'professor_hp@googlegroups.com',
            'ad_professor': 'ad_professor_hp@googlegroups.com'
          };
          return roleToEmail[role] || null;
        }
      })
      .filter(email => email && email.trim() !== '');
      
  } catch (error) {
    console.error('❌ 역할 코드 변환 오류:', error);
    return [];
  }
}

// ===== 장부 폴더 권한 설정 =====

/**
 * 장부 폴더 권한 설정
 * @param {Object} params
 *   {
 *     folderId: string,           // 폴더 ID
 *     users: Array<string>,       // 사용자 이메일 목록
 *     groups: Array<string>       // 그룹 이메일 목록
 *   }
 * @returns {Object} 권한 설정 결과
 */
function setLedgerFolderPermissions(params) {
  try {
    const { folderId, users = [], groups = [] } = params;
    
    if (!folderId) {
      throw new Error('폴더 ID가 필요합니다');
    }
    
    let successCount = 0;
    let failCount = 0;
    const grantedUsers = [];
    const failedUsers = [];
    
    // 현재 권한 확인 (Drive API 사용)
    const permissions = Drive.Permissions.list(folderId);
    const beforePermissions = permissions.items || [];
    
    // 개인 사용자 권한 부여 (Drive API - 메일 알림 없음)
    for (const userEmail of users) {
      try {
        // 이미 권한이 있는지 확인
        const hasPermission = beforePermissions.some(p => p.emailAddress === userEmail && p.role === 'writer');
        if (hasPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', userEmail);
          successCount++;
          grantedUsers.push(userEmail);
          continue;
        }
        
        // 편집 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: 'writer',
          type: 'user',
          value: userEmail,
          sendNotificationEmails: false
        }, folderId);
        console.log('✅ 폴더 편집 권한 부여 완료 (메일 알림 없음):', userEmail);
        successCount++;
        grantedUsers.push(userEmail);
        
        Utilities.sleep(100); // API 제한 방지
        
      } catch (error) {
        console.error('❌ 사용자 권한 부여 실패:', userEmail, error.message);
        failCount++;
        failedUsers.push(userEmail);
      }
    }
    
    // 그룹 권한 부여 (Google Groups) - Drive API 사용
    for (const groupEmail of groups) {
      try {
        // 그룹에 편집 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: 'writer',
          type: 'group',
          value: groupEmail,
          sendNotificationEmails: false
        }, folderId);
        console.log('✅ 폴더 그룹 권한 부여 완료 (메일 알림 없음):', groupEmail);
        successCount++;
        grantedUsers.push(groupEmail);
        
        Utilities.sleep(100);
        
      } catch (error) {
        console.error('❌ 그룹 권한 부여 실패:', groupEmail, error.message);
        failCount++;
        failedUsers.push(groupEmail);
      }
    }
    
    return {
      success: successCount > 0,
      successCount: successCount,
      failCount: failCount,
      grantedUsers: grantedUsers,
      failedUsers: failedUsers
    };
    
  } catch (error) {
    console.error('❌ 폴더 권한 설정 오류:', error);
    return {
      success: false,
      message: '폴더 권한 설정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 스프레드시트 권한 설정
 * @param {Object} params
 *   {
 *     fileId: string,           // 파일 ID
 *     users: Array<string>,     // 사용자 이메일 목록
 *     groups: Array<string>     // 그룹 이메일 목록
 *   }
 * @returns {Object} 권한 설정 결과
 */
function setLedgerFilePermissions(params) {
  try {
    const { fileId, users = [], groups = [] } = params;
    
    if (!fileId) {
      throw new Error('파일 ID가 필요합니다');
    }
    
    let successCount = 0;
    let failCount = 0;
    const grantedUsers = [];
    const failedUsers = [];
    
    // 현재 권한 확인 (Drive API 사용)
    const permissions = Drive.Permissions.list(fileId);
    const beforePermissions = permissions.items || [];
    
    // 개인 사용자 권한 부여 (Drive API - 메일 알림 없음)
    for (const userEmail of users) {
      try {
        const hasPermission = beforePermissions.some(p => p.emailAddress === userEmail && p.role === 'writer');
        if (hasPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', userEmail);
          successCount++;
          grantedUsers.push(userEmail);
          continue;
        }
        
        // 편집 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: 'writer',
          type: 'user',
          value: userEmail,
          sendNotificationEmails: false
        }, fileId);
        console.log('✅ 스프레드시트 편집 권한 부여 완료 (메일 알림 없음):', userEmail);
        successCount++;
        grantedUsers.push(userEmail);
        
        Utilities.sleep(100);
        
      } catch (error) {
        console.error('❌ 사용자 권한 부여 실패:', userEmail, error.message);
        failCount++;
        failedUsers.push(userEmail);
      }
    }
    
    // 그룹 권한 부여 (Drive API - 메일 알림 없음)
    for (const groupEmail of groups) {
      try {
        // 그룹에 편집 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: 'writer',
          type: 'group',
          value: groupEmail,
          sendNotificationEmails: false
        }, fileId);
        console.log('✅ 스프레드시트 그룹 권한 부여 완료 (메일 알림 없음):', groupEmail);
        successCount++;
        grantedUsers.push(groupEmail);
        
        Utilities.sleep(100);
        
      } catch (error) {
        console.error('❌ 그룹 권한 부여 실패:', groupEmail, error.message);
        failCount++;
        failedUsers.push(groupEmail);
      }
    }
    
    return {
      success: successCount > 0,
      successCount: successCount,
      failCount: failCount,
      grantedUsers: grantedUsers,
      failedUsers: failedUsers
    };
    
  } catch (error) {
    console.error('❌ 스프레드시트 권한 설정 오류:', error);
    return {
      success: false,
      message: '스프레드시트 권한 설정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 증빙 폴더 권한 설정
 * @param {Object} params
 *   {
 *     folderId: string,           // 폴더 ID
 *     users: Array<string>,       // 사용자 이메일 목록
 *     groups: Array<string>       // 그룹 이메일 목록
 *   }
 * @returns {Object} 권한 설정 결과
 */
function setEvidenceFolderPermissions(params) {
  // setLedgerFolderPermissions와 동일한 로직
  return setLedgerFolderPermissions(params);
}

// ===== 회계 관련 시트 생성 =====

/**
 * 회계 관련 시트 생성
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - 스프레드시트 객체
 */
function createAccountingSheets(spreadsheet) {
  try {
    console.log('📊 회계 시트 생성 시작');
    
    // 기본 시트 삭제 (필요시)
    const sheets = spreadsheet.getSheets();
    const defaultSheet = sheets.length > 0 ? sheets[0] : null;
    
    // 통장 시트 생성
    const accountSheet = spreadsheet.insertSheet('통장');
    setSheetHeaders(accountSheet, [
      'account_id', 'account_name', 'initial_balance', 'current_balance',
      'main_manager_id', 'sub_manager_ids', 'access_group_emails', 'access_user_emails',
      'created_by', 'created_date', 'is_active'
    ]);
    
    // 장부 시트 생성
    const ledgerSheet = spreadsheet.insertSheet('장부');
    setSheetHeaders(ledgerSheet, [
      'entry_id', 'account_id', 'date', 'category', 'description',
      'amount', 'balance_after', 'source', 'transaction_type',
      'evidence_file_id', 'evidence_file_name',
      'created_by', 'created_date', 'is_budget_executed', 'budget_plan_id'
    ]);
    
    // 예산계획 시트 생성
    const budgetSheet = spreadsheet.insertSheet('예산계획');
    setSheetHeaders(budgetSheet, [
      'budget_id', 'account_id', 'title', 'total_amount',
      'requested_date', 'planned_execution_date', 'status',
      'sub_manager_reviewed', 'sub_manager_review_date',
      'main_manager_approved', 'main_manager_approval_date',
      'executed_date', 'created_by', 'rejection_reason', 'details'
    ]);
    
    // 카테고리 시트 생성
    const categorySheet = spreadsheet.insertSheet('카테고리');
    setSheetHeaders(categorySheet, [
      'category_id', 'category_name', 'description',
      'created_by', 'created_date', 'is_active', 'usage_count'
    ]);
    
    // 기본 시트 삭제
    if (defaultSheet && defaultSheet.getName() === '시트1') {
      spreadsheet.deleteSheet(defaultSheet);
    }
    
    console.log('✅ 시트 생성 완료');
    
  } catch (error) {
    console.error('❌ 시트 생성 오류:', error);
    throw error;
  }
}

/**
 * 시트 헤더 설정
 */
function setSheetHeaders(sheet, headers) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    console.log('✅ 헤더 설정 완료:', headers);
  } catch (error) {
    console.error('❌ 헤더 설정 오류:', error);
    throw error;
  }
}

// ===== 장부 구조 생성 =====

/**
 * 장부 구조 생성 (폴더 + 스프레드시트 + 증빙 폴더 + 권한 설정)
 * @param {Object} params - 생성 파라미터
 *   {
 *     ledgerName: string,              // 장부 이름
 *     accountName: string,             // 통장 이름 (장부마다 통장 하나)
 *     initialBalance: number,          // 최초 잔액
 *     creatorEmail: string,            // 생성자 이메일
 *     accessUsers: Array<string>,      // 접근 권한 사용자 이메일 목록
 *     accessGroups: Array<string>,     // 접근 권한 그룹 역할 코드 (예: ['std_council', 'professor'])
 *     mainManagerEmail: string,        // 주관리인 이메일
 *     subManagerEmails: Array<string>  // 별도 관리인 이메일 목록
 *   }
 * @returns {Object} 생성된 구조 정보 및 권한 설정 결과
 */
function createLedgerStructure(params) {
  try {
    console.log('📁 장부 구조 생성 시작:', params);
    
    const {
      ledgerName,
      accountName,
      initialBalance = 0,
      creatorEmail,
      accessUsers = [],
      accessGroups = [],
      mainManagerEmail,
      subManagerEmails = []
    } = params;
    
    // 1. 회계 폴더 초기화
    const accountingFolderId = initializeAccountingFolder();
    const accountingFolder = DriveApp.getFolderById(accountingFolderId);
    
    // 2. 장부 폴더 생성
    const ledgerFolder = accountingFolder.createFolder(ledgerName);
    const ledgerFolderId = ledgerFolder.getId();
    console.log('✅ 장부 폴더 생성:', ledgerFolderId);
    
    // 3. 스프레드시트 생성
    const spreadsheet = SpreadsheetApp.create(`${ledgerName}_장부`);
    const spreadsheetId = spreadsheet.getId();
    const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
    
    // 스프레드시트를 장부 폴더로 이동
    ledgerFolder.addFile(spreadsheetFile);
    DriveApp.getRootFolder().removeFile(spreadsheetFile);
    
    // 시트 생성 (통장, 장부, 예산계획, 카테고리)
    createAccountingSheets(spreadsheet);
    
    // 통장 정보를 통장 시트에 추가 (장부마다 통장 하나)
    if (accountName) {
      const accountSheet = spreadsheet.getSheetByName('통장');
      if (accountSheet) {
        const accountId = 'acc_' + Date.now();
        const createdDate = new Date().toISOString();
        
        // 주관리인 ID는 이메일에서 추출 (또는 그대로 사용)
        const mainManagerId = mainManagerEmail;
        const subManagerIdsJson = JSON.stringify(subManagerEmails || []);
        const groupEmailsJson = JSON.stringify(convertRoleCodesToGroupEmails(accessGroups));
        const userEmailsJson = JSON.stringify(accessUsers || []);
        
        accountSheet.appendRow([
          accountId,
          accountName,
          initialBalance,
          initialBalance, // current_balance = initial_balance
          mainManagerId,
          subManagerIdsJson,
          groupEmailsJson,
          userEmailsJson,
          creatorEmail,
          createdDate,
          'TRUE' // is_active
        ]);
        
        console.log('✅ 통장 정보 추가:', accountId, accountName);
      }
    }
    
    console.log('✅ 스프레드시트 생성:', spreadsheetId);
    
    // 4. 증빙 폴더 생성
    const evidenceFolder = ledgerFolder.createFolder('증빙');
    const evidenceFolderId = evidenceFolder.getId();
    console.log('✅ 증빙 폴더 생성:', evidenceFolderId);
    
    // 5. 권한 설정
    // 접근 권한 대상: 생성자 + 주관리인 + 별도 관리인 + 지정된 사용자
    const allAccessUsers = [
      creatorEmail,
      mainManagerEmail,
      ...subManagerEmails,
      ...accessUsers
    ].filter((email, index, arr) => 
      email && email.trim() !== '' && arr.indexOf(email) === index
    );
    
    // 역할 코드를 그룹 이메일로 변환
    const groupEmails = convertRoleCodesToGroupEmails(accessGroups);
    
    console.log('🔐 권한 설정 대상:', {
      users: allAccessUsers,
      groups: groupEmails,
      roleCodes: accessGroups
    });
    
    // 장부 폴더 권한 설정
    const folderPermissionResult = setLedgerFolderPermissions({
      folderId: ledgerFolderId,
      users: allAccessUsers,
      groups: groupEmails
    });
    
    // 스프레드시트 권한 설정
    const spreadsheetPermissionResult = setLedgerFilePermissions({
      fileId: spreadsheetId,
      users: allAccessUsers,
      groups: groupEmails
    });
    
    // 증빙 폴더 권한 설정
    const evidencePermissionResult = setEvidenceFolderPermissions({
      folderId: evidenceFolderId,
      users: allAccessUsers,
      groups: groupEmails
    });
    
    console.log('✅ 장부 생성 완료:', {
      ledgerFolderId,
      spreadsheetId,
      evidenceFolderId,
      permissions: {
        folder: folderPermissionResult,
        spreadsheet: spreadsheetPermissionResult,
        evidence: evidencePermissionResult
      }
    });
    
    return {
      success: true,
      message: '장부가 성공적으로 생성되었습니다.',
      data: {
        ledgerFolderId: ledgerFolderId,
        spreadsheetId: spreadsheetId,
        evidenceFolderId: evidenceFolderId,
        permissionResult: {
          folder: folderPermissionResult,
          spreadsheet: spreadsheetPermissionResult,
          evidence: evidencePermissionResult
        }
      }
    };
    
  } catch (error) {
    console.error('❌ 장부 생성 오류:', error);
    return {
      success: false,
      message: '장부 생성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

// ===== 장부 목록 조회 =====

/**
 * 장부 목록 조회
 * @returns {Array<Object>} 장부 목록
 */
function getLedgerList() {
  try {
    console.log('📋 장부 목록 조회 시작');
    
    const accountingFolderId = initializeAccountingFolder();
    const accountingFolder = DriveApp.getFolderById(accountingFolderId);
    
    const ledgers = [];
    const folders = accountingFolder.getFolders();
    
    while (folders.hasNext()) {
      const folder = folders.next();
      const folderName = folder.getName();
      
      // 증빙 폴더는 제외
      if (folderName === '증빙') {
        continue;
      }
      
      // 스프레드시트 찾기 (파일명이 [장부이름]_장부 형식)
      const files = folder.getFiles();
      let spreadsheetId = null;
      
      while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName();
        // Google Sheets 파일인지 확인
        if (file.getMimeType() === 'application/vnd.google-apps.spreadsheet') {
          spreadsheetId = file.getId();
          break;
        }
      }
      
      // 증빙 폴더 찾기
      const subFolders = folder.getFolders();
      let evidenceFolderId = null;
      
      while (subFolders.hasNext()) {
        const subFolder = subFolders.next();
        if (subFolder.getName() === '증빙') {
          evidenceFolderId = subFolder.getId();
          break;
        }
      }
      
      ledgers.push({
        folderId: folder.getId(),
        folderName: folderName,
        spreadsheetId: spreadsheetId,
        evidenceFolderId: evidenceFolderId,
        createdDate: folder.getDateCreated().toISOString()
      });
    }
    
    console.log('✅ 장부 목록 조회 완료:', ledgers.length, '개');
    return ledgers;
    
  } catch (error) {
    console.error('❌ 장부 목록 조회 오류:', error);
    return [];
  }
}

/**
 * 장부 스프레드시트 ID 조회
 * @param {string} folderId - 장부 폴더 ID
 * @returns {string} 스프레드시트 ID
 */
function getLedgerSpreadsheetId(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === 'application/vnd.google-apps.spreadsheet') {
        return file.getId();
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ 스프레드시트 ID 조회 오류:', error);
    return null;
  }
}

