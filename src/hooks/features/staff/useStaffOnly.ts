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
// useAppState 의존성 제거 - 교직원 전용 데이터만 로드
import type { StaffMember } from '../../../types/features/staff';

interface StaffFilters {
  grade: string; // 교직원의 'pos'에 해당
}

export const useStaffOnly = (staffSpreadsheetId?: string | null) => {
  // useAppState 의존성 제거 - 교직원 전용 데이터만 로드
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


  // 데이터 암호화 (통합 App Script API 사용, 배치 처리)
  const encryptData = useCallback(async (dataItem: StaffMember) => {
    try {
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '/api' : (import.meta.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFLMG03A0aHCa_OE9oqLY4fCzopaj6wPWMeJYCxyieG_8CgKHQMbnp9miwTMu0Snt9/exec');

      const encryptedStaff = { ...dataItem };
      
      // 암호화할 값들을 모아서 한 번에 처리
      const valuesToEncrypt: string[] = [];
      const valueKeys: Array<'tel' | 'phone' | 'email'> = [];
      
      if (dataItem.tel && dataItem.tel.trim() !== '') {
        valuesToEncrypt.push(dataItem.tel);
        valueKeys.push('tel');
      } else {
        valuesToEncrypt.push('');
        valueKeys.push('tel');
      }
      
      if (dataItem.phone && dataItem.phone.trim() !== '') {
        valuesToEncrypt.push(dataItem.phone);
        valueKeys.push('phone');
      } else {
        valuesToEncrypt.push('');
        valueKeys.push('phone');
      }
      
      if (dataItem.email && dataItem.email.trim() !== '') {
        valuesToEncrypt.push(dataItem.email);
        valueKeys.push('email');
      } else {
        valuesToEncrypt.push('');
        valueKeys.push('email');
      }
      
      // 배치 암호화
      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'batchEncryptEmail', data: valuesToEncrypt })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            result.data.forEach((encrypted: string, index: number) => {
              if (encrypted && encrypted.trim() !== '') {
                encryptedStaff[valueKeys[index]] = encrypted;
              }
            });
          } else {
            // 배치 암호화 실패 시 개별 암호화로 폴백
            console.warn('⚠️ 배치 암호화 실패, 개별 암호화로 전환...');
            if (dataItem.tel && dataItem.tel.trim() !== '') {
              const telResponse = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'encryptEmail', data: dataItem.tel })
              });
              if (telResponse.ok) {
                const telResult = await telResponse.json();
                if (telResult.success) encryptedStaff.tel = telResult.data;
              }
            }
            if (dataItem.phone && dataItem.phone.trim() !== '') {
              const phoneResponse = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'encryptEmail', data: dataItem.phone })
              });
              if (phoneResponse.ok) {
                const phoneResult = await phoneResponse.json();
                if (phoneResult.success) encryptedStaff.phone = phoneResult.data;
              }
            }
            if (dataItem.email && dataItem.email.trim() !== '') {
              const emailResponse = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'encryptEmail', data: dataItem.email })
              });
              if (emailResponse.ok) {
                const emailResult = await emailResponse.json();
                if (emailResult.success) encryptedStaff.email = emailResult.data;
              }
            }
          }
        }
      } catch (error) {
        console.warn('배치 암호화 실패:', error);
      }
      
      return encryptedStaff;
    } catch (error) {
      console.warn('데이터 암호화 실패, 원본 데이터를 사용합니다:', error);
      return dataItem;
    }
  }, []);

  // 교직원 목록 조회
  // 참고: fetchStaffFromPapyrus에서 이미 복호화된 데이터를 반환하므로 추가 복호화 불필요
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const staffData = await fetchStaffFromPapyrus(staffSpreadsheetId!);
      console.log('Papyrus DB에서 받은 교직원 데이터:', staffData);
      
      // fetchStaffFromPapyrus에서 이미 복호화된 데이터를 반환하므로 복호화 불필요
      console.log('교직원 데이터 (이미 복호화됨):', staffData);
      setStaff(staffData);
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
      if (filters.grade === '기타') {
        const mainClassifications = ['전임교수', '조교', '외부강사', '겸임교수', '시간강사'];
        filtered = filtered.filter(staff => staff.pos && !mainClassifications.includes(staff.pos));
      } else {
        filtered = filtered.filter(staff => staff.pos === filters.grade);
      }
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
        const aValue = (a as Record<string, unknown>)[sortConfig.key!];
        const bValue = (b as Record<string, unknown>)[sortConfig.key!];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredStaff, sortConfig]);

  // 필터 옵션들 (교직원 전용)
  const filterOptions = {
    grades: ['전임교수', '조교', '외부강사', '겸임교수', '시간강사', '기타']
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['교번', '구분', '이름', '내선번호', '연락처', '이메일', '임용일', '비고'];
    const csvContent = [
      headers.join(','),
      ...sortedStaff.map(row => headers.map(header => {
        let value = (row as Record<string, unknown>)[header];
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
  const downloadExcelTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        ['교번', '구분', '이름', '내선번호', '연락처', '이메일', '임용일', '비고'],
        ['20240001', '전임교수', '홍길동', '7201', '010-1234-5678', 'hong@example.com', '2024-03-01', ''],
        ['20240002', '조교', '김철수', '7202', '010-2345-6789', 'kim@example.com', '2024-03-01', ''],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '교직원 목록');
      XLSX.writeFile(wb, `교직원일괄입력_양식_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('양식 다운로드 실패:', error);
      alert('양식 다운로드에 실패했습니다.');
    }
  };

  // 파일 업로드
  const handleFileUpload = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCSV = fileName.endsWith('.csv');

      if (!isExcel && !isCSV) {
        reject(new Error('CSV 또는 Excel 파일(.xlsx, .xls)만 업로드 가능합니다.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let rows: string[][] = [];

          if (isExcel) {
            const XLSX = await import('xlsx');
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          } else {
            const data = e.target?.result as string;
            const lines = data.split('\n').filter(line => line.trim());
            rows = lines.map(line => {
              const values: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  values.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              values.push(current.trim());
              return values;
            });
          }

          if (rows.length < 2) {
            reject(new Error('파일에 데이터가 없습니다.'));
            return;
          }

          const newStaffList: StaffMember[] = [];
          const duplicates: string[] = [];
          const errors: string[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
              continue;
            }

            const staffMember: StaffMember = {
              no: (row[0] || '').toString().trim(),
              pos: (row[1] || '').toString().trim(),
              name: (row[2] || '').toString().trim(),
              tel: (row[3] || '').toString().trim(),
              phone: (row[4] || '').toString().trim(),
              email: (row[5] || '').toString().trim(),
              date: (row[6] || '').toString().trim(),
              note: (row[7] || '').toString().trim()
            };

            if (!staffMember.no || !staffMember.name) {
              errors.push(`${i + 1}행: 교번과 이름은 필수입니다.`);
              continue;
            }

            if (staff.some(s => s.no === staffMember.no)) {
              duplicates.push(staffMember.no);
              continue;
            }

            newStaffList.push(staffMember);
          }

          if (errors.length > 0) {
            alert(`오류가 발생했습니다:\n${errors.join('\n')}`);
          }

          if (duplicates.length > 0) {
            alert(`중복된 교번이 발견되었습니다: ${duplicates.join(', ')}`);
          }

          if (newStaffList.length > 0 && staffSpreadsheetId) {
            setIsLoading(true);
            try {
              // 모든 교직원을 한 번에 암호화 (배치 처리)
              const encryptedStaffList = await Promise.all(
                newStaffList.map(staff => encryptData(staff))
              );
              
              // 각 교직원을 추가
              for (const encryptedStaff of encryptedStaffList) {
                await addStaffToPapyrus(staffSpreadsheetId, encryptedStaff);
              }
              
              await fetchStaff();
              alert(`${newStaffList.length}명의 교직원이 추가되었습니다.`);
            } catch (err) {
              console.error('교직원 추가 실패:', err);
              reject(err);
              return;
            } finally {
              setIsLoading(false);
            }
          } else if (newStaffList.length === 0) {
            alert('추가할 교직원이 없습니다.');
          }

          resolve();
        } catch (error) {
          console.error('파일 업로드 오류:', error);
          reject(error);
        }
      };

      if (isExcel) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file, 'UTF-8');
      }
    });
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
    updateStaff: async (staffNo: string, updatedStaff: StaffMember) => {
      setIsLoading(true);
      try {
        const encryptedStaff = await encryptData(updatedStaff);
        await updateStaffInPapyrus(staffSpreadsheetId!, staffNo, encryptedStaff);
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
        await deleteStaffFromPapyrus(staffSpreadsheetId!, staffNo);
        await fetchStaff();
      } catch (err) {
        setError(err instanceof Error ? err.message : '교직원 삭제 실패');
      } finally {
        setIsLoading(false);
      }
    }
  };
};
