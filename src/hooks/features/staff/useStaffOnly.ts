/**
 * @file useStaffOnly.ts
 * @brief 교직원 전용 관리 훅
 * @details 교직원 정보만을 관리하는 전용 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchStaffFromPapyrus,
  addStaff as addStaffToPapyrus,
  updateStaff as updateStaffInPapyrus,
  deleteStaff as deleteStaffFromPapyrus
} from '../../../utils/database/papyrusManager';
import { useAppState } from '../../core/useAppState';
import type { StaffMember } from '../../../types/features/staff';

interface StaffFilters {
  grade: string; // 교직원의 'pos'에 해당
}

export const useStaffOnly = (staffSpreadsheetId: string | null) => {
  const { hotPotatoDBSpreadsheetId } = useAppState();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<StaffFilters>({
    grade: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });


  // 데이터 암호화 (통합 App Script API 사용)
  const encryptData = useCallback(async (dataItem: StaffMember) => {
    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      const encryptedStaff = { ...dataItem };
      
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
              encryptedStaff.tel = result.data;
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
              encryptedStaff.email = result.data;
            }
          }
        } catch (error) {
          console.warn('이메일 암호화 실패:', error);
        }
      }
      
      return encryptedStaff;
    } catch (error) {
      console.warn('데이터 암호화 실패, 원본 데이터를 사용합니다:', error);
      return dataItem;
    }
  }, []);

  // 전화번호 복호화 함수 (학생관리와 동일한 방식)
  const decryptPhone = async (encryptedPhone: string): Promise<string> => {
    if (!encryptedPhone || encryptedPhone.trim() === '') {
      return '';
    }

    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decryptEmail', data: encryptedPhone })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
      return encryptedPhone;
    } catch (error) {
      console.warn('전화번호 복호화 실패:', error);
      return encryptedPhone;
    }
  };

  // 이메일 복호화 함수
  const decryptEmail = async (encryptedEmail: string): Promise<string> => {
    if (!encryptedEmail || encryptedEmail.trim() === '') {
      return '';
    }

    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decryptEmail', data: encryptedEmail })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
      return encryptedEmail;
    } catch (error) {
      console.warn('이메일 복호화 실패:', error);
      return encryptedEmail;
    }
  };

  // 교직원 목록 조회
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const staffData = await fetchStaffFromPapyrus(staffSpreadsheetId!);
      console.log('Papyrus DB에서 받은 교직원 데이터:', staffData);
      
      // 전화번호와 이메일 복호화 처리 (학생관리와 동일한 방식)
      const decryptedStaff = await Promise.all(
        staffData.map(async (staff: StaffMember) => {
          const decryptedTel = await decryptPhone(staff.tel || '');
          const decryptedPhone = await decryptPhone(staff.phone || '');
          const decryptedEmail = await decryptEmail(staff.email || '');
          
          console.log(`교직원 ${staff.name}: tel=${staff.tel} -> ${decryptedTel}, phone=${staff.phone} -> ${decryptedPhone}, email=${staff.email} -> ${decryptedEmail}`);
          
          return {
            ...staff,
            tel: decryptedTel,
            phone: decryptedPhone,
            email: decryptedEmail
          };
        })
      );
      
      console.log('복호화된 교직원 데이터:', decryptedStaff);
      setStaff(decryptedStaff);
    } catch (err) {
      setError(err instanceof Error ? err.message : '교직원 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [staffSpreadsheetId]);

  useEffect(() => {
    if (staffSpreadsheetId) {
      fetchStaff();
    }
  }, [staffSpreadsheetId, fetchStaff]);

  // 필터링된 교직원 목록
  const filteredStaff = useMemo(() => {
    let filtered = staff;
    const term = searchTerm.toLowerCase();

    if (term) {
      filtered = filtered.filter(staff =>
        staff.no.toLowerCase().includes(term) ||
        staff.name.toLowerCase().includes(term) ||
        staff.pos.toLowerCase().includes(term) ||
        staff.tel.toLowerCase().includes(term) ||
        staff.phone.toLowerCase().includes(term) ||
        staff.email.toLowerCase().includes(term)
      );
    }

    // 구분 필터링
    if (filters.grade) {
      filtered = filtered.filter(staff => staff.pos === filters.grade);
    }

    return filtered;
  }, [staff, searchTerm, filters.grade]);

  // 정렬 처리
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return { ...prevConfig, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedStaff = useMemo(() => {
    const sortableItems = [...filteredStaff];
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
  }, [filteredStaff, sortConfig]);

  // 필터 옵션들 (교직원 전용)
  const filterOptions = {
    grades: ['전체 구분', '전임교수', '조교', '외부강사', '겸임교수', '시간강사']
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['교번', '구분', '이름', '내선번호', '연락처', '이메일', '임용일', '비고'];
    const csvContent = [
      headers.join(','),
      ...sortedStaff.map(row => headers.map(header => {
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
    link.setAttribute('download', '교직원_목록.csv');
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
  const totalStaff = staff.length;
  const filteredStaffCount = filteredStaff.length;

  return {
    staff,
    filteredStaff: sortedStaff,
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
    totalStaff,
    filteredStaffCount,
    addStaff: async (newStaff: StaffMember) => {
      setIsLoading(true);
      try {
        const encryptedStaff = await encryptData(newStaff);
        await addStaffToPapyrus(staffSpreadsheetId!, encryptedStaff);
        await fetchStaff();
      } catch (err) {
        setError(err instanceof Error ? err.message : '교직원 추가 실패');
      } finally {
        setIsLoading(false);
      }
    },
    updateStaff: async (updatedStaff: StaffMember) => {
      setIsLoading(true);
      try {
        const encryptedStaff = await encryptData(updatedStaff);
        await updateStaffInPapyrus(staffSpreadsheetId!, encryptedStaff);
        await fetchStaff();
      } catch (err) {
        setError(err instanceof Error ? err.message : '교직원 업데이트 실패');
      } finally {
        setIsLoading(false);
      }
    },
    deleteStaff: async (staffNo: string) => {
      setIsLoading(true);
      try {
        await deleteStaffFromPapyrus(hotPotatoDBSpreadsheetId!, staffNo);
        await fetchStaff();
      } catch (err) {
        setError(err instanceof Error ? err.message : '교직원 삭제 실패');
      } finally {
        setIsLoading(false);
      }
    }
  };
};
