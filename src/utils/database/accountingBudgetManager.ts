/**
 * @file accountingBudgetManager.ts
 * @brief 예산 계획 관리 유틸리티
 * @details 예산 계획의 작성, 승인, 집행을 관리합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { getCacheManager } from '../cache/cacheManager';
import { generateCacheKey, getCacheTTL, getActionCategory } from '../cache/cacheUtils';
import type { BudgetPlan, BudgetPlanDetail, CreateBudgetPlanRequest, UpdateBudgetPlanDetailsRequest, Account } from '../../types/features/accounting';
import type { SheetInfo } from '../../types/google';
import { getAccounts } from './accountingManager';

// papyrus-db 설정
const setupPapyrusAuth = (): void => {
  if (window.gapi && window.gapi.client) {
    window.papyrusAuth = {
      client: window.gapi.client
    };
  }
};

const ensureAuth = () => {
  setupPapyrusAuth();
};

const ACCOUNTING_SHEETS = {
  BUDGET_PLAN: '예산계획'
} as const;

/**
 * 시트 ID 가져오기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @returns {Promise<number | null>} 시트 ID 또는 null
 */
const getSheetId = async (spreadsheetId: string, sheetName: string): Promise<number | null> => {
  try {
    if (!window.gapi || !window.gapi.client) {
      console.error('❌ Google API가 초기화되지 않았습니다.');
      return null;
    }

    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties'
    });
    
    const sheet = response.result.sheets?.find((s: SheetInfo) => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId || null;
  } catch (error) {
    console.error('❌ 시트 ID 가져오기 오류:', error);
    return null;
  }
};

/**
 * 예산 계획 목록 조회
 */
export const getBudgetPlans = async (
  spreadsheetId: string,
  accountId?: string
): Promise<BudgetPlan[]> => {
  const cacheManager = getCacheManager();
  const action = 'getPendingBudgetPlans';
  const category = getActionCategory(action);
  const cacheKey = generateCacheKey(category, action, { spreadsheetId, accountId });
  
  // 캐시에서 먼저 확인
  const cachedData = await cacheManager.get<BudgetPlan[]>(cacheKey);
  if (cachedData) {
    console.log('💰 캐시에서 예산 계획 로드:', cachedData.length, '개');
    return cachedData;
  }

  try {
    ensureAuth();
    
    // Google API 인증 확인
    if (!window.gapi || !window.gapi.client) {
      console.error('❌ Google API가 초기화되지 않았습니다.');
      throw new Error('Google API 인증이 필요합니다. 페이지를 새로고침해주세요.');
    }
    
    console.log('💰 예산 계획 로드 시작 (캐시 미스)...');
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    
    if (!data || !data.values || data.values.length <= 1) {
      console.log('📊 예산 계획 데이터 없음:', { spreadsheetId, dataLength: data?.values?.length || 0 });
      return [];
    }

    // 통장 정보 미리 로드 (무결성 검사용)
    const accounts = await getAccounts(spreadsheetId);

    // 각 행을 처리하면서 무결성 검사 및 수정
    const plans: BudgetPlan[] = [];
    for (let i = 0; i < data.values.length - 1; i++) {
      const row = data.values[i + 1]; // 헤더 제외
      const actualRowNumber = i + 2; // 실제 스프레드시트 행 번호 (헤더 포함)
      
      // 빈 행이거나 budgetId가 없으면 건너뛰기
      if (!row || !row[0] || row[0].trim() === '') {
        continue;
      }
      
      const detailsJson = row[14] || '[]';
      let details: BudgetPlanDetail[] = [];
      try {
        details = JSON.parse(detailsJson);
      } catch (e) {
        console.warn('예산 계획 상세 파싱 오류:', e);
      }

      // 서브 관리자 검토 목록 파싱 (P열, 16번째 컬럼)
      const subManagerReviewsJson = row[15] || '[]';
      let subManagerReviews: Array<{ email: string; date: string }> = [];
      try {
        subManagerReviews = JSON.parse(subManagerReviewsJson);
      } catch (e) {
        // 하위 호환성: 기존 데이터가 있으면 변환
        if (row[7] === 'TRUE' && row[8]) {
          subManagerReviews = [{ email: 'unknown', date: row[8] }];
        }
      }

      const currentStatus = (row[6] || 'pending') as BudgetPlan['status'];
      const planAccountId = row[1] || '';
      
      // 통장 정보 가져오기
      const account = accounts.find(acc => acc.accountId === planAccountId);
      
      // 무결성 검사: 모든 서브 관리자가 검토했는데 상태가 pending이면 reviewed로 수정
      if (account && account.subManagerIds.length > 0 && currentStatus === 'pending') {
        const allSubManagersReviewed = account.subManagerIds.every(subManagerId => 
          subManagerReviews.some(r => r.email === subManagerId)
        );
        
        if (allSubManagersReviewed) {
          console.log('🔧 데이터 무결성 수정:', {
            budgetId: row[0],
            title: row[2],
            currentStatus,
            subManagerReviews: subManagerReviews.map(r => r.email),
            subManagerIds: account.subManagerIds
          });
          
          // 상태를 reviewed로 업데이트
          await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['reviewed']]);
          await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `H${actualRowNumber}`, [['TRUE']]);
          if (subManagerReviews.length > 0) {
            await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `I${actualRowNumber}`, [[subManagerReviews[subManagerReviews.length - 1].date]]);
          }
          
          // 수정된 상태로 반환
          plans.push({
            budgetId: row[0] || '',
            accountId: planAccountId,
            title: row[2] || '',
            totalAmount: parseFloat(row[3] || '0'),
            modificationDate: row[4] || '',
            status: 'reviewed', // 수정된 상태
            subManagerReviewed: true,
            subManagerReviewDate: row[7] || subManagerReviews[subManagerReviews.length - 1]?.date || undefined,
            subManagerReviews,
            mainManagerApproved: row[8] === 'TRUE' || row[8] === true,
            mainManagerApprovalDate: row[9] || undefined,
            executedDate: row[10] || undefined,
            createdBy: row[11] || '',
            rejectionReason: row[12] || undefined,
            details
          });
          continue;
        }
      }

      // 무결성 문제가 없으면 그대로 반환
      plans.push({
        budgetId: row[0] || '',
        accountId: planAccountId,
        title: row[2] || '',
        totalAmount: parseFloat(row[3] || '0'),
        modificationDate: row[4] || '',
        status: currentStatus,
        subManagerReviewed: row[6] === 'TRUE' || row[6] === true || subManagerReviews.length > 0,
        subManagerReviewDate: row[7] || undefined,
        subManagerReviews,
        mainManagerApproved: row[8] === 'TRUE' || row[8] === true,
        mainManagerApprovalDate: row[9] || undefined,
        executedDate: row[10] || undefined,
        createdBy: row[11] || '',
        rejectionReason: row[12] || undefined,
        details
      });
    }

    // 필터링
    const filteredPlans = plans.filter((plan: BudgetPlan) => {
      if (accountId) {
        return plan.budgetId && plan.accountId === accountId;
      }
      return plan.budgetId;
    });

    console.log(`💰 예산 계획 로드 완료: ${filteredPlans.length}개`);
    
    // 캐시에 저장
    const ttl = getCacheTTL(action);
    await cacheManager.set(cacheKey, filteredPlans, ttl);
    console.log('💰 예산 계획 캐시 저장 완료 (TTL:', ttl / 1000 / 60, '분)');
    
    return filteredPlans;
    
  } catch (error: unknown) {
    console.error('❌ 예산 계획 목록 조회 오류:', error);
    
    const err = error as { status?: number; code?: number; message?: string };
    // 401 인증 오류인 경우
    if (err.status === 401 || err.code === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
      console.error('❌ 인증 오류: Google API 인증이 필요합니다.');
      throw new Error('인증이 만료되었습니다. 페이지를 새로고침해주세요.');
    }
    
    // 다른 에러는 빈 배열 반환 (기존 동작 유지)
    console.warn('⚠️ 예산 계획 조회 실패, 빈 배열 반환:', error);
    return [];
  }
};

