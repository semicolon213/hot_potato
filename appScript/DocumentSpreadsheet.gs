/**
 * DocumentSpreadsheet.gs
 * 문서 스프레드시트 관리 관련 기능
 * Hot Potato Document Management System
 */

// ===== 스프레드시트 관련 함수들 =====

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
    console.log('📄 스프레드시트에 문서 정보 추가 시작:', { documentId, title, creatorEmail, role });
    
    // 역할에 따른 스프레드시트 이름 결정
    const spreadsheetName = getSpreadsheetNameByRole(role);
    if (!spreadsheetName) {
      return {
        success: false,
        message: '지원하지 않는 역할입니다: ' + role
      };
    }
    
    // 스프레드시트 ID 찾기
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      return {
        success: false,
        message: '스프레드시트를 찾을 수 없습니다: ' + spreadsheetName
      };
    }
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 문서 정보를 스프레드시트에 추가 (이메일로 저장, 조회 시 이름으로 변환)
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    sheet.appendRow([
      documentId,
      title,
      creatorEmail,  // 이메일로 저장 (조회 시 이름으로 변환됨)
      documentUrl,
      timestamp,
      '생성됨'
    ]);
    
    console.log('📄 스프레드시트에 문서 정보 추가 완료');
    return { success: true };
    
  } catch (error) {
    console.error('📄 스프레드시트 추가 오류:', error);
    return {
      success: false,
      message: '스프레드시트 추가 실패: ' + error.message
    };
  }
}

/**
 * 스프레드시트 이름으로 ID 찾기
 * @param {string} sheetName - 스프레드시트 이름
 * @returns {string} 스프레드시트 ID
 */
