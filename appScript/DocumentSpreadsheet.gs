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
    
    // 문서 정보를 스프레드시트에 추가
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    sheet.appendRow([
      documentId,
      title,
      creatorEmail,
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

    // 1) Drive 폴더 기반 조회 (공유 전용)
    if (role === 'shared') {
      console.log('📁 Drive 폴더 기반 조회 모드:', role);

      // 폴더 경로 결정
      var folderPath = (typeof getSharedDocumentFolderPath === 'function' ? getSharedDocumentFolderPath() : 'hot potato/문서/공유 문서');

      // 폴더 찾기/생성
      var folderResult = null;
      try {
        folderResult = findOrCreateFolder(folderPath);
      } catch (findErr) {
        console.error('📁 폴더 탐색 오류:', findErr);
        folderResult = { success: false };
      }

      if (!folderResult || !folderResult.success || !folderResult.data || !folderResult.data.id) {
        return { success: true, data: [], total: 0, message: '대상 폴더를 찾을 수 없습니다.' };
      }

      const targetFolderId = folderResult.data.id;
      console.log('📁 대상 폴더 ID:', targetFolderId);

      // 폴더 내 파일 조회
      var files;
      try {
        files = Drive.Files.list({
          q: "'" + targetFolderId + "' in parents and trashed=false",
          fields: 'files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,properties)',
          orderBy: 'modifiedTime desc'
        });
      } catch (listErr) {
        console.error('📁 파일 목록 조회 오류:', listErr);
        files = { files: [] };
      }

      var items = (files.files || []).map(function(file, index) {
        var creatorRaw = (file.properties && file.properties.creator) 
          || (file.owners && file.owners.length > 0 && (file.owners[0].displayName || file.owners[0].emailAddress))
          || '';
        // 이메일이면 이름 변환 시도
        var creator = creatorRaw;
        var creatorEmail = '';
        try {
          if (creatorRaw && typeof creatorRaw === 'string' && creatorRaw.indexOf('@') !== -1) {
            creatorEmail = creatorRaw;
            var nameResult = getUserNameByEmail(creatorRaw);
            if (nameResult && nameResult.success && nameResult.name) {
              creator = nameResult.name;
            }
          }
        } catch (nameErr) {
          // 변환 실패 시 원본 유지
        }
        var tag = (file.properties && file.properties.tag) || '공용';
        return {
          id: file.id,
          documentNumber: '', // 프론트에서 보완 생성 가능
          title: file.name || '',
          author: creator,
          authorEmail: creatorEmail,
          createdTime: file.createdTime || '',
          lastModified: file.modifiedTime || '',
          url: file.webViewLink || '',
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