/**
 * 예산 계획 생성
 */
export const createBudgetPlan = async (
  spreadsheetId: string,
  request: CreateBudgetPlanRequest,
  createdBy: string
): Promise<BudgetPlan> => {
  try {
    // 통장 잔액 확인
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === request.accountId);
    
    if (!account) {
      throw new Error('통장을 찾을 수 없습니다.');
    }

    // 예산 한도 검증 (details가 있을 때만)
    const totalAmount = request.details?.reduce((sum, detail) => sum + detail.amount, 0) || 0;
    if (totalAmount > 0 && totalAmount > account.currentBalance) {
      throw new Error(`예산 금액(${totalAmount.toLocaleString()}원)이 통장 잔액(${account.currentBalance.toLocaleString()}원)을 초과합니다.`);
    }

    const budgetId = `budget_${Date.now()}`;
    // 수정일을 분까지 표기 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss.sssZ)
    const modificationDate = new Date().toISOString();

    const newBudgetPlan: BudgetPlan = {
      budgetId,
      accountId: request.accountId,
      title: request.title,
      totalAmount,
      modificationDate,
      status: 'pending',
      subManagerReviewed: false,
      mainManagerApproved: false,
      executedDate: request.executedDate,
      createdBy,
      details: (request.details || []).map((detail, index) => ({
        detailId: `${budgetId}_detail_${index}`,
        category: detail.category,
        description: detail.description,
        amount: detail.amount,
        plannedDate: detail.plannedDate,
        source: detail.source
      }))
    };

    ensureAuth();
    
    // 시트 헤더 순서: budget_id, account_id, title, total_amount, modification_date,
    // status, sub_manager_reviewed, sub_manager_review_date,
    // main_manager_approved, main_manager_approval_date, executed_date, created_by,
    // rejection_reason, details, sub_manager_reviews
    const budgetPlanRow = [
      newBudgetPlan.budgetId,                        // budget_id
      newBudgetPlan.accountId,                      // account_id
      newBudgetPlan.title,                          // title
      newBudgetPlan.totalAmount,                    // total_amount
      newBudgetPlan.modificationDate,              // modification_date
      newBudgetPlan.status,                         // status
      'FALSE',                                      // sub_manager_reviewed (하위 호환성)
      '',                                           // sub_manager_review_date (하위 호환성)
      'FALSE',                                      // main_manager_approved
      '',                                           // main_manager_approval_date
      newBudgetPlan.executedDate || '',            // executed_date
      newBudgetPlan.createdBy,                      // created_by
      '',                                           // rejection_reason
      JSON.stringify(newBudgetPlan.details),       // details
      JSON.stringify([])                            // sub_manager_reviews (새 필드)
    ];
    
    // 배열 형식으로 append (papyrus-db는 2차원 배열을 기대함)
    await append(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, [budgetPlanRow]);

    console.log('✅ 예산 계획 생성 완료:', budgetId);
    return newBudgetPlan;

  } catch (error) {
    console.error('❌ 예산 계획 생성 오류:', error);
    throw error;
  }
};

