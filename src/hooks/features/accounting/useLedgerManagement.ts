/**
 * @file useLedgerManagement.ts
 * @brief 장부 관리 훅
 * @details 장부 목록 조회 및 관리 기능을 제공합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useCallback } from 'react';
import { getLedgerFolders, getLedgerInfo } from '../../../utils/google/accountingFolderManager';
import { apiClient } from '../../../utils/api/apiClient';
import type { LedgerInfo, CreateLedgerRequest, LedgerResponse } from '../../../types/features/accounting';
import { ENV_CONFIG } from '../../../config/environment';

export const useLedgerManagement = () => {
  const [ledgers, setLedgers] = useState<LedgerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 장부 목록 새로고침
   */
  const refreshLedgers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Apps Script를 통해 장부 목록 조회 (회계 폴더 ID 문제 회피)
      console.log('📋 Apps Script를 통해 장부 목록 조회 시작...');
      const response = await apiClient.getLedgerList();
      
      if (response.success && response.data) {
        console.log('✅ 장부 목록 조회 성공:', response.data.length, '개');
        // Apps Script 응답을 LedgerInfo 형식으로 변환
        const ledgers: LedgerInfo[] = response.data.map((ledger: LedgerResponse) => ({
          folderId: ledger.folderId || '',
          folderName: ledger.folderName || '',
          spreadsheetId: ledger.spreadsheetId || '',
          evidenceFolderId: ledger.evidenceFolderId || '',
          createdDate: ledger.createdDate || ''
        }));
        setLedgers(ledgers);
      } else {
        console.warn('⚠️ Apps Script 응답에서 장부 목록을 찾을 수 없습니다.');
        console.warn('⚠️ 응답:', response);
        setLedgers([]);
      }
      
    } catch (err: unknown) {
      console.error('❌ 장부 목록 조회 오류:', err);
      const error = err as { message?: string; status?: number };
      const errorMessage = error?.message || '장부 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      
      // 403 권한 오류인 경우 특별 처리
      if (error?.status === 403 || error?.message?.includes('PERMISSION_DENIED')) {
        setError('Google Drive 권한이 없습니다. 권한을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 장부 생성
   */
  const createLedger = useCallback(async (request: CreateLedgerRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userInfo = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('user') || '{}') 
        : {};
      
      const response = await apiClient.createLedger({
        ledgerName: request.ledgerName,
        creatorEmail: userInfo.email || '',
        accessUsers: request.accessUsers,
        accessGroups: request.accessGroups,
        mainManagerEmail: request.mainManagerEmail,
        subManagerEmails: request.subManagerEmails
      });

      if (!response.success) {
        throw new Error(response.message || '장부 생성에 실패했습니다.');
      }

      // 장부 목록 새로고침
      await refreshLedgers();
      
      return response.data;
      
    } catch (err: unknown) {
      console.error('❌ 장부 생성 오류:', err);
      const error = err as { message?: string };
      setError(error.message || '장부 생성에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshLedgers]);

  /**
   * 특정 장부 정보 조회
   */
  const getLedger = useCallback(async (folderId: string): Promise<LedgerInfo | null> => {
    try {
      return await getLedgerInfo(folderId);
    } catch (err) {
      console.error('❌ 장부 정보 조회 오류:', err);
      return null;
    }
  }, []);

  // 초기 로드 (Google API 초기화 후 실행)
  useEffect(() => {
    // 약간의 지연을 주어 Google API 초기화가 완료될 시간을 확보
    const timer = setTimeout(() => {
      refreshLedgers();
    }, 1000);

    return () => clearTimeout(timer);
  }, [refreshLedgers]);

  return {
    ledgers,
    isLoading,
    error,
    refreshLedgers,
    createLedger,
    getLedger
  };
};

