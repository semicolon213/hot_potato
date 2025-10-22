/**
 * @file useStaffManagement.ts
 * @brief 교직원 관리 훅
 * @details 학생관리 훅과 동일한 수준의 완전한 기능을 제공하는 교직원 관리 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStaffFromPapyrus, fetchCommitteeFromPapyrus } from '../../../utils/database/papyrusManager';

/**
 * @brief 교직원 데이터 타입 정의
 * @details 교직원의 기본 정보를 담는 인터페이스입니다.
 */
interface Staff {
  no: string;
  pos: string;
  name: string;
  tel: string;
  phone: string;
  email: string;
  date: string;
  note: string;
}

/**
 * @brief 학과 위원회 정보 타입 정의
 * @details 학과 위원회 구성원의 정보를 담는 인터페이스입니다.
 */
interface Committee {
  sortation: string;
  name: string;
  tel: string;
  email: string;
  position: string;
  career: string;
  company_name: string;
  company_position: string;
  location: string;
  is_family: boolean;
  representative: string;
  note: string;
}

/**
 * @brief 교직원 관리 커스텀 훅
 * @details 교직원 목록을 가져오고, 검색, 필터링, 정렬 기능을 제공합니다.
 * @param {string | null} staffSpreadsheetId - 교직원 데이터가 있는 스프레드시트 ID
 * @returns {Object} 교직원 관리 관련 상태와 핸들러 함수들
 */
