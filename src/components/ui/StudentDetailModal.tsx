import React, { useState, useEffect } from 'react';
import { getSheetData, appendSheetData } from '../../utils/google/googleSheetUtils';
import './StudentDetailModal.css';

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

interface StudentDetailModalProps {
  student: StudentWithCouncil | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: StudentWithCouncil) => void;
  studentSpreadsheetId: string | null;
}

interface StudentIssue {
  id: string;
  no_member: string;
  date_issue: string;
  type_issue: string;
  level_issue: string;
  content_issue: string;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onUpdate,
  studentSpreadsheetId
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'issues'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<StudentWithCouncil | null>(null);
  const [issues, setIssues] = useState<StudentIssue[]>([]);
  const [newIssue, setNewIssue] = useState<Omit<StudentIssue, 'id'>>({
    no_member: '',
    date_issue: '',
    type_issue: '',
    level_issue: '',
    content_issue: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      setEditedStudent({ ...student });
      setNewIssue({
        no_member: student.no_student,
        date_issue: '',
        type_issue: '',
        level_issue: '',
        content_issue: ''
      });
      loadStudentIssues();
    }
  }, [student, isOpen]);

  const loadStudentIssues = async () => {
    if (!student || !studentSpreadsheetId) return;

    setIsLoading(true);
    try {
      const data = await getSheetData(studentSpreadsheetId, 'std_issue', 'A:E');
      
      if (data && data.length > 1) {
        const studentIssues: StudentIssue[] = data.slice(1)
          .filter(row => row[0] === student.no_student)
          .map((row, index) => ({
            id: `issue_${index}`,
            no_member: row[0] || '',
            date_issue: row[1] || '',
            type_issue: row[2] || '',
            level_issue: row[3] || '',
            content_issue: row[4] || ''
          }));
        setIssues(studentIssues);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error('특이사항 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedStudent || !studentSpreadsheetId) return;

    try {
      const gapi = (window as any).gapi;
      const spreadsheet = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: studentSpreadsheetId
      });
      
      const sheets = spreadsheet.result.sheets;
      const firstSheetName = sheets[0].properties.title;
      
      const data = await getSheetData(studentSpreadsheetId, firstSheetName, 'A:F');
      if (data && data.length > 1) {
        const rowIndex = data.findIndex(row => row[0] === student?.no_student);
        if (rowIndex !== -1) {
          const range = `${firstSheetName}!A${rowIndex + 1}:F${rowIndex + 1}`;
          await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: studentSpreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [[
                editedStudent.no_student,
                editedStudent.name,
                editedStudent.address,
                editedStudent.grade,
                editedStudent.state,
                editedStudent.council
              ]]
            }
          });

          onUpdate(editedStudent);
          setIsEditing(false);
          alert('학생 정보가 성공적으로 업데이트되었습니다.');
        } else {
          alert('해당 학생을 찾을 수 없습니다.');
        }
      } else {
        alert('학생 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('학생 정보 업데이트 실패:', error);
      alert('학생 정보 업데이트에 실패했습니다.');
    }
  };

  const handleAddIssue = async () => {
    if (!newIssue.content_issue.trim() || !studentSpreadsheetId) return;

    try {
      const issueData = [
        newIssue.no_member,
        newIssue.date_issue || new Date().toISOString().split('T')[0],
        newIssue.type_issue,
        newIssue.level_issue,
        newIssue.content_issue
      ];

      await appendSheetData(studentSpreadsheetId, 'std_issue', [issueData]);
      
      const newIssueWithId: StudentIssue = {
        ...newIssue,
        id: `issue_${Date.now()}`,
        date_issue: newIssue.date_issue || new Date().toISOString().split('T')[0]
      };
      setIssues(prev => [...prev, newIssueWithId]);
      
      setNewIssue({
        no_member: student?.no_student || '',
        date_issue: new Date().toISOString().split('T')[0],
        type_issue: '',
        level_issue: '',
        content_issue: ''
      });
      
      alert('특이사항이 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('특이사항 추가 실패:', error);
      alert('특이사항 추가에 실패했습니다.');
    }
  };

  const handleInputChange = (field: keyof StudentWithCouncil, value: string) => {
    if (!editedStudent) return;
    setEditedStudent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleIssueInputChange = (field: keyof Omit<StudentIssue, 'id'>, value: string) => {
    setNewIssue(prev => ({ ...prev, [field]: value }));
  };

  // 일렉트론에서 입력 필드 포커스 문제 해결
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.focus();
    e.target.select();
  };

  if (!isOpen || !student || !editedStudent) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>학생 정보</h2>
          <div className="header-actions">
            {!isEditing ? (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                수정
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>
                  저장
                </button>
                <button className="cancel-btn" onClick={() => {
                  setIsEditing(false);
                  setEditedStudent({ ...student });
                }}>
                  취소
                </button>
              </div>
            )}
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            기본 정보
          </button>
          <button 
            className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => setActiveTab('issues')}
          >
            특이사항
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {activeTab === 'info' && (
            <div className="info-section">
              <h3>기본 정보</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>학번</label>
                  <input
                    type="text"
                    value={editedStudent.no_student}
                    onChange={(e) => handleInputChange('no_student', e.target.value)}
                    disabled={!isEditing}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    value={editedStudent.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
                <div className="form-group">
                  <label>학년</label>
                  <select
                    value={editedStudent.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    disabled={!isEditing}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  >
                    <option value="">선택하세요</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>상태</label>
                  <select
                    value={editedStudent.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={!isEditing}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  >
                    <option value="">선택하세요</option>
                    <option value="재학">재학</option>
                    <option value="휴학">휴학</option>
                    <option value="졸업">졸업</option>
                    <option value="자퇴">자퇴</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>주소</label>
                  <input
                    type="text"
                    value={editedStudent.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
                <div className="form-group full-width">
                  <label>학생회 직책</label>
                  <input
                    type="text"
                    value={editedStudent.council}
                    onChange={(e) => handleInputChange('council', e.target.value)}
                    disabled={!isEditing}
                    placeholder="예: 25 기획부장/24 총무부장"
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="issues-section">
              <h3>특이사항 기록</h3>
              
              <div className="add-issue-form">
                <div className="form-row">
                <div className="form-group">
                  <label>발생일</label>
                  <input
                    type="date"
                    value={newIssue.date_issue}
                    onChange={(e) => handleIssueInputChange('date_issue', e.target.value)}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
                <div className="form-group">
                  <label>유형</label>
                  <select
                    value={newIssue.type_issue}
                    onChange={(e) => handleIssueInputChange('type_issue', e.target.value)}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  >
                    <option value="">선택하세요</option>
                    <option value="학업">학업</option>
                    <option value="출석">출석</option>
                    <option value="행동">행동</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>심각도</label>
                  <select
                    value={newIssue.level_issue}
                    onChange={(e) => handleIssueInputChange('level_issue', e.target.value)}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  >
                    <option value="">선택하세요</option>
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                    <option value="심각">심각</option>
                  </select>
                </div>
                </div>
                <div className="form-group">
                  <label>내용</label>
                  <textarea
                    value={newIssue.content_issue}
                    onChange={(e) => handleIssueInputChange('content_issue', e.target.value)}
                    placeholder="특이사항 내용을 입력하세요..."
                    rows={3}
                    onFocus={handleInputFocus}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                </div>
                <div className="form-actions">
                  <button className="add-btn" onClick={handleAddIssue}>
                    특이사항 추가
                  </button>
                </div>
              </div>

              <div className="issues-list">
                <h4>기록된 특이사항 ({issues.length}건)</h4>
                {isLoading ? (
                  <div className="loading">특이사항을 불러오는 중...</div>
                ) : issues.length === 0 ? (
                  <div className="no-issues">기록된 특이사항이 없습니다.</div>
                ) : (
                  <div className="issues-grid">
                    {issues.map((issue) => (
                      <div key={issue.id} className="issue-card">
                        <div className="issue-header">
                          <span className="issue-date">{issue.date_issue}</span>
                          <span className={`issue-level ${issue.level_issue}`}>
                            {issue.level_issue}
                          </span>
                        </div>
                        <div className="issue-type">{issue.type_issue}</div>
                        <div className="issue-content">{issue.content_issue}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;