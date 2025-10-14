/**
 * @file useStudentManagement.ts
 * @brief 학생 관리 훅
 * @details 학생 목록, 검색, 필터링, 정렬 기능을 관리하는 커스텀 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useMemo } from 'react';
import { fetchStudents as fetchStudentsFromPapyrus } from '../../../utils/database/papyrusManager';
import type { Student, StudentWithCouncil, CouncilPosition } from '../../../types/features/students/student';

/**
 * @brief 학생 관리 커스텀 훅
 * @details 학생 목록을 가져오고, 검색, 필터링, 정렬 기능을 제공합니다.
 * @param {string | null} studentSpreadsheetId - 학생 데이터가 있는 스프레드시트 ID
 * @returns {Object} 학생 관리 관련 상태와 핸들러 함수들
 */
export const useStudentManagement = (studentSpreadsheetId: string | null) => {
  const [students, setStudents] = useState<StudentWithCouncil[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    grade: '',
    state: '',
    council: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StudentWithCouncil | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // council 필드를 파싱하는 함수
  const parseCouncil = (council: string): CouncilPosition[] => {
    if (!council || council.trim() === '') return [];
    
    return council.split('/').map(item => {
      const trimmed = item.trim();
      // "24 기획부장" 형태에서 년도와 직책 분리
      const match = trimmed.match(/^(\d+)\s+(.+)$/);
      if (match) {
        return {
          year: match[1],
          position: match[2]
        };
      }
      return {
        year: '',
        position: trimmed
      };
    });
  };

  // Papyrus DB에서 학생 데이터 가져오기
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('학생 데이터 가져오기 시작...');
      console.log('studentSpreadsheetId:', studentSpreadsheetId);
      const studentsData = await fetchStudentsFromPapyrus(studentSpreadsheetId!);
      console.log('Papyrus DB에서 받은 학생 데이터:', studentsData);
      
      if (studentsData && studentsData.length > 0) {
        const studentData: StudentWithCouncil[] = studentsData.map((student: any) => {
          const studentObj: Student = {
            no_student: student.no_student || '',
            name: student.name || '',
            address: student.address || '',
            phone_num: student.phone_num || '',
            grade: student.grade || '',
            state: student.state || '',
            council: student.council || ''
          };

          return {
            ...studentObj,
            parsedCouncil: parseCouncil(studentObj.council)
          };
        });

        setStudents(studentData);
        console.log(`학생 ${studentData.length}명 데이터 로드 완료`);
      } else {
        console.log('학생 데이터가 없습니다.');
        setStudents([]);
      }
    } catch (err) {
      console.error('학생 데이터 가져오기 실패:', err);
      setError('학생 데이터를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 학생 데이터 로드
  useEffect(() => {
    if (studentSpreadsheetId) {
      console.log('useStudentManagement: studentSpreadsheetId가 있으므로 학생 데이터 로드 시작');
      fetchStudents();
    } else {
      console.log('useStudentManagement: studentSpreadsheetId가 없음');
    }
  }, [studentSpreadsheetId]);

  // 년도별 학생회 데이터 가져오기
  const getCouncilByYear = (year: string) => {
    return students.filter(student => 
      student.parsedCouncil.some(council => council.year === year)
    );
  };

  // 모든 년도 목록 가져오기
  const getAllYears = () => {
    const years = new Set<string>();
    students.forEach(student => {
      student.parsedCouncil.forEach(council => {
        if (council.year) {
          years.add(council.year);
        }
      });
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // 최신년도부터
  };

  // 학생 목록 컬럼 정의
  const studentColumns = [
    { key: 'no_student' as const, header: '학번', width: '12%' },
    { key: 'name' as const, header: '이름', width: '12%' },
    { key: 'address' as const, header: '주소', width: '20%' },
    { key: 'phone_num' as const, header: '연락처', width: '15%' },
    { key: 'grade' as const, header: '학년', width: '8%' },
    { key: 'state' as const, header: '상태', width: '8%' },
    { 
      key: 'council' as const, 
      header: '학생회', 
      width: '25%',
      render: (row: StudentWithCouncil) => 
        row.parsedCouncil.map(council => 
          (council.year ? council.year + '년 ' : '') + council.position
        ).join(', ')
    }
  ];

  // 학생회 테이블 컬럼 정의
  const councilColumns = [
    { key: 'name' as const, header: '이름', width: '20%' },
    { key: 'no_student' as const, header: '학번', width: '15%' },
    { key: 'grade' as const, header: '학년', width: '10%' },
    { key: 'position' as const, header: '직책', width: '25%' },
    { key: 'state' as const, header: '상태', width: '10%' },
    { key: 'address' as const, header: '주소', width: '20%' }
  ];

  // 특정 년도의 학생회 데이터를 테이블용으로 변환
  const getCouncilTableData = (year: string) => {
    const councilStudents = getCouncilByYear(year);
    return councilStudents.flatMap(student => 
      student.parsedCouncil
        .filter(council => council.year === year)
        .map(council => ({
          ...student,
          position: council.position
        }))
    );
  };

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(term) ||
        student.no_student.toLowerCase().includes(term) ||
        student.address.toLowerCase().includes(term) ||
        student.parsedCouncil.some(council => 
          council.position.toLowerCase().includes(term)
        )
      );
    }

    // 필드별 필터링
    if (filters.grade) {
      filtered = filtered.filter(student => student.grade.includes(filters.grade));
    }
    if (filters.state) {
      filtered = filtered.filter(student => student.state === filters.state);
    }
    if (filters.council) {
      filtered = filtered.filter(student => 
        student.parsedCouncil.some(council => 
          council.position.toLowerCase().includes(filters.council.toLowerCase())
        )
      );
    }

    // 정렬
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [students, searchTerm, filters, sortConfig]);

  // 정렬 함수
  const handleSort = (key: keyof StudentWithCouncil) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 필터 옵션들
  const filterOptions = useMemo(() => {
    const grades = [...new Set(students.map(s => s.grade))].filter(Boolean);
    const states = [...new Set(students.map(s => s.state))].filter(Boolean);
    const councilPositions = [...new Set(
      students.flatMap(s => s.parsedCouncil.map(c => c.position))
    )].filter(Boolean);

    return { grades, states, councilPositions };
  }, [students]);

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['학번', '이름', '주소', '학년', '상태', '학생회'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.no_student,
        student.name,
        student.address,
        student.grade,
        student.state,
        student.parsedCouncil.map(c => `${c.year}년 ${c.position}`).join(', ')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `학생목록_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 엑셀 양식 다운로드
  const downloadExcelTemplate = () => {
    const headers = ['학번', '이름', '주소', '학년', '상태', '학생회'];
    const sampleData = [
      ['202400001', '홍길동', '서울특별시 강남구', '1', '재학', '25 기획부장'],
      ['202400002', '김철수', '경기도 수원시', '2', '재학', '25 총무부장'],
      ['202400003', '이영희', '인천광역시', '3', '휴학', '']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `학생일괄입력_양식_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 엑셀 파일 업로드 및 중복 검증
  const handleExcelUpload = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          const lines = data.split('\n').filter(line => line.trim());
          
          const newStudents: StudentWithCouncil[] = [];
          const duplicates: string[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const student: Student = {
              no_student: values[0] || '',
              name: values[1] || '',
              address: values[2] || '',
              phone_num: values[3] || '',
              grade: values[4] || '',
              state: values[5] || '',
              council: values[6] || ''
            };

            // 중복 검증 (학번 기준)
            if (students.some(s => s.no_student === student.no_student)) {
              duplicates.push(student.no_student);
              continue;
            }

            newStudents.push({
              ...student,
              parsedCouncil: parseCouncil(student.council)
            });
          }

          if (duplicates.length > 0) {
            alert(`중복된 학번이 발견되었습니다: ${duplicates.join(', ')}`);
          }

          // Google Sheets에 추가
          if (newStudents.length > 0 && studentSpreadsheetId) {
            const values = newStudents.map(student => [
              student.no_student,
              student.name,
              student.address,
              student.grade,
              student.state,
              student.council
            ]);

            await (window as any).gapi.client.sheets.spreadsheets.values.append({
              spreadsheetId: studentSpreadsheetId,
              range: 'A:F',
              valueInputOption: 'RAW',
              insertDataOption: 'INSERT_ROWS',
              resource: { values }
            });

            // 로컬 상태 업데이트
            setStudents(prev => [...prev, ...newStudents]);
            alert(`${newStudents.length}명의 학생이 추가되었습니다.`);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  useEffect(() => {
    if (studentSpreadsheetId) {
      fetchStudents();
    }
  }, [studentSpreadsheetId]);

  return {
    students,
    filteredStudents,
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
    handleExcelUpload,
    fetchStudents,
    getCouncilByYear,
    getAllYears,
    getCouncilTableData,
    studentColumns,
    councilColumns
  };
};