export const useStaffManagement = (staffSpreadsheetId: string | null) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [committee, setCommittee] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 및 검색 상태 (학생관리 형식으로 변환)
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    grade: '',
    state: '',
    council: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'staff' | 'committee'>('staff');

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

  // Papyrus DB에서 교직원 데이터 가져오기
  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('교직원 데이터 가져오기 시작...');
      console.log('staffSpreadsheetId:', staffSpreadsheetId);
      const staffData = await fetchStaffFromPapyrus(staffSpreadsheetId!);
      console.log('Papyrus DB에서 받은 교직원 데이터:', staffData);
      
      if (staffData && staffData.length > 0) {
        // 전화번호와 이메일 복호화 처리 (학생관리와 동일한 방식)
        const processedStaff: Staff[] = await Promise.all(
          staffData.map(async (staff: Staff) => {
            const decryptedTel = await decryptPhone(staff.tel || '');
            const decryptedPhone = await decryptPhone(staff.phone || '');
            const decryptedEmail = await decryptEmail(staff.email || '');
            
            return {
              no: staff.no || '',
              pos: staff.pos || '',
              name: staff.name || '',
              tel: decryptedTel,
              phone: decryptedPhone,
              email: decryptedEmail,
              date: staff.date || '',
              note: staff.note || ''
            };
          })
        );
        
        setStaff(processedStaff);
        console.log(`교직원 ${processedStaff.length}명 데이터 로드 완료 (연락처 및 이메일 복호화 완료)`);
      } else {
        setStaff([]);
        console.log('교직원 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('교직원 데이터 로드 오류:', error);
      setError('교직원 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Papyrus DB에서 학과 위원회 데이터 가져오기
  const fetchCommittee = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('학과 위원회 데이터 가져오기 시작...');
      const committeeData = await fetchCommitteeFromPapyrus(staffSpreadsheetId!);
      console.log('Papyrus DB에서 받은 학과 위원회 데이터:', committeeData);
      
      if (committeeData && committeeData.length > 0) {
        const processedCommittee: Committee[] = committeeData.map((committee: Committee) => ({
          sortation: committee.sortation || '',
          name: committee.name || '',
          tel: committee.tel || '',
          email: committee.email || '',
          position: committee.position || '',
          career: committee.career || '',
          company_name: committee.company_name || '',
          company_position: committee.company_position || '',
          location: committee.location || '',
          is_family: committee.is_family || false,
          representative: committee.representative || '',
          note: committee.note || ''
        }));
        
        setCommittee(processedCommittee);
        console.log('처리된 학과 위원회 데이터:', processedCommittee);
      } else {
        setCommittee([]);
        console.log('학과 위원회 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('학과 위원회 데이터 로드 오류:', error);
      setError('학과 위원회 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 교직원 목록
  const filteredStaff = useMemo(() => {
    let filtered = staff;

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(staff => 
        staff.name.toLowerCase().includes(term) ||
        staff.no.toLowerCase().includes(term) ||
        staff.pos.toLowerCase().includes(term) ||
        staff.tel.toLowerCase().includes(term) ||
        staff.phone.toLowerCase().includes(term) ||
        staff.email.toLowerCase().includes(term)
      );
    }

    // 구분 필터링 (grade 필터를 position으로 매핑)
    if (filters.grade) {
      filtered = filtered.filter(staff => staff.pos === filters.grade);
    }

    return filtered;
  }, [staff, searchTerm, filters.grade]);

  // 필터링된 위원회 목록
  const filteredCommittee = useMemo(() => {
    let filtered = committee;

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(committee => 
        committee.name.toLowerCase().includes(term) ||
        committee.sortation.toLowerCase().includes(term) ||
        committee.position.toLowerCase().includes(term) ||
        committee.company_name.toLowerCase().includes(term) ||
        committee.location.toLowerCase().includes(term)
      );
    }

    // 위원회 구분 필터링 (state 필터를 sortation으로 매핑)
    if (filters.state) {
      filtered = filtered.filter(committee => committee.sortation === filters.state);
    }

    return filtered;
  }, [committee, searchTerm, filters.state]);

  // 정렬 처리
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // 정렬된 목록
  const sortedStaff = useMemo(() => {
    if (!sortConfig.key) return filteredStaff;
    
    return [...filteredStaff].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key!];
      const bValue = (b as any)[sortConfig.key!];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStaff, sortConfig]);

  const sortedCommittee = useMemo(() => {
    if (!sortConfig.key) return filteredCommittee;
    
    return [...filteredCommittee].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key!];
      const bValue = (b as any)[sortConfig.key!];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredCommittee, sortConfig]);

  // 필터 옵션들 (교직원에 맞게 수정)
  const filterOptions = {
    grades: ['전체 구분', '전임교수', '조교', '외부강사', '겸임교수', '시간강사'],
    states: ['전체 위원회', '교과과정위원회', '학과운영위원회', '입학위원회', '졸업위원회'],
    councilPositions: ['전체 직책', '위원장', '위원', '간사', '자문위원']
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const data = activeTab === 'staff' ? sortedStaff : sortedCommittee;
    const headers = activeTab === 'staff' 
      ? ['교번', '구분', '이름', '내선번호', '연락처', '이메일', '임용일', '비고']
      : ['위원회구분', '이름', '연락처', '이메일', '직책', '업체명', '직위', '소재지', '대표자', '비고'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        activeTab === 'staff' 
          ? [item.no, item.pos, item.name, item.tel, item.phone, item.email, item.date, item.note].join(',')
          : [item.sortation, item.name, item.tel, item.email, item.position, item.company_name, item.company_position, item.location, item.representative, item.note].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab === 'staff' ? '교직원' : '학과위원회'}_목록.csv`;
    link.click();
  };

  // Excel 템플릿 다운로드
  const downloadExcelTemplate = () => {
    console.log('Excel 템플릿 다운로드');
    // 실제 구현은 나중에 추가
  };

  // 파일 업로드
  const handleFileUpload = async (file: File) => {
    console.log('파일 업로드:', file);
    // 실제 구현은 나중에 추가
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (staffSpreadsheetId) {
      fetchStaff();
      fetchCommittee();
    }
  }, [staffSpreadsheetId]);

  return {
    // 데이터
    staff,
    committee,
    filteredStaff: sortedStaff,
    filteredCommittee: sortedCommittee,
    
    // 상태
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortConfig,
    activeTab,
    setActiveTab,
    
    // 핸들러
    handleSort,
    exportToCSV,
    downloadExcelTemplate,
    handleFileUpload,
    
    // 필터 옵션
    filterOptions,
    
    // 통계
    totalStaff: staff.length,
    totalCommittee: committee.length,
    filteredStaffCount: sortedStaff.length,
    filteredCommitteeCount: sortedCommittee.length
  };
};