/**
 * 부 관리인 검토
 */
export const reviewBudgetPlan = async (
  spreadsheetId: string,
  budgetId: string,
  reviewerId: string
): Promise<void> => {
  try {
    ensureAuth();
    const reviewDate = new Date().toISOString();
    
    // 스프레드시트에서 해당 행 찾아서 업데이트 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    // budget_id가 일치하는 행 찾기 (첫 번째 컬럼)
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }
    
    const row = budgetData.values[rowIndex];
    const actualRowNumber = rowIndex + 1;
    
    // 기존 서브 관리자 검토 목록 가져오기 (P열, 16번째 컬럼)
    const subManagerReviewsJson = row[15] || '[]';
    let subManagerReviews: Array<{ email: string; date: string }> = [];
    try {
      subManagerReviews = JSON.parse(subManagerReviewsJson);
    } catch (e) {
      // 파싱 실패 시 빈 배열
    }
    
    // 이미 검토한 경우 체크
    const alreadyReviewed = subManagerReviews.some(r => r.email === reviewerId);
    if (alreadyReviewed) {
      throw new Error('이미 검토한 예산 계획입니다.');
    }
    
    // 통장 정보 가져오기 (서브 관리자 목록 확인용)
    const { getAccounts } = await import('./accountingManager');
    const accounts = await getAccounts(spreadsheetId);
    const plan = await getBudgetPlans(spreadsheetId);
    const budgetPlan = plan.find(p => p.budgetId === budgetId);
    
    if (!budgetPlan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
    }
    
    const account = accounts.find(acc => acc.accountId === budgetPlan.accountId);
    if (!account) {
      throw new Error('통장 정보를 찾을 수 없습니다.');
    }
    
    // 검토자가 서브 관리자인지 확인 (이메일로 비교)
    const isSubManager = account.subManagerIds.includes(reviewerId);
    if (!isSubManager) {
      throw new Error('서브 관리자만 검토할 수 있습니다.');
    }
    
    // 검토 목록에 추가 (이메일 형식으로 저장)
    subManagerReviews.push({ email: reviewerId, date: reviewDate });
    
    console.log('🔍 검토 처리:', {
      reviewerId,
      subManagerIds: account.subManagerIds,
      subManagerReviews: subManagerReviews,
      currentReviewsCount: subManagerReviews.length,
      totalSubManagers: account.subManagerIds.length
    });
    
    // 모든 서브 관리자가 검토했는지 확인
    const allSubManagersReviewed = account.subManagerIds.every(subManagerId => 
      subManagerReviews.some(r => r.email === subManagerId)
    );
    
    console.log('🔍 검토 완료 확인:', {
      allSubManagersReviewed,
      subManagerIds: account.subManagerIds,
      reviewedEmails: subManagerReviews.map(r => r.email),
      missingReviews: account.subManagerIds.filter(subManagerId => 
        !subManagerReviews.some(r => r.email === subManagerId)
      )
    });
    
    // 상태 업데이트: 모든 서브 관리자가 검토 완료하면 'reviewed', 아니면 'pending' 유지
    const newStatus = allSubManagersReviewed ? 'reviewed' : 'pending';
    
    // 배열 형식으로 각 열 업데이트 (papyrus-db update 사용)
    // status (G열), sub_manager_reviewed (H열), sub_manager_review_date (I열), sub_manager_reviews (P열)
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [[newStatus]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `H${actualRowNumber}`, [[allSubManagersReviewed ? 'TRUE' : 'FALSE']]);
    if (allSubManagersReviewed && subManagerReviews.length > 0) {
      await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `I${actualRowNumber}`, [[subManagerReviews[subManagerReviews.length - 1].date]]);
    }
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `P${actualRowNumber}`, [[JSON.stringify(subManagerReviews)]]);

    console.log('✅ 예산 계획 검토 완료:', budgetId, '검토자:', reviewerId);
  } catch (error) {
    console.error('❌ 예산 계획 검토 오류:', error);
    throw error;
  }
};

/**
 * 주 관리인 승인
 */
