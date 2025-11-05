/**
 * WorkflowSpreadsheet.gs
 * 워크플로우 스프레드시트 및 시트 관리
 * Hot Potato Document Workflow Management System
 */

// ===== 워크플로우 스프레드시트 관리 =====

/**
 * 워크플로우 스프레드시트 이름 가져오기 (Script Properties 또는 기본값)
 * @returns {string} 스프레드시트 이름
 */
function getWorkflowSpreadsheetName() {
  const name = PropertiesService.getScriptProperties().getProperty('WORKFLOW_SPREADSHEET_NAME');
  return name || '워크플로우_관리';
}

/**
 * 워크플로우 스프레드시트 가져오기 (없으면 생성)
 * @returns {Object} 스프레드시트 객체
 */
function getWorkflowSpreadsheet() {
  try {
    const spreadsheetName = getWorkflowSpreadsheetName();
    console.log('📊 워크플로우 스프레드시트 조회 시작:', spreadsheetName);
    
    // 스프레드시트 ID 찾기
    let spreadsheetId = getSheetIdByName(spreadsheetName);
    
    if (!spreadsheetId) {
      // 스프레드시트가 없으면 생성
      console.log('📊 워크플로우 스프레드시트 생성 시작:', spreadsheetName);
      const newSpreadsheet = SpreadsheetApp.create(spreadsheetName);
      spreadsheetId = newSpreadsheet.getId();
      console.log('📊 워크플로우 스프레드시트 생성 완료:', spreadsheetId);
      
      // 루트 폴더 찾기 및 이동
      try {
        const rootFolderName = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_NAME') || 'hot potato';
        const rootFolder = getFolderByName(rootFolderName);
        if (rootFolder) {
          const file = DriveApp.getFileById(spreadsheetId);
          const parents = file.getParents();
          if (parents.hasNext()) {
            const oldParent = parents.next();
            file.moveTo(rootFolder);
            console.log('📊 워크플로우 스프레드시트를 루트 폴더로 이동:', rootFolderName);
          }
        }
      } catch (error) {
        console.warn('📊 워크플로우 스프레드시트 폴더 이동 실패 (무시됨):', error.message);
      }
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('📊 워크플로우 스프레드시트 조회 완료:', spreadsheet.getName());
    return spreadsheet;
    
  } catch (error) {
    console.error('📊 워크플로우 스프레드시트 조회/생성 오류:', error);
    throw new Error('워크플로우 스프레드시트를 가져오거나 생성할 수 없습니다: ' + error.message);
  }
}

/**
 * 워크플로우 스프레드시트 ID 가져오기
 * @returns {string} 스프레드시트 ID
 */
function getWorkflowSpreadsheetId() {
  try {
    const spreadsheet = getWorkflowSpreadsheet();
    return spreadsheet.getId();
  } catch (error) {
    console.error('📊 워크플로우 스프레드시트 ID 가져오기 실패:', error);
    return null;
  }
}

/**
 * workflow_documents 시트 확인 및 생성
 * @returns {Object} 시트 객체
 */
function ensureWorkflowDocumentsSheet() {
  try {
    const spreadsheet = getWorkflowSpreadsheet();
    const sheetName = 'workflow_documents';
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log('📊 workflow_documents 시트 생성 시작');
      sheet = spreadsheet.insertSheet(sheetName);
      
      // 헤더 설정
      const headers = [
        'workflow_id',           // A: 워크플로우 고유 ID (UUID 또는 타임스탬프 기반, 주 키)
        'workflow_type',         // B: 결재 타입 ('direct' | 'workflow' | 'workflow_with_attachment')
        'document_id',           // C: 문서 ID (Drive 파일 ID, 직접 결재 시)
        'document_title',        // D: 문서 제목 (직접 결재 시)
        'document_url',          // E: 문서 URL (직접 결재 시)
        'workflow_document_id',  // F: 결재 문서 ID (결재 문서가 있을 때)
        'workflow_document_title', // G: 결재 문서 제목
        'workflow_document_url', // H: 결재 문서 URL
        'attached_document_id',  // I: 첨부 문서 ID (첨부 문서가 있을 때)
        'attached_document_title', // J: 첨부 문서 제목
        'attached_document_url', // K: 첨부 문서 URL
        'requester_email',       // L: 요청자 이메일
        'requester_name',        // M: 요청자 이름
        'workflow_status',       // N: 워크플로우 상태
        'workflow_request_date',  // O: 워크플로우 요청일시
        'current_review_step',    // P: 현재 검토 단계
        'current_payment_step',   // Q: 현재 결제 단계
        'review_line',           // R: 검토 라인 (JSON 문자열)
        'payment_line',          // S: 결제 라인 (JSON 문자열)
        'workflow_complete_date', // T: 워크플로우 완료일시
        'created_at',            // U: 생성일시
        'updated_at'             // V: 수정일시
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      console.log('📊 workflow_documents 시트 생성 완료');
    } else {
      console.log('📊 workflow_documents 시트 이미 존재');
    }
    
    return sheet;
    
  } catch (error) {
    console.error('📊 workflow_documents 시트 확인/생성 오류:', error);
    throw error;
  }
}

/**
 * workflow_history 시트 확인 및 생성
 * @returns {Object} 시트 객체
 */
function ensureWorkflowHistorySheet() {
  try {
    const spreadsheet = getWorkflowSpreadsheet();
    const sheetName = 'workflow_history';
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log('📊 workflow_history 시트 생성 시작');
      sheet = spreadsheet.insertSheet(sheetName);
      
      // 헤더 설정
      const headers = [
        'history_id',           // A: 이력 고유 ID
        'workflow_id',           // B: 워크플로우 ID (workflow_documents의 workflow_id와 연결, 외래 키)
        'document_id',           // C: 문서 ID (참고용)
        'document_title',        // D: 문서 제목 (참고용)
        'line_type',             // E: 라인 타입 ('review' | 'payment')
        'step_number',           // F: 단계 번호
        'action_type',           // G: 액션 타입 ('요청' | '승인' | '반려' | '완료' | '보류' | '회송')
        'actor_email',           // H: 행위자 이메일
        'actor_name',            // I: 행위자 이름
        'actor_position',        // J: 행위자 직책/부서 (선택사항)
        'action_date',           // K: 액션 일시
        'opinion',               // L: 결재 의견/메모
        'reject_reason',         // M: 반려 사유 (반려 시)
        'previous_status',       // N: 이전 상태
        'new_status',            // O: 새 상태
        'processing_time'        // P: 처리 소요 시간 (시간 단위, 선택사항)
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      console.log('📊 workflow_history 시트 생성 완료');
    } else {
      console.log('📊 workflow_history 시트 이미 존재');
    }
    
    return sheet;
    
  } catch (error) {
    console.error('📊 workflow_history 시트 확인/생성 오류:', error);
    throw error;
  }
}

/**
 * workflow_templates 시트 확인 및 생성
 * @returns {Object} 시트 객체
 */
function ensureWorkflowTemplatesSheet() {
  try {
    const spreadsheet = getWorkflowSpreadsheet();
    const sheetName = 'workflow_templates';
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log('📊 workflow_templates 시트 생성 시작');
      sheet = spreadsheet.insertSheet(sheetName);
      
      // 헤더 설정
      const headers = [
        'template_id',      // A: 템플릿 ID
        'template_name',    // B: 템플릿 이름
        'document_tag',     // C: 적용 문서 태그 (예: '회의록', '보고서')
        'review_line',      // D: 검토 라인 (JSON 문자열)
        'payment_line',     // E: 결제 라인 (JSON 문자열)
        'is_default',       // F: 기본 템플릿 여부
        'created_date',     // G: 생성일시
        'updated_date',     // H: 수정일시
        'created_by',       // I: 생성자 이메일
        'description'       // J: 템플릿 설명 (선택사항)
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      console.log('📊 workflow_templates 시트 생성 완료');
    } else {
      console.log('📊 workflow_templates 시트 이미 존재');
    }
    
    return sheet;
    
  } catch (error) {
    console.error('📊 workflow_templates 시트 확인/생성 오류:', error);
    throw error;
  }
}

/**
 * 모든 워크플로우 시트 초기화 (없으면 모두 생성)
 * @returns {Object} 생성된/확인된 시트 객체들
 */
function initializeWorkflowSheets() {
  try {
    console.log('📊 워크플로우 시트 초기화 시작');
    
    const documentsSheet = ensureWorkflowDocumentsSheet();
    const historySheet = ensureWorkflowHistorySheet();
    const templatesSheet = ensureWorkflowTemplatesSheet();
    
    console.log('📊 워크플로우 시트 초기화 완료');
    
    return {
      documents: documentsSheet,
      history: historySheet,
      templates: templatesSheet
    };
    
  } catch (error) {
    console.error('📊 워크플로우 시트 초기화 오류:', error);
    throw error;
  }
}

/**
 * 폴더 이름으로 폴더 찾기 (DocumentFolder.gs 또는 유사한 함수 사용)
 * @param {string} folderName - 폴더 이름
 * @returns {Object} 폴더 객체 또는 null
 */
function getFolderByName(folderName) {
  try {
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return null;
  } catch (error) {
    console.error('📁 폴더 찾기 오류:', error);
    return null;
  }
}

