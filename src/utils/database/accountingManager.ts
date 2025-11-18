/**
 * @file accountingManager.ts
 * @brief 회계 데이터 관리 유틸리티
 * @details Google Sheets를 사용하여 회계 데이터를 관리합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { getCacheManager } from '../cache/cacheManager';
import { generateCacheKey, getCacheTTL, getActionCategory } from '../cache/cacheUtils';
import { getDataSyncService } from '../../services/dataSyncService';
import type {
  Account,
  LedgerEntry,
  Category,
  CreateLedgerEntryRequest,
  UpdateLedgerEntryRequest
} from '../../types/features/accounting';
import type { SheetInfo } from '../../types/google';
import { ENV_CONFIG } from '../../config/environment';

// 시트 이름 상수
const ACCOUNTING_SHEETS = {
  ACCOUNT: '통장',
  LEDGER: '장부',
  BUDGET_PLAN: '예산계획',
  CATEGORY: '카테고리'
};

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
 * 증빙 폴더 ID 가져오기 (spreadsheetId로부터)
 */
export const getEvidenceFolderIdFromSpreadsheet = async (spreadsheetId: string): Promise<string | null> => {
  try {
    if (!window.gapi || !window.gapi.client) {
      console.warn('⚠️ Google API가 초기화되지 않았습니다.');
      return null;
    }

    const gapi = window.gapi.client;

    // 스프레드시트 파일의 부모 폴더 찾기
    const fileResponse = await gapi.drive.files.get({
      fileId: spreadsheetId,
      fields: 'parents'
    });

    const parents = fileResponse.result.parents;
    if (!parents || parents.length === 0) {
      return null;
    }

    const parentFolderId = parents[0];

    // 부모 폴더 내의 증빙 폴더 찾기
    const foldersResponse = await gapi.drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${ENV_CONFIG.EVIDENCE_FOLDER_NAME}' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1
    });

    if (foldersResponse.result.files && foldersResponse.result.files.length > 0) {
      return foldersResponse.result.files[0].id;
    }

    return null;
  } catch (error) {
    console.error('❌ 증빙 폴더 ID 조회 오류:', error);
    return null;
  }
};

/**
 * 증빙 문서를 Google Drive에 업로드
 */
