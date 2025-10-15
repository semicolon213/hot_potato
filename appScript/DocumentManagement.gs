/**
 * DocumentManagement.gs
 * 문서 생성, 권한 설정, 폴더 관리 관련 기능
 * Hot Potato Document Management System
 */

// ===== 문서 생성 관련 함수들 =====

/**
 * 문서 생성 요청 처리
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function handleCreateDocument(req) {
  try {
    console.log('📄 문서 생성 시작:', req);
    
    const { title, templateType, creatorEmail, editors, role } = req;
    
    if (!title || !creatorEmail) {
      return {
        success: false,
        message: '제목과 생성자 이메일이 필요합니다.'
      };
    }
    
    // 1. Google Drive API로 새 문서 생성
    const document = createGoogleDocument(title, templateType);
    if (!document.success) {
      return document;
    }
    
    const documentId = document.data.id;
    const documentUrl = document.data.webViewLink;
    
    // 2. 문서 권한 설정 (소유자: 앱스크립트 소유자, 편집자: 요청자 + 지정된 편집자들)
    const permissionResult = setDocumentPermissions(documentId, creatorEmail, editors || []);
    if (!permissionResult.success) {
      return permissionResult;
    }
    
    // 3. hot_potato/문서 폴더에 문서 이동
    const moveResult = moveDocumentToFolder(documentId);
    if (!moveResult.success) {
      console.warn('문서 폴더 이동 실패:', moveResult.message);
      // 폴더 이동 실패해도 문서 생성은 성공으로 처리
    }
    
    // 4. 문서 정보를 스프레드시트에 추가
    const spreadsheetResult = addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role);
    if (!spreadsheetResult.success) {
      console.warn('스프레드시트 추가 실패:', spreadsheetResult.message);
      // 스프레드시트 추가 실패해도 문서 생성은 성공으로 처리
    }
    
    return {
      success: true,
      data: {
        documentId: documentId,
        documentUrl: documentUrl,
        title: title,
        creatorEmail: creatorEmail,
        editors: editors || []
      },
      message: '문서가 성공적으로 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('📄 문서 생성 오류:', error);
    return {
      success: false,
      message: '문서 생성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * Google Drive API로 새 문서 생성
 * @param {string} title - 문서 제목
 * @param {string} templateType - 템플릿 타입 또는 documentId
 * @returns {Object} 생성 결과
 */
