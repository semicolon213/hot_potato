/**
 * DocumentFolder.gs
 * 문서 폴더 관리 관련 기능
 * Hot Potato Document Management System
 */

// ===== 폴더 관리 관련 함수들 =====

/**
 * 문서를 hot potato/문서 폴더로 이동
 * @param {string} documentId - 문서 ID
 * @returns {Object} 이동 결과
 */
function moveDocumentToFolder(documentId) {
  try {
    console.log('📄 문서 폴더 이동 시작:', documentId);
    
    // hot potato/문서 폴더 찾기 또는 생성
    const folder = findOrCreateFolder(getDocumentFolderPath());
    if (!folder.success) {
      return folder;
    }
    
    // 문서를 폴더로 이동
    Drive.Files.update({
      fileId: documentId,
      addParents: folder.data.id,
      removeParents: 'root'
    });
    
    console.log('📄 문서 폴더 이동 완료');
    return { success: true };
    
  } catch (error) {
    console.error('📄 문서 폴더 이동 오류:', error);
    return {
      success: false,
      message: '문서 폴더 이동 실패: ' + error.message
    };
  }
}

/**
 * 폴더 찾기 또는 생성
 * @param {string} folderPath - 폴더 경로
 * @returns {Object} 폴더 정보
 */
function findOrCreateFolder(folderPath) {
  console.log('📁 findOrCreateFolder 함수 시작');
  console.log('📁 입력된 폴더 경로:', folderPath);
  console.log('📁 폴더 경로 타입:', typeof folderPath);
  
  try {
    console.log('📁 폴더 찾기/생성 시작:', folderPath);
    
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      console.error('📁 Drive API가 정의되지 않았습니다');
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다. Google Apps Script에서 Drive API를 활성화해주세요.'
      };
    }
    
    if (!folderPath || typeof folderPath !== 'string') {
      console.error('📁 잘못된 폴더 경로:', folderPath);
      return {
        success: false,
        message: '잘못된 폴더 경로입니다'
      };
    }
    
    const pathParts = folderPath.split('/');
    let currentFolderId = 'root';
    
    for (const part of pathParts) {
      if (!part) continue;
      
      console.log('📁 폴더 검색 중:', part, 'in', currentFolderId);
      
      // 더 안전한 폴더 검색 방법 사용
      let foundFolder = null;
      
      try {
        // 단순한 쿼리로 모든 폴더 가져오기
        const folders = Drive.Files.list({
          q: `'${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id,name)'
        });
        
        console.log('📁 검색 결과:', folders);
        
        if (folders.files && folders.files.length > 0) {
          // 정확한 이름을 가진 폴더 찾기
          for (const folder of folders.files) {
            if (folder.name === part) {
              foundFolder = folder;
              break;
            }
          }
        }
      } catch (searchError) {
        console.error('📁 폴더 검색 오류:', searchError);
        // 검색 실패 시 바로 폴더 생성
        foundFolder = null;
      }
      
      if (foundFolder) {
        currentFolderId = foundFolder.id;
        console.log('📁 기존 폴더 발견:', part, currentFolderId);
      } else {
        console.log('📁 폴더를 찾지 못함, 새 폴더 생성:', part);
        try {
          const newFolder = Drive.Files.create({
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentFolderId]
          });
          currentFolderId = newFolder.id;
          console.log('📁 새 폴더 생성 완료:', part, currentFolderId);
        } catch (createError) {
          console.error('📁 폴더 생성 오류:', createError);
          return {
            success: false,
            message: '폴더 생성 실패: ' + createError.message
          };
        }
      }
    }
    
    console.log('📁 폴더 찾기/생성 완료:', folderPath, currentFolderId);
    
    const result = {
      success: true,
      data: {
        id: currentFolderId,
        path: folderPath
      }
    };
    
    console.log('📁 findOrCreateFolder 반환값:', result);
    console.log('📁 findOrCreateFolder 반환값 타입:', typeof result);
    
    return result;
    
  } catch (error) {
    console.error('📁 폴더 찾기/생성 오류:', error);
    const errorResult = {
      success: false,
      message: '폴더 찾기/생성 실패: ' + error.message
    };
    console.log('📁 findOrCreateFolder 오류 반환값:', errorResult);
    return errorResult;
  }
}

/**
 * 폴더 내 파일 목록 조회
 * @param {string} folderId - 폴더 ID
 * @returns {Object} 파일 목록
 */
function getFolderFiles(folderId) {
  try {
    console.log('📁 폴더 내 파일 목록 조회 시작:', folderId);
    
    const files = Drive.Files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime)',
      orderBy: 'name'
    });
    
    return {
      success: true,
      data: files.files || [],
      message: '폴더 내 파일 목록을 성공적으로 가져왔습니다.'
    };
    
  } catch (error) {
    console.error('📁 폴더 파일 목록 조회 오류:', error);
    return {
      success: false,
      message: '폴더 파일 목록 조회 실패: ' + error.message
    };
  }
}

/**
 * 폴더 정보 조회
 * @param {string} folderId - 폴더 ID
 * @returns {Object} 폴더 정보
 */
function getFolderInfo(folderId) {
  try {
    console.log('📁 폴더 정보 조회 시작:', folderId);
    
    const folder = Drive.Files.get(folderId, {
      fields: 'id,name,parents,owners,permissions,createdTime,modifiedTime'
    });
    
    return {
      success: true,
      data: folder,
      message: '폴더 정보를 성공적으로 가져왔습니다.'
    };
    
  } catch (error) {
    console.error('📁 폴더 정보 조회 오류:', error);
    return {
      success: false,
      message: '폴더 정보 조회 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getDocumentFolderInfo() {
  return {
    version: '1.0.0',
    description: '문서 폴더 관리 관련 기능',
    functions: [
      'moveDocumentToFolder',
      'findOrCreateFolder',
      'getFolderFiles',
      'getFolderInfo'
    ],
    dependencies: ['CONFIG.gs']
  };
}
