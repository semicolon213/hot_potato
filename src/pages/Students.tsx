import React, { useState, useMemo, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { useStudentManagement } from '../hooks/features/students/useStudentManagement';
import StudentDetailModal from '../components/ui/StudentDetailModal';
import {
  StudentHeader,
  StudentActionButtons,
  StudentList,
  CouncilSection
} from '../components/features/students';
import type { StudentWithCouncil } from '../types/features/students/student';
import '../styles/pages/Students.css';

interface StudentsProps {
  onPageChange: (pageName: string) => void;
  studentSpreadsheetId: string | null;
  initialTab?: 'list' | 'council';
  user?: {
    userType?: string;
  } | null;
}

const Students: React.FC<StudentsProps> = ({ studentSpreadsheetId, user, initialTab = 'list', onPageChange }) => {
  const {
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
    getAllYears,
    addStudent, // 학생 추가 함수
    deleteStudent,
    getCouncilTableData,
    studentColumns,
    councilColumns,
    fetchStudents
  } = useStudentManagement(studentSpreadsheetId);

  const [activeTab, setActiveTab] = useState<'list' | 'council'>(initialTab);
  
  // initialTab이 변경되면 activeTab 업데이트
  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithCouncil | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false); // 학생 추가 모달 상태
  const [showFilters, setShowFilters] = useState(false);

  // URL 파라미터에서 필터 읽기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    const gradeParam = urlParams.get('grade');
    
    if (stateParam || gradeParam) {
      setFilters(prev => ({
        ...prev,
        ...(stateParam && { state: stateParam }),
        ...(gradeParam && { grade: gradeParam })
      }));
      // 필터가 있으면 필터 패널 열기
      setShowFilters(true);
    }
  }, [setFilters]);

  const years = getAllYears();
  
  // 년도별로 정렬 (최신년도부터)
  const sortedYears = useMemo(() => {
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [years]);
  
  // 선택된 년도가 없으면 첫 번째 년도를 자동 선택
  useEffect(() => {
    if (sortedYears.length > 0 && !selectedYear && activeTab === 'council') {
      setSelectedYear(sortedYears[0]);
    }
  }, [sortedYears, selectedYear, activeTab]);
  
  // 모든 학생회 데이터를 평탄화하여 가져오기
  const allCouncilData = useMemo(() => {
    const result = students.flatMap(student => {
      // parsedCouncil이 없거나 비어있으면 건너뛰기
      if (!student.parsedCouncil || student.parsedCouncil.length === 0) {
        return [];
      }
      
      return student.parsedCouncil
        .filter(council => council.year && council.position) // 년도와 직책이 모두 있는 것만
        .map(council => ({
          ...student,
          position: council.position,
          councilYear: council.year || ''
        }));
    });
    
    // 디버깅: 파싱 결과 확인
    console.log('📊 allCouncilData 생성:', {
      총학생수: students.length,
      총항목수: result.length,
      년도별분포: result.reduce((acc, item) => {
        const year = item.councilYear;
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    return result;
  }, [students]);

  // 학생회 데이터 필터링 (년도별)
  const filteredCouncilData = useMemo(() => {
    let filtered = allCouncilData;
    if (selectedYear) {
      filtered = filtered.filter(item => {
        const matches = item.councilYear === selectedYear;
        if (!matches && item.councilYear) {
          // 디버깅: 필터링되지 않은 항목 확인
          console.log('⚠️ 필터링 제외:', {
            학생: item.name,
            학번: item.no_student,
            선택된년도: selectedYear,
            항목년도: item.councilYear,
            일치여부: item.councilYear === selectedYear
          });
        }
        return matches;
      });
    }
    
    // 디버깅: 필터링 결과 확인
    console.log('🔍 filteredCouncilData:', {
      선택된년도: selectedYear,
      필터링된항목수: filtered.length,
      학생목록: filtered.map(item => `${item.name}(${item.no_student}) - ${item.position}`)
    });
    
    return filtered;
  }, [allCouncilData, selectedYear]);
  
  // 년도별 학생 수 계산 (중복 제거: 같은 학생이 여러 직책을 가져도 1명으로 카운트)
  const getYearStudentCount = (year: string) => {
    const yearStudents = allCouncilData.filter(item => item.councilYear === year);
    // 학번(no_student) 기준으로 중복 제거하여 실제 학생 수 계산
    const uniqueStudents = new Set(yearStudents.map(item => item.no_student));
    return uniqueStudents.size;
  };

  // 학생 추가 핸들러
  const handleAddStudent = () => setIsAddStudentModalOpen(true);
  const handleAddStudentModalClose = () => setIsAddStudentModalOpen(false);
  const handleCreateStudent = (newStudentData: StudentWithCouncil) => {
    addStudent(newStudentData);
    setIsAddStudentModalOpen(false);
  };

  // Council 데이터용 정렬 함수
  const handleCouncilSort = (key: string) => {
    // council 데이터는 StudentWithCouncil과 다른 구조이므로 별도 처리
    console.log('Council sort:', key);
  };

  // 학생 더블클릭 핸들러
  const handleStudentDoubleClick = (student: StudentWithCouncil) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // 학생 정보 업데이트 핸들러
  const handleStudentUpdate = async () => {
    // 데이터 다시 로드
    if (studentSpreadsheetId) {
      await fetchStudents();
    }
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = (studentToDelete: StudentWithCouncil) => {
    deleteStudent(studentToDelete.no_student);
  };

  if (error) {
    return (
      <div className="students-container">
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="students-container">
      <StudentHeader
        totalStudents={students.length}
        filteredStudents={filteredStudents.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'list' && (
        <div className="students-list">
          <div className="action-buttons-container">
            <div className="action-left">
              <StudentActionButtons
                onExportCSV={exportToCSV}
                onDownloadTemplate={downloadExcelTemplate}
                onFileUpload={handleExcelUpload}
                filteredCount={filteredStudents.length}
                totalCount={students.length}
              />
            </div>
            <div className="action-right">
              <button 
                className="student-add-button"
                onClick={handleAddStudent}
                title="학생 추가"
              >
                <FaPlus className="add-icon" />
                <span className="add-button-text">학생 추가</span>
              </button>
            </div>
          </div>

          <StudentList
            students={students}
            columns={studentColumns}
            sortConfig={sortConfig}
            onSort={(key: string) => handleSort(key as keyof StudentWithCouncil)}
            onStudentDoubleClick={handleStudentDoubleClick}
            onAddStudent={handleAddStudent} // 학생 추가 버튼 핸들러 전달
          />
        </div>
      )}

      {activeTab === 'council' && (
        <div className="students-list">
          <div className="action-buttons-container">
            <div className="action-left">
              <StudentActionButtons
                onExportCSV={exportToCSV}
                onDownloadTemplate={downloadExcelTemplate}
                onFileUpload={handleExcelUpload}
                filteredCount={filteredCouncilData.length}
                totalCount={allCouncilData.length}
              />
            </div>
            {sortedYears.length > 0 && (
              <div className="action-right">
                <div className="council-year-navigation">
                  <button
                    className="council-year-nav-btn"
                    onClick={() => {
                      const currentIndex = sortedYears.findIndex(y => y === selectedYear);
                      if (currentIndex > 0) {
                        setSelectedYear(sortedYears[currentIndex - 1]);
                      }
                    }}
                    disabled={sortedYears.findIndex(y => y === selectedYear) === 0}
                    title="이전 년도"
                  >
                    <FaChevronLeft />
                  </button>
                  {selectedYear && (
                    <div className="council-year-display">
                      <span className="council-year-text">
                        {selectedYear}년 ({getYearStudentCount(selectedYear)})
                      </span>
                    </div>
                  )}
                  <button
                    className="council-year-nav-btn"
                    onClick={() => {
                      const currentIndex = sortedYears.findIndex(y => y === selectedYear);
                      if (currentIndex < sortedYears.length - 1) {
                        setSelectedYear(sortedYears[currentIndex + 1]);
                      }
                    }}
                    disabled={sortedYears.findIndex(y => y === selectedYear) === sortedYears.length - 1}
                    title="다음 년도"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>

          <StudentList
            students={filteredCouncilData}
            columns={councilColumns}
            sortConfig={sortConfig}
            onSort={(key: string) => handleSort(key as keyof StudentWithCouncil)}
            onStudentDoubleClick={handleStudentDoubleClick}
          />
        </div>
      )}

      {/* 학생 상세 정보 모달 */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleStudentUpdate}
        onDelete={handleDeleteStudent}
        studentSpreadsheetId={studentSpreadsheetId}
        user={user}
      />

      {/* 학생 추가 모달 */}
      <StudentDetailModal
        student={null}
        isOpen={isAddStudentModalOpen}
        onClose={handleAddStudentModalClose}
        onUpdate={handleCreateStudent}
        studentSpreadsheetId={studentSpreadsheetId}
        mode="student"
        isAdding={true}
        user={user}
      />
    </div>
  );
};

export default Students;