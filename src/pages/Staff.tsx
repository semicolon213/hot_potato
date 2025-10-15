/**
 * @file Staff.tsx
 * @brief 교직원 관리 페이지
 * @details 학생관리와 동일한 수준의 완전한 기능을 제공하는 교직원 관리 페이지입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from 'react';
import { useStaffOnly } from '../hooks/features/staff/useStaffOnly';
import { useCommitteeOnly } from '../hooks/features/staff/useCommitteeOnly';
import StudentDetailModal from '../components/ui/StudentDetailModal';
import type { Committee } from '../types/features/staff';
import {
  StudentHeader,
  StudentSearchFilter,
  StudentActionButtons,
  StudentList,
  CouncilSection
} from '../components/features/students';
import '../styles/pages/Students.css';

// 타입 정의
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

// 변환된 데이터 타입 (StudentList에서 사용)
interface ConvertedData {
  no_student: string;
  name: string;
  address: string;
  phone_num: string;
  email: string;
  grade: string;
  state: string;
  council: string;
}


interface StaffProps {
  onPageChange: (pageName: string) => void;
  staffSpreadsheetId: string | null;
}

const Staff: React.FC<StaffProps> = ({ staffSpreadsheetId }) => {
  // 교직원 전용 훅
  const staffHook = useStaffOnly(staffSpreadsheetId);
  
  // 위원회 전용 훅
  const committeeHook = useCommitteeOnly(staffSpreadsheetId);

  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState<'staff' | 'committee'>('staff');

  // 현재 활성 탭에 따라 사용할 훅 결정
  const currentHook = activeTab === 'staff' ? staffHook : committeeHook;

  // 교직원 데이터를 학생관리 형식으로 변환
  const convertedStaff = staffHook.filteredStaff.map(staff => ({
    no_student: staff.no,
    name: staff.name,
    address: staff.tel,        // 내선번호
    phone_num: staff.phone,    // 연락처
    email: staff.email,        // 이메일 추가
    grade: staff.pos,
    state: staff.date,
    council: staff.note,
    parsedCouncil: [] as { year: string; position: string }[]
  }));

  const convertedCommittee = committeeHook.filteredCommittee.map(committee => ({
    no_student: committee.name,
    name: committee.name,
    address: committee.location,
    phone_num: committee.tel,
    email: committee.email,        // 이메일 추가
    grade: committee.sortation,
    state: committee.position,
    council: `${committee.company_name} / ${committee.representative} / ${committee.note}`,
    parsedCouncil: [] as { year: string; position: string }[]
  }));

  // 탭 변환
  const studentActiveTab = activeTab === 'staff' ? 'list' : 'council';

  // 모달 상태
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 필터 표시 상태
  const [showFilters, setShowFilters] = useState(true);

  // 교직원 목록 컬럼 정의 (학생관리 형식으로 변환)
  const staffColumns = [
    { key: 'no_student', header: '교번', sortable: true },
    { key: 'grade', header: '구분', sortable: true },
    { key: 'name', header: '이름', sortable: true },
    { key: 'address', header: '내선번호', sortable: true },
    { key: 'phone_num', header: '연락처', sortable: true },
    { key: 'email', header: '이메일', sortable: true },
    { key: 'state', header: '임용일', sortable: true },
    { key: 'council', header: '비고', sortable: false },
  ];

  // 학과 위원회 목록 컬럼 정의 (StudentList 형식으로 변환)
  const committeeColumns = [
    { key: 'no_student', header: '이름', sortable: true },
    { key: 'grade', header: '위원회 구분', sortable: true },
    { key: 'name', header: '이름', sortable: true },
    { key: 'address', header: '소재지', sortable: true },
    { key: 'phone_num', header: '연락처', sortable: true },
    { key: 'email', header: '이메일', sortable: true },
    { key: 'state', header: '직책', sortable: true },
    { key: 'council', header: '업체명/대표자/비고', sortable: false },
  ];

  // 교직원 더블클릭 처리
  const handleStaffDoubleClick = (student: ConvertedData) => {
    // 변환된 데이터에서 원본 교직원 데이터 찾기
    const originalStaff = staffHook.staff.find(s => s.no === student.no_student);
    if (originalStaff) {
      setSelectedStaff(originalStaff);
      setSelectedCommittee(null);
      setIsModalOpen(true);
    }
  };

  // 위원회 더블클릭 처리
  const handleCommitteeDoubleClick = (student: ConvertedData) => {
    // 변환된 데이터에서 원본 위원회 데이터 찾기
    const originalCommittee = committeeHook.committee.find(c => c.name === student.no_student);
    if (originalCommittee) {
      setSelectedCommittee(originalCommittee);
      setSelectedStaff(null);
      setIsModalOpen(true);
    }
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setSelectedCommittee(null);
  };

  // 모달 업데이트 처리
  const handleModalUpdate = (updatedStudent: ConvertedData) => {
    if (selectedStaff) {
      // 교직원 데이터 업데이트
      const updatedStaff: Staff = {
        ...selectedStaff,
        no: updatedStudent.no_student,
        name: updatedStudent.name,
        tel: updatedStudent.address,
        phone: updatedStudent.phone_num,
        email: updatedStudent.email,
        pos: updatedStudent.grade,
        date: updatedStudent.state,
        note: updatedStudent.council,
      };
      staffHook.updateStaff(updatedStaff);
    } else if (selectedCommittee) {
      // 위원회 데이터 업데이트
      const updatedCommittee: Committee = {
        ...selectedCommittee,
        name: updatedStudent.name,
        location: updatedStudent.address,
        tel: updatedStudent.phone_num,
        email: updatedStudent.email,
        sortation: updatedStudent.grade,
        position: updatedStudent.state,
        company_name: updatedStudent.council.split(' / ')[0] || '',
        representative: updatedStudent.council.split(' / ')[1] || '',
        note: updatedStudent.council.split(' / ')[2] || '',
      };
      committeeHook.updateCommittee(updatedCommittee);
    }
    handleModalClose();
  };

  if (currentHook.isLoading) return <div className="staff-loading">데이터를 불러오는 중...</div>;
  if (currentHook.error) return <div className="staff-error">오류: {currentHook.error}</div>;

  return (
    <div className="staff-management-page">
      <StudentHeader
        totalStudents={activeTab === 'staff' ? staffHook.totalStaff : committeeHook.totalCommittee}
        filteredStudents={activeTab === 'staff' ? staffHook.filteredStaffCount : committeeHook.filteredCommitteeCount}
        activeTab={studentActiveTab}
        onTabChange={(tab) => setActiveTab(tab === 'list' ? 'staff' : 'committee')}
        isStaffMode={true}
      />
      
      <StudentSearchFilter
        searchTerm={currentHook.searchTerm}
        onSearchChange={currentHook.setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={currentHook.filters}
        onFiltersChange={currentHook.setFilters}
        filterOptions={activeTab === 'staff' ? {
          grades: staffHook.filterOptions.grades, // 교직원 구분 (전임교수, 조교, 외부강사 등)
          states: ['전체 상태', '재학', '졸업', '휴학', '자퇴'], // 교직원 상태 (사용하지 않음)
          councilPositions: ['전체 직책', '학생장', '부학생장', '총무부장', '기획부장', '학술부장', '서기'] // 교직원 직책 (사용하지 않음)
        } : {
          grades: ['전체 구분', '교과과정위원회', '학과운영위원회', '입학위원회', '졸업위원회'], // 위원회 구분
          states: committeeHook.filterOptions.sortations, // 위원회 종류
          councilPositions: committeeHook.filterOptions.positions // 위원회 직책
        }}
        isStaffMode={true}
        activeTab={activeTab}
      />

      <StudentActionButtons
        onExportCSV={currentHook.exportToCSV}
        onDownloadTemplate={currentHook.downloadExcelTemplate}
        onFileUpload={currentHook.handleFileUpload}
        filteredCount={activeTab === 'staff' ? staffHook.filteredStaffCount : committeeHook.filteredCommitteeCount}
        totalCount={activeTab === 'staff' ? staffHook.totalStaff : committeeHook.totalCommittee}
      />

            {activeTab === 'staff' ? (
              <StudentList
                students={convertedStaff}
                columns={staffColumns}
                sortConfig={staffHook.sortConfig}
                onSort={staffHook.handleSort}
                onStudentDoubleClick={handleStaffDoubleClick}
                isStaffMode={true}
              />
            ) : (
              <StudentList
                students={convertedCommittee}
                columns={committeeColumns}
                sortConfig={committeeHook.sortConfig}
                onSort={committeeHook.handleSort}
                onStudentDoubleClick={handleCommitteeDoubleClick}
                isStaffMode={true}
              />
            )}

      <StudentDetailModal
        student={selectedStaff ? {
          no_student: selectedStaff.no,
          name: selectedStaff.name,
          address: selectedStaff.tel,
          phone_num: selectedStaff.phone,
          email: selectedStaff.email,  // 이메일 필드 추가
          grade: selectedStaff.pos,
          state: selectedStaff.date,
          council: selectedStaff.note,  // 비고만 포함
          parsedCouncil: [] as { year: string; position: string }[]
        } : (selectedCommittee ? {
          no_student: selectedCommittee.name,
          name: selectedCommittee.name,
          address: selectedCommittee.location,
          phone_num: selectedCommittee.tel,
          email: selectedCommittee.email,  // 이메일 필드 추가
          grade: selectedCommittee.sortation,
          state: selectedCommittee.position,
          council: `${selectedCommittee.company_name} / ${selectedCommittee.representative} / ${selectedCommittee.note}`,
          parsedCouncil: [] as { year: string; position: string }[]
        } : null)}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
        studentSpreadsheetId={activeTab === 'staff' ? staffSpreadsheetId : staffSpreadsheetId}
        mode={selectedStaff ? 'staff' : selectedCommittee ? 'committee' : 'student'}
      />
    </div>
  );
};

export default Staff;