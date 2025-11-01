/**
 * @file accountingBudgetManager.ts
 * @brief 예산 계획 관리 유틸리티
 * @details 예산 계획의 작성, 승인, 집행을 관리합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import type { BudgetPlan, BudgetPlanDetail, CreateBudgetPlanRequest, UpdateBudgetPlanDetailsRequest, Account } from '../../types/features/accounting';
import { getAccounts } from './accountingManager';

// papyrus-db 설정
const setupPapyrusAuth = () => {
  if ((window as any).gapi && (window as any).gapi.client) {
    (window as any).papyrusAuth = {
      client: (window as any).gapi.client
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
 * 예산 계획 목록 조회
 */
export const getBudgetPlans = async (
  spreadsheetId: string,
  accountId?: string
): Promise<BudgetPlan[]> => {
  try {
    ensureAuth();
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    
    if (!data || !data.values || data.values.length <= 1) {
      return [];
    }

    return data.values.slice(1).map((row: any[]) => {
      const detailsJson = row[14] || '[]';
      let details: BudgetPlanDetail[] = [];
      try {
        details = JSON.parse(detailsJson);
      } catch (e) {
        console.warn('예산 계획 상세 파싱 오류:', e);
      }

      return {
        budgetId: row[0] || '',
        accountId: row[1] || '',
        title: row[2] || '',
        totalAmount: parseFloat(row[3] || '0'),
        requestedDate: row[4] || '',
        plannedExecutionDate: row[5] || '',
        status: (row[6] || 'pending') as BudgetPlan['status'],
        subManagerReviewed: row[7] === 'TRUE' || row[7] === true,
        subManagerReviewDate: row[8] || undefined,
        mainManagerApproved: row[9] === 'TRUE' || row[9] === true,
        mainManagerApprovalDate: row[10] || undefined,
        executedDate: row[11] || undefined,
        createdBy: row[12] || '',
        rejectionReason: row[13] || undefined,
        details
      };
    }).filter((plan: BudgetPlan) => {
      if (accountId) {
        return plan.budgetId && plan.accountId === accountId;
      }
      return plan.budgetId;
    });
    
  } catch (error) {
    console.error('❌ 예산 계획 목록 조회 오류:', error);
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
    const requestedDate = new Date().toISOString();

    const newBudgetPlan: BudgetPlan = {
      budgetId,
      accountId: request.accountId,
      title: request.title,
      totalAmount,
      requestedDate,
      plannedExecutionDate: request.plannedExecutionDate,
      status: 'pending',
      subManagerReviewed: false,
      mainManagerApproved: false,
      createdBy,
      details: (request.details || []).map((detail, index) => ({
        detailId: `${budgetId}_detail_${index}`,
        category: detail.category,
        description: detail.description,
        amount: detail.amount
      }))
    };

    ensureAuth();
    
    // 시트 헤더 순서: budget_id, account_id, title, total_amount, requested_date,
    // planned_execution_date, status, sub_manager_reviewed, sub_manager_review_date,
    // main_manager_approved, main_manager_approval_date, executed_date, created_by,
    // rejection_reason, details
    const budgetPlanRow = [
      newBudgetPlan.budgetId,                        // budget_id
      newBudgetPlan.accountId,                      // account_id
      newBudgetPlan.title,                          // title
      newBudgetPlan.totalAmount,                    // total_amount
      newBudgetPlan.requestedDate,                 // requested_date
      newBudgetPlan.plannedExecutionDate,          // planned_execution_date
      newBudgetPlan.status,                         // status
      'FALSE',                                      // sub_manager_reviewed
      '',                                           // sub_manager_review_date
      'FALSE',                                      // main_manager_approved
      '',                                           // main_manager_approval_date
      '',                                           // executed_date
      newBudgetPlan.createdBy,                      // created_by
      '',                                           // rejection_reason
      JSON.stringify(newBudgetPlan.details)        // details
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
    const rowIndex = budgetData.values.findIndex((row: any[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }
    
    const actualRowNumber = rowIndex + 1;
    
    // 배열 형식으로 각 열 업데이트 (papyrus-db update 사용)
    // status (G열), sub_manager_reviewed (H열), sub_manager_review_date (I열)
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `G${actualRowNumber}`, [['reviewed']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `H${actualRowNumber}`, [['TRUE']]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `I${actualRowNumber}`, [[reviewDate]]);

    console.log('✅ 예산 계획 검토 완료:', budgetId);
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
    const approvalDate = new Date().toISOString();
    
    // 스프레드시트에서 해당 행 찾아서 업데이트 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: any[]) => row[0] === budgetId);
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
  rejectionReason: string
): Promise<void> => {
  try {
    ensureAuth();
    
    // 스프레드시트에서 해당 행 찾아서 업데이트 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: any[]) => row[0] === budgetId);
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
    const executedDate = new Date().toISOString();

    // 예산 계획의 각 상세 항목을 장부 항목으로 추가
    for (const detail of plan.details) {
      await createLedgerEntry(
        spreadsheetId,
        {
          accountId: plan.accountId,
          date: plan.plannedExecutionDate,
          category: detail.category,
          description: `${plan.title} - ${detail.description}`,
          amount: detail.amount,
          source: plan.title,
          transactionType: 'expense' // 예산 계획은 보통 지출
        },
        executorId
      );
    }

    // 예산 계획 상태를 'executed'로 변경 (배열 형식으로)
    const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
    if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
      throw new Error('예산 계획 데이터를 찾을 수 없습니다.');
    }
    
    const rowIndex = budgetData.values.findIndex((row: any[]) => row[0] === budgetId);
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
    
    // 예산 계획 정보 가져오기
    const plans = await getBudgetPlans(spreadsheetId);
    const plan = plans.find(p => p.budgetId === budgetId);
    
    if (!plan) {
      throw new Error('예산 계획을 찾을 수 없습니다.');
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
    
    const rowIndex = budgetData.values.findIndex((row: any[]) => row[0] === budgetId);
    if (rowIndex === -1) {
      throw new Error('예산 계획을 시트에서 찾을 수 없습니다.');
    }

    const actualRowNumber = rowIndex + 1;

    // 새로운 details 생성 (detailId 포함)
    const newDetails = request.details.map((detail, index) => ({
      detailId: `${budgetId}_detail_${index}`,
      category: detail.category,
      description: detail.description,
      amount: detail.amount
    }));

    // total_amount (4번째 컬럼, D열)와 details (15번째 컬럼, O열) 업데이트
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `D${actualRowNumber}`, [[totalAmount]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `O${actualRowNumber}`, [[JSON.stringify(newDetails)]]);

    console.log('✅ 예산 계획 상세 업데이트 완료:', budgetId);
  } catch (error) {
    console.error('❌ 예산 계획 상세 업데이트 오류:', error);
    throw error;
  }
};

