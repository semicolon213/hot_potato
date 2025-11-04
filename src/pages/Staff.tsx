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
import type { Committee, StaffMember } from '../types/features/staff';
import {
  StudentHeader,
  StudentSearchFilter,
  StudentActionButtons,
  StudentList,
} from '../components/features/students';
import '../styles/pages/Students.css';
import type { StudentWithCouncil } from '../types/features/students/student';

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
  // Modal states
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddCommitteeModalOpen, setIsAddCommitteeModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Hooks
  const staffHook = useStaffOnly(staffSpreadsheetId);
  const committeeHook = useCommitteeOnly(staffSpreadsheetId);

  // CRUD Handlers
  const handleAddStaff = () => setIsAddStaffModalOpen(true);
  const handleAddStaffModalClose = () => setIsAddStaffModalOpen(false);
  const handleCreateStaff = (newStaffData: StudentWithCouncil) => {
    const newStaffMember: StaffMember = {
      no: newStaffData.no_student,
      pos: newStaffData.grade,
      name: newStaffData.name,
      tel: newStaffData.address,
      phone: newStaffData.phone_num,
      email: newStaffData.email || '',
      date: newStaffData.state,
      note: newStaffData.council,
    };
    staffHook.addStaff(newStaffMember);
    setIsAddStaffModalOpen(false);
  };

  const handleAddCommittee = () => setIsAddCommitteeModalOpen(true);
  const handleAddCommitteeModalClose = () => setIsAddCommitteeModalOpen(false);
  const handleCreateCommittee = (newCommitteeData: StudentWithCouncil) => {
    const councilParts = newCommitteeData.council.split(' / ');
    const newCommittee: Committee = {
        sortation: newCommitteeData.grade,
        name: newCommitteeData.name,
        tel: newCommitteeData.phone_num,
        email: newCommitteeData.email || '',
        position: newCommitteeData.state,
        career: newCommitteeData.career || [],
        company_name: councilParts[0] || '',
        representative: councilParts[1] || '',
        note: councilParts[2] || '',
        location: newCommitteeData.address,
        company_position: '',
        is_family: false,
    };
    committeeHook.addCommittee(newCommittee);
    setIsAddCommitteeModalOpen(false);
  };

  // Tab and data conversion logic
  const [activeTab, setActiveTab] = useState<'staff' | 'committee'>('staff');
  const currentHook = activeTab === 'staff' ? staffHook : committeeHook;

  const convertedStaff = staffHook.filteredStaff.map(staff => ({
    no_student: staff.no,
    name: staff.name,
    address: staff.tel,
    phone_num: staff.phone,
    email: staff.email,
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
    email: committee.email,
    grade: committee.sortation,
    state: committee.position,
    council: `${committee.company_name} / ${committee.representative} / ${committee.note}`,
    parsedCouncil: [] as { year: string; position: string }[]
  }));

  const studentActiveTab = activeTab === 'staff' ? 'list' : 'council';

  // Columns for tables
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

  const committeeColumns = [
    { key: 'no_student', header: '이름', sortable: true },
    { key: 'grade', header: '위원회 구분', sortable: true },
    { key: 'address', header: '소재지', sortable: true },
    { key: 'phone_num', header: '연락처', sortable: true },
    { key: 'email', header: '이메일', sortable: true },
    { key: 'state', header: '직책', sortable: true },
    { key: 'council', header: '업체명/대표자/비고', sortable: false },
  ];

  // Handlers for edit modal
  const handleStaffDoubleClick = (student: ConvertedData) => {
    const originalStaff = staffHook.staff.find(s => s.no === student.no_student);
    if (originalStaff) {
      setSelectedStaff(originalStaff);
      setSelectedCommittee(null);
      setIsModalOpen(true);
    }
  };

  const handleCommitteeDoubleClick = (student: ConvertedData) => {
    const originalCommittee = committeeHook.committee.find(c => c.name === student.no_student);
    if (originalCommittee) {
      setSelectedCommittee(originalCommittee);
      setSelectedStaff(null);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setSelectedCommittee(null);
  };

  const handleModalUpdate = (updatedStudent: ConvertedData) => {
    if (selectedStaff) {
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
      staffHook.updateStaff(selectedStaff.no, updatedStaff);
    } else if (selectedCommittee) {
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
        career: updatedStudent.career || [],
      };
      committeeHook.updateCommittee(selectedCommittee.name, updatedCommittee);
    }
    handleModalClose();
  };

  const handleModalDelete = (studentToDelete: StudentWithCouncil) => {
    if (selectedStaff) {
      staffHook.deleteStaff(selectedStaff.no);
    } else if (selectedCommittee) {
      committeeHook.deleteCommittee(selectedCommittee.name);
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
        filters={activeTab === 'staff' ? staffHook.filters : {
          grade: '', // 위원회 탭에서는 사용하지 않음
          state: committeeHook.filters.sortation,
          council: committeeHook.filters.position,
        }}
        onFiltersChange={(newFilters) => {
          if (activeTab === 'staff') {
            staffHook.setFilters(newFilters);
          } else {
            committeeHook.setFilters({
              sortation: newFilters.state,
              position: newFilters.council,
            });
          }
        }}
        filterOptions={activeTab === 'staff' ? {
          grades: staffHook.filterOptions.grades, // 교직원 구분 (전임교수, 조교, 외부강사 등)
          states: ['전체 상태', '재학', '졸업', '휴학', '자퇴'], // 교직원 상태 (사용하지 않음)
          councilPositions: ['전체 직책', '학생장', '부학생장', '총무부장', '기획부장', '학술부장', '서기'] // 교직원 직책 (사용하지 않지 않음)
        } : {
          grades: ['교과과정위원회', '학과운영위원회', '입학위원회', '졸업위원회'], // 위원회 구분
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
                onAddStaff={handleAddStaff}
                staffTabType='staff'
              />
            ) : (
              <StudentList
                students={convertedCommittee}
                columns={committeeColumns}
                sortConfig={committeeHook.sortConfig}
                onSort={committeeHook.handleSort}
                onStudentDoubleClick={handleCommitteeDoubleClick}
                isStaffMode={true}
                onAddCommittee={handleAddCommittee}
                staffTabType='committee'
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
          parsedCouncil: [] as { year: string; position: string }[],
          career: selectedCommittee.career
        } : null)}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
        onDelete={handleModalDelete}
        studentSpreadsheetId={staffSpreadsheetId}
        mode={selectedStaff ? 'staff' : selectedCommittee ? 'committee' : 'student'}
      />

      <StudentDetailModal
        student={null}
        isOpen={isAddStaffModalOpen}
        onClose={handleAddStaffModalClose}
        onUpdate={handleCreateStaff}
        studentSpreadsheetId={staffSpreadsheetId}
        mode='staff'
        isAdding={true}
      />

      <StudentDetailModal
        student={null}
        isOpen={isAddCommitteeModalOpen}
        onClose={handleAddCommitteeModalClose}
        onUpdate={handleCreateCommittee}
        studentSpreadsheetId={staffSpreadsheetId}
        mode='committee'
        isAdding={true}
      />
    </div>
  );
};

export default Staff;