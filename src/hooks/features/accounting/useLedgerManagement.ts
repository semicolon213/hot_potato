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
import type { LedgerInfo, CreateLedgerRequest } from '../../../types/features/accounting';
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
      // 방법 1: Google Drive API로 직접 조회 (권장)
      const ledgerList = await getLedgerFolders();
      setLedgers(ledgerList);
      
      // 방법 2: Apps Script로 조회 (대안)
      // const response = await apiClient.getLedgerList();
      // if (response.success && response.data) {
      //   setLedgers(response.data);
      // }
      
    } catch (err) {
      console.error('❌ 장부 목록 조회 오류:', err);
      setError('장부 목록을 불러오는데 실패했습니다.');
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
      
    } catch (err: any) {
      console.error('❌ 장부 생성 오류:', err);
      setError(err.message || '장부 생성에 실패했습니다.');
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

  // 초기 로드
  useEffect(() => {
    refreshLedgers();
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