export const uploadEvidenceFile = async (
  evidenceFolderId: string,
  file: File,
  entryId: string
): Promise<{ fileId: string; fileName: string }> => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API가 초기화되지 않았습니다.');
    }

    const gapi = window.gapi;
    const token = gapi.client.getToken();
    
    if (!token || !token.access_token) {
      throw new Error('Google 인증 토큰이 없습니다.');
    }

    // 파일명: 증빙_[날짜]_[항목ID].[확장자]
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `증빙_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${entryId}.${fileExtension}`;

    // 메타데이터
    const metadata = {
      name: fileName,
      parents: [evidenceFolderId]
    };

    // multipart 업로드를 위한 경계 문자열
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15);
    
    // multipart body 생성
    const metadataPart = `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n`;
    
    const filePart = `--${boundary}\r\n` +
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
    
    const closingBoundary = `\r\n--${boundary}--`;

    // 파일을 ArrayBuffer로 읽기
    const fileBuffer = await file.arrayBuffer();
    
    // 전체 body 구성: metadata + file + closing
    const metadataBuffer = new TextEncoder().encode(metadataPart);
    const filePartBuffer = new TextEncoder().encode(filePart);
    const fileContentBuffer = new Uint8Array(fileBuffer);
    const closingBuffer = new TextEncoder().encode(closingBoundary);
    
    // 모든 버퍼 합치기
    const totalLength = metadataBuffer.length + filePartBuffer.length + fileContentBuffer.length + closingBuffer.length;
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    combinedBuffer.set(metadataBuffer, offset);
    offset += metadataBuffer.length;
    combinedBuffer.set(filePartBuffer, offset);
    offset += filePartBuffer.length;
    combinedBuffer.set(fileContentBuffer, offset);
    offset += fileContentBuffer.length;
    combinedBuffer.set(closingBuffer, offset);

    // Google Drive API v3 multipart 업로드
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: combinedBuffer
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ 파일 업로드 응답 오류:', errorData);
      throw new Error(`파일 업로드 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ 증빙 문서 업로드 완료:', result);
    
    return {
      fileId: result.id,
      fileName: result.name
    };
  } catch (error: unknown) {
    console.error('❌ 증빙 문서 업로드 오류:', error);
    throw error;
  }
};

/**
 * 통장 목록 조회
 */
export const getAccounts = async (spreadsheetId: string): Promise<Account[]> => {
  const cacheManager = getCacheManager();
  const action = 'getAccounts';
  const category = getActionCategory(action);
  const cacheKey = generateCacheKey(category, action, { spreadsheetId });
  
  // 캐시에서 먼저 확인
  const cachedData = await cacheManager.get<Account[]>(cacheKey);
  if (cachedData) {
    console.log('💰 캐시에서 통장 목록 로드:', cachedData.length, '개');
    return cachedData;
  }

  try {
    ensureAuth();
    console.log('💰 통장 목록 로드 시작 (캐시 미스)...');
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT);
    
    if (!data || !data.values || data.values.length <= 1) {
      return [];
    }

    // 헤더 행 제외하고 데이터 파싱
    const accounts: Account[] = [];
    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      accounts.push({
        accountId: row[0] || '',
        accountName: row[1] || '',
        initialBalance: parseFloat(row[2] || '0'),
        currentBalance: parseFloat(row[3] || '0'),
        mainManagerId: row[4] || '',
        subManagerIds: row[5] ? JSON.parse(row[5]) : [],
        accessGroupEmails: row[6] ? JSON.parse(row[6]) : [],
        accessUserEmails: row[7] ? JSON.parse(row[7]) : [],
        createdBy: row[8] || '',
        createdDate: row[9] || '',
        isActive: row[10] === 'TRUE'
      });
    }

    console.log(`💰 통장 목록 로드 완료: ${accounts.length}개`);
    
    // 캐시에 저장
    const ttl = getCacheTTL(action);
    await cacheManager.set(cacheKey, accounts, ttl);
    console.log('💰 통장 목록 캐시 저장 완료 (TTL:', ttl / 1000 / 60, '분)');
    
    return accounts;
  } catch (error) {
    console.error('❌ 통장 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 장부 항목 추가
 */
export const createLedgerEntry = async (
  spreadsheetId: string,
  entryData: CreateLedgerEntryRequest,
  createdBy: string
): Promise<LedgerEntry> => {
  try {
    // 현재 통장의 마지막 잔액 조회
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === entryData.accountId);
    
    if (!account) {
      throw new Error('통장을 찾을 수 없습니다.');
    }

    const entryId = `entry_${Date.now()}`;
    const createdDate = new Date().toISOString();
    
    // 금액 처리 (지출은 음수로 변환)
    const amount = entryData.transactionType === 'expense' 
      ? -Math.abs(entryData.amount)
      : Math.abs(entryData.amount);
    
    // 거래 후 잔액 계산
    const balanceAfter = account.currentBalance + amount;

    // 증빙 문서 업로드 (있는 경우)
    let evidenceFileId: string | undefined;
    let evidenceFileName: string | undefined;

    if (entryData.evidenceFile) {
      try {
        // 증빙 폴더 ID 가져오기
        const evidenceFolderId = await getEvidenceFolderIdFromSpreadsheet(spreadsheetId);
        
        if (!evidenceFolderId) {
          console.warn('⚠️ 증빙 폴더를 찾을 수 없습니다. 파일 업로드를 건너뜁니다.');
        } else {
          // 파일 업로드
          const uploadResult = await uploadEvidenceFile(evidenceFolderId, entryData.evidenceFile, entryId);
          evidenceFileId = uploadResult.fileId;
          evidenceFileName = uploadResult.fileName;
          console.log('✅ 증빙 문서 업로드 완료:', uploadResult);
        }
      } catch (uploadError: unknown) {
        console.error('❌ 증빙 문서 업로드 실패:', uploadError);
        // 파일 업로드 실패해도 장부 항목은 추가하도록 계속 진행
        console.warn('⚠️ 증빙 문서 업로드 실패했지만 장부 항목 추가는 계속 진행합니다.');
      }
    }

    // 통장 잔액 업데이트 (배열 형식으로)
    ensureAuth();
    try {
      console.log('💰 통장 잔액 업데이트 시도:', {
        accountId: account.accountId,
        currentBalance: account.currentBalance,
        balanceAfter: balanceAfter
      });
      
      // 통장 데이터 조회하여 행 번호 찾기
      const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT);
      if (!accountData || !accountData.values || accountData.values.length <= 1) {
        throw new Error('통장 데이터를 찾을 수 없습니다.');
      }
      
      // account_id가 일치하는 행 찾기
      const rowIndex = accountData.values.findIndex((row: string[]) => row[0] === account.accountId);
      if (rowIndex === -1) {
        throw new Error('통장을 시트에서 찾을 수 없습니다.');
      }
      
      // current_balance는 4번째 컬럼 (인덱스 3, D열)
      const actualRowNumber = rowIndex + 1;
      
      // 배열 형식으로 update (papyrus-db는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만)
      await update(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT, `D${actualRowNumber}`, [[balanceAfter]]);
      
      console.log('✅ 통장 잔액 업데이트 완료');
    } catch (updateError: unknown) {
      const error = updateError as { message?: string; code?: number; status?: number; result?: unknown; error?: unknown };
      console.error('❌ 통장 잔액 업데이트 오류:', updateError);
      console.error('❌ 업데이트 오류 상세:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        result: error?.result,
        error: error?.error
      });
      // 잔액 업데이트 실패해도 장부 항목은 추가되도록 계속 진행
      // (나중에 수동으로 잔액을 수정할 수 있음)
      console.warn('⚠️ 통장 잔액 업데이트 실패했지만 장부 항목 추가는 계속 진행합니다.');
    }

    const isBudgetExecuted = !!(entryData.budgetPlanId && entryData.budgetPlanTitle);
    
    const newEntry: LedgerEntry = {
      entryId,
      accountId: entryData.accountId,
      date: entryData.date,
      category: entryData.category,
      description: entryData.description,
      amount,
      balanceAfter,
      source: entryData.source,
      transactionType: entryData.transactionType,
      evidenceFileId,
      evidenceFileName,
      createdBy,
      createdDate,
      isBudgetExecuted,
      budgetPlanId: entryData.budgetPlanId,
      budgetPlanTitle: entryData.budgetPlanTitle
    };

    // 스프레드시트에 추가
    ensureAuth();
    
    // 시트 헤더 순서: entry_id, account_id, date, category, description, amount, balance_after, 
    // source, transaction_type, evidence_file_id, evidence_file_name, created_by, created_date, 
    // is_budget_executed, budget_plan_id, budget_plan_title
    const ledgerRow = [
      newEntry.entryId,                    // entry_id
      newEntry.accountId,                  // account_id
      newEntry.date,                       // date
      newEntry.category,                   // category
      newEntry.description,                // description
      newEntry.amount,                     // amount
      newEntry.balanceAfter,               // balance_after
      newEntry.source,                     // source
      newEntry.transactionType,            // transaction_type
      newEntry.evidenceFileId || '',      // evidence_file_id
      newEntry.evidenceFileName || '',     // evidence_file_name
      newEntry.createdBy,                  // created_by
      newEntry.createdDate,                // created_date
      isBudgetExecuted ? 'TRUE' : 'FALSE', // is_budget_executed
      newEntry.budgetPlanId || '',        // budget_plan_id
      newEntry.budgetPlanTitle || ''       // budget_plan_title
    ];
    
    // 배열 형식으로 append (papyrus-db는 2차원 배열을 기대함)
    await append(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, [ledgerRow]);

    // 카테고리 사용 횟수 증가
    await updateCategoryUsageCount(spreadsheetId, entryData.category, 1);

    // 저장 후 정렬 및 잔액 재계산
    try {
      const allEntries = await getLedgerEntries(spreadsheetId, entryData.accountId);
      // 날짜순으로 정렬, 날짜가 같으면 생성일 기준으로 정렬
      const sortedEntries = [...allEntries].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // 날짜가 다르면 날짜순으로 정렬
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // 날짜가 같으면 생성일 기준으로 정렬
        const createdA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const createdB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return createdA - createdB;
      });

      // 정렬된 순서대로 잔액 재계산
      let runningBalance = account.initialBalance;
      
      for (const entry of sortedEntries) {
        runningBalance += entry.amount;
        
        // balanceAfter 업데이트
        const entryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
        const entryRowIndex = entryData.values.findIndex((row: string[]) => row[0] === entry.entryId);
        if (entryRowIndex !== -1) {
          await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `G${entryRowIndex + 1}`, [[runningBalance]]);
        }
      }

      // 통장 잔액 업데이트 (마지막 항목의 balanceAfter)
      const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT);
      if (accountData && accountData.values && accountData.values.length > 1) {
        const accountRowIndex = accountData.values.findIndex((row: string[]) => row[0] === account.accountId);
        if (accountRowIndex !== -1) {
          const finalBalance = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].balanceAfter : account.initialBalance;
          await update(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT, `D${accountRowIndex + 1}`, [[finalBalance]]);
        }
      }
    } catch (sortError) {
      console.error('❌ 정렬 및 잔액 재계산 오류:', sortError);
      console.warn('⚠️ 정렬 실패했지만 장부 항목은 추가되었습니다.');
    }

    console.log('✅ 장부 항목 추가 완료:', entryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getLedgerEntries', { spreadsheetId, accountId: entryData.accountId }),
        generateCacheKey('accounting', 'getAccounts', { spreadsheetId }),
        'accounting:getLedgerEntries:*', // 와일드카드로 모든 장부 항목 캐시 무효화
        'accounting:getAccounts:*' // 와일드카드로 모든 통장 캐시 무효화
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }
    
    return newEntry;

  } catch (error) {
    console.error('❌ 장부 항목 추가 오류:', error);
    throw error;
  }
};

/**
 * 장부 항목 수정
 */
export const updateLedgerEntry = async (
  spreadsheetId: string,
  entryId: string,
  entryData: UpdateLedgerEntryRequest
): Promise<LedgerEntry> => {
  try {
    ensureAuth();

    // 기존 항목 조회
    const entries = await getLedgerEntries(spreadsheetId, entryData.accountId);
    const existingEntry = entries.find(e => e.entryId === entryId);
    
    if (!existingEntry) {
      throw new Error('장부 항목을 찾을 수 없습니다.');
    }

    // 예산안으로 생성된 항목은 수정 불가
    if (existingEntry.isBudgetExecuted && existingEntry.budgetPlanId) {
      throw new Error('예산안으로 생성된 항목은 수정할 수 없습니다.');
    }

    // 통장 정보 조회
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === entryData.accountId);
    
    if (!account) {
      throw new Error('통장을 찾을 수 없습니다.');
    }

    // 금액 처리 (지출은 음수로 변환)
    const updatedAmount = entryData.transactionType === 'expense' 
      ? -Math.abs(entryData.amount)
      : Math.abs(entryData.amount);

    // 기존 항목의 금액을 되돌리고, 새로운 금액을 적용
    const balanceBeforeEntry = account.currentBalance - existingEntry.amount;
    const balanceAfter = balanceBeforeEntry + updatedAmount;

    // 업데이트할 값들
    const updatedDate = entryData.date;
    const updatedCategory = entryData.category;
    const updatedDescription = entryData.description;
    const updatedSource = entryData.source;
    const updatedTransactionType = entryData.transactionType;

    // 증빙 문서 업로드 (새 파일이 있는 경우)
    let evidenceFileId = existingEntry.evidenceFileId;
    let evidenceFileName = existingEntry.evidenceFileName;

    if (entryData.evidenceFile) {
      try {
        // 증빙 폴더 ID 가져오기
        const evidenceFolderId = await getEvidenceFolderIdFromSpreadsheet(spreadsheetId);
        
        if (!evidenceFolderId) {
          console.warn('⚠️ 증빙 폴더를 찾을 수 없습니다. 파일 업로드를 건너뜁니다.');
        } else {
          // 파일 업로드
          const uploadResult = await uploadEvidenceFile(evidenceFolderId, entryData.evidenceFile, entryId);
          evidenceFileId = uploadResult.fileId;
          evidenceFileName = uploadResult.fileName;
          console.log('✅ 증빙 문서 업로드 완료:', uploadResult);
        }
      } catch (uploadError: unknown) {
        console.error('❌ 증빙 문서 업로드 실패:', uploadError);
        console.warn('⚠️ 증빙 문서 업로드 실패했지만 장부 항목 수정은 계속 진행합니다.');
      }
    }

    // 시트에서 해당 행 찾기
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
    if (!data || !data.values || data.values.length <= 1) {
      throw new Error('장부 데이터를 찾을 수 없습니다.');
    }

    const rowIndex = data.values.findIndex((row: string[]) => row[0] === entryId);
    if (rowIndex === -1) {
      throw new Error('장부 항목을 시트에서 찾을 수 없습니다.');
    }

    const actualRowNumber = rowIndex + 1;

    // 장부 항목 업데이트
    const updatedEntry: LedgerEntry = {
      ...existingEntry,
      date: updatedDate,
      category: updatedCategory,
      description: updatedDescription,
      amount: updatedAmount,
      balanceAfter,
      source: updatedSource,
      transactionType: updatedTransactionType,
      evidenceFileId,
      evidenceFileName
    };

    // 시트 헤더 순서: entry_id, account_id, date, category, description, amount, balance_after,
    // source, transaction_type, evidence_file_id, evidence_file_name, created_by, created_date,
    // is_budget_executed, budget_plan_id
    // papyrus-db update는 두 번째 인자로 시트명을 받으므로, range에는 셀 주소만 포함
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `C${actualRowNumber}`, [[updatedDate]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `D${actualRowNumber}`, [[updatedCategory]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `E${actualRowNumber}`, [[updatedDescription]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `F${actualRowNumber}`, [[updatedAmount]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `G${actualRowNumber}`, [[balanceAfter]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `H${actualRowNumber}`, [[updatedSource]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `I${actualRowNumber}`, [[updatedTransactionType]]);
    
    // 증빙 문서 정보 업데이트 (있는 경우)
    if (evidenceFileId) {
      await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `J${actualRowNumber}`, [[evidenceFileId]]);
      await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `K${actualRowNumber}`, [[evidenceFileName || '']]);
    }

    // 통장 잔액 업데이트
    const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT);
    if (!accountData || !accountData.values || accountData.values.length <= 1) {
      throw new Error('통장 데이터를 찾을 수 없습니다.');
    }

    const accountRowIndex = accountData.values.findIndex((row: string[]) => row[0] === account.accountId);
    if (accountRowIndex === -1) {
      throw new Error('통장을 시트에서 찾을 수 없습니다.');
    }

    // 수정된 항목 이후의 모든 항목들의 balanceAfter 재계산
    const allEntries = await getLedgerEntries(spreadsheetId, entryData.accountId);
    // 날짜순으로 정렬, 날짜가 같으면 생성일 기준으로 정렬
    const sortedEntries = [...allEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // 날짜가 다르면 날짜순으로 정렬
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // 날짜가 같으면 생성일 기준으로 정렬
      const createdA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const createdB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return createdA - createdB;
    });

    const entryIndex = sortedEntries.findIndex(e => e.entryId === entryId);
    if (entryIndex !== -1) {
      // 수정된 항목의 balanceAfter 업데이트
      const previousBalance = entryIndex > 0 ? sortedEntries[entryIndex - 1].balanceAfter : account.initialBalance;
      let runningBalance = previousBalance;

      // 수정된 항목의 잔액 계산
      if (sortedEntries[entryIndex].transactionType === 'expense') {
        runningBalance -= Math.abs(sortedEntries[entryIndex].amount);
      } else {
        runningBalance += sortedEntries[entryIndex].amount;
      }

      // 수정된 항목의 balanceAfter 업데이트
      await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `G${actualRowNumber}`, [[runningBalance]]);

      // 이후 항목들의 balanceAfter 재계산
      for (let i = entryIndex + 1; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        if (entry.transactionType === 'expense') {
          runningBalance -= Math.abs(entry.amount);
        } else {
          runningBalance += entry.amount;
        }

        // balanceAfter 업데이트
        const entryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
        const entryRowIndex = entryData.values.findIndex((row: string[]) => row[0] === entry.entryId);
        if (entryRowIndex !== -1) {
          await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `G${entryRowIndex + 1}`, [[runningBalance]]);
        }
      }

      // 통장 잔액 업데이트 (마지막 항목의 balanceAfter)
      const finalBalance = sortedEntries[sortedEntries.length - 1].balanceAfter;
      await update(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT, `D${accountRowIndex + 1}`, [[finalBalance]]);
    }

    // 카테고리 사용 횟수 업데이트 (카테고리가 변경된 경우)
    if (existingEntry.category !== updatedCategory) {
      // 기존 카테고리 사용 횟수 감소
      await updateCategoryUsageCount(spreadsheetId, existingEntry.category, -1);
      // 새 카테고리 사용 횟수 증가
      await updateCategoryUsageCount(spreadsheetId, updatedCategory, 1);
    }

    console.log('✅ 장부 항목 수정 완료:', entryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getLedgerEntries', { spreadsheetId, accountId: entryData.accountId }),
        generateCacheKey('accounting', 'getAccounts', { spreadsheetId }),
        'accounting:getLedgerEntries:*', // 와일드카드로 모든 장부 항목 캐시 무효화
        'accounting:getAccounts:*' // 와일드카드로 모든 통장 캐시 무효화
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }
    
    return updatedEntry;

  } catch (error) {
    console.error('❌ 장부 항목 수정 오류:', error);
    throw error;
  }
};

/**
 * 장부 항목 삭제
 */
export const deleteLedgerEntry = async (
  spreadsheetId: string,
  entryId: string,
  accountId: string
): Promise<void> => {
  try {
    ensureAuth();

    // 기존 항목 조회
    const entries = await getLedgerEntries(spreadsheetId, accountId);
    const entry = entries.find(e => e.entryId === entryId);
    
    if (!entry) {
      throw new Error('장부 항목을 찾을 수 없습니다.');
    }

    // 예산안으로 생성된 항목은 삭제 불가
    if (entry.isBudgetExecuted && entry.budgetPlanId) {
      throw new Error('예산안으로 생성된 항목은 삭제할 수 없습니다.');
    }

    // 통장 정보 조회
    const accounts = await getAccounts(spreadsheetId);
    const account = accounts.find(acc => acc.accountId === accountId);
    
    if (!account) {
      throw new Error('통장을 찾을 수 없습니다.');
    }

    // 시트에서 해당 행 찾기
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
    if (!data || !data.values || data.values.length <= 1) {
      throw new Error('장부 데이터를 찾을 수 없습니다.');
    }

    const rowIndex = data.values.findIndex((row: string[]) => row[0] === entryId);
    if (rowIndex === -1) {
      throw new Error('장부 항목을 시트에서 찾을 수 없습니다.');
    }

    // 시트 이름을 시트 ID로 변환
    const sheetId = await getSheetId(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
    if (sheetId === null) {
      throw new Error('장부 시트 ID를 찾을 수 없습니다.');
    }

    // 카테고리 사용 횟수 감소 (삭제 전에 수행)
    await updateCategoryUsageCount(spreadsheetId, entry.category, -1);

    // 행 삭제
    const { deleteRow } = await import('papyrus-db');
    await deleteRow(spreadsheetId, sheetId, rowIndex + 1);

    // 삭제 후 남은 항목들의 balanceAfter 재계산
    const remainingEntries = await getLedgerEntries(spreadsheetId, accountId);
    // 날짜순으로 정렬, 날짜가 같으면 생성일 기준으로 정렬
    const sortedEntries = [...remainingEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // 날짜가 다르면 날짜순으로 정렬
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // 날짜가 같으면 생성일 기준으로 정렬
      const createdA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const createdB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return createdA - createdB;
    });

    let currentBalance = account.initialBalance;
    
    // 모든 항목의 balanceAfter 재계산
    for (const entry of sortedEntries) {
      currentBalance += entry.amount;
      
      // balanceAfter 업데이트
      const entryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
      const entryRowIndex = entryData.values.findIndex((row: string[]) => row[0] === entry.entryId);
      if (entryRowIndex !== -1) {
        await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `G${entryRowIndex + 1}`, [[currentBalance]]);
      }
    }

    // 통장 잔액 업데이트
    const accountData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT);
    if (!accountData || !accountData.values || accountData.values.length <= 1) {
      throw new Error('통장 데이터를 찾을 수 없습니다.');
    }
    
    const accountRowIndex = accountData.values.findIndex((row: string[]) => row[0] === account.accountId);
    if (accountRowIndex !== -1) {
      await update(spreadsheetId, ACCOUNTING_SHEETS.ACCOUNT, `D${accountRowIndex + 1}`, [[currentBalance]]);
    }

    console.log('✅ 장부 항목 삭제 완료:', entryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getLedgerEntries', { spreadsheetId, accountId }),
        generateCacheKey('accounting', 'getAccounts', { spreadsheetId }),
        'accounting:getLedgerEntries:*', // 와일드카드로 모든 장부 항목 캐시 무효화
        'accounting:getAccounts:*' // 와일드카드로 모든 통장 캐시 무효화
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }

  } catch (error) {
    console.error('❌ 장부 항목 삭제 오류:', error);
    throw error;
  }
};

/**
 * 장부 항목 목록 조회
 */
export const getLedgerEntries = async (
  spreadsheetId: string,
  accountId: string,
  filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    transactionType?: 'income' | 'expense';
    searchTerm?: string;
  }
): Promise<LedgerEntry[]> => {
  try {
    ensureAuth();
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
    
    if (!data || !data.values || data.values.length <= 1) {
      return [];
    }

    // 헤더 행 제외하고 데이터 파싱
    const entries: LedgerEntry[] = [];
    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      const entry: LedgerEntry = {
        entryId: row[0] || '',
        accountId: row[1] || '',
        date: row[2] || '',
        category: row[3] || '',
        description: row[4] || '',
        amount: parseFloat(row[5] || '0'),
        balanceAfter: parseFloat(row[6] || '0'),
        source: row[7] || '',
        transactionType: (row[8] === 'income' || row[8] === 'expense') ? row[8] : 'expense',
        evidenceFileId: row[9] || undefined,
        evidenceFileName: row[10] || undefined,
        createdBy: row[11] || '',
        createdDate: row[12] || '',
        isBudgetExecuted: row[13] === 'TRUE',
        budgetPlanId: row[14] || undefined,
        budgetPlanTitle: row[15] || undefined
      };

      // accountId 필터
      if (entry.accountId !== accountId) {
        continue;
      }

      // 필터 적용
      if (filters) {
        if (filters.category && entry.category !== filters.category) {
          continue;
        }
        if (filters.startDate) {
          const entryDate = new Date(entry.date).getTime();
          const startDate = new Date(filters.startDate).getTime();
          if (isNaN(entryDate) || isNaN(startDate) || entryDate < startDate) {
            continue;
          }
        }
        if (filters.endDate) {
          const entryDate = new Date(entry.date).getTime();
          const endDate = new Date(filters.endDate).getTime();
          if (isNaN(entryDate) || isNaN(endDate) || entryDate > endDate) {
            continue;
          }
        }
        if (filters.transactionType && entry.transactionType !== filters.transactionType) {
          continue;
        }
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesDescription = entry.description.toLowerCase().includes(searchLower);
          const matchesSource = entry.source.toLowerCase().includes(searchLower);
          const matchesAmount = Math.abs(entry.amount).toString().includes(searchLower);
          if (!matchesDescription && !matchesSource && !matchesAmount) {
            continue;
          }
        }
      }

      entries.push(entry);
    }

    // 날짜순 정렬
    entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.entryId.localeCompare(b.entryId);
    });

    return entries;
  } catch (error) {
    console.error('❌ 장부 항목 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 카테고리 목록 조회
 */
export const getCategories = async (spreadsheetId: string): Promise<Category[]> => {
  const cacheManager = getCacheManager();
  const action = 'getAccountingCategories';
  const category = getActionCategory(action);
  const cacheKey = generateCacheKey(category, action, { spreadsheetId });
  
  // 캐시에서 먼저 확인
  const cachedData = await cacheManager.get<Category[]>(cacheKey);
  if (cachedData) {
    console.log('📂 캐시에서 카테고리 목록 로드:', cachedData.length, '개');
    return cachedData;
  }

  try {
    ensureAuth();
    console.log('📂 카테고리 목록 로드 시작 (캐시 미스)...');
    const data = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY);
    
    if (!data || !data.values || data.values.length <= 1) {
      return [];
    }

    // 헤더 행 제외하고 데이터 파싱
    const categories: Category[] = [];
    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      categories.push({
        categoryId: row[0] || '',
        categoryName: row[1] || '',
        description: row[2] || '',
        createdBy: row[3] || '',
        createdDate: row[4] || '',
        isActive: row[5] === 'TRUE',
        usageCount: parseInt(row[6] || '0', 10)
      });
    }

    const filteredCategories = categories.filter(cat => cat.isActive);
    console.log(`📂 카테고리 목록 로드 완료: ${filteredCategories.length}개`);
    
    // 캐시에 저장
    const ttl = getCacheTTL(action);
    await cacheManager.set(cacheKey, filteredCategories, ttl);
    console.log('📂 카테고리 목록 캐시 저장 완료 (TTL:', ttl / 1000 / 60, '분)');
    
    return filteredCategories;
  } catch (error) {
    console.error('❌ 카테고리 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 카테고리 사용 횟수 업데이트
 */
const updateCategoryUsageCount = async (
  spreadsheetId: string,
  categoryName: string,
  increment: number
): Promise<void> => {
  try {
    if (!categoryName || categoryName.trim() === '') {
      return; // 카테고리가 없으면 업데이트하지 않음
    }

    const categoryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY);
    if (!categoryData || !categoryData.values || categoryData.values.length <= 1) {
      return; // 카테고리 데이터가 없으면 업데이트하지 않음
    }

    // 카테고리 찾기
    const categoryRowIndex = categoryData.values.findIndex(
      (row: string[], index: number) => index > 0 && row[1] === categoryName
    );

    if (categoryRowIndex === -1) {
      console.warn(`⚠️ 카테고리를 찾을 수 없습니다: ${categoryName}`);
      return; // 카테고리를 찾을 수 없으면 업데이트하지 않음
    }

    const actualRowNumber = categoryRowIndex + 1;
    const currentUsageCount = parseInt(categoryData.values[categoryRowIndex][6] || '0', 10);
    const newUsageCount = Math.max(0, currentUsageCount + increment); // 음수 방지

    // 사용 횟수 업데이트 (G열, 7번째 컬럼)
    await update(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY, `G${actualRowNumber}`, [[newUsageCount]]);
    
    console.log(`✅ 카테고리 사용 횟수 업데이트: ${categoryName} (${currentUsageCount} → ${newUsageCount})`);
  } catch (error) {
    console.error(`❌ 카테고리 사용 횟수 업데이트 오류 (${categoryName}):`, error);
    // 오류가 발생해도 계속 진행 (카테고리 업데이트 실패는 치명적이지 않음)
  }
};

/**
 * 카테고리 생성
 */
export const createCategory = async (
  spreadsheetId: string,
  categoryName: string,
  description: string,
  createdBy: string
): Promise<Category> => {
  try {
    ensureAuth();

    const categoryId = `cat_${Date.now()}`;
    const createdDate = new Date().toISOString();

    // 시트 헤더 순서: category_id, category_name, description, created_by, created_date, is_active, usage_count
    const categoryRow = [
      categoryId,
      categoryName,
      description || '',
      createdBy,
      createdDate,
      'TRUE',
      0
    ];

    // 배열 형식으로 append (papyrus-db는 2차원 배열을 기대함)
    await append(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY, [categoryRow]);

    const newCategory: Category = {
      categoryId,
      categoryName,
      description: description || '',
      createdBy,
      createdDate,
      isActive: true,
      usageCount: 0
    };

    console.log('✅ 카테고리 생성 완료:', categoryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getAccountingCategories', { spreadsheetId }),
        'accounting:getAccountingCategories:*' // 와일드카드로 모든 카테고리 캐시 무효화
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }
    
    return newCategory;

  } catch (error: unknown) {
    console.error('❌ 카테고리 생성 오류:', error);
    
    // 더 자세한 오류 정보 로깅
    const err = error as { result?: { error?: unknown }; body?: string };
    if (err.result && err.result.error) {
      console.error('❌ 오류 상세:', err.result.error);
    }
    if (err.body) {
      try {
        const errorBody = JSON.parse(err.body);
        console.error('❌ 오류 본문:', errorBody);
      } catch (e) {
        console.error('❌ 오류 본문 (파싱 실패):', err.body);
      }
    }

    throw error;
  }
};

/**
 * 카테고리 수정 (장부 항목과 예산안의 카테고리도 함께 업데이트)
 */
export const updateCategory = async (
  spreadsheetId: string,
  categoryId: string,
  newCategoryName: string,
  newDescription: string
): Promise<void> => {
  try {
    ensureAuth();

    // 기존 카테고리 정보 가져오기
    const categories = await getCategories(spreadsheetId);
    const category = categories.find(cat => cat.categoryId === categoryId);
    
    if (!category) {
      throw new Error('카테고리를 찾을 수 없습니다.');
    }

    const oldCategoryName = category.categoryName;

    // 중복 체크 (자기 자신 제외)
    if (categories.some(cat => 
      cat.categoryId !== categoryId && 
      cat.categoryName.toLowerCase() === newCategoryName.trim().toLowerCase()
    )) {
      throw new Error('이미 존재하는 카테고리 이름입니다.');
    }

    // 카테고리 이름이 변경된 경우에만 장부 항목과 예산안 업데이트
    if (oldCategoryName !== newCategoryName.trim()) {
      // 모든 통장의 장부 항목에서 해당 카테고리 찾아서 업데이트
      const accounts = await getAccounts(spreadsheetId);
      
      for (const account of accounts) {
        const entries = await getLedgerEntries(spreadsheetId, account.accountId);
        const entriesToUpdate = entries.filter(entry => entry.category === oldCategoryName);
        
        if (entriesToUpdate.length > 0) {
          console.log(`📝 장부 항목 카테고리 업데이트: ${oldCategoryName} → ${newCategoryName} (${entriesToUpdate.length}개)`);
          
          // 장부 시트 데이터 가져오기
          const ledgerData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.LEDGER);
          if (!ledgerData || !ledgerData.values || ledgerData.values.length <= 1) {
            continue;
          }

          // 각 항목 업데이트
          for (const entry of entriesToUpdate) {
            const rowIndex = ledgerData.values.findIndex((row: string[]) => row[0] === entry.entryId);
            if (rowIndex !== -1) {
              const actualRowNumber = rowIndex + 1;
              // 카테고리는 D열 (4번째 컬럼, 인덱스 3)
              await update(spreadsheetId, ACCOUNTING_SHEETS.LEDGER, `D${actualRowNumber}`, [[newCategoryName.trim()]]);
            }
          }
        }
      }

      // 예산안의 상세 항목에서 해당 카테고리 찾아서 업데이트
      const { getBudgetPlans } = await import('./accountingBudgetManager');
      const budgetPlans = await getBudgetPlans(spreadsheetId);
      
      const plansToUpdate = budgetPlans.filter(plan => 
        plan.details.some(detail => detail.category === oldCategoryName)
      );

      if (plansToUpdate.length > 0) {
        console.log(`📝 예산안 카테고리 업데이트: ${oldCategoryName} → ${newCategoryName} (${plansToUpdate.length}개)`);
        
        // 예산안 시트 데이터 가져오기
        const budgetData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN);
        if (!budgetData || !budgetData.values || budgetData.values.length <= 1) {
          throw new Error('예산안 데이터를 찾을 수 없습니다.');
        }

        // 각 예산안 업데이트
        for (const plan of plansToUpdate) {
          const rowIndex = budgetData.values.findIndex((row: string[]) => row[0] === plan.budgetId);
          if (rowIndex !== -1) {
            const actualRowNumber = rowIndex + 1;
            
            // 상세 항목 업데이트 (카테고리 변경)
            const updatedDetails = plan.details.map(detail => ({
              ...detail,
              category: detail.category === oldCategoryName ? newCategoryName.trim() : detail.category
            }));
            
            // details는 O열 (15번째 컬럼, 인덱스 14)
            await update(spreadsheetId, ACCOUNTING_SHEETS.BUDGET_PLAN, `O${actualRowNumber}`, [[JSON.stringify(updatedDetails)]]);
          }
        }
      }
    }

    // 카테고리 정보 업데이트
    const categoryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY);
    if (!categoryData || !categoryData.values || categoryData.values.length <= 1) {
      throw new Error('카테고리 데이터를 찾을 수 없습니다.');
    }

    const categoryRowIndex = categoryData.values.findIndex((row: string[]) => row[0] === categoryId);
    if (categoryRowIndex === -1) {
      throw new Error('카테고리를 시트에서 찾을 수 없습니다.');
    }

    const actualRowNumber = categoryRowIndex + 1;
    
    // 카테고리 이름 (B열), 설명 (C열) 업데이트
    await update(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY, `B${actualRowNumber}`, [[newCategoryName.trim()]]);
    await update(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY, `C${actualRowNumber}`, [[newDescription.trim()]]);

    console.log('✅ 카테고리 수정 완료:', categoryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getAccountingCategories', { spreadsheetId }),
        'accounting:getAccountingCategories:*', // 와일드카드로 모든 카테고리 캐시 무효화
        'accounting:getLedgerEntries:*' // 카테고리 이름이 변경되면 장부 항목도 영향받을 수 있음
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }
  } catch (error: unknown) {
    console.error('❌ 카테고리 수정 오류:', error);
    throw error;
  }
};

/**
 * 카테고리 삭제 (사용 중인 경우 삭제 불가)
 */
export const deleteCategory = async (
  spreadsheetId: string,
  categoryId: string
): Promise<void> => {
  try {
    ensureAuth();

    // 기존 카테고리 정보 가져오기
    const categories = await getCategories(spreadsheetId);
    const category = categories.find(cat => cat.categoryId === categoryId);
    
    if (!category) {
      throw new Error('카테고리를 찾을 수 없습니다.');
    }

    // 사용 중인지 확인
    if (category.usageCount > 0) {
      throw new Error(`카테고리 "${category.categoryName}"는 ${category.usageCount}개의 항목에서 사용 중이므로 삭제할 수 없습니다.`);
    }

    // 카테고리 비활성화 (실제 삭제 대신 is_active를 FALSE로 설정)
    const categoryData = await getSheetData(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY);
    if (!categoryData || !categoryData.values || categoryData.values.length <= 1) {
      throw new Error('카테고리 데이터를 찾을 수 없습니다.');
    }

    const categoryRowIndex = categoryData.values.findIndex((row: string[]) => row[0] === categoryId);
    if (categoryRowIndex === -1) {
      throw new Error('카테고리를 시트에서 찾을 수 없습니다.');
    }

    const actualRowNumber = categoryRowIndex + 1;
    
    // is_active를 FALSE로 설정 (F열, 6번째 컬럼, 인덱스 5)
    await update(spreadsheetId, ACCOUNTING_SHEETS.CATEGORY, `F${actualRowNumber}`, [['FALSE']]);

    console.log('✅ 카테고리 삭제 완료:', categoryId);
    
    // 캐시 무효화 및 백그라운드 갱신
    try {
      const dataSyncService = getDataSyncService();
      const cacheKeys = [
        generateCacheKey('accounting', 'getAccountingCategories', { spreadsheetId }),
        'accounting:getAccountingCategories:*' // 와일드카드로 모든 카테고리 캐시 무효화
      ];
      await dataSyncService.invalidateAndRefresh(cacheKeys);
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
    }
  } catch (error: unknown) {
    console.error('❌ 카테고리 삭제 오류:', error);
    throw error;
  }
};
