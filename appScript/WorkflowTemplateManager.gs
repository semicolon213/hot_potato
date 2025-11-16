/**
 * WorkflowTemplateManager.gs
 * 워크플로우 템플릿 관리 함수들
 * Hot Potato Document Workflow Management System
 */

// ===== 워크플로우 템플릿 관리 =====

/**
 * 워크플로우 템플릿 생성
 * @param {Object} req - 요청 데이터
 * @returns {Object} 생성 결과
 */
function createWorkflowTemplate(req) {
  try {
    console.log('📋 워크플로우 템플릿 생성 시작:', req);
    
    // 관리자 권한 확인
    if (!req.creatorEmail) {
      return {
        success: false,
        message: '생성자 이메일이 필요합니다.'
      };
    }
    
    const isAdmin = checkAdminStatus(req.creatorEmail);
    if (!isAdmin) {
      return {
        success: false,
        message: '템플릿 생성은 관리자만 가능합니다.'
      };
    }
    
    // 필수 필드 확인
    if (!req.templateName || !req.reviewLine || !req.paymentLine) {
      return {
        success: false,
        message: '템플릿 이름, 검토 라인, 결재 라인이 필요합니다.'
      };
    }
    
    const spreadsheet = getWorkflowSpreadsheet();
    const templatesSheet = ensureWorkflowTemplatesSheet();
    
    // 템플릿 ID 생성
    const templateId = 'tpl_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 데이터 준비
    const rowData = [
      templateId,                                    // A: template_id
      req.templateName,                              // B: template_name
      req.documentTag || '',                         // C: document_tag
      JSON.stringify(req.reviewLine || []),         // D: review_line
      JSON.stringify(req.paymentLine || []),        // E: payment_line
      req.isDefault ? 'O' : 'X',                    // F: is_default
      timestamp,                                     // G: created_date
      timestamp,                                     // H: updated_date
      req.creatorEmail,                             // I: created_by
      req.description || ''                         // J: description
    ];
    
    // 헤더 확인
    const headers = templatesSheet.getRange(1, 1, 1, 10).getValues()[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[header] = index;
    });
    
    // 데이터 추가
    const lastRow = templatesSheet.getLastRow();
    templatesSheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('✅ 워크플로우 템플릿 생성 완료:', templateId);
    
    return {
      success: true,
      message: '템플릿이 생성되었습니다.',
      data: {
        templateId: templateId,
        templateName: req.templateName,
        createdDate: timestamp
      }
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 템플릿 생성 오류:', error);
    return {
      success: false,
      message: '템플릿 생성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 워크플로우 템플릿 목록 조회
 * @param {Object} req - 요청 데이터 (선택사항)
 * @returns {Object} 템플릿 목록
 */
function getWorkflowTemplates(req) {
  try {
    console.log('📋 워크플로우 템플릿 목록 조회 시작');
    
    const spreadsheet = getWorkflowSpreadsheet();
    const templatesSheet = ensureWorkflowTemplatesSheet();
    
    const data = templatesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: [],
        message: '템플릿이 없습니다.'
      };
    }
    
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[header] = index;
    });
    
    const templates = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const template = {
        templateId: row[headerMap['template_id']] || '',
        templateName: row[headerMap['template_name']] || '',
        documentTag: row[headerMap['document_tag']] || '',
        reviewLine: JSON.parse(row[headerMap['review_line']] || '[]'),
        paymentLine: JSON.parse(row[headerMap['payment_line']] || '[]'),
        isDefault: row[headerMap['is_default']] === 'O',
        createdDate: row[headerMap['created_date']] || '',
        updatedDate: row[headerMap['updated_date']] || '',
        createdBy: row[headerMap['created_by']] || '',
        description: row[headerMap['description']] || ''
      };
      templates.push(template);
    }
    
    console.log('✅ 워크플로우 템플릿 목록 조회 완료:', templates.length, '개');
    
    return {
      success: true,
      data: templates,
      message: `${templates.length}개의 템플릿을 찾았습니다.`
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 템플릿 목록 조회 오류:', error);
    return {
      success: false,
      message: '템플릿 목록 조회 중 오류가 발생했습니다: ' + error.message,
      data: []
    };
  }
}

/**
 * 워크플로우 템플릿 수정
 * @param {Object} req - 요청 데이터
 * @returns {Object} 수정 결과
 */
