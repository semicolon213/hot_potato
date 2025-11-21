/**
 * @file StudentList.tsx
 * @brief 학생 목록 컴포넌트
 * @details 학생 데이터를 테이블 형태로 표시하고 정렬, 검색 기능을 제공합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { StudentWithCouncil } from '../../../types/features/students/student';
import TableColumnFilter, { type SortDirection, type FilterOption } from '../../../components/ui/common/TableColumnFilter';
import { FaFilter, FaTimes } from 'react-icons/fa';
import '../../../styles/pages/DocumentManagement.css';
import '../../../styles/pages/Students.css';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: StudentWithCouncil) => React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface StudentListProps {
  students: StudentWithCouncil[];
  columns: Column[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onStudentDoubleClick: (student: StudentWithCouncil) => void;
  isStaffMode?: boolean; // 교직원 모드 추가
  onAddStaff?: () => void;
  onAddCommittee?: () => void;
  onAddStudent?: () => void; // 학생 추가 버튼
  staffTabType?: 'staff' | 'committee';
}

interface FilterConfig {
  sortDirection: SortDirection;
  selectedFilters: (string | number)[];
}

// Helper function to generate pagination numbers
const getPaginationNumbers = (currentPage: number, totalPages: number) => {
  const pageNeighbours = 2;
  const totalNumbers = (pageNeighbours * 2) + 1;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const startPage = Math.max(2, currentPage - pageNeighbours);
  const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
  let pages: (string | number)[] = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

  const hasLeftSpill = startPage > 2;
  const hasRightSpill = (totalPages - endPage) > 1;
  const spillOffset = totalNumbers - (pages.length + 1);

  switch (true) {
    case (hasLeftSpill && !hasRightSpill):
      const extraPages = Array.from({ length: spillOffset }, (_, i) => startPage - 1 - i).reverse();
      pages = ['...', ...extraPages, ...pages];
      break;
    case (!hasLeftSpill && hasRightSpill):
      const extraPages_ = Array.from({ length: spillOffset }, (_, i) => endPage + 1 + i);
      pages = [...pages, ...extraPages_, '...'];
      break;
    case (hasLeftSpill && hasRightSpill):
    default:
      pages = ['...', ...pages, '...'];
      break;
  }

  return [1, ...pages, totalPages];
};

const StudentList: React.FC<StudentListProps> = ({
  students,
  columns,
  sortConfig,
  onSort,
  onStudentDoubleClick,
  isStaffMode = false,
  onAddStaff,
  onAddCommittee,
  onAddStudent,
  staffTabType = 'staff'
}) => {
  // 필터 상태
  const [filterConfigs, setFilterConfigs] = useState<Record<string, FilterConfig>>({});
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [filterPopupPosition, setFilterPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // 값 정규화 함수
  const normalizeValue = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  // 각 컬럼의 필터 옵션 생성
  const getFilterOptions = (columnKey: string): FilterOption[] => {
    const uniqueValues = new Map<string, { displayValue: string; count: number }>();
    
    // 원본 students에서 고유값과 개수 계산
    students.forEach(student => {
      let values: unknown[] = [];
      
      // council 컬럼은 배열이므로 특별 처리
      if (columnKey === 'council') {
        const studentWithCouncil = student as StudentWithCouncil;
        if (studentWithCouncil.parsedCouncil && Array.isArray(studentWithCouncil.parsedCouncil)) {
          values = studentWithCouncil.parsedCouncil.map(c => c.position).filter(Boolean);
        }
      } else {
        const value = (student as Record<string, unknown>)[columnKey];
        values = [value];
      }
      
      // 각 값에 대해 처리
      values.forEach(value => {
        const normalized = normalizeValue(value);
        
        if (normalized !== '') {
          const existing = uniqueValues.get(normalized);
          if (existing) {
            existing.count += 1;
          } else {
            // 원본 값을 표시용으로 저장 (공백이 있을 수 있음)
            const displayValue = value !== null && value !== undefined ? String(value) : '';
            uniqueValues.set(normalized, {
              displayValue,
              count: 1
            });
          }
        }
      });
    });
    
    return Array.from(uniqueValues.entries()).map(([normalized, { displayValue, count }]) => ({
      value: normalized, // 정규화된 값을 저장 (필터링 시 비교용)
      label: displayValue || normalized, // 표시용 레이블
      count
    })).sort((a, b) => {
      // 숫자로 변환 가능하면 숫자 순서로, 아니면 문자열 순서로
      const aNum = Number(a.value);
      const bNum = Number(b.value);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return String(a.value).localeCompare(String(b.value));
    });
  };

  // 헤더 클릭 핸들러
  const handleHeaderClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const column = columns.find(col => col.key === key);
    if (column?.sortable === false) return;

    const thElement = e.currentTarget as HTMLElement;
    const rect = thElement.getBoundingClientRect();
    setFilterPopupPosition({
      top: rect.bottom + 4,
      left: rect.left
    });
    setOpenFilterColumn(openFilterColumn === key ? null : key);
  };

  // 필터 초기화
  const handleClearFilters = (columnKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFilterConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[columnKey];
      return newConfigs;
    });
    setOpenFilterColumn(null);
  };

  // 정렬 변경
  const handleSortChange = (columnKey: string, direction: SortDirection) => {
    setFilterConfigs(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        sortDirection: direction
      }
    }));
    
    if (direction) {
      onSort(columnKey);
    }
  };

  // 필터 변경
  const handleFilterChange = (columnKey: string, filters: (string | number)[]) => {
    setFilterConfigs(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey] || { sortDirection: null, selectedFilters: [] },
        selectedFilters: filters
      }
    }));
  };

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    // 필터가 없으면 모든 학생 반환
    const hasActiveFilters = Object.values(filterConfigs).some(
      config => config.selectedFilters && config.selectedFilters.length > 0
    );
    
    if (!hasActiveFilters) {
      return students;
    }
    
    return students.filter(student => {
      // 모든 필터 조건을 만족해야 함
      for (const [columnKey, config] of Object.entries(filterConfigs)) {
        // 필터가 선택되지 않았으면 이 컬럼은 체크하지 않음
        if (!config.selectedFilters || config.selectedFilters.length === 0) {
          continue;
        }
        
        let studentValues: string[] = [];
        
        // council 컬럼은 배열이므로 특별 처리
        if (columnKey === 'council') {
          const studentWithCouncil = student as StudentWithCouncil;
          if (studentWithCouncil.parsedCouncil && Array.isArray(studentWithCouncil.parsedCouncil)) {
            studentValues = studentWithCouncil.parsedCouncil
              .map(c => normalizeValue(c.position))
              .filter(v => v !== '');
          }
        } else {
          const value = (student as Record<string, unknown>)[columnKey];
          const normalized = normalizeValue(value);
          if (normalized !== '') {
            studentValues = [normalized];
          }
        }
        
        // 필터 값과 비교 (정규화된 값으로 비교)
        const matches = config.selectedFilters.some(filter => {
          const filterValue = normalizeValue(filter);
          return studentValues.some(studentValue => studentValue === filterValue);
        });
        
        // 하나라도 매칭되지 않으면 제외
        if (!matches) {
          return false;
        }
      }
      return true;
    });
  }, [students, filterConfigs]);

  // 정렬된 학생 목록
  const sortedAndFilteredStudents = useMemo(() => {
    const sorted = [...filteredStudents];
    
    // 필터 설정에서 정렬 정보 가져오기
    const activeSortConfig = Object.entries(filterConfigs).find(([_, config]) => config.sortDirection !== null);
    
    if (activeSortConfig) {
      const [columnKey, config] = activeSortConfig;
      const direction = config.sortDirection!;
      
      sorted.sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[columnKey];
        const bValue = (b as Record<string, unknown>)[columnKey];
        
        // 숫자로 변환 가능하면 숫자 비교
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // 문자열 비교
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        if (direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    } else if (sortConfig?.key) {
      // 기존 정렬 로직 유지
      const aValue = (sorted[0] as Record<string, unknown>)[sortConfig.key];
      const bValue = (sorted[0] as Record<string, unknown>)[sortConfig.key];
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        sorted.sort((a, b) => {
          const aVal = Number((a as Record<string, unknown>)[sortConfig.key]);
          const bVal = Number((b as Record<string, unknown>)[sortConfig.key]);
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
      } else {
        sorted.sort((a, b) => {
          const aStr = String((a as Record<string, unknown>)[sortConfig.key] || '');
          const bStr = String((b as Record<string, unknown>)[sortConfig.key] || '');
          return sortConfig.direction === 'asc' 
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        });
      }
    }
    
    return sorted;
  }, [filteredStudents, filterConfigs, sortConfig]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedAndFilteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedAndFilteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const paginationNumbers = totalPages >= 1 ? getPaginationNumbers(currentPage, totalPages) : [];

  // 필터나 정렬이 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [filterConfigs, sortConfig]);

  // students prop이 변경되면 필터 결과 확인 및 초기화 (데이터가 갑자기 안 나오는 문제 방지)
  useEffect(() => {
    // students가 변경되고 데이터가 있을 때만 확인
    if (students && students.length > 0) {
      // 필터가 활성화되어 있는지 확인
      const hasActiveFilters = Object.values(filterConfigs).some(
        config => config.selectedFilters && config.selectedFilters.length > 0
      );
      
      if (hasActiveFilters) {
        // 현재 필터로 필터링한 결과 확인
        const filtered = students.filter(student => {
          for (const [columnKey, config] of Object.entries(filterConfigs)) {
            if (!config.selectedFilters || config.selectedFilters.length === 0) {
              continue;
            }
            let studentValues: string[] = [];
            if (columnKey === 'council') {
              const studentWithCouncil = student as StudentWithCouncil;
              if (studentWithCouncil.parsedCouncil && Array.isArray(studentWithCouncil.parsedCouncil)) {
                studentValues = studentWithCouncil.parsedCouncil
                  .map(c => normalizeValue(c.position))
                  .filter(v => v !== '');
              }
            } else {
              const value = (student as Record<string, unknown>)[columnKey];
              const normalized = normalizeValue(value);
              if (normalized !== '') {
                studentValues = [normalized];
              }
            }
            const matches = config.selectedFilters.some(filter => {
              const filterValue = normalizeValue(filter);
              return studentValues.some(studentValue => studentValue === filterValue);
            });
            if (!matches) {
              return false;
            }
          }
          return true;
        });
        
        // 필터링 결과가 없고 원본 데이터는 있으면 필터 초기화
        if (filtered.length === 0 && students.length > 0) {
          setFilterConfigs({});
          setCurrentPage(1);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const getSortIndicator = (key: string) => {
    // 정렬 아이콘 표시 제거
    return '';
  };

  const renderCellContent = (student: StudentWithCouncil, column: Column) => {
    if (column.render) {
      return column.render(student);
    }
    
    if (column.key === 'council') {
      if (student.parsedCouncil && student.parsedCouncil.length > 0) {
        const badgeColors = [
          '#e3f2fd', // 파란색
          '#f3e5f5', // 보라색
          '#e8f5e9', // 초록색
          '#fff3e0', // 주황색
          '#fce4ec', // 분홍색
          '#e0f2f1', // 청록색
          '#f1f8e9', // 연두색
          '#fff8e1', // 노란색
        ];
        return (
          <div className="council-badges">
            {student.parsedCouncil.map((council, index) => {
              const colorIndex = index % badgeColors.length;
              return (
                <span 
                  key={index} 
                  className="type-badge council-badge-item"
                  style={{ backgroundColor: badgeColors[colorIndex] }}
                >
                  {council.year ? `${council.year}년 ` : ''}{council.position}
                </span>
              );
            })}
          </div>
        );
      }
      return <span className="no-tag">-</span>;
    }
    
    if (column.key === 'state') {
      const value = (student as Record<string, unknown>)[column.key];
      const stateValue = value ? String(value) : '-';
      
      // 상태별 색상 매핑
      const stateColors: Record<string, string> = {
        '재학': '#e3f2fd', // 파란색
        '휴학': '#fff3e0', // 주황색
        '졸업': '#e8f5e9', // 초록색
        '자퇴': '#fce4ec', // 분홍색
        '제적': '#ffebee', // 빨간색
        '복학': '#e0f2f1', // 청록색
        '전과': '#f1f8e9', // 연두색
        '편입': '#fff8e1', // 노란색
      };
      
      const badgeColor = stateColors[stateValue] || '#f3e5f5'; // 기본값: 보라색
      
      return (
        <span 
          className="type-badge state-badge"
          style={{ backgroundColor: badgeColor }}
        >
          {stateValue}
        </span>
      );
    }
    
    const value = (student as Record<string, unknown>)[column.key];
    return value ? String(value) : '-';
  };

  // 컬럼 너비 계산 (동적으로)
  const getColumnWidth = (index: number, total: number) => {
    // 컬럼 키로 너비 결정
    const column = columns[index];
    if (!column) return 'auto';
    
    const widths: Record<string, string> = {
      'no_student': '15%',
      'name': '15%', // 주소에서 줄인 6% 추가 (9% + 6% = 15%)
      'address': '19%', // 4분의 3로 줄임 (25% * 3/4 = 18.75% -> 19%)
      'phone_num': '15%',
      'grade': '8%',
      'state': '8%',
      'council': '20%', // 3분의 2로 줄임 (30% * 2/3 = 20%)
    };
    
    return widths[column.key] || 'auto';
  };

  return (
    <div className="student-list-section">
      <div className="student-table-container">
        <table className="document-table student-table">
          <colgroup>
            {columns.map((col, index) => (
              <col key={col.key} style={{ width: getColumnWidth(index, columns.length) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => {
                const config = filterConfigs[col.key];
                const hasFilter = config?.sortDirection || (config?.selectedFilters.length ?? 0) > 0;
                
                return (
                  <th
                    key={col.key}
                    className={`col-${col.key} ${col.sortable !== false ? 'sortable' : ''} ${hasFilter ? 'sorted' : ''}`}
                    onClick={(e) => col.sortable !== false && handleHeaderClick(e, col.key)}
                  >
                    <div className="th-content">
                      <span>{col.header}{getSortIndicator(col.key)}</span>
                      {hasFilter && (
                        <button
                          className="filter-clear-icon"
                          onClick={(e) => handleClearFilters(col.key, e)}
                          title="필터/정렬 초기화"
                        >
                          <FaFilter className="filter-icon" />
                          <FaTimes className="clear-icon" />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              <>
                {currentStudents.map((student, index) => (
                  <tr
                    key={student.no_student || index}
                    className="document-row student-row"
                    onDoubleClick={() => onStudentDoubleClick(student)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`col-${col.key} ${col.key === 'council' ? 'col-council' : ''}`}>
                        {renderCellContent(student, col)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* 빈 행 추가: 화면을 채우기 위해 최소 10개 행 유지 */}
                {Array.from({ length: Math.max(0, studentsPerPage - currentStudents.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="document-row empty-row">
                    {columns.map((col) => (
                      <td key={col.key} className={`col-${col.key}`}></td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              // 데이터가 없을 때도 빈 행 10개 표시
              Array.from({ length: studentsPerPage }).map((_, index) => (
                <tr key={`empty-${index}`} className="document-row empty-row">
                  {columns.map((col) => (
                    <td key={col.key} className={`col-${col.key}`}></td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
      </table>
      </div>
      
      {/* 페이지네이션 */}
      {sortedAndFilteredStudents.length > 0 && totalPages >= 1 && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="page-arrow-link"
          >
            <span>이전</span>
          </button>

          {paginationNumbers.map((page, index) => {
            if (typeof page === 'string') {
              return <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>;
            }
            return (
              <button 
                key={page} 
                onClick={() => paginate(page)} 
                className={`page-link ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            );
          })}

          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="page-arrow-link"
          >
            <span>다음</span>
          </button>
        </div>
      )}
      
      {/* 필터 팝업 */}
      {columns.map((col) => {
        if (openFilterColumn !== col.key) return null;
        
        const config = filterConfigs[col.key] || { sortDirection: null, selectedFilters: [] };
        const options = getFilterOptions(col.key);
        
        return (
          <TableColumnFilter
            key={col.key}
            columnKey={col.key}
            columnLabel={col.header}
            isOpen={openFilterColumn === col.key}
            position={filterPopupPosition}
            onClose={() => setOpenFilterColumn(null)}
            sortDirection={config.sortDirection || null}
            onSortChange={(direction) => handleSortChange(col.key, direction)}
            availableOptions={options || []}
            selectedFilters={config.selectedFilters || []}
            onFilterChange={(filters) => handleFilterChange(col.key, filters)}
            onClearFilters={() => handleClearFilters(col.key, { stopPropagation: () => {} } as React.MouseEvent)}
            isStaffMode={isStaffMode}
          />
        );
      })}
    </div>
  );
};

export default StudentList;
