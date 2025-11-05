/**
 * DocumentWorkflowActions.gs
 * 워크플로우 액션 처리 함수들 (승인/반려/보류)
 * Hot Potato Document Workflow Management System
 */

// ===== 워크플로우 상태 조회 =====

/**
 * 워크플로우 상태 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 워크플로우 정보
 */
function getWorkflowStatus(req) {
  try {
    console.log('📋 워크플로우 상태 조회 시작:', req);
    
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    
    if (!documentsSheet) {
      throw new Error('workflow_documents 시트를 찾을 수 없습니다.');
    }
    
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 헤더 인덱스 찾기
    const workflowIdIdx = headers.indexOf('workflow_id');
    const documentIdIdx = headers.indexOf('document_id');
    const workflowDocumentIdIdx = headers.indexOf('workflow_document_id');
    
    let workflowRow = null;
    let rowIndex = -1;
    
    // workflowId로 검색
    if (req.workflowId) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][workflowIdIdx] === req.workflowId) {
          workflowRow = data[i];
          rowIndex = i;
          break;
        }
      }
    }
    // documentId로 검색
    else if (req.documentId) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][documentIdIdx] === req.documentId) {
          workflowRow = data[i];
          rowIndex = i;
          break;
        }
      }
    }
    // workflowDocumentId로 검색
    else if (req.workflowDocumentId) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][workflowDocumentIdIdx] === req.workflowDocumentId) {
          workflowRow = data[i];
          rowIndex = i;
          break;
        }
      }
    }
    
    if (!workflowRow) {
      return {
        success: false,
        message: '워크플로우를 찾을 수 없습니다.'
      };
    }
    
    // 데이터 매핑
    const workflowInfo = createWorkflowInfoFromRow(workflowRow, headers);
    
    return {
      success: true,
      message: '워크플로우 상태를 성공적으로 조회했습니다.',
      data: workflowInfo
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 상태 조회 오류:', error);
    return {
      success: false,
      message: '워크플로우 상태 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 내 담당 워크플로우 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 워크플로우 목록
 */
function getMyPendingWorkflows(req) {
  try {
    console.log('📋 내 담당 워크플로우 조회 시작:', req);
    
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    
    if (!documentsSheet) {
      throw new Error('workflow_documents 시트를 찾을 수 없습니다.');
    }
    
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    const userEmail = req.userEmail;
    const lineType = req.lineType; // 'review' | 'payment'
    const status = req.status; // 필터링할 상태
    
    const workflows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const reviewLine = JSON.parse(row[headers.indexOf('review_line')] || '[]');
      const paymentLine = JSON.parse(row[headers.indexOf('payment_line')] || '[]');
      const workflowStatus = row[headers.indexOf('workflow_status')];
      
      // 상태 필터링 (검토중, 결재중, 검토보류, 결재보류만 허용 - 완료/반려는 제외)
      // 반려된 워크플로우는 요청자에게만 표시되므로 여기서는 제외
      if (status) {
        // 특정 상태로 필터링
        if (workflowStatus !== status) {
          continue;
        }
      } else {
        // 상태 필터가 없으면 완료/반려 상태는 제외 (반려는 "내가 올린 결재"에서만 표시)
        if (workflowStatus === '결재완료' || 
            workflowStatus === '검토반려' || 
            workflowStatus === '전체반려') {
          continue;
        }
      }
      
      // 반려된 단계를 가진 사용자는 제외
      // 검토 라인에서 현재 사용자가 대기 중이거나 보류 상태인지 확인 (반려 상태는 제외)
      if (!lineType || lineType === 'review') {
        // 먼저 반려된 단계가 있는지 확인 (어떤 단계든 반려가 있으면 제외)
        const hasRejectedStep = reviewLine.some(step => step.status === '반려') ||
                                 paymentLine.some(step => step.status === '반려') ||
                                 workflowStatus === '검토반려' ||
                                 workflowStatus === '전체반려';
        if (hasRejectedStep) {
          continue; // 반려된 워크플로우는 "내가 결재해야 하는 것"에 표시하지 않음
        }
        
        const reviewStep = reviewLine.find(step => 
          step.email === userEmail && 
          (step.status === '대기' || step.status === '보류')
        );
        if (reviewStep) {
          // 이전 검토 단계들이 모두 완료되었는지 확인
          // 1단계이거나, 이전 단계들이 모두 승인된 경우에만 처리 가능
          let canProcess = false;
          if (reviewStep.step === 1) {
            canProcess = true;
          } else {
            // 보류 상태인 경우에도 표시 (재개 가능)
            if (reviewStep.status === '보류') {
              canProcess = true;
            } else {
              // 이전 단계들이 모두 승인되어야 함 (대기, 반려면 진행 불가)
              const previousSteps = reviewLine.filter(s => s.step < reviewStep.step);
              canProcess = previousSteps.length > 0 && previousSteps.every(s => s.status === '승인');
            }
          }
          
          if (canProcess) {
            workflows.push(createWorkflowInfoFromRow(row, headers));
            continue;
          }
        }
      }
      
      // 결재 라인에서 현재 사용자가 대기 중인지 확인
      if (!lineType || lineType === 'payment') {
        // 먼저 반려된 단계가 있는지 확인 (어떤 단계든 반려가 있으면 제외)
        const hasRejectedStep = paymentLine.some(step => step.status === '반려') || 
                                 reviewLine.some(step => step.status === '반려') ||
                                 workflowStatus === '검토반려' ||
                                 workflowStatus === '전체반려';
        if (hasRejectedStep) {
          continue; // 반려된 워크플로우는 "내가 결재해야 하는 것"에 표시하지 않음
        }
        
        // 검토 라인이 모두 완료되었는지 확인
        const allReviewCompleted = reviewLine.length === 0 || reviewLine.every(step => step.status === '승인');
        
        if (allReviewCompleted) {
          const paymentStep = paymentLine.find(step => 
            step.email === userEmail && 
            (step.status === '대기' || step.status === '보류')
          );
          if (paymentStep) {
            // 이전 결재 단계들이 모두 완료되었는지 확인
            // 1단계이거나, 이전 단계들이 모두 승인된 경우에만 처리 가능
            let canProcess = false;
            if (paymentStep.step === 1) {
              canProcess = true;
            } else {
              // 보류 상태인 경우에도 표시 (재개 가능)
              if (paymentStep.status === '보류') {
                canProcess = true;
              } else {
                // 이전 단계들이 모두 승인되어야 함 (대기, 반려면 진행 불가)
                const previousSteps = paymentLine.filter(s => s.step < paymentStep.step);
                canProcess = previousSteps.length > 0 && previousSteps.every(s => s.status === '승인');
              }
            }
            
            if (canProcess) {
              workflows.push(createWorkflowInfoFromRow(row, headers));
            }
          }
        }
      }
    }
    
    return {
      success: true,
      message: '내 담당 워크플로우를 성공적으로 조회했습니다.',
      data: workflows
    };
    
  } catch (error) {
    console.error('❌ 내 담당 워크플로우 조회 오류:', error);
    return {
      success: false,
      message: '내 담당 워크플로우 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 내가 올린 결재 목록 조회
 * 요청자이거나 검토/결재에 참여한 사용자 모두 포함 (완료 전까지)
 * @param {Object} req - 요청 데이터
 * @returns {Object} 워크플로우 목록
 */
function getMyRequestedWorkflows(req) {
  try {
    console.log('📋 내가 올린 결재 목록 조회 시작:', req);
    
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    
    if (!documentsSheet) {
      throw new Error('workflow_documents 시트를 찾을 수 없습니다.');
    }
    
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    const userEmail = req.userEmail;
    const workflows = [];
    
    console.log('📋 전체 워크플로우 행 수:', data.length - 1);
    
    // 완료된 상태 목록 (결재완료는 참여자에게는 완료로 간주)
    const completedStatuses = ['결재완료'];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const requesterEmail = row[headers.indexOf('requester_email')];
      const workflowStatus = row[headers.indexOf('workflow_status')];
      const workflowId = row[headers.indexOf('workflow_id')];
      
      // 요청자인 경우 항상 포함 (완료 후에도 포함)
      let shouldInclude = (requesterEmail === userEmail);
      
      // 요청자가 아닌 경우
      if (!shouldInclude) {
        const reviewLine = JSON.parse(row[headers.indexOf('review_line')] || '[]');
        const paymentLine = JSON.parse(row[headers.indexOf('payment_line')] || '[]');
        
        // 검토 라인에서 현재 사용자가 참여했는지 확인
        const userInReviewLine = reviewLine.some(step => step.email === userEmail);
        
        // 결재 라인에서 현재 사용자가 참여했는지 확인
        const userInPaymentLine = paymentLine.some(step => step.email === userEmail);
        
        // 참여한 워크플로우인 경우
        if (userInReviewLine || userInPaymentLine) {
          // 완료 전까지는 포함 (결재완료 제외, 반려는 포함)
          if (!completedStatuses.includes(workflowStatus)) {
            shouldInclude = true;
          }
        }
      }
      
      if (shouldInclude) {
        const workflowInfo = createWorkflowInfoFromRow(row, headers);
        workflows.push(workflowInfo);
        console.log(`✅ 워크플로우 포함: ${workflowId}, 상태=${workflowStatus}, 요청자=${requesterEmail === userEmail}, 참여자=${shouldInclude && requesterEmail !== userEmail}`);
      }
    }
    
    console.log('📋 최종 반환 워크플로우 수:', workflows.length);
    console.log('📋 워크플로우 상태 분포:', workflows.map(w => w.workflowStatus));
    
    return {
      success: true,
      message: '내가 올린 결재 목록을 성공적으로 조회했습니다.',
      data: workflows
    };
    
  } catch (error) {
    console.error('❌ 내가 올린 결재 목록 조회 오류:', error);
    return {
      success: false,
      message: '내가 올린 결재 목록 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 결재 완료된 리스트 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 워크플로우 목록
 */
function getCompletedWorkflows(req) {
  try {
    console.log('📋 결재 완료된 리스트 조회 시작:', req);
    
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    const historySheet = spreadsheet.getSheetByName('workflow_history');
    
    if (!documentsSheet || !historySheet) {
      throw new Error('워크플로우 시트를 찾을 수 없습니다.');
    }
    
    const userEmail = req.userEmail;
    const startDate = req.startDate;
    const endDate = req.endDate;
    
    // 이력에서 해당 사용자가 승인/반려한 워크플로우 ID 찾기
    const historyData = historySheet.getDataRange().getValues();
    const historyHeaders = historyData[0];
    const completedWorkflowIds = new Set();
    
    for (let i = 1; i < historyData.length; i++) {
      const row = historyData[i];
      const actorEmail = row[historyHeaders.indexOf('actor_email')];
      const workflowId = row[historyHeaders.indexOf('workflow_id')];
      const actionType = row[historyHeaders.indexOf('action_type')];
      const actionDate = row[historyHeaders.indexOf('action_date')];
      
      if (actorEmail === userEmail && (actionType === '승인' || actionType === '반려')) {
        // 날짜 필터링
        if (startDate && actionDate < startDate) continue;
        if (endDate && actionDate > endDate) continue;
        
        completedWorkflowIds.add(workflowId);
      }
    }
    
    // 워크플로우 정보 조회 (완료된 워크플로우만 포함)
    const documentsData = documentsSheet.getDataRange().getValues();
    const documentsHeaders = documentsData[0];
    const workflows = [];
    
    for (let i = 1; i < documentsData.length; i++) {
      const row = documentsData[i];
      const workflowId = row[documentsHeaders.indexOf('workflow_id')];
      const workflowStatus = row[documentsHeaders.indexOf('workflow_status')];
      
      // 완료된 워크플로우만 포함 (결재완료, 검토반려, 전체반려)
      // 그리고 사용자가 승인/반려한 이력이 있는 워크플로우만 포함
      if (completedWorkflowIds.has(workflowId) && 
          (workflowStatus === '결재완료' || workflowStatus === '검토반려' || workflowStatus === '전체반려')) {
        workflows.push(createWorkflowInfoFromRow(row, documentsHeaders));
      }
    }
    
    return {
      success: true,
      message: '결재 완료된 리스트를 성공적으로 조회했습니다.',
      data: workflows
    };
    
  } catch (error) {
    console.error('❌ 결재 완료된 리스트 조회 오류:', error);
    return {
      success: false,
      message: '결재 완료된 리스트 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 워크플로우 정보 객체 생성 (헬퍼 함수)
 * @param {Array} row - 행 데이터
 * @param {Array} headers - 헤더 배열
 * @returns {Object} 워크플로우 정보
 */
function createWorkflowInfoFromRow(row, headers) {
  // 첨부 문서 ID 목록 파싱 (쉼표로 구분된 문자열)
  const attachedDocIdsStr = row[headers.indexOf('attached_document_id')] || '';
  const attachedDocumentIds = attachedDocIdsStr ? attachedDocIdsStr.split(',').map(id => id.trim()).filter(id => id) : [];
  
  // 첨부 문서 URL 목록 파싱 (쉼표로 구분된 문자열)
  const attachedDocUrlsStr = row[headers.indexOf('attached_document_url')] || '';
  const attachedDocumentUrls = attachedDocUrlsStr ? attachedDocUrlsStr.split(',').map(url => url.trim()).filter(url => url) : [];
  
  // 첨부 문서 제목 목록 파싱 (쉼표로 구분된 문자열)
  const attachedDocTitlesStr = row[headers.indexOf('attached_document_title')] || '';
  const attachedDocumentTitles = attachedDocTitlesStr ? attachedDocTitlesStr.split(',').map(title => title.trim()).filter(title => title) : [];
  
  // 하위 호환성: 첫 번째 첨부 문서 정보
  const attachedDocumentId = attachedDocumentIds.length > 0 ? attachedDocumentIds[0] : undefined;
  const attachedDocumentUrl = attachedDocumentUrls.length > 0 ? attachedDocumentUrls[0] : undefined;
  const attachedDocumentTitle = attachedDocumentTitles.length > 0 ? attachedDocumentTitles[0] : undefined;
  
  return {
    workflowId: row[headers.indexOf('workflow_id')],
    workflowType: row[headers.indexOf('workflow_type')],
    documentId: row[headers.indexOf('document_id')] || undefined,
    documentTitle: row[headers.indexOf('document_title')] || undefined,
    documentUrl: row[headers.indexOf('document_url')] || undefined,
    workflowDocumentId: row[headers.indexOf('workflow_document_id')] || undefined,
    workflowDocumentTitle: row[headers.indexOf('workflow_document_title')] || undefined,
    workflowDocumentUrl: row[headers.indexOf('workflow_document_url')] || undefined,
    attachedDocumentIds: attachedDocumentIds.length > 0 ? attachedDocumentIds : undefined,  // 여러 첨부 문서 ID 목록
    attachedDocumentUrls: attachedDocumentUrls.length > 0 ? attachedDocumentUrls : undefined,  // 여러 첨부 문서 URL 목록
    attachedDocumentTitles: attachedDocumentTitles.length > 0 ? attachedDocumentTitles : undefined,  // 여러 첨부 문서 제목 목록
    attachedDocumentId: attachedDocumentId,  // 하위 호환성 (첫 번째 문서)
    attachedDocumentTitle: attachedDocumentTitle,  // 하위 호환성 (첫 번째 문서)
    attachedDocumentUrl: attachedDocumentUrl,  // 하위 호환성 (첫 번째 문서)
    requesterEmail: row[headers.indexOf('requester_email')],
    requesterName: row[headers.indexOf('requester_name')] || '',
    workflowStatus: row[headers.indexOf('workflow_status')],
    workflowRequestDate: row[headers.indexOf('workflow_request_date')],
    currentReviewStep: row[headers.indexOf('current_review_step')] || undefined,
    currentPaymentStep: row[headers.indexOf('current_payment_step')] || undefined,
    reviewLine: JSON.parse(row[headers.indexOf('review_line')] || '[]'),
    paymentLine: JSON.parse(row[headers.indexOf('payment_line')] || '[]'),
    workflowCompleteDate: row[headers.indexOf('workflow_complete_date')] || undefined
  };
}

// ===== 검토 단계 액션 처리 =====

/**
 * 검토 단계 승인
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function approveReview(req) {
  return processReviewAction(req, 'approve');
}

/**
 * 검토 단계 반려
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function rejectReview(req) {
  return processReviewAction(req, 'reject');
}

/**
 * 검토 단계 보류
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function holdReview(req) {
  return processReviewAction(req, 'hold');
}

/**
 * 검토 액션 처리 (공통 함수)
 * @param {Object} req - 요청 데이터
 * @param {string} action - 액션 타입 ('approve' | 'reject' | 'hold')
 * @returns {Object} 처리 결과
 */
function processReviewAction(req, action) {
  try {
    console.log(`📋 검토 액션 처리 시작 [${action}]:`, req);
    
    // 워크플로우 찾기
    const workflowResult = getWorkflowStatus(req);
    if (!workflowResult.success || !workflowResult.data) {
      return {
        success: false,
        message: workflowResult.message || '워크플로우를 찾을 수 없습니다.'
      };
    }
    
    const workflow = workflowResult.data;
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 워크플로우 행 찾기
    const workflowIdIdx = headers.indexOf('workflow_id');
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][workflowIdIdx] === workflow.workflowId) {
        rowIndex = i + 1; // 1-based index for setValues
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: '워크플로우 행을 찾을 수 없습니다.'
      };
    }
    
    const reviewLine = workflow.reviewLine;
    const currentStep = workflow.currentReviewStep || 1;
    const userEmail = req.userEmail;
    const step = req.step || currentStep;
    const requesterEmail = workflow.requesterEmail;
    
    // 현재 단계 확인
    const currentStepData = reviewLine.find(s => s.step === step);
    if (!currentStepData) {
      return {
        success: false,
        message: '해당 단계를 찾을 수 없습니다.'
      };
    }
    
    // 권한 확인: 해당 단계 담당자이거나, 보류 상태에서 요청자가 재개하는 경우 허용
    const isAssignee = currentStepData.email === userEmail;
    const isRequesterResuming = currentStepData.status === '보류' && 
                                action === 'approve' && 
                                requesterEmail === userEmail;
    
    if (!isAssignee && !isRequesterResuming) {
      return {
        success: false,
        message: '해당 단계를 처리할 권한이 없습니다.'
      };
    }
    
    // 보류 상태에서 재개(승인)하는 경우 허용
    const canProcess = currentStepData.status === '대기' || 
                      (currentStepData.status === '보류' && action === 'approve');
    
    if (!canProcess) {
      return {
        success: false,
        message: '이미 처리된 단계입니다. (보류 상태에서는 승인만 가능합니다)'
      };
    }
    
    // 이전 검토 단계들이 모두 완료되었는지 확인
    for (let i = 1; i < step; i++) {
      const prevStep = reviewLine.find(s => s.step === i);
      if (prevStep) {
        if (prevStep.status === '대기') {
          return {
            success: false,
            message: `이전 검토 단계(${i}단계)가 아직 진행 중입니다. 이전 단계가 완료될 때까지 대기해주세요.`
          };
        } else if (prevStep.status === '보류') {
          return {
            success: false,
            message: `이전 검토 단계(${i}단계)가 보류 상태입니다. 이전 단계가 완료될 때까지 대기해주세요.`
          };
        } else if (prevStep.status !== '승인') {
          return {
            success: false,
            message: `이전 검토 단계(${i}단계)가 아직 완료되지 않았습니다. 이전 단계를 먼저 완료해주세요.`
          };
        }
      }
    }
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 액션에 따른 상태 업데이트
    let newStatus = '대기';
    let workflowStatus = workflow.workflowStatus;
    let nextReviewStep = currentStep;
    let actionType = '';
    
    if (action === 'approve') {
      const wasHeld = currentStepData.status === '보류';
      newStatus = '승인';
      actionType = wasHeld ? '재개' : '승인';
      currentStepData.status = '승인';
      currentStepData.date = timestamp;
      currentStepData.opinion = req.opinion || '';
      // 보류에서 재개하는 경우, 이전 보류 사유는 유지
      
      // 보류 상태였던 워크플로우를 정상 상태로 복구
      if (workflow.workflowStatus === '검토보류') {
        workflowStatus = '검토중';
      }
      
      // 다음 검토 단계 확인
      const nextStep = reviewLine.find(s => s.step === step + 1);
      if (nextStep) {
        nextReviewStep = step + 1;
        workflowStatus = '검토중';
      } else {
        // 검토 라인 완료 -> 결재 라인으로 이동
        workflowStatus = '결재중';
        nextReviewStep = 0;
        const paymentStepIdx = headers.indexOf('current_payment_step');
        documentsSheet.getRange(rowIndex, paymentStepIdx + 1).setValue(1);
      }
    } else if (action === 'reject') {
      if (!req.rejectReason) {
        return {
          success: false,
          message: '반려 사유가 필요합니다.'
        };
      }
      newStatus = '반려';
      actionType = '반려';
      workflowStatus = '검토반려';
      currentStepData.status = '반려';
      currentStepData.date = timestamp;
      currentStepData.reason = req.rejectReason || '';
      currentStepData.opinion = req.opinion || '';
      
      // 반려 시 이후 단계들을 '-' 상태로 표기
      reviewLine.forEach(reviewStep => {
        if (reviewStep.step > step) {
          reviewStep.status = '-';
          reviewStep.date = '';
          reviewStep.reason = '';
          reviewStep.opinion = '';
        }
      });
      
      // 결재 라인의 모든 단계를 '-' 상태로 표기
      paymentLine.forEach(paymentStep => {
        paymentStep.status = '-';
        paymentStep.date = '';
        paymentStep.reason = '';
        paymentStep.opinion = '';
      });
      
      // 요청자를 결재 라인 맨 앞에 추가 (요청자가 수정 후 재제출하도록)
      const requesterEmail = workflow.requesterEmail;
      const requesterName = workflow.requesterName || '';
      
      // 이미 요청자가 결재 라인에 있는지 확인
      const requesterExists = paymentLine.some(p => p.email === requesterEmail);
      if (!requesterExists) {
        // 요청자를 맨 앞에 추가 (step은 나중에 정렬)
        paymentLine.unshift({
          step: 0, // 임시 값, 나중에 정렬
          email: requesterEmail,
          name: requesterName,
          status: '대기',
          date: '',
          reason: '',
          opinion: ''
        });
        // step 재정렬
        paymentLine.forEach((p, index) => {
          p.step = index + 1;
        });
      }
      
      // 반려 시 단계 초기화 (요청자에게 돌아감을 의미)
      nextReviewStep = 0;
    } else if (action === 'hold') {
      newStatus = '보류';
      actionType = '보류';
      workflowStatus = '검토보류';
      currentStepData.status = '보류';
      currentStepData.date = timestamp;
      currentStepData.reason = req.holdReason || '';
      currentStepData.opinion = req.opinion || '';
    }
    
    // 스프레드시트 업데이트
    const reviewLineIdx = headers.indexOf('review_line');
    const workflowStatusIdx = headers.indexOf('workflow_status');
    const currentReviewStepIdx = headers.indexOf('current_review_step');
    const updatedAtIdx = headers.indexOf('updated_at');
    
    documentsSheet.getRange(rowIndex, reviewLineIdx + 1).setValue(JSON.stringify(reviewLine));
    documentsSheet.getRange(rowIndex, workflowStatusIdx + 1).setValue(workflowStatus);
    documentsSheet.getRange(rowIndex, currentReviewStepIdx + 1).setValue(nextReviewStep);
    documentsSheet.getRange(rowIndex, updatedAtIdx + 1).setValue(timestamp);
    
    // 완료일 설정 (반려 시)
    if (action === 'reject') {
      const completeDateIdx = headers.indexOf('workflow_complete_date');
      documentsSheet.getRange(rowIndex, completeDateIdx + 1).setValue(timestamp);
    }
    
    // 이력 기록
    recordWorkflowHistory({
      workflowId: workflow.workflowId,
      documentId: workflow.documentId,
      documentTitle: workflow.documentTitle || workflow.workflowDocumentTitle,
      lineType: 'review',
      stepNumber: step,
      actionType: actionType,
      actorEmail: userEmail,
      actorName: req.userName || '',
      actionDate: timestamp,
      opinion: req.opinion || '',
      rejectReason: req.rejectReason || '',
      holdReason: req.holdReason || '',
      previousStatus: workflow.workflowStatus,
      newStatus: workflowStatus
    });
    
    // 업데이트된 워크플로우 정보 조회
    const updatedWorkflow = getWorkflowStatus({ workflowId: workflow.workflowId });
    
    return {
      success: true,
      message: `검토 ${actionType} 처리가 완료되었습니다.`,
      data: updatedWorkflow.data
    };
    
  } catch (error) {
    console.error(`❌ 검토 액션 처리 오류 [${action}]:`, error);
    return {
      success: false,
      message: `검토 ${action} 처리 중 오류가 발생했습니다: ` + error.message
    };
  }
}

// ===== 결재 단계 액션 처리 =====

/**
 * 결재 단계 승인
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function approvePayment(req) {
  return processPaymentAction(req, 'approve');
}

/**
 * 결재 단계 반려
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function rejectPayment(req) {
  return processPaymentAction(req, 'reject');
}

/**
 * 결재 단계 보류
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function holdPayment(req) {
  return processPaymentAction(req, 'hold');
}

/**
 * 결재 액션 처리 (공통 함수)
 * @param {Object} req - 요청 데이터
 * @param {string} action - 액션 타입 ('approve' | 'reject' | 'hold')
 * @returns {Object} 처리 결과
 */
function processPaymentAction(req, action) {
  try {
    console.log(`💰 결재 액션 처리 시작 [${action}]:`, req);
    
    // 워크플로우 찾기
    const workflowResult = getWorkflowStatus(req);
    if (!workflowResult.success || !workflowResult.data) {
      return {
        success: false,
        message: workflowResult.message || '워크플로우를 찾을 수 없습니다.'
      };
    }
    
    const workflow = workflowResult.data;
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 워크플로우 행 찾기
    const workflowIdIdx = headers.indexOf('workflow_id');
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][workflowIdIdx] === workflow.workflowId) {
        rowIndex = i + 1; // 1-based index for setValues
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: '워크플로우 행을 찾을 수 없습니다.'
      };
    }
    
    const paymentLine = workflow.paymentLine;
    const currentStep = workflow.currentPaymentStep || 1;
    const userEmail = req.userEmail;
    const step = req.step || currentStep;
    const requesterEmail = workflow.requesterEmail;
    
    // 현재 단계 확인
    const currentStepData = paymentLine.find(s => s.step === step);
    if (!currentStepData) {
      return {
        success: false,
        message: '해당 단계를 찾을 수 없습니다.'
      };
    }
    
    // 권한 확인: 해당 단계 담당자이거나, 보류 상태에서 요청자가 재개하는 경우 허용
    const isAssignee = currentStepData.email === userEmail;
    const isRequesterResuming = currentStepData.status === '보류' && 
                                action === 'approve' && 
                                requesterEmail === userEmail;
    
    if (!isAssignee && !isRequesterResuming) {
      return {
        success: false,
        message: '해당 단계를 처리할 권한이 없습니다.'
      };
    }
    
    // 보류 상태에서 재개(승인)하는 경우 허용
    const canProcess = currentStepData.status === '대기' || 
                      (currentStepData.status === '보류' && action === 'approve');
    
    if (!canProcess) {
      return {
        success: false,
        message: '이미 처리된 단계입니다. (보류 상태에서는 승인만 가능합니다)'
      };
    }
    
    // 검토 라인이 모두 완료되었는지 확인
    const reviewLine = workflow.reviewLine || [];
    const allReviewCompleted = reviewLine.length === 0 || reviewLine.every(step => step.status === '승인');
    if (!allReviewCompleted) {
      const pendingReviewSteps = reviewLine.filter(step => step.status !== '승인').map(s => s.step).join(', ');
      return {
        success: false,
        message: `검토 단계가 아직 완료되지 않았습니다. (미완료: ${pendingReviewSteps}단계)`
      };
    }
    
    // 이전 결재 단계들이 모두 완료되었는지 확인
    for (let i = 1; i < step; i++) {
      const prevStep = paymentLine.find(s => s.step === i);
      if (prevStep) {
        if (prevStep.status === '대기') {
          return {
            success: false,
            message: `이전 결재 단계(${i}단계)가 아직 진행 중입니다. 이전 단계가 완료될 때까지 대기해주세요.`
          };
        } else if (prevStep.status === '보류') {
          return {
            success: false,
            message: `이전 결재 단계(${i}단계)가 보류 상태입니다. 이전 단계가 완료될 때까지 대기해주세요.`
          };
        } else if (prevStep.status !== '승인') {
          return {
            success: false,
            message: `이전 결재 단계(${i}단계)가 아직 완료되지 않았습니다. 이전 단계를 먼저 완료해주세요.`
          };
        }
      }
    }
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 액션에 따른 상태 업데이트
    let newStatus = '대기';
    let workflowStatus = workflow.workflowStatus;
    let nextPaymentStep = currentStep;
    let actionType = '';
    
    if (action === 'approve') {
      const wasHeld = currentStepData.status === '보류';
      newStatus = '승인';
      actionType = wasHeld ? '재개' : '승인';
      currentStepData.status = '승인';
      currentStepData.date = timestamp;
      currentStepData.opinion = req.opinion || '';
      // 보류에서 재개하는 경우, 이전 보류 사유는 유지
      
      // 보류 상태였던 워크플로우를 정상 상태로 복구
      if (workflow.workflowStatus === '결재보류') {
        workflowStatus = '결재중';
      }
      
      // 다음 결재 단계 확인
      const nextStep = paymentLine.find(s => s.step === step + 1);
      if (nextStep) {
        nextPaymentStep = step + 1;
        workflowStatus = '결재중';
      } else {
        // 결재 라인 완료
        workflowStatus = '결재완료';
        nextPaymentStep = 0;
        const completeDateIdx = headers.indexOf('workflow_complete_date');
        documentsSheet.getRange(rowIndex, completeDateIdx + 1).setValue(timestamp);
      }
    } else if (action === 'reject') {
      if (!req.rejectReason) {
        return {
          success: false,
          message: '반려 사유가 필요합니다.'
        };
      }
      newStatus = '반려';
      actionType = '반려';
      workflowStatus = '전체반려';
      currentStepData.status = '반려';
      currentStepData.date = timestamp;
      currentStepData.reason = req.rejectReason || '';
      currentStepData.opinion = req.opinion || '';
      
      // 반려 시 이후 결재 단계들을 '-' 상태로 표기
      paymentLine.forEach(paymentStep => {
        if (paymentStep.step > step) {
          paymentStep.status = '-';
          paymentStep.date = '';
          paymentStep.reason = '';
          paymentStep.opinion = '';
        }
      });
      
      // 요청자를 결재 라인 맨 앞에 추가 (요청자가 수정 후 재제출하도록)
      const requesterEmail = workflow.requesterEmail;
      const requesterName = workflow.requesterName || '';
      
      // 이미 요청자가 결재 라인에 있는지 확인
      const requesterExists = paymentLine.some(p => p.email === requesterEmail);
      if (!requesterExists) {
        // 요청자를 맨 앞에 추가 (step은 나중에 정렬)
        paymentLine.unshift({
          step: 0, // 임시 값, 나중에 정렬
          email: requesterEmail,
          name: requesterName,
          status: '대기',
          date: '',
          reason: '',
          opinion: ''
        });
        // step 재정렬
        paymentLine.forEach((p, index) => {
          p.step = index + 1;
        });
      } else {
        // 요청자가 이미 있으면 맨 앞으로 이동
        const requesterIndex = paymentLine.findIndex(p => p.email === requesterEmail);
        if (requesterIndex > 0) {
          const requesterStep = paymentLine.splice(requesterIndex, 1)[0];
          paymentLine.unshift(requesterStep);
          // step 재정렬
          paymentLine.forEach((p, index) => {
            p.step = index + 1;
          });
        }
      }
      
      // 반려 시 단계 초기화 (요청자에게 돌아감을 의미)
      nextPaymentStep = 0;
      // 결재 반려 시 검토 단계도 초기화 (요청자에게 돌아감)
      const currentReviewStepIdx = headers.indexOf('current_review_step');
      documentsSheet.getRange(rowIndex, currentReviewStepIdx + 1).setValue(0);
      
      const completeDateIdx = headers.indexOf('workflow_complete_date');
      documentsSheet.getRange(rowIndex, completeDateIdx + 1).setValue(timestamp);
    } else if (action === 'hold') {
      newStatus = '보류';
      actionType = '보류';
      workflowStatus = '결재보류';
      currentStepData.status = '보류';
      currentStepData.date = timestamp;
      currentStepData.reason = req.holdReason || '';
      currentStepData.opinion = req.opinion || '';
    }
    
    // 스프레드시트 업데이트
    const paymentLineIdx = headers.indexOf('payment_line');
    const workflowStatusIdx = headers.indexOf('workflow_status');
    const currentPaymentStepIdx = headers.indexOf('current_payment_step');
    const updatedAtIdx = headers.indexOf('updated_at');
    
    documentsSheet.getRange(rowIndex, paymentLineIdx + 1).setValue(JSON.stringify(paymentLine));
    documentsSheet.getRange(rowIndex, workflowStatusIdx + 1).setValue(workflowStatus);
    documentsSheet.getRange(rowIndex, currentPaymentStepIdx + 1).setValue(nextPaymentStep);
    documentsSheet.getRange(rowIndex, updatedAtIdx + 1).setValue(timestamp);
    
    // 이력 기록
    recordWorkflowHistory({
      workflowId: workflow.workflowId,
      documentId: workflow.documentId,
      documentTitle: workflow.documentTitle || workflow.workflowDocumentTitle,
      lineType: 'payment',
      stepNumber: step,
      actionType: actionType,
      actorEmail: userEmail,
      actorName: req.userName || '',
      actionDate: timestamp,
      opinion: req.opinion || '',
      rejectReason: req.rejectReason || '',
      holdReason: req.holdReason || '',
      previousStatus: workflow.workflowStatus,
      newStatus: workflowStatus
    });
    
    // 업데이트된 워크플로우 정보 조회
    const updatedWorkflow = getWorkflowStatus({ workflowId: workflow.workflowId });
    
    return {
      success: true,
      message: `결재 ${actionType} 처리가 완료되었습니다.`,
      data: updatedWorkflow.data
    };
    
  } catch (error) {
    console.error(`❌ 결재 액션 처리 오류 [${action}]:`, error);
    return {
      success: false,
      message: `결재 ${action} 처리 중 오류가 발생했습니다: ` + error.message
    };
  }
}

/**
 * 반려된 워크플로우 재제출
 * @param {Object} req - 요청 데이터
 * @returns {Object} 처리 결과
 */
function resubmitWorkflow(req) {
  try {
    console.log('🔄 워크플로우 재제출 시작:', req);
    
    // 필수 필드 검증
    if (!req.workflowId) {
      return {
        success: false,
        message: '워크플로우 ID가 필요합니다.'
      };
    }
    
    if (!req.userEmail) {
      return {
        success: false,
        message: '사용자 이메일이 필요합니다.'
      };
    }
    
    // 워크플로우 찾기
    const workflowResult = getWorkflowStatus({ workflowId: req.workflowId });
    if (!workflowResult.success || !workflowResult.data) {
      return {
        success: false,
        message: workflowResult.message || '워크플로우를 찾을 수 없습니다.'
      };
    }
    
    const workflow = workflowResult.data;
    
    // 권한 확인: 요청자만 재제출 가능
    if (workflow.requesterEmail !== req.userEmail) {
      return {
        success: false,
        message: '요청자만 워크플로우를 재제출할 수 있습니다.'
      };
    }
    
    // 반려 상태 확인
    if (workflow.workflowStatus !== '검토반려' && workflow.workflowStatus !== '전체반려') {
      return {
        success: false,
        message: '반려된 워크플로우만 재제출할 수 있습니다.'
      };
    }
    
    const spreadsheet = getWorkflowSpreadsheet();
    const documentsSheet = spreadsheet.getSheetByName('workflow_documents');
    const data = documentsSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 워크플로우 행 찾기
    const workflowIdIdx = headers.indexOf('workflow_id');
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][workflowIdIdx] === workflow.workflowId) {
        rowIndex = i + 1; // 1-based index for setValues
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: '워크플로우 데이터를 찾을 수 없습니다.'
      };
    }
    
    // 검토/결재 라인 파싱 (이미 배열일 수도 있음)
    let reviewLine = [];
    let paymentLine = [];
    
    if (typeof workflow.reviewLine === 'string') {
      reviewLine = JSON.parse(workflow.reviewLine || '[]');
    } else if (Array.isArray(workflow.reviewLine)) {
      reviewLine = workflow.reviewLine;
    }
    
    if (typeof workflow.paymentLine === 'string') {
      paymentLine = JSON.parse(workflow.paymentLine || '[]');
    } else if (Array.isArray(workflow.paymentLine)) {
      paymentLine = workflow.paymentLine;
    }
    
    // 현재 시간
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 결재 라인 처리: 요청자를 맨 앞에 두고 새로 구성한 결재 라인을 붙임
    const requesterEmail = workflow.requesterEmail;
    const requesterName = workflow.requesterName || '';
    
    // 새로운 검토 라인이 제공된 경우
    let reviewLineData = null;
    if (req.reviewLine) {
      if (typeof req.reviewLine === 'string') {
        try {
          reviewLineData = JSON.parse(req.reviewLine);
        } catch (e) {
          console.error('❌ 검토 라인 파싱 오류:', e);
          reviewLineData = null;
        }
      } else if (Array.isArray(req.reviewLine)) {
        reviewLineData = req.reviewLine;
      }
    }
    
    // 새로운 결재 라인이 제공된 경우
    let paymentLineData = null;
    if (req.paymentLine) {
      if (typeof req.paymentLine === 'string') {
        try {
          paymentLineData = JSON.parse(req.paymentLine);
        } catch (e) {
          console.error('❌ 결재 라인 파싱 오류:', e);
          paymentLineData = null;
        }
      } else if (Array.isArray(req.paymentLine)) {
        paymentLineData = req.paymentLine;
      }
    }
    
    // 검토 라인 재구성
    if (reviewLineData && Array.isArray(reviewLineData) && reviewLineData.length > 0) {
      reviewLine = reviewLineData.map((step, idx) => ({
        step: idx + 1,
        email: step.email || '',
        name: step.name || '',
        status: '대기',
        date: '',
        reason: '',
        opinion: ''
      }));
    } else {
      // 검토 라인이 제공되지 않은 경우, 기존 라인 초기화
      reviewLine = reviewLine.filter(r => r.status !== '-'); // '-' 상태 제거
      reviewLine.forEach(step => {
        step.status = '대기';
        step.date = '';
      });
      // step 재정렬
      reviewLine.forEach((r, idx) => { r.step = idx + 1; });
    }
    
    // 결재 라인 재구성: 요청자를 맨 앞에 두고 새로 구성한 결재 라인을 붙임
    if (paymentLineData && Array.isArray(paymentLineData) && paymentLineData.length > 0) {
      // 요청자를 맨 앞에 두고, 새로 구성한 결재 라인을 붙임
      paymentLine = [
        {
          step: 1,
          email: requesterEmail,
          name: requesterName,
          status: '대기',
          date: '',
          reason: '',
          opinion: ''
        },
        ...paymentLineData.map((step, idx) => ({
          step: idx + 2, // 요청자 뒤부터 시작
          email: step.email || '',
          name: step.name || '',
          status: '대기',
          date: '',
          reason: '',
          opinion: ''
        }))
      ];
    } else {
      // 결재 라인이 제공되지 않은 경우, 요청자를 맨 앞에 두고 기존 라인 초기화
      paymentLine = paymentLine.filter(p => p.status !== '-'); // '-' 상태 제거
      
      // 요청자가 이미 있는지 확인
      const requesterIndex = paymentLine.findIndex(p => p.email === requesterEmail);
      
      if (requesterIndex >= 0) {
        // 요청자가 있으면 맨 앞으로 이동
        const requesterStep = paymentLine[requesterIndex];
        paymentLine = paymentLine.filter((p, idx) => idx !== requesterIndex);
        paymentLine = [requesterStep, ...paymentLine];
      } else {
        // 요청자가 없으면 맨 앞에 추가
        paymentLine = [
          {
            step: 1,
            email: requesterEmail,
            name: requesterName,
            status: '대기',
            date: '',
            reason: '',
            opinion: ''
          },
          ...paymentLine
        ];
      }
      
      // 모든 결재 라인 상태 초기화
      paymentLine.forEach(step => {
        step.status = '대기';
        step.date = '';
      });
      
      // step 재정렬
      paymentLine.forEach((p, idx) => { p.step = idx + 1; });
    }
    
    // 단계 초기화
    let newCurrentReviewStep = 0;
    let newCurrentPaymentStep = 0;
    
    // 검토 라인이 있으면 첫 번째 대기 단계로 설정
    const firstReviewStep = reviewLine.find(r => r.status === '대기');
    if (firstReviewStep) {
      newCurrentReviewStep = firstReviewStep.step;
    }
    
    // 검토 라인이 없고 결재 라인이 있으면 결재 첫 번째 단계로 설정
    if (reviewLine.length === 0 || !firstReviewStep) {
      const firstPaymentStep = paymentLine.find(p => p.status === '대기');
      if (firstPaymentStep) {
        newCurrentPaymentStep = firstPaymentStep.step;
      }
    }
    
    // 스프레드시트 업데이트
    const reviewLineIdx = headers.indexOf('review_line');
    const paymentLineIdx = headers.indexOf('payment_line');
    const workflowStatusIdx = headers.indexOf('workflow_status');
    const currentReviewStepIdx = headers.indexOf('current_review_step');
    const currentPaymentStepIdx = headers.indexOf('current_payment_step');
    const workflowCompleteDateIdx = headers.indexOf('workflow_complete_date');
    const updatedAtIdx = headers.indexOf('updated_at');
    
    documentsSheet.getRange(rowIndex, reviewLineIdx + 1).setValue(JSON.stringify(reviewLine));
    documentsSheet.getRange(rowIndex, paymentLineIdx + 1).setValue(JSON.stringify(paymentLine));
    documentsSheet.getRange(rowIndex, workflowStatusIdx + 1).setValue('검토중');
    documentsSheet.getRange(rowIndex, currentReviewStepIdx + 1).setValue(newCurrentReviewStep);
    documentsSheet.getRange(rowIndex, currentPaymentStepIdx + 1).setValue(newCurrentPaymentStep);
    documentsSheet.getRange(rowIndex, workflowCompleteDateIdx + 1).setValue(''); // 완료일 초기화
    documentsSheet.getRange(rowIndex, updatedAtIdx + 1).setValue(timestamp);
    
    // 결재 문서 내용 업데이트 (workflowDocumentId가 있는 경우)
    if (workflow.workflowDocumentId && (req.workflowTitle || req.workflowContent)) {
      try {
        const workflowDoc = DocumentApp.openById(workflow.workflowDocumentId);
        const body = workflowDoc.getBody();
        
        // 제목 업데이트
        if (req.workflowTitle) {
          const docFile = DriveApp.getFileById(workflow.workflowDocumentId);
          docFile.setName(req.workflowTitle);
          
          // 스프레드시트의 workflow_document_title도 업데이트
          const workflowDocumentTitleIdx = headers.indexOf('workflow_document_title');
          if (workflowDocumentTitleIdx >= 0) {
            documentsSheet.getRange(rowIndex, workflowDocumentTitleIdx + 1).setValue(req.workflowTitle);
          }
        }
        
        // 내용 업데이트
        if (req.workflowContent !== undefined) {
          body.clear();
          // HTML 태그 제거하고 텍스트만 추출
          const plainText = req.workflowContent.replace(/<[^>]+>/g, '').trim();
          if (plainText) {
            body.appendParagraph(plainText);
          }
        }
        
        console.log('📄 결재 문서 내용 업데이트 완료:', workflow.workflowDocumentId);
      } catch (error) {
        console.warn('⚠️ 결재 문서 내용 업데이트 실패 (무시됨):', error.message);
      }
    }
    
    // 재제출 이력 기록
    recordWorkflowHistory({
      workflowId: workflow.workflowId,
      documentId: workflow.documentId,
      documentTitle: workflow.documentTitle || workflow.workflowDocumentTitle,
      lineType: 'review',
      stepNumber: 0,
      actionType: '재제출',
      actorEmail: req.userEmail,
      actorName: req.userName || '',
      actionDate: timestamp,
      opinion: '',
      previousStatus: workflow.workflowStatus,
      newStatus: '검토중'
    });
    
    // 업데이트된 워크플로우 정보 조회
    const updatedWorkflow = getWorkflowStatus({ workflowId: workflow.workflowId });
    
    console.log('🔄 워크플로우 재제출 완료:', workflow.workflowId);
    
    return {
      success: true,
      message: '워크플로우가 성공적으로 재제출되었습니다.',
      data: updatedWorkflow.data
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 재제출 오류:', error);
    return {
      success: false,
      message: '워크플로우 재제출 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 워크플로우 히스토리 조회
 * @param {Object} req - 요청 데이터
 * @returns {Object} 워크플로우 히스토리 목록
 */
function getWorkflowHistory(req) {
  try {
    console.log('📋 워크플로우 히스토리 조회 시작:', req);
    
    if (!req.workflowId) {
      return {
        success: false,
        message: '워크플로우 ID가 필요합니다.'
      };
    }
    
    const spreadsheet = getWorkflowSpreadsheet();
    const historySheet = spreadsheet.getSheetByName('workflow_history');
    
    if (!historySheet) {
      return {
        success: false,
        message: 'workflow_history 시트를 찾을 수 없습니다.'
      };
    }
    
    const data = historySheet.getDataRange().getValues();
    const headers = data[0];
    
    const workflowIdIdx = headers.indexOf('workflow_id');
    const historyIdIdx = headers.indexOf('history_id');
    const documentIdIdx = headers.indexOf('document_id');
    const documentTitleIdx = headers.indexOf('document_title');
    const lineTypeIdx = headers.indexOf('line_type');
    const stepNumberIdx = headers.indexOf('step_number');
    const actionTypeIdx = headers.indexOf('action_type');
    const actorEmailIdx = headers.indexOf('actor_email');
    const actorNameIdx = headers.indexOf('actor_name');
    const actorPositionIdx = headers.indexOf('actor_position');
    const actionDateIdx = headers.indexOf('action_date');
    const opinionIdx = headers.indexOf('opinion');
    const rejectReasonIdx = headers.indexOf('reject_reason');
    const previousStatusIdx = headers.indexOf('previous_status');
    const newStatusIdx = headers.indexOf('new_status');
    const processingTimeIdx = headers.indexOf('processing_time');
    
    const historyList = [];
    
    // 해당 워크플로우의 모든 히스토리 조회 (날짜순 정렬)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[workflowIdIdx] === req.workflowId) {
        historyList.push({
          historyId: row[historyIdIdx] || '',
          workflowId: row[workflowIdIdx] || '',
          documentId: row[documentIdIdx] || '',
          documentTitle: row[documentTitleIdx] || '',
          lineType: row[lineTypeIdx] || 'review',
          stepNumber: row[stepNumberIdx] || 0,
          actionType: row[actionTypeIdx] || '',
          actorEmail: row[actorEmailIdx] || '',
          actorName: row[actorNameIdx] || '',
          actorPosition: row[actorPositionIdx] || '',
          actionDate: row[actionDateIdx] || '',
          opinion: row[opinionIdx] || '',
          rejectReason: row[rejectReasonIdx] || '',
          previousStatus: row[previousStatusIdx] || '',
          newStatus: row[newStatusIdx] || '',
          processingTime: row[processingTimeIdx] || ''
        });
      }
    }
    
    // 날짜순 정렬 (오래된 것부터)
    historyList.sort((a, b) => {
      const dateA = new Date(a.actionDate || 0).getTime();
      const dateB = new Date(b.actionDate || 0).getTime();
      return dateA - dateB;
    });
    
    return {
      success: true,
      message: '워크플로우 히스토리를 성공적으로 조회했습니다.',
      data: historyList
    };
    
  } catch (error) {
    console.error('❌ 워크플로우 히스토리 조회 오류:', error);
    return {
      success: false,
      message: '워크플로우 히스토리 조회 중 오류가 발생했습니다: ' + error.message
    };
  }
}
