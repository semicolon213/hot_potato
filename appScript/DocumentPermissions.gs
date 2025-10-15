/**
 * DocumentPermissions.gs
 * 문서 권한 설정 관련 기능
 * Hot Potato Document Management System
 */

// ===== 문서 권한 관련 함수들 =====

/**
 * 문서 권한 설정
 * @param {string} documentId - 문서 ID
 * @param {string} creatorEmail - 생성자 이메일
 * @param {Array} editors - 편집자 이메일 배열
 * @returns {Object} 설정 결과
 */
function setDocumentPermissions(documentId, creatorEmail, editors) {
  try {
    console.log('🔐 문서 권한 설정 시작:', { documentId, creatorEmail, editors });
    
    // 소유자는 앱스크립트 소유자로 유지 (이미 소유자이므로 변경 불필요)
    
    // 편집자 권한 부여
    const allEditors = [creatorEmail, ...editors].filter((email, index, arr) => 
      email && arr.indexOf(email) === index // 중복 제거
    );
    
    for (const editorEmail of allEditors) {
      try {
        // 기존 권한 확인
        const permissions = Drive.Permissions.list(documentId);
        const existingPermission = permissions.items.find(p => p.emailAddress === editorEmail);
        
        if (!existingPermission) {
          // 새 권한 추가
          Drive.Permissions.create({
            emailAddress: editorEmail,
            type: 'user',
            role: 'writer'
          }, documentId);
          
          console.log('🔐 편집자 권한 부여 완료:', editorEmail);
        } else {
          console.log('🔐 이미 권한이 있는 사용자:', editorEmail);
        }
      } catch (permissionError) {
        console.warn('🔐 권한 설정 실패:', editorEmail, permissionError.message);
        // 개별 권한 설정 실패는 전체 실패로 처리하지 않음
      }
    }
    
    return {
      success: true,
      message: '문서 권한 설정이 완료되었습니다.'
    };
    
  } catch (error) {
    console.error('🔐 문서 권한 설정 오류:', error);
    return {
      success: false,
      message: '문서 권한 설정 실패: ' + error.message
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
