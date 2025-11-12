import React, { useState, useMemo } from 'react';
import { FaListUl, FaUsers } from 'react-icons/fa';
import { useStudentManagement } from '../hooks/features/students/useStudentManagement';
import StudentDetailModal from '../components/ui/StudentDetailModal';
import {
  StudentHeader,
  StudentSearchFilter,
  StudentActionButtons,
  StudentList,
  CouncilSection
} from '../components/features/students';
import type { StudentWithCouncil } from '../types/features/students/student';
import '../styles/pages/Students.css';

interface StudentsProps {
  onPageChange: (pageName: string) => void;
  studentSpreadsheetId: string | null;
  user?: {
    userType?: string;
  } | null;
}

const Students: React.FC<StudentsProps> = ({ studentSpreadsheetId, user }) => {
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

  const [activeTab, setActiveTab] = useState<'list' | 'council'>('list');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCouncilFilters, setShowCouncilFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithCouncil | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false); // 학생 추가 모달 상태

  const years = getAllYears();
  // 모든 학생회 데이터를 평탄화하여 가져오기
  const allCouncilData = useMemo(() => {
    return students.flatMap(student => 
      student.parsedCouncil.map(council => ({
        ...student,
        position: council.position,
        councilYear: council.year || ''
      }))
    );
  }, [students]);

  // 학생회 데이터 필터링 (년도별)
  const filteredCouncilData = useMemo(() => {
    let filtered = allCouncilData;
    if (selectedYear) {
      filtered = filtered.filter(item => item.councilYear === selectedYear);
    }
    return filtered;
  }, [allCouncilData, selectedYear]);

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

  // 학생회 필터 토글 핸들러
  const handleToggleCouncilFilters = () => {
    setShowCouncilFilters(!showCouncilFilters);
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

  // 필터 토글 핸들러
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // 필터 변경 핸들러
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="students-container">
        <div className="loading">학생 데이터를 불러오는 중...</div>
      </div>
    );
  }

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
          <div className="action-buttons">
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
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <FaListUl className="tab-icon" />
                  <span>학생 목록</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'council' ? 'active' : ''}`}
                  onClick={() => setActiveTab('council')}
                >
                  <FaUsers className="tab-icon" />
                  <span>학생회</span>
                </button>
              </div>
            </div>
          </div>

          <StudentSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={handleToggleFilters}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
          />

          <StudentList
            students={filteredStudents}
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
          <div className="action-buttons">
            <div className="action-left">
              <StudentActionButtons
                onExportCSV={exportToCSV}
                onDownloadTemplate={downloadExcelTemplate}
                onFileUpload={handleExcelUpload}
                filteredCount={filteredCouncilData.length}
                totalCount={allCouncilData.length}
              />
            </div>
            <div className="action-right">
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <FaListUl className="tab-icon" />
                  <span>학생 목록</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'council' ? 'active' : ''}`}
                  onClick={() => setActiveTab('council')}
                >
                  <FaUsers className="tab-icon" />
                  <span>학생회</span>
                </button>
              </div>
            </div>
          </div>

          <StudentSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showCouncilFilters}
            onToggleFilters={handleToggleCouncilFilters}
            filters={{ grade: selectedYear, state: '', council: '' }}
            onFiltersChange={(newFilters) => {
              setSelectedYear(newFilters.grade || '');
            }}
            filterOptions={{
              grades: ['전체 년도', ...years],
              states: [],
              councilPositions: []
            }}
          />

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