function updateWorkflowTemplate(req) {
  try {
    console.log('📋 워크플로우 템플릿 수정 시작:', req);
    
    // 관리자 권한 확인
    if (!req.userEmail) {
      return {
        success: false,
        message: '사용자 이메일이 필요합니다.'
      };
    }
    
    const isAdmin = checkAdminStatus(req.userEmail);
    if (!isAdmin) {
      return {
        success: false,
        message: '템플릿 수정은 관리자만 가능합니다.'
      };
    }
    
    if (!req.templateId) {
      return {
        success: false,
        message: '템플릿 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = getWorkflowSpreadsheet();
    const templatesSheet = ensureWorkflowTemplatesSheet();
    
    const data = templatesSheet.getDataRange().getValues();
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[header] = index;
    });
    
    // 템플릿 찾기
    const templateIdIdx = headerMap['template_id'];
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][templateIdIdx] === req.templateId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: '템플릿을 찾을 수 없습니다.'
      };
    }
    
    // 업데이트할 필드만 수정
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    if (req.templateName !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['template_name'] + 1).setValue(req.templateName);
    }
    if (req.documentTag !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['document_tag'] + 1).setValue(req.documentTag);
    }
    if (req.reviewLine !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['review_line'] + 1).setValue(JSON.stringify(req.reviewLine));
    }
    if (req.paymentLine !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['payment_line'] + 1).setValue(JSON.stringify(req.paymentLine));
    }
    if (req.isDefault !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['is_default'] + 1).setValue(req.isDefault ? 'O' : 'X');
    }
    if (req.description !== undefined) {
      templatesSheet.getRange(rowIndex, headerMap['description'] + 1).setValue(req.description);
    }
    
    // updated_date 항상 업데이트
    templatesSheet.getRange(rowIndex, headerMap['updated_date'] + 1).setValue(timestamp);
    
    console.log('✅ 워크플로우 템플릿 수정 완료:', req.templateId);
    
    return {
      success: true,
      message: '템플릿이 수정되었습니다.',
      data: {
        templateId: req.templateId,
        updatedDate: timestamp
      }
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 템플릿 수정 오류:', error);
    return {
      success: false,
      message: '템플릿 수정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 워크플로우 템플릿 삭제
 * @param {Object} req - 요청 데이터
 * @returns {Object} 삭제 결과
 */
function deleteWorkflowTemplate(req) {
  try {
    console.log('📋 워크플로우 템플릿 삭제 시작:', req);
    
    // 관리자 권한 확인
    if (!req.userEmail) {
      return {
        success: false,
        message: '사용자 이메일이 필요합니다.'
      };
    }
    
    const isAdmin = checkAdminStatus(req.userEmail);
    if (!isAdmin) {
      return {
        success: false,
        message: '템플릿 삭제는 관리자만 가능합니다.'
      };
    }
    
    if (!req.templateId) {
      return {
        success: false,
        message: '템플릿 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = getWorkflowSpreadsheet();
    const templatesSheet = ensureWorkflowTemplatesSheet();
    
    const data = templatesSheet.getDataRange().getValues();
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[header] = index;
    });
    
    // 템플릿 찾기
    const templateIdIdx = headerMap['template_id'];
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][templateIdIdx] === req.templateId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: '템플릿을 찾을 수 없습니다.'
      };
    }
    
    // 행 삭제
    templatesSheet.deleteRow(rowIndex);
    
    console.log('✅ 워크플로우 템플릿 삭제 완료:', req.templateId);
    
    return {
      success: true,
      message: '템플릿이 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 템플릿 삭제 오류:', error);
    return {
      success: false,
      message: '템플릿 삭제 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 관리자 권한 확인
 * @param {string} email - 사용자 이메일
 * @returns {boolean} 관리자 여부
 */
function checkAdminStatus(email) {
  try {
    console.log('🔐 관리자 권한 확인 시작:', email);
    
    if (!email) {
      console.log('⚠️ 이메일이 없습니다.');
      return false;
    }
    
    const spreadsheetName = 'hp_member';
    const spreadsheetId = getSheetIdByName(spreadsheetName);
    if (!spreadsheetId) {
      console.log('⚠️ 스프레드시트를 찾을 수 없습니다.');
      return false;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const userSheet = spreadsheet.getSheetByName('user');
    if (!userSheet) {
      console.log('⚠️ user 시트를 찾을 수 없습니다.');
      return false;
    }
    
    const data = userSheet.getDataRange().getValues();
    const headers = data[0];
    const emailIdx = headers.indexOf('google_member');
    const adminIdx = headers.indexOf('is_admin');
    
    if (emailIdx === -1 || adminIdx === -1) {
      console.log('⚠️ 필요한 컬럼을 찾을 수 없습니다. emailIdx:', emailIdx, 'adminIdx:', adminIdx);
      return false;
    }
    
    // 이메일 암호화 (스프레드시트에 저장된 형식과 일치하도록)
    let encryptedEmail;
    try {
      // applyEncryption 함수가 있는지 확인
      if (typeof applyEncryption === 'function') {
        encryptedEmail = applyEncryption(email, 'Base64', '');
        console.log('🔐 암호화된 이메일:', encryptedEmail);
      } else {
        // applyEncryption이 없으면 원본 이메일 사용 (암호화가 안 되어 있을 수도 있음)
        encryptedEmail = email;
        console.log('⚠️ applyEncryption 함수를 찾을 수 없어 원본 이메일 사용:', email);
      }
    } catch (encryptError) {
      console.log('⚠️ 이메일 암호화 실패, 원본 이메일 사용:', encryptError);
      encryptedEmail = email;
    }
    
    // 암호화된 이메일과 원본 이메일 모두 확인 (둘 다 시도)
    for (let i = 1; i < data.length; i++) {
      const storedEmail = data[i][emailIdx];
      const isAdmin = data[i][adminIdx] === 'O';
      
      // 암호화된 이메일로 비교
      if (storedEmail === encryptedEmail) {
        console.log('✅ 이메일 일치 (암호화):', storedEmail, 'isAdmin:', isAdmin);
        return isAdmin;
      }
      
      // 원본 이메일로도 비교 (혹시 암호화가 안 되어 있을 경우)
      if (storedEmail === email) {
        console.log('✅ 이메일 일치 (원본):', storedEmail, 'isAdmin:', isAdmin);
        return isAdmin;
      }
    }
    
    console.log('⚠️ 일치하는 이메일을 찾을 수 없습니다.');
    return false;
  } catch (error) {
    console.error('❌ 관리자 권한 확인 오류:', error);
    return false;
  }
}