export const approveBudgetPlan = async (
  spreadsheetId: string,
  budgetId: string,
  approverId: string
): Promise<void> => {
  try {
    ensureAuth();
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    const budgetPlan = plans.find(p => p.budgetId === budgetId);
    
    if (!budgetPlan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
    }
    
    // 통장 정보 가져오기 (서브 관리자 목록 확인용)
    const { getAccounts } = await import('./accountingManager');
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === budgetPlan.accountId);
    
    if (!account) {
      throw new Error('통장 정보를 찾을 수 없습니다.');
    }
    
    // 모든 서브 관리자가 검토했는지 확인
    if (budgetPlan.status !== 'reviewed') {
      throw new Error('모든 서브 관리자의 검토가 완료되어야 승인할 수 있습니다.');
    }
    
    // 주 관리자인지 확인 (이메일 또는 학번으로 비교)
    const isMainManager = account.mainManagerId === approverId;
    
    console.log('🔍 승인 권한 확인:', {
      approverId,
      mainManagerId: account.mainManagerId,
      isMainManager,
      accountId: account.accountId
    });
    
    if (!isMainManager) {
      throw new Error(`주 관리자만 승인할 수 있습니다. (현재: ${approverId}, 주 관리자: ${account.mainManagerId})`);
    }
    
    const approvalDate = new Date().toISOString();
    
    // 스프레드시트에서 해당 행 찾아서 업데이트 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }
    
    const actualRowNumber = rowIndex + 1;
    
    // main_manager_approved (J열), main_manager_approval_date (K열), status (G열)
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['approved']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `J${actualRowNumber}`, [['TRUE']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `K${actualRowNumber}`, [[approvalDate]]);

    console.log('✅ 예산 계획 승인 완료:', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 승인 오류:', error);
    throw error;
  }
};

/**
 * 예산 계획 반려
 */
export const rejectBudgetPlan = async (
  spreadsheetId: string,
  budgetId: string,
  rejectionReason: string,
  rejecterId: string
): Promise<void> => {
  try {
    ensureAuth();
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    const budgetPlan = plans.find(p => p.budgetId === budgetId);
    
    if (!budgetPlan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
    }
    
    // 통장 정보 가져오기
    const { getAccounts } = await import('./accountingManager');
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === budgetPlan.accountId);
    
    if (!account) {
      throw new Error('통장 정보를 찾을 수 없습니다.');
    }
    
    // 모든 서브 관리자가 검토했는지 확인
    if (budgetPlan.status !== 'reviewed') {
      throw new Error('모든 서브 관리자의 검토가 완료되어야 반려할 수 있습니다.');
    }
    
    // 주 관리자인지 확인
    if (account.mainManagerId !== rejecterId) {
      throw new Error('주 관리자만 반려할 수 있습니다.');
    }
    
    // 스프레드시트에서 해당 행 찾아서 업데이트 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }
    
    const actualRowNumber = rowIndex + 1;
    
    // status (G열), rejection_reason (N열)
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['rejected']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `N${actualRowNumber}`, [[rejectionReason]]);

    console.log('✅ 예산 계획 반려 완료:', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 반려 오류:', error);
    throw error;
  }
};

/**
 * 예산 계획 집행 (장부에 자동 반영)
 */
export const executeBudgetPlan = async (
  spreadsheetId: string,
  budgetId: string,
  executorId: string
): Promise<void> => {
  try {
    ensureAuth();
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    const plan = plans.find(p => p.budgetId === budgetId);
    
    if (!plan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
    }

    if (plan.status !== 'approved') {
      throw new Error('승인된 예산 계획만 집행할 수 있습니다.');
    }

    const { createLedgerEntry } = await import('./accountingManager');
    // 집행일을 분까지 표기 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss.sssZ)
    const executedDate = new Date().toISOString();

    // 예산 계획의 각 상세 항목을 장부 항목으로 추가
    for (const detail of plan.details) {
      await createLedgerEntry(
        spreadsheetId,
        {
          accountId: plan.accountId,
          date: detail.plannedDate || plan.executedDate || new Date().toISOString().split('T')[0],
          category: detail.category,
          description: detail.description, // 항목 이름만 저장
          amount: detail.amount,
          source: detail.source || plan.title, // 예산안 상세 항목의 출처가 있으면 사용, 없으면 예산안 제목 사용
          transactionType: 'expense', // 예산 계획은 보통 지출
          budgetPlanId: budgetId, // 예산 계획 ID 추가
          budgetPlanTitle: plan.title // 예산안 제목 추가
        },
        executorId
      );
    }

    // 예산 계획 상태를 'executed'로 변경 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }
    
    const actualRowNumber = rowIndex + 1;
    
    // status (G열), executed_date (L열)
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['executed']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `L${actualRowNumber}`, [[executedDate]]);

    console.log('✅ 예산 계획 집행 완료:', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 집행 오류:', error);
    throw error;
  }
};

/**
 * 예산 계획 상세 항목 업데이트
 */
