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
