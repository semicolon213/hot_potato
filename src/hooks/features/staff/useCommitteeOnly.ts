/**
 * @file useCommitteeOnly.ts
 * @brief 학과 위원회 전용 관리 훅
 * @details 학과 위원회 정보만을 관리하는 전용 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchCommitteeFromPapyrus,
  addCommittee as addCommitteeToPapyrus,
  updateCommittee as updateCommitteeInPapyrus,
  deleteCommittee as deleteCommitteeFromPapyrus
} from '../../../utils/database/papyrusManager';
import { useAppState } from '../../core/useAppState';
import type { Committee } from '../../../types/features/staff';

interface CommitteeFilters {
  sortation: string; // 위원회의 'sortation'에 해당
  position: string; // 위원회의 'position'에 해당
}

export const useCommitteeOnly = (committeeSpreadsheetId: string | null) => {
  const { hotPotatoDBSpreadsheetId } = useAppState();
  const [committee, setCommittee] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CommitteeFilters>({
    sortation: '',
    position: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // 암호화된 데이터 복호화 (통합 App Script API 사용)
  const decryptData = useCallback(async (dataList: any[]) => {
    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      // 각 위원회의 전화번호와 이메일을 개별적으로 복호화
      const decryptedList = await Promise.all(
        dataList.map(async (committee) => {
          const decryptedCommittee = { ...committee };
          
          // 전화번호 복호화
          if (committee.tel && committee.tel.trim() !== '') {
            try {
              const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decryptEmail', data: committee.tel })
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  decryptedCommittee.tel = result.data;
                }
              }
            } catch (error) {
              console.warn('전화번호 복호화 실패:', error);
            }
          }
          
          // 이메일 복호화
          if (committee.email && committee.email.trim() !== '') {
            try {
              const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decryptEmail', data: committee.email })
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  decryptedCommittee.email = result.data;
                }
              }
            } catch (error) {
              console.warn('이메일 복호화 실패:', error);
            }
          }
          
          return decryptedCommittee;
        })
      );
      
      return decryptedList;
    } catch (error) {
      console.warn('데이터 복호화 실패, 원본 데이터를 사용합니다:', error);
      return dataList;
    }
  }, []);

  // 데이터 암호화 (통합 App Script API 사용)
  const encryptData = useCallback(async (dataItem: any) => {
    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      const encryptedCommittee = { ...dataItem };
      
      // 전화번호 암호화
      if (dataItem.tel && dataItem.tel.trim() !== '') {
        try {
          const response = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'encryptEmail', data: dataItem.tel })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              encryptedCommittee.tel = result.data;
            }
          }
        } catch (error) {
          console.warn('전화번호 암호화 실패:', error);
        }
      }
      
      // 이메일 암호화
      if (dataItem.email && dataItem.email.trim() !== '') {
        try {
          const response = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'encryptEmail', data: dataItem.email })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              encryptedCommittee.email = result.data;
            }
          }
        } catch (error) {
          console.warn('이메일 암호화 실패:', error);
        }
      }
      
      return encryptedCommittee;
    } catch (error) {
      console.warn('데이터 암호화 실패, 원본 데이터를 사용합니다:', error);
      return dataItem;
    }
  }, []);

  // 위원회 목록 조회
  const fetchCommittee = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const committeeData = await fetchCommitteeFromPapyrus(hotPotatoDBSpreadsheetId!);
      const decryptedCommittee = await decryptData(committeeData);
      setCommittee(decryptedCommittee);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학과 위원회 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [hotPotatoDBSpreadsheetId, decryptData]);

  useEffect(() => {
    if (hotPotatoDBSpreadsheetId) {
      fetchCommittee();
    }
  }, [hotPotatoDBSpreadsheetId, fetchCommittee]);

  // 필터링된 위원회 목록
  const filteredCommittee = useMemo(() => {
    let filtered = committee;
    const term = searchTerm.toLowerCase();

    if (term) {
      filtered = filtered.filter(committee =>
        committee.name.toLowerCase().includes(term) ||
        committee.sortation.toLowerCase().includes(term) ||
        committee.position.toLowerCase().includes(term) ||
        committee.company_name.toLowerCase().includes(term) ||
        committee.location.toLowerCase().includes(term)
      );
    }

    // 위원회 구분 필터링
    if (filters.sortation) {
      filtered = filtered.filter(committee => committee.sortation === filters.sortation);
    }

    // 직책 필터링
    if (filters.position) {
      filtered = filtered.filter(committee => committee.position === filters.position);
    }

    return filtered;
  }, [committee, searchTerm, filters.sortation, filters.position]);

  // 정렬 처리
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return { ...prevConfig, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedCommittee = useMemo(() => {
    const sortableItems = [...filteredCommittee];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key!];
        const bValue = (b as any)[sortConfig.key!];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCommittee, sortConfig]);

  // 필터 옵션들 (위원회 전용)
  const filterOptions = {
    sortations: ['전체 위원회', '교과과정위원회', '학과운영위원회', '입학위원회', '졸업위원회'],
    positions: ['전체 직책', '위원장', '위원', '간사', '자문위원']
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['위원회 구분', '이름', '연락처', '이메일', '직책', '경력', '업체명', '직위', '소재지', '가족회사여부', '대표자', '비고'];
    const csvContent = [
      headers.join(','),
      ...sortedCommittee.map(row => headers.map(header => {
        let value = (row as any)[header];
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', '학과위원회_목록.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 엑셀 양식 다운로드
  const downloadExcelTemplate = () => {
    alert('엑셀 양식 다운로드 기능은 아직 구현되지 않았습니다.');
  };

  // 파일 업로드
  const handleFileUpload = async (file: File) => {
    alert('파일 업로드 기능은 아직 구현되지 않았습니다.');
    console.log('Uploaded file:', file);
  };

  // 통계 계산
  const totalCommittee = committee.length;
  const filteredCommitteeCount = filteredCommittee.length;

  return {
    committee,
    filteredCommittee: sortedCommittee,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    filterOptions,
    exportToCSV,
    downloadExcelTemplate,
    handleFileUpload,
    totalCommittee,
    filteredCommitteeCount,
    addCommittee: async (newCommittee: Committee) => {
      setIsLoading(true);
      try {
        const encryptedCommittee = await encryptData(newCommittee);
        await addCommitteeToPapyrus(hotPotatoDBSpreadsheetId!, encryptedCommittee);
        await fetchCommittee();
      } catch (err) {
        setError(err instanceof Error ? err.message : '위원회 추가 실패');
      } finally {
        setIsLoading(false);
      }
    },
    updateCommittee: async (updatedCommittee: Committee) => {
      setIsLoading(true);
      try {
        const encryptedCommittee = await encryptData(updatedCommittee);
        await updateCommitteeInPapyrus(hotPotatoDBSpreadsheetId!, encryptedCommittee);
        await fetchCommittee();
      } catch (err) {
        setError(err instanceof Error ? err.message : '위원회 업데이트 실패');
      } finally {
        setIsLoading(false);
      }
    },
    deleteCommittee: async (committeeName: string) => {
      setIsLoading(true);
      try {
        await deleteCommitteeFromPapyrus(hotPotatoDBSpreadsheetId!, committeeName);
        await fetchCommittee();
      } catch (err) {
        setError(err instanceof Error ? err.message : '위원회 삭제 실패');
      } finally {
        setIsLoading(false);
      }
    }
  };
};