function createGoogleDocument(title, templateType) {
  try {
    console.log('📄 Google 문서 생성 시도:', { title, templateType });
    
    // 빈 문서인 경우
    if (templateType === 'empty') {
      console.log('📄 빈 문서 생성 (템플릿 없음)');
    }
    // templateType이 documentId인 경우 (템플릿 복사)
    else if (templateType && templateType.length > 20 && !templateType.includes('http')) {
      console.log('📄 커스텀 템플릿 복사 시도:', templateType);
      
      try {
        // 기존 문서를 복사
        const copiedFile = Drive.Files.copy({
          fileId: templateType,
          title: title
        });
        
        console.log('📄 템플릿 복사 성공:', copiedFile.id);
        
        return {
          success: true,
          data: {
            id: copiedFile.id,
            title: title,
            webViewLink: `https://docs.google.com/document/d/${copiedFile.id}/edit`
          }
        };
      } catch (copyError) {
        console.error('📄 템플릿 복사 실패:', copyError);
        // 복사 실패 시 빈 문서로 생성
      }
    }
    
    // 기본 문서 생성 또는 복사 실패 시
    console.log('📄 빈 문서 생성 시도');
    const file = Drive.Files.insert({
      title: title,
      mimeType: 'application/vnd.google-apps.document'
    });
    
    console.log('📄 Google 문서 생성 성공:', file.id);
    
    return {
      success: true,
      data: {
        id: file.id,
        title: file.title,
        webViewLink: `https://docs.google.com/document/d/${file.id}/edit`
      }
    };
    
  } catch (error) {
    console.error('📄 Google 문서 생성 오류:', error);
    return {
      success: false,
      message: 'Google 문서 생성 실패: ' + error.message
    };
  }
}

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
          Drive.Permissions.insert({
            value: editorEmail,
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
 * 문서를 hot_potato/문서 폴더로 이동
 * @param {string} documentId - 문서 ID
 * @returns {Object} 이동 결과
 */
function moveDocumentToFolder(documentId) {
  try {
    console.log('📁 문서 폴더 이동 시작:', documentId);
    
    // hot_potato/문서 폴더 찾기 또는 생성
    const folderName = 'hot_potato/문서';
    const folder = findOrCreateFolder(folderName);
    
    if (!folder) {
      return {
        success: false,
        message: '문서 폴더를 찾거나 생성할 수 없습니다.'
      };
    }
    
    // 문서를 폴더로 이동
    const file = Drive.Files.get(documentId);
    const previousParents = file.parents.map(parent => parent.id).join(',');
    
    Drive.Files.patch({
      addParents: folder.id,
      removeParents: previousParents
    }, documentId);
    
    console.log('📁 문서 폴더 이동 완료:', documentId, '->', folder.id);
    
    return {
      success: true,
      message: '문서가 폴더로 이동되었습니다.'
    };
    
  } catch (error) {
    console.error('📁 문서 폴더 이동 오류:', error);
    return {
      success: false,
      message: '문서 폴더 이동 실패: ' + error.message
    };
  }
}

/**
 * 폴더 찾기 또는 생성
 * @param {string} folderPath - 폴더 경로 (예: 'hot_potato/문서')
 * @returns {Object|null} 폴더 객체 또는 null
 */
function findOrCreateFolder(folderPath) {
  try {
    console.log('📁 폴더 찾기/생성 시작:', folderPath);
    
    const pathParts = folderPath.split('/');
    let currentFolder = null;
    
    for (let i = 0; i < pathParts.length; i++) {
      const folderName = pathParts[i];
      const parentId = currentFolder ? currentFolder.id : 'root';
      
      // 폴더 검색
      const query = `title='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const folders = Drive.Files.list({
        q: query,
        maxResults: 1
      });
      
      if (folders.items && folders.items.length > 0) {
        currentFolder = folders.items[0];
        console.log('📁 기존 폴더 발견:', folderName, currentFolder.id);
      } else {
        // 폴더 생성
        const folder = Drive.Files.insert({
          title: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [{ id: parentId }]
        });
        
        currentFolder = folder;
        console.log('📁 새 폴더 생성:', folderName, folder.id);
      }
    }
    
    return currentFolder;
    
  } catch (error) {
    console.error('📁 폴더 찾기/생성 오류:', error);
    return null;
  }
}

/**
 * 문서 정보를 스프레드시트에 추가
 * @param {string} documentId - 문서 ID
 * @param {string} title - 문서 제목
 * @param {string} creatorEmail - 생성자 이메일
 * @param {string} documentUrl - 문서 URL
 * @param {string} role - 역할
 * @returns {Object} 추가 결과
 */
function addDocumentToSpreadsheet(documentId, title, creatorEmail, documentUrl, role) {
  try {
    console.log('📊 스프레드시트에 문서 추가 시작:', { documentId, title, creatorEmail });
    
    // 스프레드시트 ID 가져오기
    const spreadsheetId = getSheetIdByName(ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME);
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    
    const sheetName = 'documents';
    
    // 시트 존재 확인 및 생성
    if (!checkSheetExists(spreadsheetId, sheetName)) {
      createNewSheet(spreadsheetId, sheetName);
      const header = [['document_id', 'document_number', 'title', 'author', 'created_at', 'last_modified', 'approval_date', 'status', 'url', 'permission']];
      appendSheetData(spreadsheetId, sheetName, header);
    }
    
    // 문서 번호 생성
    const today = new Date();
    const datePrefix = today.getFullYear().toString() + 
                     ('0' + (today.getMonth() + 1)).slice(-2) + 
                     ('0' + today.getDate()).slice(-2);
    
    const docData = getSheetData(spreadsheetId, sheetName, 'B:B');
    const todayDocs = docData ? docData.filter(row => row[0] && row[0].startsWith(datePrefix)) : [];
    const newSeq = ('000' + (todayDocs.length + 1)).slice(-3);
    const newDocNumber = `${datePrefix}-${newSeq}`;
    
    // 새 행 데이터
    const newRow = [
      documentId,
      newDocNumber,
      title,
      creatorEmail,
      today.toISOString(),
      new Date().toLocaleDateString('ko-KR'),
      '',
      '진행중',
      documentUrl,
      role || 'student'
    ];
    
    // 스프레드시트에 추가
    appendSheetData(spreadsheetId, sheetName, [newRow]);
    
    console.log('📊 스프레드시트에 문서 추가 완료:', newDocNumber);
    
    return {
      success: true,
      message: '문서가 스프레드시트에 추가되었습니다.'
    };
    
  } catch (error) {
    console.error('📊 스프레드시트 추가 오류:', error);
    return {
      success: false,
      message: '스프레드시트 추가 실패: ' + error.message
    };
  }
}

// ===== 문서 조회 관련 함수들 =====

/**
 * 문서 목록 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function handleGetDocuments(req) {
  try {
    console.log('📄 문서 목록 조회 시작:', req);
    
    const { role, searchTerm, author, sortBy, page, limit } = req;
    
    // 역할에 따른 스프레드시트 선택
    const spreadsheetName = getSpreadsheetNameByRole(role);
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    
    const sheetName = 'documents';
    const data = getSheetData(spreadsheetId, sheetName, 'A:J');
    
    if (!data || data.length <= 1) {
      return {
        success: true,
        data: [],
        total: 0,
        message: '문서가 없습니다.'
      };
    }
    
    const header = data[0];
    const documents = data.slice(1).map((row, index) => {
      const doc = {};
      header.forEach((key, hIndex) => {
        doc[key] = row[hIndex];
      });
      return {
        id: doc.document_id,
        documentNumber: doc.document_number,
        title: doc.title,
        author: doc.author,
        lastModified: doc.last_modified,
        approvalDate: doc.approval_date,
        status: doc.status,
        url: doc.url,
        permission: doc.permission,
        originalIndex: index
      };
    }).filter(doc => doc.id);
    
    // 필터링
    let filteredDocs = documents;
    
    if (searchTerm) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (author && author !== '전체') {
      filteredDocs = filteredDocs.filter(doc => doc.author === author);
    }
    
    // 정렬
    if (sortBy === '최신순') {
      filteredDocs.sort((a, b) => {
        const dateA = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
        const dateB = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === '오래된순') {
      filteredDocs.sort((a, b) => {
        const dateA = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
        const dateB = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === '제목순') {
      filteredDocs.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // 페이지네이션
    const total = filteredDocs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedDocs,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('📄 문서 목록 조회 오류:', error);
    return {
      success: false,
      message: '문서 목록 조회 실패: ' + error.message
    };
  }
}

/**
 * 역할에 따른 스프레드시트 이름 반환
 * @param {string} role - 사용자 역할
 * @returns {string} 스프레드시트 이름
 */
function getSpreadsheetNameByRole(role) {
  switch (role) {
    case 'professor': return '교수용_DB';
    case 'assistant': return '조교용_DB';
    case 'executive': return '집행부용_DB';
    case 'adjunct':
    case 'student':
    default:
      return ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME;
  }
}

// ===== 문서 삭제 관련 함수들 =====

/**
 * 문서 삭제 처리
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function handleDeleteDocuments(req) {
  try {
    console.log('🗑️ 문서 삭제 시작:', req);
    
    const { documentIds, role } = req;
    
    if (!documentIds || documentIds.length === 0) {
      return {
        success: false,
        message: '삭제할 문서 ID가 필요합니다.'
      };
    }
    
    // 역할에 따른 스프레드시트 선택
    const spreadsheetName = getSpreadsheetNameByRole(role);
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다.'
      };
    }
    
    // 스프레드시트에서 문서 정보 삭제
    const deleteResult = deleteRowsByDocIds(spreadsheetId, 'documents', documentIds);
    
    if (!deleteResult.success) {
      return deleteResult;
    }
    
    // Google Drive에서 문서 삭제 (선택사항)
    for (const docId of documentIds) {
      try {
        Drive.Files.remove(docId);
        console.log('🗑️ Google Drive에서 문서 삭제 완료:', docId);
      } catch (driveError) {
        console.warn('🗑️ Google Drive 삭제 실패:', docId, driveError.message);
        // Drive 삭제 실패해도 스프레드시트 삭제는 성공으로 처리
      }
    }
    
    return {
      success: true,
      message: `${documentIds.length}개의 문서가 삭제되었습니다.`
    };
    
  } catch (error) {
    console.error('🗑️ 문서 삭제 오류:', error);
    return {
      success: false,
      message: '문서 삭제 실패: ' + error.message
    };
  }
}

// ===== 테스트 함수들 =====

/**
 * 문서 생성 테스트
 */
function testDocumentCreation() {
  console.log('🧪 문서 생성 테스트 시작');
  
  const testReq = {
    title: '테스트 문서',
    templateType: 'meeting',
    creatorEmail: 'test@example.com',
    editors: ['editor1@example.com', 'editor2@example.com'],
    role: 'student'
  };
  
  const result = handleCreateDocument(testReq);
  console.log('🧪 문서 생성 테스트 결과:', result);
  
  return result;
}

/**
 * 폴더 생성 테스트
 */
function testFolderCreation() {
  console.log('🧪 폴더 생성 테스트 시작');
  
  const folder = findOrCreateFolder('hot_potato/문서');
  console.log('🧪 폴더 생성 테스트 결과:', folder);
  
  return folder;
}

/**
 * hot potato/문서/양식 폴더에서 템플릿 목록 가져오기
 * @returns {Object} 템플릿 목록 결과
 */
function getTemplatesFromFolder() {
  try {
    console.log('📄 템플릿 폴더에서 파일 목록 가져오기 시작');
    
    // hot_potato/문서/양식 폴더 찾기
    const folder = findOrCreateFolder('hot_potato/문서/양식');
    if (!folder.success) {
      return {
        success: false,
        message: '템플릿 폴더를 찾을 수 없습니다: ' + folder.message
      };
    }
    
    // 폴더 내의 Google Docs 파일들 가져오기
    const files = Drive.Files.list({
      q: `'${folder.data.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'items(id,title,description,modifiedDate,owners)',
      orderBy: 'title'
    });
    
    if (!files.items || files.items.length === 0) {
      console.log('📄 템플릿 폴더에 문서가 없습니다');
      return {
        success: true,
        data: [],
        message: '템플릿 폴더에 문서가 없습니다'
      };
    }
    
    // 템플릿 정보 파싱
    const templates = files.items.map(file => {
      // 파일 제목에서 태그 추출 (예: "회의 / 회의록 / 회의 내용을 기록하는 템플릿" -> "회의")
      const titleParts = file.title.split(' / ');
      const tag = titleParts.length > 1 ? titleParts[0] : '기본';
      const displayTitle = titleParts.length > 1 ? titleParts[1] : file.title;
      const description = titleParts.length > 2 ? titleParts[2] : (file.description || '템플릿 파일');
      
      return {
        id: file.id,
        type: file.id, // documentId를 type으로 사용
        title: displayTitle,
        description: description,
        tag: tag,
        fullTitle: file.title,
        modifiedDate: file.modifiedDate,
        owner: file.owners && file.owners.length > 0 ? file.owners[0].displayName : 'Unknown'
      };
    });
    
    console.log('📄 템플릿 목록 가져오기 성공:', templates.length, '개');
    
    return {
      success: true,
      data: templates,
      message: `${templates.length}개의 템플릿을 찾았습니다`
    };
    
  } catch (error) {
    console.error('📄 템플릿 목록 가져오기 오류:', error);
    return {
      success: false,
      message: '템플릿 목록을 가져오는 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 빈 문서 템플릿 테스트
 */
function testEmptyDocumentTemplate() {
  console.log('🧪 빈 문서 템플릿 테스트 시작');
  
  const testReq = {
    title: '테스트 빈 문서',
    templateType: 'empty',
    creatorEmail: 'test@example.com',
    editors: [],
    role: 'student'
  };
  
  const result = handleCreateDocument(testReq);
  console.log('🧪 빈 문서 템플릿 테스트 결과:', result);
  
  return result;
}

/**
 * 기본 템플릿 테스트
 */
function testDefaultTemplate() {
  console.log('🧪 기본 템플릿 테스트 시작');
  
  const testReq = {
    title: '테스트 회의록',
    templateType: 'meeting',
    creatorEmail: 'test@example.com',
    editors: [],
    role: 'student'
  };
  
  const result = handleCreateDocument(testReq);
  console.log('🧪 기본 템플릿 테스트 결과:', result);
  
  return result;
}

// ===== 배포 정보 =====
function getDocumentManagementInfo() {
  return {
    version: '1.0.0',
    description: '문서 생성, 권한 설정, 폴더 관리 시스템',
    functions: [
      'handleCreateDocument',
      'createGoogleDocument',
      'setDocumentPermissions',
      'moveDocumentToFolder',
      'findOrCreateFolder',
      'addDocumentToSpreadsheet',
      'handleGetDocuments',
      'handleDeleteDocuments',
      'getSpreadsheetNameByRole',
      'getTemplatesFromFolder',
      'testDocumentCreation',
      'testFolderCreation',
      'testEmptyDocumentTemplate',
      'testDefaultTemplate'
    ],
    dependencies: ['SpreadsheetUtils.gs', 'CONFIG.gs']
  };
}
