import React, { useState } from 'react';
import { useStudentManagement } from '../hooks/features/students/useStudentManagement';
import StudentDetailModal from '../components/ui/StudentDetailModal';
import {
  StudentHeader,
  StudentSearchFilter,
  StudentActionButtons,
  StudentList,
  CouncilSection
} from '../components/features/students/students';
import '../styles/pages/Students.css';

interface Student {
  no_student: string;
  name: string;
  address: string;
  grade: string;
  state: string;
  council: string;
}

interface CouncilPosition {
  year: string;
  position: string;
}

interface StudentWithCouncil extends Student {
  parsedCouncil: CouncilPosition[];
}

interface StudentsProps {
  onPageChange: (pageName: string) => void;
  studentSpreadsheetId: string | null;
}

const Students: React.FC<StudentsProps> = ({ onPageChange, studentSpreadsheetId }) => {
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
    getCouncilTableData,
    studentColumns,
    councilColumns,
    fetchStudents
  } = useStudentManagement(studentSpreadsheetId);

  const [activeTab, setActiveTab] = useState<'list' | 'council'>('list');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithCouncil | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const years = getAllYears();
  const councilData = selectedYear ? getCouncilTableData(selectedYear) : [];

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
          <StudentSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={handleToggleFilters}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
          />

          <StudentActionButtons
            onExportCSV={exportToCSV}
            onDownloadTemplate={downloadExcelTemplate}
            onFileUpload={handleExcelUpload}
            filteredCount={filteredStudents.length}
            totalCount={students.length}
          />

          <StudentList
            students={filteredStudents}
            columns={studentColumns}
            sortConfig={sortConfig}
            onSort={handleSort}
            onStudentDoubleClick={handleStudentDoubleClick}
          />
        </div>
      )}

      {activeTab === 'council' && (
        <CouncilSection
          years={years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          councilData={councilData}
          columns={councilColumns}
          sortConfig={sortConfig}
          onSort={handleCouncilSort}
        />
      )}

      {/* 학생 상세 정보 모달 */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleStudentUpdate}
        studentSpreadsheetId={studentSpreadsheetId}
      />
    </div>
  );
};

export default Students;