export const updateBudgetPlanDetails = async (
  spreadsheetId: string,
  budgetId: string,
  request: UpdateBudgetPlanDetailsRequest
): Promise<void> => {
  try {
    ensureAuth();
    
    // Google API 인증 확인
    if (!window.gapi || !window.gapi.client) {
      console.error('❌ Google API가 초기화되지 않았습니다.');
      throw new Error('Google API 인증이 필요합니다. 페이지를 새로고침해주세요.');
    }
    
    console.log('🔍 예산 계획 상세 업데이트 시도:', { spreadsheetId, budgetId });
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    console.log('📊 조회된 예산 계획 목록:', plans.length, '개');
    console.log('🔍 찾는 budgetId:', budgetId);
    console.log('📋 예산 계획 ID 목록:', plans.map(p => p.budgetId));
    
    const plan = plans.find(p => p.budgetId === budgetId);
    
    if (!plan) {
      console.error('❌ 예산 계획을 찾을 수 없음:', {
        budgetId,
        totalPlans: plans.length,
        planIds: plans.map(p => p.budgetId)
      });
      throw new Error(`예산 계획을 찾을 수 없습니다. (ID: ${budgetId})`);
    }

    // 통장 잔액 확인
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === plan.accountId);
    
    if (!account) {
      throw new Error('통장을 찾을 수 없습니다.');
    }

    // 예산 한도 검증
    const totalAmount = request.details.reduce((sum, detail) => sum + detail.amount, 0);
    if (totalAmount > account.currentBalance) {
      throw new Error(`예산 금액(${totalAmount.toLocaleString()}원)이 통장 잔액(${account.currentBalance.toLocaleString()}원)을 초과합니다.`);
    }

    // 시트에서 해당 행 찾기
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }

    const actualRowNumber = rowIndex + 1;

    // 새로운 details 생성 (detailId 포함, 항목별 날짜 포함, 출처 포함)
    const newDetails = request.details.map((detail, index) => ({
      detailId: `${budgetId}_detail_${index}`,
      category: detail.category,
      description: detail.description,
      amount: detail.amount,
      plannedDate: detail.plannedDate,
      source: detail.source
    }));

    // 수정일 업데이트 (분까지 표기)
    const modificationDate = new Date().toISOString();

    // 이미 집행된 장부 항목이 있는지 확인하고 삭제 (상태와 관계없이 해당 예산안으로 생성된 항목은 모두 삭제)
    const { getLedgerEntries } = await import('./accountingManager');
    const { deleteRow } = await import('papyrus-db');
    const ACCOUNTING_SHEETS_IMPORT = {
      LEDGER: '장부',
      ACCOUNT: '통장'
    };
    
    // 장부 데이터를 직접 시트에서 읽어서 정확히 확인
    const ledgerData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
    
    if (!ledgerData || !ledgerData.values || ledgerData.values.length <= 1) {
      console.log('📋 장부 데이터가 없습니다.');
      return;
    }
    
    // 시트에서 직접 읽어서 budgetPlanId와 accountId가 모두 일치하는 항목 찾기
    // rowIndex는 배열 인덱스 (0-based, 헤더 포함이므로 실제 시트 행 번호는 rowIndex + 1)
    const budgetEntriesToDelete: Array<{ 
      entryId: string; 
      arrayIndex: number;  // 배열 인덱스 (0-based, 헤더 포함)
      sheetRowNumber: number;  // 실제 시트 행 번호 (1-based)
      accountId: string;
      budgetPlanId: string;
      description: string;
    }> = [];
    
    const expectedAccountId = plan.accountId.toString().trim();
    const expectedBudgetPlanId = budgetId.toString().trim();
    
    for (let i = 1; i < ledgerData.values.length; i++) {
      const row = ledgerData.values[i];
      if (!row || row.length === 0) continue;
      
      const rowEntryId = (row[0] || '').toString().trim();
      const rowAccountId = (row[1] || '').toString().trim();
      const rowBudgetPlanId = (row[14] || '').toString().trim();
      const rowDescription = (row[4] || '').toString().trim();
      
      // accountId와 budgetPlanId가 모두 정확히 일치하는지 확인
      // budgetPlanId가 비어있지 않아야 함 (예산안으로 생성된 항목만)
      if (rowAccountId === expectedAccountId && 
          rowBudgetPlanId === expectedBudgetPlanId && 
          rowBudgetPlanId !== '') {
        budgetEntriesToDelete.push({
          entryId: rowEntryId,
          arrayIndex: i,  // 배열 인덱스 (0-based, 헤더 포함)
          sheetRowNumber: i + 1,  // 실제 시트 행 번호 (1-based, 헤더 포함)
          accountId: rowAccountId,
          budgetPlanId: rowBudgetPlanId,
          description: rowDescription
        });
      }
    }
    
    console.log(`🔍 예산안 장부 항목 검색 (시트 직접 확인):`, {
      budgetId: budgetId,
      accountId: plan.accountId,
      totalRows: ledgerData.values.length - 1,
      foundEntries: budgetEntriesToDelete.length,
      entriesToDelete: budgetEntriesToDelete.map(e => ({
        entryId: e.entryId,
        description: e.description,
        arrayIndex: e.arrayIndex,
        sheetRowNumber: e.sheetRowNumber,
        accountId: e.accountId,
        budgetPlanId: e.budgetPlanId
      }))
    });
    
    if (budgetEntriesToDelete.length > 0) {
      console.log(`🔍 예산안으로 생성된 장부 항목 발견: ${budgetEntriesToDelete.length}개, 삭제 시작...`);
      
      // 시트 이름을 시트 ID로 변환
      const ledgerSheetId = await getSheetId(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
      if (ledgerSheetId !== null) {
        // 역순으로 삭제하여 잔액 계산 오류 방지
        // 시트 행 번호 기준으로 역순 정렬 (큰 행 번호부터 삭제하여 행 번호 변경 방지)
        const sortedEntries = [...budgetEntriesToDelete].sort((a, b) => b.sheetRowNumber - a.sheetRowNumber);
        
        for (const entryToDelete of sortedEntries) {
          // 삭제 전 매번 시트를 다시 읽어서 entryId로 정확한 행 찾기
          // 이렇게 하면 이전 삭제로 인한 행 번호 변경에도 안전함
          const currentLedgerData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
          if (!currentLedgerData || !currentLedgerData.values || currentLedgerData.values.length <= 1) {
            console.warn('⚠️ 시트 데이터를 읽을 수 없음:', { entryId: entryToDelete.entryId });
            continue;
          }
          
          // entryId로 정확한 행 찾기 (accountingManager.ts의 deleteLedgerEntry와 동일한 방식)
          const currentRowIndex = currentLedgerData.values.findIndex((row: string[]) => 
            row && row.length > 0 && (row[0] || '').toString().trim() === entryToDelete.entryId
          );
          
          if (currentRowIndex === -1) {
            console.warn('⚠️ 삭제할 항목을 시트에서 찾을 수 없음 (이미 삭제되었을 수 있음):', { 
              entryId: entryToDelete.entryId 
            });
            continue;
          }
          
          // 해당 행의 데이터 확인
          const row = currentLedgerData.values[currentRowIndex];
          if (!row || row.length === 0) {
            console.warn('⚠️ 행 데이터가 없음:', { 
              arrayIndex: currentRowIndex, 
              entryId: entryToDelete.entryId 
            });
            continue;
          }
          
          // 행 데이터 검증
          const rowEntryId = (row[0] || '').toString().trim();
          const rowAccountId = (row[1] || '').toString().trim();
          const rowBudgetPlanId = (row[14] || '').toString().trim();
          const rowDescription = (row[4] || '').toString().trim();
          
          // 최종 검증: entryId, accountId, budgetPlanId가 모두 정확히 일치하는지 확인
          // 이 검증을 통해 엉뚱한 항목이 삭제되는 것을 방지
          if (rowEntryId === entryToDelete.entryId &&
              rowAccountId === entryToDelete.accountId && 
              rowBudgetPlanId === entryToDelete.budgetPlanId && 
              rowAccountId === expectedAccountId &&
              rowBudgetPlanId === expectedBudgetPlanId &&
              rowBudgetPlanId !== '') {
            
            // 실제 시트 행 번호 계산 (1-based, 헤더 포함)
            // currentLedgerData.values[0] = 헤더 (시트 1행)
            // currentLedgerData.values[currentRowIndex] = 찾은 행 (시트 currentRowIndex + 1행)
            const actualSheetRowNumber = currentRowIndex + 1;
            
            // 삭제 전 시트 상태 로깅 (디버깅용)
            console.log('🔍 삭제 전 시트 상태 확인:', {
              totalRows: currentLedgerData.values.length,
              targetRowNumber: actualSheetRowNumber,
              targetRowData: row,
              allRows: currentLedgerData.values.map((r, idx) => ({
                rowNumber: idx + 1,
                entryId: r[0] || '',
                description: r[4] || '',
                budgetPlanId: r[14] || ''
              }))
            });
            
            console.log('✅ 삭제 확인 완료, 삭제 실행:', {
              entryId: rowEntryId,
              budgetPlanId: rowBudgetPlanId,
              accountId: rowAccountId,
              description: rowDescription,
              arrayIndex: currentRowIndex,
              sheetRowNumber: actualSheetRowNumber,
              expected: {
                entryId: entryToDelete.entryId,
                accountId: expectedAccountId,
                budgetPlanId: expectedBudgetPlanId
              }
            });
            
            // deleteRow 사용
            // papyrus-db의 deleteRow는 0-based 인덱스를 기대합니다
            // 시트 행 1 (헤더) = API 인덱스 0
            // 시트 행 2 (첫 데이터) = API 인덱스 1
            // 따라서 actualSheetRowNumber - 1을 전달해야 합니다
            try {
              // 0-based 인덱스로 변환 (시트 행 번호 - 1)
              const apiRowIndex = actualSheetRowNumber - 1;
              
              console.log('🔧 deleteRow 호출 파라미터:', {
                spreadsheetId,
                ledgerSheetId,
                actualSheetRowNumber,  // 1-based 시트 행 번호
                apiRowIndex,  // 0-based API 인덱스
                entryId: rowEntryId
              });
              
              const { deleteRow } = await import('papyrus-db');
              await deleteRow(spreadsheetId, ledgerSheetId, apiRowIndex);
              
              // 삭제 후 시트 상태 확인 (디버깅용)
              const afterDeleteData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
              const deletedRowStillExists = afterDeleteData?.values?.some((r: string[]) => 
                (r[0] || '').toString().trim() === rowEntryId
              );
              
              console.log('🗑️ 집행된 장부 항목 삭제 완료:', {
                entryId: rowEntryId,
                sheetRowNumber: actualSheetRowNumber,
                deletedRowStillExists: deletedRowStillExists,
                afterDeleteTotalRows: afterDeleteData?.values?.length || 0,
                afterDeleteRows: afterDeleteData?.values?.map((r, idx) => ({
                  rowNumber: idx + 1,
                  entryId: r[0] || '',
                  description: r[4] || '',
                  budgetPlanId: r[14] || ''
                }))
              });
              
              if (deletedRowStillExists) {
                console.error('❌ 삭제 실패: 항목이 여전히 시트에 존재합니다!', {
                  entryId: rowEntryId,
                  sheetRowNumber: actualSheetRowNumber
                });
              }
            } catch (deleteError: unknown) {
              const err = deleteError as { message?: string; code?: number; status?: number };
              console.error('❌ deleteRow 실행 오류:', {
                entryId: rowEntryId,
                sheetRowNumber: actualSheetRowNumber,
                error: err.message || deleteError,
                code: err.code,
                status: err.status
              });
              throw deleteError;
            }
          } else {
            console.error('❌ 삭제 직전 검증 실패 - 삭제하지 않음:', {
              entryId: rowEntryId,
              expectedEntryId: entryToDelete.entryId,
              description: rowDescription,
              arrayIndex: currentRowIndex,
              expected: {
                entryId: entryToDelete.entryId,
                accountId: expectedAccountId,
                budgetPlanId: expectedBudgetPlanId
              },
              actual: {
                entryId: rowEntryId,
                accountId: rowAccountId,
                budgetPlanId: rowBudgetPlanId
              },
              stored: {
                entryId: entryToDelete.entryId,
                accountId: entryToDelete.accountId,
                budgetPlanId: entryToDelete.budgetPlanId
              },
              matches: {
                entryId: rowEntryId === entryToDelete.entryId,
                accountId: rowAccountId === entryToDelete.accountId,
                budgetPlanId: rowBudgetPlanId === entryToDelete.budgetPlanId,
                accountIdExpected: rowAccountId === expectedAccountId,
                budgetPlanIdExpected: rowBudgetPlanId === expectedBudgetPlanId
              }
            });
          }
        }
      } else {
        console.error('❌ 장부 시트 ID를 찾을 수 없습니다.');
      }
      
      // 통장 잔액 재계산 (남은 항목들로)
      // 삭제 후 최신 통장 정보 가져오기 (변수명 다르게 선언)
      const updatedAccounts = await getAccounts(spreadsheetId);
      const updatedAccount = updatedAccounts.find(acc => acc.accountId === plan.accountId);
      if (updatedAccount) {
        // 삭제 후 남은 항목들 다시 가져오기
        const remainingEntries = await getLedgerEntries(spreadsheetId, plan.accountId);
        const sortedEntries = [...remainingEntries].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.entryId.localeCompare(b.entryId);
        });

        let currentBalance = updatedAccount.initialBalance;
        for (const entry of sortedEntries) {
          currentBalance += entry.amount;
          const entryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
          const entryRowIndex = entryData.values.findIndex((row: string[]) => row[0] === entry.entryId);
          if (entryRowIndex !== -1) {
            await update(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER, `G${entryRowIndex + 1}`, [[currentBalance]]);
          }
        }

        // 통장 잔액 업데이트
        const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.ACCOUNT);
        const accountRowIndex = accountData.values.findIndex((row: string[]) => row[0] === updatedAccount.accountId);
        if (accountRowIndex !== -1) {
          await update(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.ACCOUNT, `D${accountRowIndex + 1}`, [[currentBalance]]);
          console.log('✅ 통장 잔액 재계산 완료:', currentBalance);
        }
      }
    }

    // 상세 항목 수정 시 상태를 'pending'으로 되돌리고 모든 승인/검토 정보 초기화
    // total_amount (D열), modification_date (E열), details (O열), status (G열), sub_manager_reviewed (H열), 
    // sub_manager_review_date (I열), main_manager_approved (J열), 
    // main_manager_approval_date (K열), executed_date (L열), rejection_reason (N열), 
    // sub_manager_reviews (P열) 업데이트
    
    // 수정일 업데이트 (E열)
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `E${actualRowNumber}`, [[modificationDate]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `D${actualRowNumber}`, [[totalAmount]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['pending']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `H${actualRowNumber}`, [['FALSE']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `I${actualRowNumber}`, [['']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `J${actualRowNumber}`, [['FALSE']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `K${actualRowNumber}`, [['']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `L${actualRowNumber}`, [['']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `N${actualRowNumber}`, [['']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `O${actualRowNumber}`, [[JSON.stringify(newDetails)]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `P${actualRowNumber}`, [['[]']]);

    console.log('✅ 예산 계획 상세 업데이트 완료 (상태 초기화):', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 상세 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 예산 계획 삭제
 */
export const deleteBudgetPlan = async (
  spreadsheetId: string,
  budgetId: string,
  deleterId: string
): Promise<void> => {
  try {
    ensureAuth();
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    const plan = plans.find(p => p.budgetId === budgetId);
    
    if (!plan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
    }

    // 통장 정보 가져오기
    const { getAccounts } = await import('./accountingManager');
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === plan.accountId);
    
    if (!account) {
      throw new Error('통장 정보를 찾을 수 없습니다.');
    }

    // 관리자인지 확인 (주 관리자 또는 서브 관리자)
    const isManager = account.mainManagerId === deleterId || 
                      account.subManagerIds.includes(deleterId);
    
    if (!isManager) {
      throw new Error('관리자만 예산 계획을 삭제할 수 있습니다.');
    }

    // 이미 집행된 장부 항목이 있는지 확인
    if (plan.status === 'executed') {
      const { getLedgerEntries, getAccounts: getAccountsForDelete } = await import('./accountingManager');
      const { getSheetData, deleteRow } = await import('papyrus-db');
      const ACCOUNTING_SHEETS_IMPORT = {
        LEDGER: '장부',
        ACCOUNT: '통장'
      };
      
      const ledgerEntries = await getLedgerEntries(spreadsheetId, plan.accountId);
      const budgetEntries = ledgerEntries.filter(entry => entry.budgetPlanId === budgetId);
      
      if (budgetEntries.length > 0) {
        // 장부 데이터 가져오기
        const ledgerData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
        if (ledgerData && ledgerData.values) {
          // 시트 이름을 시트 ID로 변환
          const ledgerSheetId = await getSheetId(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
          if (ledgerSheetId !== null) {
            // 집행된 장부 항목 삭제 (역순으로 삭제하여 잔액 계산 오류 방지)
            for (const entry of budgetEntries.reverse()) {
              const rowIndex = ledgerData.values.findIndex((row: string[]) => row[0] === entry.entryId);
              if (rowIndex !== -1) {
                await deleteRow(spreadsheetId, ledgerSheetId, rowIndex + 1);
                console.log('🗑️ 집행된 장부 항목 삭제:', entry.entryId);
              }
            }
          } else {
            console.error('❌ 장부 시트 ID를 찾을 수 없습니다.');
          }
          
          // 통장 잔액 재계산 (남은 항목들로)
          const accountsForDelete = await getAccountsForDelete(spreadsheetId);
          const accountForDelete = accountsForDelete.find(acc => acc.accountId === plan.accountId);
          if (accountForDelete) {
            const remainingEntries = await getLedgerEntries(spreadsheetId, plan.accountId);
            const sortedEntries = [...remainingEntries].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (dateA !== dateB) return dateA - dateB;
              return a.entryId.localeCompare(b.entryId);
            });

            let currentBalance = accountForDelete.initialBalance;
            for (const entry of sortedEntries) {
              currentBalance += entry.amount;
              const entryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER);
              const entryRowIndex = entryData.values.findIndex((row: string[]) => row[0] === entry.entryId);
              if (entryRowIndex !== -1) {
                await update(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.LEDGER, `G${entryRowIndex + 1}`, [[currentBalance]]);
              }
            }

            // 통장 잔액 업데이트
            const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.ACCOUNT);
            const accountRowIndex = accountData.values.findIndex((row: string[]) => row[0] === accountForDelete.accountId);
            if (accountRowIndex !== -1) {
              await update(spreadsheetId, ACCOUNTING_SHEETS_IMPORT.ACCOUNT, `D${accountRowIndex + 1}`, [[currentBalance]]);
            }
          }
        }
      }
    }

    // 예산 계획 행 삭제
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }

    // 시트 이름을 시트 ID로 변환
    const sheetId = await getSheetId(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (sheetId === null) {
      throw new Error('예산계획 시트 ID를 찾을 수 없습니다.');
    }

    // 실제 시트 행 번호 계산 (1-based, 헤더 포함)
    // data.values[0] = 헤더 (시트 1행)
    // data.values[rowIndex] = 찾은 행 (시트 rowIndex + 1행)
    const actualSheetRowNumber = rowIndex + 1;
    
    console.log('🗑️ 예산 계획 삭제 시도:', {
      budgetId,
      rowIndex,
      actualSheetRowNumber,
      sheetId
    });

    // Google Sheets API를 직접 사용하여 행 삭제
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API가 초기화되지 않았습니다.');
    }

    // 삭제 전 현재 행 번호 확인
    const beforeDeleteData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    const beforeRowCount = beforeDeleteData?.values?.length || 0;
    console.log('🗑️ 삭제 전 상태:', {
      totalRows: beforeRowCount,
      targetRowNumber: actualSheetRowNumber,
      targetRowData: beforeDeleteData?.values?.[rowIndex]
    });
    
    // Google Sheets API의 deleteDimension은 0-based 인덱스를 사용합니다
    // data.values[0] = 헤더 (시트 1행, API 인덱스 0)
    // data.values[rowIndex] = 찾은 행 (시트 rowIndex + 1행, API 인덱스 rowIndex)
    // 따라서 rowIndex를 그대로 사용하면 됩니다
    const apiRowIndex = rowIndex; // 0-based
    
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: apiRowIndex,
                endIndex: apiRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    // 삭제 확인: 여러 번 시도하여 캐시 문제 해결
    let stillExists = true;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (stillExists && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300 * (attempts + 1))); // 점진적으로 대기 시간 증가
      const verifyData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
      stillExists = verifyData?.values?.some((row: string[]) => row && row[0] === budgetId) || false;
      
      if (!stillExists) {
        console.log(`✅ 삭제 확인 성공 (시도 ${attempts + 1}/${maxAttempts}):`, {
          beforeRowCount,
          afterRowCount: verifyData?.values?.length || 0
        });
        break;
      }
      
      attempts++;
      console.log(`⏳ 삭제 확인 시도 ${attempts}/${maxAttempts}...`);
    }
    
    if (stillExists) {
      // 최종 확인: 삭제 후 데이터 다시 조회
      const finalCheck = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
      const finalRowData = finalCheck?.values?.find((row: string[]) => row && row[0] === budgetId);
      console.error('❌ 삭제 실패 - 최종 확인:', {
        budgetId,
        stillExists,
        finalRowData,
        totalRows: finalCheck?.values?.length || 0,
        targetRowNumber: actualSheetRowNumber
      });
      throw new Error('예산 계획 삭제에 실패했습니다. 시트를 직접 확인해주세요.');
    }

    console.log('✅ 예산 계획 삭제 완료:', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 삭제 오류:', error);
    throw error;
  }
};