function getSheetIdByName(sheetName) {
  try {
    console.log('📊 스프레드시트 ID 찾기 시작:', sheetName);
    
    const query = `name='${sheetName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    console.log('📊 스프레드시트 검색 쿼리:', query);
    
    const files = Drive.Files.list({
      q: query,
      fields: 'files(id,name)'
    });
    
    if (files.files && files.files.length > 0) {
      const spreadsheetId = files.files[0].id;
      console.log('📊 스프레드시트 ID 찾기 성공:', spreadsheetId);
      return spreadsheetId;
    } else {
      console.warn('📊 스프레드시트를 찾을 수 없습니다:', sheetName);
      return null;
    }
  } catch (error) {
    console.error('📊 스프레드시트 ID 찾기 오류:', error);
    return null;
  }
}

/**
 * 공유 문서 폴더에서 파일 목록 가져오기 (기본 템플릿처럼 파일 목록 + 메타데이터 따로 조회)
 * @returns {Object} 파일 목록 (메타데이터 포함)
 */
function getSharedDocumentsFromFolder() {
  try {
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다.'
      };
    }
    
    // 스크립트 속성에서 폴더 이름 가져오기
    const rootFolderName = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_NAME') || 'hot potato';
    const documentFolderName = PropertiesService.getScriptProperties().getProperty('DOCUMENT_FOLDER_NAME') || '문서';
    const sharedFolderName = PropertiesService.getScriptProperties().getProperty('SHARED_DOCUMENT_FOLDER_NAME') || '공유 문서';
    
    // 폴더 경로 결정
    var folderPath;
    if (typeof getSharedDocumentFolderPath === 'function') {
      folderPath = getSharedDocumentFolderPath();
    } else {
      folderPath = rootFolderName + '/' + documentFolderName + '/' + sharedFolderName;
    }
    
    // 폴더 찾기/생성
    var folderResult = null;
    try {
      folderResult = findOrCreateFolder(folderPath);
    } catch (findErr) {
      console.error('📁 폴더 탐색 오류:', findErr);
      folderResult = { success: false };
    }
    
    if (!folderResult || !folderResult.success || !folderResult.data || !folderResult.data.id) {
      return {
        success: false,
        message: '공유 문서 폴더를 찾을 수 없습니다.'
      };
    }
    
    const targetFolderId = folderResult.data.id;
    
    // 1단계: 파일 목록 먼저 조회 (기본 템플릿처럼)
    var files;
    var maxRetries = 3;
    var retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        files = Drive.Files.list({
          q: '\'' + targetFolderId + '\' in parents and trashed=false',
          maxResults: 1000
        });
        break; // 성공하면 루프 종료
      } catch (listError) {
        retryCount++;
        console.warn('📄 공유 문서 목록 조회 재시도 ' + retryCount + '/' + maxRetries + ':', listError.message);
        
        // 사용량 제한 오류인지 확인
        if (listError.message && (listError.message.indexOf('429') !== -1 || 
            listError.message.indexOf('quota') !== -1 || 
            listError.message.indexOf('rate limit') !== -1)) {
          console.warn('⚠️ API 사용량 제한 감지. 잠시 대기 후 재시도합니다.');
          Utilities.sleep(Math.pow(2, retryCount) * 2000); // 지수적 백오프
          continue;
        }
        
        if (retryCount >= maxRetries) {
          return { success: false, message: '공유 문서 조회 실패: ' + listError.message };
        }
        
        Utilities.sleep(Math.pow(2, retryCount) * 1000);
      }
    }
    
    // 2단계: 각 파일의 메타데이터(properties) 따로 조회 (기본 템플릿처럼)
    var fileArray = files.items || files.files || [];
    
    for (var i = 0; i < fileArray.length; i++) {
      try {
        // properties만 가져오기 위해 fields 지정
        var fileDetail = Drive.Files.get(fileArray[i].id, { fields: 'properties' });
        
        if (fileDetail && fileDetail.properties) {
          // properties 객체를 직접 할당
          fileArray[i].properties = fileDetail.properties;
        } else {
          // properties가 없으면 빈 객체로 초기화
          fileArray[i].properties = {};
        }
        
        // API 제한 방지를 위해 잠시 대기
        if (i % 10 === 0 && i > 0) {
          Utilities.sleep(100);
        }
      } catch (getError) {
        // 에러 발생 시에도 빈 객체로 초기화하여 계속 진행
        fileArray[i].properties = {};
        console.warn('파일 상세 정보 가져오기 실패:', fileArray[i].id, getError.message);
      }
    }
    
    // properties를 가져온 후 files 객체에 다시 할당
    if (files.items) {
      files.items = fileArray;
    } else if (files.files) {
      files.files = fileArray;
    }
    
    // 기존 형식 유지하여 반환
    return {
      success: true,
      files: fileArray
    };
    
  } catch (error) {
    console.error('❌ 공유 문서 목록 가져오기 오류:', error);
    return {
      success: false,
      message: '공유 문서 목록을 가져오는 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 문서 목록 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 결과
 */
function handleGetDocuments(req) {
  try {
    console.log('📄 문서 목록 조회 시작:', req);
    
    const { role, searchTerm, author, sortBy } = req;
    // 기본 페이지네이션 값 보정
    const page = req.page ? Number(req.page) : 1;
    const limit = req.limit ? Number(req.limit) : 100;

    // 1) Drive 폴더 기반 조회 (공유 전용) - 기본 템플릿처럼 폴더에서 가져오기
    if (role === 'shared') {
      console.log('📁 Drive 폴더 기반 조회 모드:', role);
      
      // 기본 템플릿처럼 폴더에서 파일 목록 가져오기
      var folderResult = getSharedDocumentsFromFolder();
      
      if (!folderResult.success || !folderResult.files || folderResult.files.length === 0) {
        return {
          success: true,
          data: [],
          total: 0,
          message: folderResult.message || '공유 문서를 가져올 수 없습니다.'
        };
      }
      
      // 기존 형식으로 변환 (메타데이터 사용) - 기본 템플릿처럼 properties에서 추출
      var items = folderResult.files.map(function(file, index) {
        // properties에서 메타데이터 추출 (기본 템플릿처럼)
        var p = file.properties || {};
        var creatorRaw = '';
        var creatorEmail = '';
        var tag = '공용';
        
        // properties가 배열인 경우 (v2)
        if (Array.isArray(p)) {
          for (var j = 0; j < p.length; j++) {
            var prop = p[j];
            if (prop && prop.key && prop.value !== undefined) {
              switch(prop.key) {
                case 'creator':
                  creatorRaw = prop.value || '';
                  break;
                case 'creatorEmail':
                  creatorEmail = prop.value || '';
                  break;
                case 'tag':
                  tag = prop.value || '공용';
                  break;
              }
            }
          }
        } else if (p && typeof p === 'object') {
          // 객체 형태인 경우 (v3)
          creatorRaw = p.creator || p['creator'] || '';
          creatorEmail = p.creatorEmail || p['creatorEmail'] || '';
          tag = p.tag || p['tag'] || '공용';
        }
        
        // creatorRaw가 없으면 owners에서 가져오기
        if (!creatorRaw) {
          creatorRaw = (file.owners && file.owners.length > 0 && (file.owners[0].displayName || file.owners[0].emailAddress)) || '';
        }
        
        // 이메일이면 이름 변환 시도
        var creator = creatorRaw;
        if (!creatorEmail && creatorRaw && creatorRaw.indexOf('@') !== -1) {
          creatorEmail = creatorRaw;
        }
        
        try {
          if (creatorRaw && typeof creatorRaw === 'string' && creatorRaw.indexOf('@') !== -1) {
            if (!creatorEmail) {
              creatorEmail = creatorRaw;
            }
            var nameResult = getUserNameByEmail(creatorRaw);
            if (nameResult && nameResult.success && nameResult.name) {
              creator = nameResult.name;
            }
          }
        } catch (nameErr) {
          // 변환 실패 시 원본 유지
        }
        
        return {
          id: file.id,
          documentNumber: '', // 프론트에서 보완 생성 가능
          title: file.title || file.name || '',
          author: creator,
          authorEmail: creatorEmail,
          createdTime: file.createdDate || file.createdTime || '',
          lastModified: file.modifiedDate || file.modifiedTime || '',
          url: file.webViewLink || file.alternateLink || '',
          mimeType: file.mimeType || '',
          tag: tag,
          originalIndex: index
        };
      });

      // 검색/필터
      if (searchTerm) {
        var lower = String(searchTerm).toLowerCase();
        items = items.filter(function(doc){
          return (doc.title || '').toLowerCase().indexOf(lower) !== -1
            || (doc.documentNumber || '').toLowerCase().indexOf(lower) !== -1;
        });
      }
      if (author && author !== '전체') {
        items = items.filter(function(doc){ return doc.author === author; });
      }

      // 정렬
      if (sortBy === '최신순') {
        items.sort(function(a,b){ return new Date(b.lastModified) - new Date(a.lastModified); });
      } else if (sortBy === '오래된순') {
        items.sort(function(a,b){ return new Date(a.lastModified) - new Date(b.lastModified); });
      } else if (sortBy === '제목순') {
        items.sort(function(a,b){ return String(a.title).localeCompare(String(b.title)); });
      }

      // 페이지네이션
      var totalDrive = items.length;
      var start = (page - 1) * limit;
      var end = start + limit;
      var pageItems = items.slice(start, end);

      return {
        success: true,
        data: pageItems,
        total: totalDrive,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalDrive / limit)
      };
    }
    
    // 2) 스프레드시트 기반 조회 (기존 로직)
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
      
      // 스프레드시트에 저장된 author가 이메일인 경우 이름으로 변환
      let authorName = doc.author || '';
      let authorEmail = '';
      try {
        if (doc.author && typeof doc.author === 'string' && doc.author.indexOf('@') !== -1) {
          // 이메일 형식이면 이름으로 변환 시도
          authorEmail = doc.author;
          var nameResult = getUserNameByEmail(doc.author);
          if (nameResult && nameResult.success && nameResult.name) {
            authorName = nameResult.name;
          }
        } else {
          // 이미 이름이면 그대로 사용
          authorName = doc.author;
        }
      } catch (nameErr) {
        // 변환 실패 시 원본 유지
        console.warn('이메일을 이름으로 변환 실패:', doc.author, nameErr);
      }
      
      return {
        id: doc.document_id,
        documentNumber: doc.document_number,
        title: doc.title,
        author: authorName,  // 변환된 이름 사용
        authorEmail: authorEmail,  // 이메일도 함께 제공
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

// ===== 배포 정보 =====
function getDocumentSpreadsheetInfo() {
  return {
    version: '1.0.0',
    description: '문서 스프레드시트 관리 관련 기능',
    functions: [
      'addDocumentToSpreadsheet',
      'getSheetIdByName',
      'handleGetDocuments',
      'handleDeleteDocuments'
    ],
    dependencies: ['CONFIG.gs', 'SpreadsheetUtils.gs']
  };
}
