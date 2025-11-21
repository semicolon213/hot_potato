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
import type { Committee, CareerItem } from '../../../types/features/staff';

interface CommitteeFilters {
  sortation: string; // 위원회의 'sortation'에 해당
  position: string; // 위원회의 'position'에 해당
}

export const useCommitteeOnly = (staffSpreadsheetId: string | null) => {
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


  // 데이터 암호화 (통합 App Script API 사용)
  const encryptData = useCallback(async (dataItem: Committee) => {
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
  // 참고: fetchCommitteeFromPapyrus에서 이미 복호화된 데이터를 반환하므로 추가 복호화 불필요
  const fetchCommittee = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const committeeData = await fetchCommitteeFromPapyrus(staffSpreadsheetId!);
      console.log('Papyrus DB에서 받은 위원회 데이터 (이미 복호화됨):', committeeData);
      setCommittee(committeeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학과 위원회 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [staffSpreadsheetId]);

  useEffect(() => {
    if (staffSpreadsheetId) {
      fetchCommittee();
    }
  }, [staffSpreadsheetId, fetchCommittee]);

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
        const aValue = (a as Record<string, unknown>)[sortConfig.key!];
        const bValue = (b as Record<string, unknown>)[sortConfig.key!];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCommittee, sortConfig]);

  // 필터 옵션들 (위원회 전용)
  const filterOptions = {
    sortations: ['교과과정위원회', '학과운영위원회', '입학위원회', '졸업위원회'],
    positions: ['위원장', '위원', '간사', '자문위원']
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['위원회 구분', '이름', '연락처', '이메일', '직책', '경력', '업체명', '직위', '소재지', '가족회사여부', '대표자', '비고'];
    const csvContent = [
      headers.join(','),
      ...sortedCommittee.map(row => headers.map(header => {
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
    link.setAttribute('download', '학과위원회_목록.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 엑셀 양식 다운로드
  const downloadExcelTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        ['위원회구분', '이름', '연락처', '이메일', '직책', '경력(JSON)', '업체명', '직위', '소재지', '가족회사여부', '대표자', '비고'],
        ['산학협력위원회', '홍길동', '010-1234-5678', 'hong@example.com', '위원장', '[]', 'ABC회사', '대표이사', '서울시 강남구', 'false', '홍길동', ''],
        ['산학협력위원회', '김철수', '010-2345-6789', 'kim@example.com', '위원', '[{"company":"XYZ회사","position":"과장","period":"2020-2024"}]', 'XYZ회사', '과장', '경기도 수원시', 'false', '김철수', ''],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '위원회 목록');
      XLSX.writeFile(wb, `위원회일괄입력_양식_${new Date().toISOString().split('T')[0]}.xlsx`);
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

          const newCommitteeList: Committee[] = [];
          const duplicates: string[] = [];
          const errors: string[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
              continue;
            }

            // 경력 파싱 (JSON 문자열 또는 빈 문자열)
            let parsedCareer: CareerItem[] = [];
            const careerStr = (row[5] || '').toString().trim();
            if (careerStr && careerStr !== '[]') {
              try {
                const parsed = JSON.parse(careerStr);
                if (Array.isArray(parsed)) {
                  parsedCareer = parsed;
                }
              } catch (e) {
                errors.push(`${i + 1}행: 경력 정보 형식이 올바르지 않습니다.`);
              }
            }

            const committeeMember: Committee = {
              sortation: (row[0] || '').toString().trim(),
              name: (row[1] || '').toString().trim(),
              tel: (row[2] || '').toString().trim(),
              email: (row[3] || '').toString().trim(),
              position: (row[4] || '').toString().trim(),
              career: parsedCareer,
              company_name: (row[6] || '').toString().trim(),
              company_position: (row[7] || '').toString().trim(),
              location: (row[8] || '').toString().trim(),
              is_family: (row[9] || '').toString().trim().toLowerCase() === 'true',
              representative: (row[10] || '').toString().trim(),
              note: (row[11] || '').toString().trim()
            };

            if (!committeeMember.name) {
              errors.push(`${i + 1}행: 이름은 필수입니다.`);
              continue;
            }

            // 이름과 위원회 구분으로 중복 검증
            if (committee.some(c => c.name === committeeMember.name && c.sortation === committeeMember.sortation)) {
              duplicates.push(`${committeeMember.name} (${committeeMember.sortation})`);
              continue;
            }

            newCommitteeList.push(committeeMember);
          }

          if (errors.length > 0) {
            alert(`오류가 발생했습니다:\n${errors.join('\n')}`);
          }

          if (duplicates.length > 0) {
            alert(`중복된 위원회 구성원이 발견되었습니다: ${duplicates.join(', ')}`);
          }

          if (newCommitteeList.length > 0 && staffSpreadsheetId) {
            setIsLoading(true);
            try {
              // 각 위원회 구성원을 암호화하여 추가
              for (const newCommittee of newCommitteeList) {
                const encryptedCommittee = await encryptData(newCommittee);
                await addCommitteeToPapyrus(staffSpreadsheetId, encryptedCommittee);
              }
              
              await fetchCommittee();
              alert(`${newCommitteeList.length}명의 위원회 구성원이 추가되었습니다.`);
            } catch (err) {
              console.error('위원회 추가 실패:', err);
              reject(err);
              return;
            } finally {
              setIsLoading(false);
            }
          } else if (newCommitteeList.length === 0) {
            alert('추가할 위원회 구성원이 없습니다.');
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
        await addCommitteeToPapyrus(staffSpreadsheetId!, encryptedCommittee);
        await fetchCommittee();
      } catch (err) {
        setError(err instanceof Error ? err.message : '위원회 추가 실패');
      } finally {
        setIsLoading(false);
      }
    },
    updateCommittee: async (committeeName: string, updatedCommittee: Committee) => {
      setIsLoading(true);
      try {
        const encryptedCommittee = await encryptData(updatedCommittee);
        await updateCommitteeInPapyrus(staffSpreadsheetId!, committeeName, encryptedCommittee);
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
        await deleteCommitteeFromPapyrus(staffSpreadsheetId!, committeeName);
        await fetchCommittee();
      } catch (err) {
        setError(err instanceof Error ? err.message : '위원회 삭제 실패');
      } finally {
        setIsLoading(false);
      }
    }
  };
};
