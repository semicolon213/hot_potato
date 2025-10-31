/**
 * DocumentWorkflow.gs
 * 워크플로우 요청 및 관리 함수
 * Hot Potato Document Workflow Management System
 */

// ===== 워크플로우 요청 처리 =====

/**
 * 워크플로우 ID 생성 (UUID 또는 타임스탬프 기반)
 * @returns {string} 워크플로우 ID
 */
function generateWorkflowId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return 'wf_' + timestamp + '_' + random;
}

/**
 * 워크플로우 요청 처리
 * @param {Object} req - 요청 데이터
 * @returns {Object} 응답 데이터
 */
function requestWorkflow(req) {
  try {
    console.log('📋 워크플로우 요청 시작:', req);
    
    // 필수 필드 검증
    if (!req.requesterEmail) {
      return {
        success: false,
        message: '요청자 이메일이 필요합니다.'
      };
    }
    
    if (!req.reviewLine || !Array.isArray(req.reviewLine) || req.reviewLine.length === 0) {
      return {
        success: false,
        message: '검토 라인이 필요합니다.'
      };
    }
    
    if (!req.paymentLine || !Array.isArray(req.paymentLine) || req.paymentLine.length === 0) {
      return {
        success: false,
        message: '결재 라인이 필요합니다.'
      };
    }
    
    // 워크플로우 타입 결정
    const createWorkflowDocument = req.createWorkflowDocument || false;
    const attachDocument = req.attachDocument || false;
    let workflowType = 'direct';
    
    if (createWorkflowDocument && attachDocument) {
      workflowType = 'workflow_with_attachment';
    } else if (createWorkflowDocument) {
      workflowType = 'workflow';
    }
    
    // 워크플로우 ID 생성
    const workflowId = generateWorkflowId();
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 워크플로우 스프레드시트 및 시트 초기화
    initializeWorkflowSheets();
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    
    if (!documentsSheet) {
      throw new Error('workflow_documents 시트를 찾을 수 없습니다.');
    }
    
    // 변수 초기화
    let workflowDocumentId = null;
    let workflowDocumentUrl = null;
    let workflowDocumentTitle = null;
    let documentId = req.documentId || null;
    let documentUrl = null;
    let documentTitle = null;
    let attachedDocumentIds = [];
    let attachedDocumentUrls = [];
    let attachedDocumentTitles = [];
    
    // 조합 1: 문서 직접 결재
    if (workflowType === 'direct') {
      if (!documentId) {
        return {
          success: false,
          message: '문서 ID가 필요합니다 (문서 직접 결재).'
        };
      }
      
      try {
        const file = DriveApp.getFileById(documentId);
        documentUrl = file.getUrl();
        documentTitle = file.getName();
      } catch (error) {
        return {
          success: false,
          message: '문서를 찾을 수 없습니다: ' + error.message
        };
      }
    }
    
    // 조합 2, 3: 결재 문서 생성
    if (createWorkflowDocument) {
      try {
        // 결재 문서 생성
        const workflowTitle = req.workflowTitle || '결재 요청 문서';
        const workflowContent = req.workflowContent || '';
        
        // Google Docs 문서 생성
        const workflowDoc = DocumentApp.create(workflowTitle);
        const workflowDocId = workflowDoc.getId();
        const workflowDocFile = DriveApp.getFileById(workflowDocId);
        
        // 내용 추가 (HTML을 텍스트로 변환하여 추가)
        if (workflowContent) {
          const body = workflowDoc.getBody();
          // HTML 태그 제거하고 텍스트만 추출 (간단한 버전)
          const plainText = workflowContent.replace(/<[^>]+>/g, '').trim();
          if (plainText) {
            body.appendParagraph(plainText);
          }
        }
        
        workflowDocumentId = workflowDocId;
        workflowDocumentUrl = workflowDocFile.getUrl();
        workflowDocumentTitle = workflowTitle;
        
        // 결재 문서 폴더로 이동
        try {
          const rootFolderName = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_NAME') || 'hot potato';
          const rootFolder = getFolderByName(rootFolderName);
          if (rootFolder) {
            const workflowFolderName = '결재 문서';
            let workflowFolder = getSubFolderByName(rootFolder, workflowFolderName);
            if (!workflowFolder) {
              workflowFolder = rootFolder.createFolder(workflowFolderName);
            }
            workflowDocFile.moveTo(workflowFolder);
            console.log('📄 결재 문서를 폴더로 이동:', workflowFolderName);
          }
        } catch (error) {
          console.warn('📄 결재 문서 폴더 이동 실패 (무시됨):', error.message);
        }
        
        console.log('📄 결재 문서 생성 완료:', workflowDocumentId);
      } catch (error) {
        return {
          success: false,
          message: '결재 문서 생성 실패: ' + error.message
        };
      }
    }
    
    // 조합 3: 첨부 문서 설정 (여러 개 지원)
    if (attachDocument) {
      // 여러 첨부 문서 지원 (attachedDocumentIds 배열)
      let documentIdsToAttach = [];
      
      if (req.attachedDocumentIds && Array.isArray(req.attachedDocumentIds) && req.attachedDocumentIds.length > 0) {
        documentIdsToAttach = req.attachedDocumentIds;
      } else if (req.attachedDocumentId) {
        // 하위 호환성: 단일 문서도 지원
        documentIdsToAttach = [req.attachedDocumentId];
      } else if (documentId) {
        // 하위 호환성: documentId도 첨부 가능
        documentIdsToAttach = [documentId];
      }
      
      if (documentIdsToAttach.length === 0) {
        return {
          success: false,
          message: '첨부할 문서 ID가 필요합니다.'
        };
      }
      
      // 모든 첨부 문서 정보 가져오기
      for (let i = 0; i < documentIdsToAttach.length; i++) {
        const docId = documentIdsToAttach[i];
        try {
          const attachedFile = DriveApp.getFileById(docId);
          attachedDocumentIds.push(docId);
          attachedDocumentUrls.push(attachedFile.getUrl());
          attachedDocumentTitles.push(attachedFile.getName());
        } catch (error) {
          return {
            success: false,
            message: `첨부 문서를 찾을 수 없습니다 (ID: ${docId}): ` + error.message
          };
        }
      }
    }
    
    // 하위 호환성: 첫 번째 첨부 문서 ID (단일 문서 처리용)
    const attachedDocumentId = attachedDocumentIds.length > 0 ? attachedDocumentIds[0] : null;
    const attachedDocumentUrl = attachedDocumentUrls.length > 0 ? attachedDocumentUrls[0] : null;
    const attachedDocumentTitle = attachedDocumentTitles.length > 0 ? attachedDocumentTitles[0] : null;
    
    // 권한 부여 대상 목록 생성 (모든 검토자 + 결재자)
    const allUsers = [];
    req.reviewLine.forEach(step => {
      if (step.email && !allUsers.includes(step.email)) {
        allUsers.push(step.email);
      }
    });
    req.paymentLine.forEach(step => {
      if (step.email && !allUsers.includes(step.email)) {
        allUsers.push(step.email);
      }
    });
    
    // 권한 부여 결과 초기화
    let permissionResult = {
      successCount: 0,
      failCount: 0,
      grantedUsers: [],
      failedUsers: []
    };
    
    // 개인 문서 여부 확인
    const isPersonalDocument = req.isPersonalDocument || false;
    let requiresFrontendPermissionGrant = false;
    const personalDocuments = [];
    
    if (allUsers.length > 0 && !isPersonalDocument) {
      // 개인 문서가 아닌 경우에만 Apps Script에서 권한 부여
      try {
        // 조합 1: 문서 직접 결재 - 문서에 권한 부여
        if (workflowType === 'direct' && documentId) {
          permissionResult = grantDocumentPermissions(documentId, allUsers, 'reader');
        }
        // 조합 2: 결재 문서만 - 결재 문서에 권한 부여
        else if (workflowType === 'workflow' && workflowDocumentId) {
          permissionResult = grantDocumentPermissions(workflowDocumentId, allUsers, 'reader');
        }
        // 조합 3: 결재 문서 + 첨부 - 첨부 문서들에 권한 부여
        else if (workflowType === 'workflow_with_attachment' && attachedDocumentIds.length > 0) {
          // 여러 첨부 문서에 권한 부여
          for (let i = 0; i < attachedDocumentIds.length; i++) {
            const docPermResult = grantDocumentPermissions(attachedDocumentIds[i], allUsers, 'reader');
            permissionResult.successCount += docPermResult.successCount;
            permissionResult.failCount += docPermResult.failCount;
            permissionResult.grantedUsers.push(...docPermResult.grantedUsers);
            permissionResult.failedUsers.push(...docPermResult.failedUsers);
          }
        }
      } catch (error) {
        console.error('❌ 권한 부여 오류:', error);
        permissionResult = {
          successCount: 0,
          failCount: allUsers.length,
          grantedUsers: [],
          failedUsers: allUsers
        };
      }
    } else if (isPersonalDocument && allUsers.length > 0) {
      // 개인 문서인 경우 프론트엔드에서 권한 부여 필요
      requiresFrontendPermissionGrant = true;
      
      // 조합 1: 문서 직접 결재 - 문서에 권한 부여 (프론트엔드)
      if (workflowType === 'direct' && documentId) {
        personalDocuments.push({
          documentId: documentId,
          userEmails: allUsers
        });
      }
      // 조합 3: 결재 문서 + 첨부 - 첨부 문서들에 권한 부여 (프론트엔드)
      else if (workflowType === 'workflow_with_attachment' && attachedDocumentIds.length > 0) {
        // 여러 첨부 문서에 대한 권한 부여 정보 전달
        for (let i = 0; i < attachedDocumentIds.length; i++) {
          personalDocuments.push({
            documentId: attachedDocumentIds[i],
            userEmails: allUsers
          });
        }
      }
      
      // Apps Script에서는 권한 부여 스킵
      permissionResult = {
        successCount: 0,
        failCount: 0,
        grantedUsers: [],
        failedUsers: [],
        message: '개인 문서는 프론트엔드에서 권한 부여가 필요합니다.'
      };
    }
    
    // 검토 라인과 결재 라인에 상태 추가
    const reviewLineWithStatus = req.reviewLine.map(step => ({
      ...step,
      status: '대기'
    }));
    
    const paymentLineWithStatus = req.paymentLine.map(step => ({
      ...step,
      status: '대기'
    }));
    
    // 스프레드시트에 워크플로우 정보 저장
    const rowData = [
      workflowId,                    // A: workflow_id
      workflowType,                  // B: workflow_type
      documentId || '',              // C: document_id
      documentTitle || '',           // D: document_title
      documentUrl || '',             // E: document_url
      workflowDocumentId || '',      // F: workflow_document_id
      workflowDocumentTitle || '',   // G: workflow_document_title
      workflowDocumentUrl || '',     // H: workflow_document_url
      attachedDocumentIds.length > 0 ? attachedDocumentIds.join(',') : '',  // I: attached_document_id (쉼표로 구분된 ID 목록)
      attachedDocumentTitles.length > 0 ? attachedDocumentTitles.join(', ') : '',  // J: attached_document_title (쉼표로 구분된 제목 목록)
      attachedDocumentUrls.length > 0 ? attachedDocumentUrls.join(', ') : '',  // K: attached_document_url (쉼표로 구분된 URL 목록)
      req.requesterEmail,            // L: requester_email
      req.requesterName || '',       // M: requester_name
      '검토중',                      // N: workflow_status
      timestamp,                     // O: workflow_request_date
      1,                             // P: current_review_step
      0,                             // Q: current_payment_step
      JSON.stringify(reviewLineWithStatus),  // R: review_line
      JSON.stringify(paymentLineWithStatus), // S: payment_line
      '',                            // T: workflow_complete_date
      timestamp,                     // U: created_at
      timestamp                      // V: updated_at
    ];
    
    documentsSheet.appendRow(rowData);
    console.log('📊 워크플로우 정보 스프레드시트 저장 완료');
    
    // 워크플로우 이력 기록 (요청)
    recordWorkflowHistory({
      workflowId: workflowId,
      documentId: documentId,
      documentTitle: documentTitle || workflowDocumentTitle,
      lineType: 'review',
      stepNumber: 1,
      actionType: '요청',
      actorEmail: req.requesterEmail,
      actorName: req.requesterName || '',
      actionDate: timestamp,
      opinion: '',
      previousStatus: '',
      newStatus: '검토중'
    });
    
    // 응답 데이터 구성
    const responseData = {
      workflowId: workflowId,
      createWorkflowDocument: createWorkflowDocument,
      attachDocument: attachDocument,
      workflowDocumentId: workflowDocumentId,
      workflowDocumentUrl: workflowDocumentUrl,
      documentId: documentId,
      documentUrl: documentUrl,
      attachedDocumentIds: attachedDocumentIds,  // 여러 첨부 문서 ID 목록
      attachedDocumentUrls: attachedDocumentUrls,  // 여러 첨부 문서 URL 목록
      attachedDocumentTitles: attachedDocumentTitles,  // 여러 첨부 문서 제목 목록
      attachedDocumentId: attachedDocumentId,  // 하위 호환성 (첫 번째 문서)
      attachedDocumentUrl: attachedDocumentUrl,  // 하위 호환성 (첫 번째 문서)
      attachedDocumentTitle: attachedDocumentTitle,  // 하위 호환성 (첫 번째 문서)
      workflowStatus: '검토중',
      workflowRequestDate: timestamp,
      reviewLine: reviewLineWithStatus,
      paymentLine: paymentLineWithStatus,
      permissionResult: permissionResult
    };
    
    // 개인 문서인 경우 프론트엔드 권한 부여 정보 추가
    if (requiresFrontendPermissionGrant && personalDocuments.length > 0) {
      responseData.requiresFrontendPermissionGrant = true;
      responseData.personalDocuments = personalDocuments;
    }
    
    const response = {
      success: true,
      message: '워크플로우 요청이 성공적으로 처리되었습니다.',
      data: responseData
    };
    
    console.log('📋 워크플로우 요청 완료:', workflowId);
    return response;
    
  } catch (error) {
    console.error('❌ 워크플로우 요청 오류:', error);
    return {
      success: false,
      message: '워크플로우 요청 처리 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 문서 권한 부여 (DocumentPermissions.gs의 grantWorkflowPermissions 사용)
 * @param {string} documentId - 문서 ID
 * @param {Array<string>} userEmails - 사용자 이메일 배열
 * @param {string} permissionType - 권한 타입 ('reader' | 'writer')
 * @returns {Object} 권한 부여 결과
 */
function grantDocumentPermissions(documentId, userEmails, permissionType) {
  // DocumentPermissions.gs의 grantWorkflowPermissions 함수 사용
  return grantWorkflowPermissions(documentId, userEmails, permissionType || 'reader');
}

/**
 * 워크플로우 이력 기록
 * @param {Object} historyData - 이력 데이터
 */
function recordWorkflowHistory(historyData) {
  try {
    const spreadsheet = getWorkflowSpreadsheet();
    const historySheet = spreadsheet.getSheetByName('workflow_history');
    
    if (!historySheet) {
      console.warn('⚠️ workflow_history 시트를 찾을 수 없습니다.');
      return;
    }
    
    const historyId = 'hist_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    
    const rowData = [
      historyId,                           // A: history_id
      historyData.workflowId || '',        // B: workflow_id
      historyData.documentId || '',        // C: document_id
      historyData.documentTitle || '',     // D: document_title
      historyData.lineType || 'review',    // E: line_type
      historyData.stepNumber || 1,         // F: step_number
      historyData.actionType || '요청',    // G: action_type
      historyData.actorEmail || '',        // H: actor_email
      historyData.actorName || '',         // I: actor_name
      historyData.actorPosition || '',      // J: actor_position
      historyData.actionDate || new Date().toISOString(), // K: action_date
      historyData.opinion || '',           // L: opinion
      historyData.rejectReason || '',      // M: reject_reason
      historyData.previousStatus || '',    // N: previous_status
      historyData.newStatus || '',         // O: new_status
      historyData.processingTime || ''     // P: processing_time
    ];
    
    historySheet.appendRow(rowData);
    console.log('📝 워크플로우 이력 기록 완료:', historyId);
    
  } catch (error) {
    console.error('❌ 워크플로우 이력 기록 오류:', error);
  }
}

/**
 * 서브 폴더 찾기
 * @param {Object} parentFolder - 부모 폴더
 * @param {string} folderName - 폴더 이름
 * @returns {Object} 폴더 객체 또는 null
 */
function getSubFolderByName(parentFolder, folderName) {
  try {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return null;
  } catch (error) {
    console.error('📁 서브 폴더 찾기 오류:', error);
    return null;
  }
}

