/**
 * DocumentFolder.gs
 * 문서 폴더 관리 관련 기능
 * Hot Potato Document Management System
 */

// ===== 폴더 관리 관련 함수들 =====

/**
 * 문서를 hot potato/문서/공유 문서 폴더로 이동
 * @param {string} documentId - 문서 ID
 * @returns {Object} 이동 결과
 */
function moveDocumentToFolder(documentId) {
  try {
    console.log('Document folder move start:', documentId);
    
    // hot potato/문서/공유 문서 폴더 찾기 또는 생성
    const folder = findOrCreateFolder('hot potato/문서/공유 문서');
    if (!folder.success) {
      return folder;
    }
    
    // 문서를 폴더로 이동
    Drive.Files.update({
      fileId: documentId,
      addParents: folder.data.id,
      removeParents: 'root'
    });
    
    console.log('Document moved to shared documents folder');
    return { success: true };
    
  } catch (error) {
    console.error('Document folder move error:', error);
    return {
      success: false,
      message: 'Document folder move failed: ' + error.message
    };
  }
}

/**
 * 폴더 찾기 또는 생성
 * @param {string} folderPath - 폴더 경로
 * @returns {Object} 폴더 정보
 */
function findOrCreateFolder(folderPath) {
  console.log('findOrCreateFolder function start');
  console.log('Input folder path:', folderPath);
  console.log('Folder path type:', typeof folderPath);
  
  try {
    console.log('Folder find/create start:', folderPath);
    
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      console.error('Drive API is not defined');
      return {
        success: false,
        message: 'Drive API is not enabled. Please enable Drive API in Google Apps Script.'
      };
    }
    
    if (!folderPath || typeof folderPath !== 'string') {
      console.error('Invalid folder path:', folderPath);
      return {
        success: false,
        message: 'Invalid folder path'
      };
    }
    
    const pathParts = folderPath.split('/');
    let currentFolderId = 'root';
    
    for (const part of pathParts) {
      if (!part) continue;
      
      console.log('Searching folder:', part, 'in', currentFolderId);
      
      // 더 안전한 폴더 검색 방법 사용
      let foundFolder = null;
      
      try {
        // 단순한 쿼리로 모든 폴더 가져오기
        const folders = Drive.Files.list({
          q: '\'' + currentFolderId + '\' in parents and mimeType=\'application/vnd.google-apps.folder\' and trashed=false',
          fields: 'files(id,name)'
        });
        
        console.log('Search results:', folders);
        
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
        console.error('Folder search error:', searchError);
        // 검색 실패 시 바로 폴더 생성
        foundFolder = null;
      }
      
      if (foundFolder) {
        currentFolderId = foundFolder.id;
        console.log('Found existing folder:', part, currentFolderId);
      } else {
        console.log('Folder not found, creating new folder:', part);
        try {
          const newFolder = Drive.Files.create({
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentFolderId]
          });
          currentFolderId = newFolder.id;
          console.log('New folder created:', part, currentFolderId);
        } catch (createError) {
          console.error('Folder creation error:', createError);
          return {
            success: false,
            message: 'Folder creation failed: ' + createError.message
          };
        }
      }
    }
    
    console.log('Folder find/create complete:', folderPath, currentFolderId);
    
    const result = {
      success: true,
      data: {
        id: currentFolderId,
        path: folderPath
      }
    };
    
    console.log('findOrCreateFolder return value:', result);
    console.log('findOrCreateFolder return type:', typeof result);
    
    return result;
    
  } catch (error) {
    console.error('Folder find/create error:', error);
    const errorResult = {
      success: false,
      message: 'Folder find/create failed: ' + error.message
    };
    console.log('findOrCreateFolder error return:', errorResult);
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
    console.log('Getting folder files:', folderId);
    
    const files = Drive.Files.list({
      q: '\'' + folderId + '\' in parents and trashed=false',
      fields: 'files(id,name,mimeType,modifiedTime)',
      orderBy: 'name'
    });
    
    return {
      success: true,
      data: files.files || [],
      message: 'Folder files retrieved successfully.'
    };
    
  } catch (error) {
    console.error('Folder files retrieval error:', error);
    return {
      success: false,
      message: 'Folder files retrieval failed: ' + error.message
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
    console.log('Getting folder info:', folderId);
    
    const folder = Drive.Files.get(folderId, {
      fields: 'id,name,parents,owners,permissions,createdTime,modifiedTime'
    });
    
    return {
      success: true,
      data: folder,
      message: 'Folder info retrieved successfully.'
    };
    
  } catch (error) {
    console.error('Folder info retrieval error:', error);
    return {
      success: false,
      message: 'Folder info retrieval failed: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getDocumentFolderInfo() {
  return {
    version: '1.0.0',
    description: 'Document folder management',
    functions: [
      'moveDocumentToFolder',
      'findOrCreateFolder',
      'getFolderFiles',
      'getFolderInfo'
    ],
    dependencies: ['CONFIG.gs']
  };
}
