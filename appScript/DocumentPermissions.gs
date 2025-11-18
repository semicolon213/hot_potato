/**
 * DocumentPermissions.gs
 * 문서 권한 설정 관련 기능
 * Hot Potato Document Management System
 */

// ===== 문서 권한 관련 함수들 =====

/**
 * 문서 권한 설정 (Drive API 사용 - 메일 알림 없음)
 * @param {string} documentId - 문서 ID
 * @param {string} creatorEmail - 생성자 이메일
 * @param {Array} editors - 편집자 이메일 배열
 * @returns {Object} 설정 결과
 */
function setDocumentPermissions(documentId, creatorEmail, editors) {
  try {
    console.log('🔐 문서 권한 설정 시작 (Drive API):', { documentId, creatorEmail, editors });
    
    // 입력 데이터 검증
    if (!documentId) {
      throw new Error('문서 ID가 필요합니다');
    }
    
    // Drive API 사용 가능 여부 확인 (상세 디버깅)
    console.log('🔍 Drive API 확인:', {
      Drive_defined: typeof Drive !== 'undefined',
      Drive_Permissions_defined: typeof Drive !== 'undefined' && typeof Drive.Permissions !== 'undefined',
      Drive_Permissions_insert_defined: typeof Drive !== 'undefined' && typeof Drive.Permissions !== 'undefined' && typeof Drive.Permissions.insert !== 'undefined',
      Drive_Permissions_insert_isFunction: typeof Drive !== 'undefined' && typeof Drive.Permissions !== 'undefined' && typeof Drive.Permissions.insert === 'function',
      Drive_keys: typeof Drive !== 'undefined' ? Object.keys(Drive) : 'N/A',
      Drive_Permissions_keys: typeof Drive !== 'undefined' && typeof Drive.Permissions !== 'undefined' ? Object.keys(Drive.Permissions) : 'N/A'
    });
    
    if (typeof Drive === 'undefined') {
      const errorMsg = 'Drive API가 활성화되지 않았습니다. Google Apps Script에서 "리소스" → "고급 Google 서비스" → "Drive API"를 활성화하고, Google Cloud Platform에서도 활성화해주세요.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (typeof Drive.Permissions === 'undefined') {
      const errorMsg = 'Drive.Permissions가 정의되지 않았습니다. Google Cloud Platform에서 "Drive API"를 활성화하고, Apps Script 프로젝트를 저장한 후 다시 시도해주세요.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (typeof Drive.Permissions.insert !== 'function') {
      const errorMsg = 'Drive.Permissions.insert가 함수가 아닙니다. Google Cloud Platform에서 "Drive API"를 활성화하고, Apps Script 프로젝트를 저장한 후 다시 시도해주세요.';
      console.error('❌', errorMsg);
      console.error('❌ Drive.Permissions 타입:', typeof Drive.Permissions);
      console.error('❌ Drive.Permissions.insert 타입:', typeof Drive.Permissions.insert);
      throw new Error(errorMsg);
    }
    
    // 이메일 유효성 검증 및 정규화 함수
    const normalizeEmail = function(email) {
      if (!email || typeof email !== 'string') return null;
      const trimmed = email.trim();
      if (trimmed === '') return null;
      // 기본 이메일 형식 검증 (@ 포함)
      if (trimmed.indexOf('@') === -1) {
        console.warn('⚠️ 유효하지 않은 이메일 형식:', trimmed);
        return null;
      }
      return trimmed.toLowerCase(); // 소문자로 정규화
    };
    
    // 모든 사용자에게 편집 권한 부여 (생성자 + 편집자)
    // editors 배열에 이미 creatorEmail이 포함될 수 있으므로 중복 제거
    const allEmails = [];
    if (creatorEmail) {
      const normalizedCreator = normalizeEmail(creatorEmail);
      if (normalizedCreator) allEmails.push(normalizedCreator);
    }
    
    if (editors && Array.isArray(editors)) {
      for (let i = 0; i < editors.length; i++) {
        const normalized = normalizeEmail(editors[i]);
        if (normalized && allEmails.indexOf(normalized) === -1) {
          allEmails.push(normalized);
        }
      }
    }
    
    console.log('🔐 권한 부여할 사용자 목록:', allEmails);
    console.log('🔐 사용자 수:', allEmails.length);
    
    if (allEmails.length === 0) {
      console.warn('⚠️ 권한 부여할 사용자가 없습니다');
      return {
        success: true,
        message: '권한 부여할 사용자가 없습니다',
        grantedUsers: [],
        currentEditors: []
      };
    }
    
    // 문서 파일 가져오기 (DriveApp 사용)
    let file;
    try {
      file = DriveApp.getFileById(documentId);
      console.log('📄 문서 정보:', { id: file.getId(), name: file.getName() });
    } catch (fileError) {
      console.error('❌ 문서 파일 가져오기 실패:', fileError.message);
      throw new Error('문서를 찾을 수 없습니다: ' + fileError.message);
    }
    
    // 권한 설정 전 현재 상태 확인 (DriveApp 사용)
    const beforeEditors = file.getEditors();
    const beforeEmails = beforeEditors.map(editor => editor.getEmail().toLowerCase());
    console.log('🔐 권한 설정 전 편집자:', beforeEmails);
    
    let successCount = 0;
    let failCount = 0;
    const grantedUsers = [];
    const failedUsers = [];
    
    // 각 사용자에게 편집 권한 부여 (DriveApp 사용 - 더 안정적)
    for (let i = 0; i < allEmails.length; i++) {
      const userEmail = allEmails[i];
      try {
        console.log('🔐 권한 부여 시도:', userEmail, `(${i + 1}/${allEmails.length})`);
        
        // 이미 권한이 있는지 확인 (소문자로 비교)
        const hasPermission = beforeEmails.indexOf(userEmail) !== -1;
        if (hasPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', userEmail);
          successCount++;
          grantedUsers.push(userEmail);
          continue;
        }
        
        // Drive API만 사용 (메일 알림 없이) - DriveApp.addEditor()는 메일을 보내므로 사용하지 않음
        try {
          const permissionResult = Drive.Permissions.insert({
            role: 'writer',
            type: 'user',
            value: userEmail,
            sendNotificationEmails: false  // 메일 알림 없음
          }, documentId);
          
          console.log('✅ Drive API로 편집 권한 부여 완료 (메일 알림 없음):', userEmail);
          console.log('📋 권한 부여 결과:', permissionResult);
          
          successCount++;
          grantedUsers.push(userEmail);
          
          // 권한 추가 후 beforeEmails에 추가하여 중복 체크 방지
          beforeEmails.push(userEmail);
          
        } catch (driveApiError) {
          // Drive API 실패 시 상세 에러 로깅
          console.error('❌ Drive API 권한 설정 실패:', userEmail);
          console.error('❌ 에러 메시지:', driveApiError.message);
          console.error('❌ 에러 타입:', typeof driveApiError);
          console.error('❌ 에러 객체:', JSON.stringify(driveApiError));
          
          // 에러 코드 확인
          if (driveApiError.code) {
            console.error('❌ 에러 코드:', driveApiError.code);
          }
          if (driveApiError.details) {
            console.error('❌ 에러 상세:', JSON.stringify(driveApiError.details));
          }
          
          failCount++;
          failedUsers.push({ 
            email: userEmail, 
            error: driveApiError.message || String(driveApiError),
            errorCode: driveApiError.code || null,
            errorDetails: driveApiError.details || null,
            errorString: driveApiError.toString()
          });
          
          // DriveApp으로 대체하지 않음 (메일을 보내므로)
          // 실패한 경우에도 계속 진행
        }
        
        // 잠시 대기 (API 제한 방지)
        Utilities.sleep(200);
        
      } catch (permError) {
        // 예상치 못한 에러
        console.error('❌ 예상치 못한 권한 설정 실패:', userEmail, permError.message);
        console.error('❌ 에러 상세:', JSON.stringify(permError));
        failCount++;
        failedUsers.push({ 
          email: userEmail, 
          error: permError.message || String(permError),
          errorDetails: permError.toString()
        });
      }
    }
    
    // 권한 설정 후 결과 확인 (약간의 지연 후 확인)
    Utilities.sleep(300);
    // 문서 새로고침 후 편집자 목록 확인
    let afterEmails = [];
    try {
      file = DriveApp.getFileById(documentId);
      const afterEditors = file.getEditors();
      afterEmails = afterEditors.map(editor => editor.getEmail().toLowerCase());
      console.log('🔐 권한 설정 후 편집자:', afterEmails);
      console.log('🔐 권한 설정 후 편집자 수:', afterEmails.length);
    } catch (refreshError) {
      console.warn('⚠️ 권한 확인 중 오류:', refreshError.message);
      // Drive API로 대체 확인
      try {
        const afterPermissions = Drive.Permissions.list(documentId);
        afterEmails = (afterPermissions.items || [])
          .filter(p => p.emailAddress)
          .map(p => p.emailAddress.toLowerCase());
        console.log('🔐 권한 설정 후 편집자 (Drive API):', afterEmails);
        console.log('🔐 권한 설정 후 편집자 수:', afterEmails.length);
      } catch (apiError) {
        console.error('❌ 권한 확인 실패:', apiError.message);
        afterEmails = [];
      }
    }
    
    // 실제로 권한이 설정되었는지 확인
    const missingPermissions = allEmails.filter(email => afterEmails.indexOf(email) === -1);
    if (missingPermissions.length > 0) {
      console.warn('⚠️ 권한이 설정되지 않은 사용자:', missingPermissions);
    }
    
    const result = {
      success: successCount > 0,
      message: `권한 설정 완료: 성공 ${successCount}명, 실패 ${failCount}명`,
      grantedUsers: grantedUsers,
      failedUsers: failedUsers,
      currentEditors: afterEmails,
      successCount: successCount,
      failCount: failCount,
      missingPermissions: missingPermissions
    };
    
    console.log('🔐 최종 권한 설정 결과:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 문서 권한 설정 오류:', error);
    return {
      success: false,
      message: '문서 권한 설정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 문서 권한 확인
 * @param {string} documentId - 문서 ID
 * @returns {Object} 권한 정보
 */
function getDocumentPermissions(documentId) {
  try {
    console.log('🔐 문서 권한 확인 시작:', documentId);
    
    const permissions = Drive.Permissions.list(documentId);
    
    return {
      success: true,
      data: permissions.items || [],
      message: '문서 권한을 성공적으로 가져왔습니다.'
    };
    
  } catch (error) {
    console.error('🔐 문서 권한 확인 오류:', error);
    return {
      success: false,
      message: '문서 권한 확인 실패: ' + error.message
    };
  }
}

/**
 * 문서 권한 제거
 * @param {string} documentId - 문서 ID
 * @param {string} email - 제거할 사용자 이메일
 * @returns {Object} 제거 결과
 */
function removeDocumentPermission(documentId, email) {
  try {
    console.log('🔐 문서 권한 제거 시작:', { documentId, email });
    
    const permissions = Drive.Permissions.list(documentId);
    const permission = permissions.items.find(p => p.emailAddress === email);
    
    if (permission) {
      Drive.Permissions.remove(documentId, permission.id);
      console.log('🔐 권한 제거 완료:', email);
      
      return {
        success: true,
        message: '권한이 성공적으로 제거되었습니다.'
      };
    } else {
      return {
        success: false,
        message: '해당 사용자의 권한을 찾을 수 없습니다.'
      };
    }
    
  } catch (error) {
    console.error('🔐 문서 권한 제거 오류:', error);
    return {
      success: false,
      message: '문서 권한 제거 실패: ' + error.message
    };
  }
}

// ===== 워크플로우 관련 권한 관리 =====

/**
 * 워크플로우 문서 권한 부여 (Drive API 사용 - 메일 알림 없음)
 * @param {string} documentId - 문서 ID
 * @param {Array<string>} userEmails - 사용자 이메일 배열
 * @param {string} permissionType - 권한 타입 ('reader' | 'writer', 기본: 'reader')
 * @returns {Object} 권한 부여 결과
 */
function grantWorkflowPermissions(documentId, userEmails, permissionType) {
  try {
    console.log('🔐 워크플로우 문서 권한 부여 시작:', { documentId, userEmails, permissionType });
    
    if (!documentId) {
      throw new Error('문서 ID가 필요합니다');
    }
    
    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return {
        successCount: 0,
        failCount: 0,
        grantedUsers: [],
        failedUsers: [],
        details: []
      };
    }
    
    const role = permissionType === 'writer' ? 'writer' : 'reader';
    const permissions = Drive.Permissions.list(documentId);
    const beforePermissions = permissions.items || [];
    
    let successCount = 0;
    let failCount = 0;
    const grantedUsers = [];
    const failedUsers = [];
    const details = [];
    
    // 중복 제거
    const uniqueEmails = [...new Set(userEmails.filter(email => email && email.trim() !== ''))];
    
    for (const email of uniqueEmails) {
      try {
        // 이미 권한이 있는지 확인
        const existingPermission = beforePermissions.find(p => p.emailAddress === email && p.role === role);
        if (existingPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', email);
          successCount++;
          grantedUsers.push(email);
          details.push({
            email: email,
            success: true,
            message: '이미 권한이 있습니다'
          });
          continue;
        }
        
        // 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: role,
          type: 'user',
          value: email,
          sendNotificationEmails: false
        }, documentId);
        
        console.log('✅ 권한 부여 완료:', email, role);
        successCount++;
        grantedUsers.push(email);
        details.push({
          email: email,
          success: true
        });
        
        // API 제한 방지
        Utilities.sleep(100);
        
      } catch (error) {
        console.error('❌ 권한 부여 실패:', email, error.message);
        failCount++;
        failedUsers.push(email);
        details.push({
          email: email,
          success: false,
          message: error.message
        });
      }
    }
    
    return {
      successCount: successCount,
      failCount: failCount,
      grantedUsers: grantedUsers,
      failedUsers: failedUsers,
      details: details
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 문서 권한 부여 오류:', error);
    return {
      successCount: 0,
      failCount: userEmails ? userEmails.length : 0,
      grantedUsers: [],
      failedUsers: userEmails || [],
      details: []
    };
  }
}

/**
 * 여러 문서에 일괄 권한 부여
 * @param {Array<string>} documentIds - 문서 ID 배열
 * @param {Array<string>} userEmails - 사용자 이메일 배열
 * @param {string} permissionType - 권한 타입 ('reader' | 'writer', 기본: 'reader')
 * @returns {Object} 권한 부여 결과
 */
function grantPermissionsToMultipleDocuments(documentIds, userEmails, permissionType) {
  try {
    console.log('🔐 여러 문서에 권한 부여 시작:', { documentIds, userEmails, permissionType });
    
    const results = {
      totalDocuments: documentIds.length,
      totalUsers: userEmails.length,
      successCount: 0,
      failCount: 0,
      documentResults: []
    };
    
    for (const documentId of documentIds) {
      const result = grantWorkflowPermissions(documentId, userEmails, permissionType);
      results.documentResults.push({
        documentId: documentId,
        ...result
      });
      
      if (result.successCount > 0) {
        results.successCount++;
      } else {
        results.failCount++;
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 여러 문서 권한 부여 오류:', error);
    return {
      totalDocuments: documentIds.length,
      totalUsers: userEmails.length,
      successCount: 0,
      failCount: documentIds.length,
      documentResults: []
    };
  }
}

// ===== 배포 정보 =====
function getDocumentPermissionsInfo() {
  return {
    version: '1.0.0',
    description: '문서 권한 설정 관련 기능',
    functions: [
      'setDocumentPermissions',
      'getDocumentPermissions',
      'removeDocumentPermission'
    ],
    dependencies: ['CONFIG.gs']
  };
}