/**
 * @file AddUsersModal.tsx
 * @brief 사용자 일괄 추가 모달
 * @details 여러 사용자를 한번에 추가할 수 있는 모달 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './AddUsersModal.css';

interface UserInput {
  no_member: string;
  name_member: string;
}

interface AddUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAddUsers: (users: UserInput[]) => Promise<void>;
  isLoading?: boolean;
}

const AddUsersModal: React.FC<AddUsersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAddUsers,
  isLoading = false
}) => {
  const [users, setUsers] = useState<UserInput[]>([
    { no_member: '', name_member: '' }
  ]);
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!isOpen) {
      setUsers([{ no_member: '', name_member: '' }]);
      setActiveTab('manual');
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen]);

  // 학번 유효성 검사
  const isValidStudentId = (studentId: string): boolean => {
    if (!studentId || !studentId.trim()) return false;
    const studentIdStr = String(studentId).trim();
    const studentIdRegex = /^\d{8,15}$/;
    return studentIdRegex.test(studentIdStr);
  };

  // 이름 유효성 검사
  const isValidName = (name: string): boolean => {
    return name && name.trim().length > 0;
  };

  // 행 추가
  const handleAddRow = () => {
    setUsers([...users, { no_member: '', name_member: '' }]);
  };

  // 행 삭제
  const handleRemoveRow = (index: number) => {
    if (users.length > 1) {
      const newUsers = users.filter((_, i) => i !== index);
      setUsers(newUsers);
      // 해당 행의 에러도 제거
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  // 사용자 정보 변경
  const handleUserChange = (index: number, field: keyof UserInput, value: string) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);

    // 실시간 유효성 검사
    const newErrors = { ...validationErrors };
    if (field === 'no_member') {
      if (value && !isValidStudentId(value)) {
        newErrors[index] = '학번은 8-15자리 숫자여야 합니다.';
      } else {
        delete newErrors[index];
      }
    } else if (field === 'name_member') {
      if (value && !isValidName(value)) {
        newErrors[index] = '이름을 입력해주세요.';
      } else {
        delete newErrors[index];
      }
    }
    setValidationErrors(newErrors);
  };

  // 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    const templateData = [
      ['학번/교번', '이름'],
      ['20230701', '홍길동'],
      ['20230702', '김철수']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '사용자 목록');
    
    XLSX.writeFile(wb, '사용자_일괄_추가_양식.xlsx');
  };

  // 엑셀 파일 업로드
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          setError('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 헤더 확인 (첫 번째 행)
        const headers = jsonData[0] as string[];
        const noMemberIndex = headers.findIndex(h => 
          h && (h.includes('학번') || h.includes('교번') || h.includes('no_member'))
        );
        const nameMemberIndex = headers.findIndex(h => 
          h && (h.includes('이름') || h.includes('name_member'))
        );

        if (noMemberIndex === -1 || nameMemberIndex === -1) {
          setError('엑셀 파일의 헤더를 확인해주세요. "학번/교번"과 "이름" 컬럼이 필요합니다.');
          return;
        }

        // 데이터 파싱 (두 번째 행부터)
        const parsedUsers: UserInput[] = [];
        const errors: Record<number, string> = {};

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const noMember = String(row[noMemberIndex] || '').trim();
          const nameMember = String(row[nameMemberIndex] || '').trim();

          // 빈 행은 건너뛰기
          if (!noMember && !nameMember) continue;

          // 유효성 검사
          if (!isValidStudentId(noMember)) {
            errors[parsedUsers.length] = '학번은 8-15자리 숫자여야 합니다.';
          }
          if (!isValidName(nameMember)) {
            errors[parsedUsers.length] = (errors[parsedUsers.length] || '') + ' 이름을 입력해주세요.';
          }

          parsedUsers.push({
            no_member: noMember,
            name_member: nameMember
          });
        }

        if (parsedUsers.length === 0) {
          setError('엑셀 파일에서 유효한 데이터를 찾을 수 없습니다.');
          return;
        }

        setUsers(parsedUsers);
        setValidationErrors(errors);
        setError(null);
        setActiveTab('manual'); // 파싱 후 수동 입력 탭으로 전환하여 미리보기 표시

        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error('엑셀 파일 파싱 오류:', err);
        setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };

    reader.onerror = () => {
      setError('파일을 읽는 중 오류가 발생했습니다.');
    };

    reader.readAsBinaryString(file);
  };

  // 제출 전 전체 유효성 검사
  const validateAll = (): boolean => {
    const errors: Record<number, string> = {};
    let hasError = false;

    users.forEach((user, index) => {
      const errorMessages: string[] = [];

      if (!isValidStudentId(user.no_member)) {
        errorMessages.push('학번은 8-15자리 숫자여야 합니다.');
      }

      if (!isValidName(user.name_member)) {
        errorMessages.push('이름을 입력해주세요.');
      }

      if (errorMessages.length > 0) {
        errors[index] = errorMessages.join(' ');
        hasError = true;
      }
    });

    setValidationErrors(errors);
    return !hasError;
  };

  // 중복 체크
  const checkDuplicates = (): boolean => {
    const noMembers = users.map(u => u.no_member.trim()).filter(Boolean);
    const duplicates = noMembers.filter((id, index) => noMembers.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      setError(`중복된 학번이 있습니다: ${duplicates.join(', ')}`);
      return false;
    }
    return true;
  };

  // 제출
  const handleSubmit = async () => {
    setError(null);

    // 빈 행 제거
    const validUsers = users.filter(u => 
      u.no_member.trim() && u.name_member.trim()
    );

    if (validUsers.length === 0) {
      setError('추가할 사용자가 없습니다.');
      return;
    }

    if (!validateAll()) {
      setError('입력 정보를 확인해주세요.');
      return;
    }

    if (!checkDuplicates()) {
      return;
    }

    try {
      await onAddUsers(validUsers);
      await onSuccess();
      onClose();
    } catch (err) {
      console.error('사용자 추가 오류:', err);
      setError(err instanceof Error ? err.message : '사용자 추가에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-users-modal-overlay" onClick={onClose}>
      <div className="add-users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-users-modal-header">
          <h3>사용자 일괄 추가</h3>
          <button className="close-btn" onClick={onClose} disabled={isLoading}>
            ✕
          </button>
        </div>

        <div className="add-users-modal-content">
          {/* 탭 */}
          <div className="add-users-tabs">
            <button
              className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
              disabled={isLoading}
            >
              직접 입력
            </button>
            <button
              className={`tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
              onClick={() => setActiveTab('excel')}
              disabled={isLoading}
            >
              엑셀 파일 업로드
            </button>
          </div>

          {/* 직접 입력 탭 */}
          {activeTab === 'manual' && (
            <div className="manual-input-section">
              <div className="users-list-header">
                <div className="header-col header-col-id">학번/교번</div>
                <div className="header-col header-col-name">이름</div>
                <div className="header-col header-col-action">작업</div>
                <div className="header-col header-col-add">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="add-row-btn"
                    disabled={isLoading}
                  >
                    항목 추가
                  </button>
                </div>
              </div>
              <div className="users-list-body">
                {users.map((user, index) => (
                  <div key={index} className="user-row">
                    <div className="user-col user-col-id">
                      <input
                        type="text"
                        value={user.no_member}
                        onChange={(e) => handleUserChange(index, 'no_member', e.target.value)}
                        placeholder="예: 20230701"
                        disabled={isLoading}
                        className={validationErrors[index] ? 'error' : ''}
                      />
                    </div>
                    <div className="user-col user-col-name">
                      <input
                        type="text"
                        value={user.name_member}
                        onChange={(e) => handleUserChange(index, 'name_member', e.target.value)}
                        placeholder="예: 홍길동"
                        disabled={isLoading}
                        className={validationErrors[index] ? 'error' : ''}
                      />
                    </div>
                    <div className="user-col user-col-action">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={isLoading || users.length === 1}
                        className="remove-row-btn"
                      >
                        삭제
                      </button>
                    </div>
                    <div className="user-col user-col-add"></div>
                    {validationErrors[index] && (
                      <div className="row-error">{validationErrors[index]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 엑셀 파일 업로드 탭 */}
          {activeTab === 'excel' && (
            <div className="excel-upload-section">
              <div className="upload-instructions">
                <h4>엑셀 파일 업로드 방법</h4>
                <ol>
                  <li>아래 버튼을 클릭하여 엑셀 양식을 다운로드합니다.</li>
                  <li>다운로드한 양식에 사용자 정보를 입력합니다.</li>
                  <li>입력한 엑셀 파일을 업로드합니다.</li>
                </ol>
              </div>

              <div className="upload-actions">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="download-template-btn"
                  disabled={isLoading}
                >
                  엑셀 양식 다운로드
                </button>
                <label className="upload-file-btn">
                  엑셀 파일 선택
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="add-users-modal-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUsersModal;

