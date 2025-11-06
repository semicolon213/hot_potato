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
    
    // 모든 사용자에게 편집 권한 부여 (생성자 + 편집자)
    const allUsers = [creatorEmail, ...(editors || [])].filter((email, index, arr) => 
      email && email.trim() !== '' && arr.indexOf(email) === index // 중복 제거
    );
    
    console.log('🔐 권한 부여할 사용자 목록:', allUsers);
    console.log('🔐 사용자 수:', allUsers.length);
    
    if (allUsers.length === 0) {
      console.warn('⚠️ 권한 부여할 사용자가 없습니다');
      return {
        success: true,
        message: '권한 부여할 사용자가 없습니다',
        grantedUsers: [],
        currentEditors: []
      };
    }
    
    // 권한 설정 전 현재 상태 확인
    const permissions = Drive.Permissions.list(documentId);
    const beforePermissions = permissions.items || [];
    console.log('🔐 권한 설정 전 편집자:', beforePermissions.map(p => p.emailAddress));
    
    let successCount = 0;
    let failCount = 0;
    
    // 각 사용자에게 편집 권한 부여
    for (const userEmail of allUsers) {
      try {
        console.log('🔐 권한 부여 시도:', userEmail);
        
        // 이미 권한이 있는지 확인
        const hasPermission = beforePermissions.some(p => p.emailAddress === userEmail && p.role === 'writer');
        if (hasPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', userEmail);
          successCount++;
          continue;
        }
        
        // 권한 부여 (메일 알림 없이)
        Drive.Permissions.insert({
          role: 'writer',
          type: 'user',
          value: userEmail,
          sendNotificationEmails: false
        }, documentId);
        console.log('✅ 편집 권한 부여 완료 (메일 알림 없음):', userEmail);
        successCount++;
        
        // 잠시 대기 (API 제한 방지)
        Utilities.sleep(100);
        
      } catch (permError) {
        console.error('❌ 권한 설정 실패:', userEmail, permError.message);
        failCount++;
      }
    }
    
    // 권한 설정 후 결과 확인
    const afterPermissions = Drive.Permissions.list(documentId);
    console.log('🔐 권한 설정 후 편집자:', afterPermissions.items.map(p => p.emailAddress));
    
    const result = {
      success: successCount > 0,
      message: `권한 설정 완료: 성공 ${successCount}명, 실패 ${failCount}명`,
      grantedUsers: allUsers,
      currentEditors: afterPermissions.items.map(p => p.emailAddress),
      successCount: successCount,
      failCount: failCount
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