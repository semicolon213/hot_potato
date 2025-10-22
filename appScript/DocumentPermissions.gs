/**
 * DocumentPermissions.gs
 * 문서 권한 설정 관련 기능
 * Hot Potato Document Management System
 */

// ===== 문서 권한 관련 함수들 =====

/**
 * 문서 권한 설정 (DriveApp 사용 - 간단한 버전)
 * @param {string} documentId - 문서 ID
 * @param {string} creatorEmail - 생성자 이메일
 * @param {Array} editors - 편집자 이메일 배열
 * @returns {Object} 설정 결과
 */
function setDocumentPermissions(documentId, creatorEmail, editors) {
  try {
    console.log('🔐 문서 권한 설정 시작 (DriveApp):', { documentId, creatorEmail, editors });
    
    // 입력 데이터 검증
    if (!documentId) {
      throw new Error('문서 ID가 필요합니다');
    }
    
    const file = DriveApp.getFileById(documentId);
    console.log('📄 문서 정보:', { id: file.getId(), name: file.getName() });
    
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
    const beforePermissions = file.getEditors();
    console.log('🔐 권한 설정 전 편집자:', beforePermissions.map(p => p.getEmail()));
    
    let successCount = 0;
    let failCount = 0;
    
    // 각 사용자에게 편집 권한 부여
    for (const userEmail of allUsers) {
      try {
        console.log('🔐 권한 부여 시도:', userEmail);
        
        // 이미 권한이 있는지 확인
        const hasPermission = beforePermissions.some(p => p.getEmail() === userEmail);
        if (hasPermission) {
          console.log('✅ 이미 권한이 있는 사용자:', userEmail);
          successCount++;
          continue;
        }
        
        // 권한 부여
        file.addEditor(userEmail);
        console.log('✅ 편집 권한 부여 완료:', userEmail);
        successCount++;
        
        // 잠시 대기 (API 제한 방지)
        Utilities.sleep(100);
        
      } catch (permError) {
        console.error('❌ 권한 설정 실패:', userEmail, permError.message);
        failCount++;
      }
    }
    
    // 권한 설정 후 결과 확인
    const afterPermissions = file.getEditors();
    console.log('🔐 권한 설정 후 편집자:', afterPermissions.map(p => p.getEmail()));
    
    const result = {
      success: successCount > 0,
      message: `권한 설정 완료: 성공 ${successCount}명, 실패 ${failCount}명`,
      grantedUsers: allUsers,
      currentEditors: afterPermissions.map(p => p.getEmail()),
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
