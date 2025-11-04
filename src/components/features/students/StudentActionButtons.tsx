// 학생 관리 액션 버튼 컴포넌트

import React, { useRef } from 'react';
import { FaDownload, FaFileDownload, FaUpload } from 'react-icons/fa';

interface StudentActionButtonsProps {
  onExportCSV: () => void;
  onDownloadTemplate: () => void;
  onFileUpload: (file: File) => Promise<void>;
  filteredCount: number;
  totalCount: number;
}

const StudentActionButtons: React.FC<StudentActionButtonsProps> = ({
  onExportCSV,
  onDownloadTemplate,
  onFileUpload,
  filteredCount,
  totalCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onFileUpload(file);
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        alert('파일 업로드에 실패했습니다.');
      }
    }
  };

  return (
    <div className="action-buttons">
      <div className="action-left">
        <button className="export-btn" onClick={onExportCSV}>
          <FaDownload className="btn-icon" />
          <span className="btn-text">CSV 다운로드</span>
        </button>
        <button 
          className="template-btn"
          onClick={onDownloadTemplate}
        >
          <FaFileDownload className="btn-icon" />
          <span className="btn-text">양식 다운로드</span>
        </button>
        <button 
          className="import-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <FaUpload className="btn-icon" />
          <span className="btn-text">일괄 업로드</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
      
      <div className="action-right">
        <div className="result-info">
          <span className="result-text">
            <span className="highlight">{filteredCount}</span>명 표시 중
          </span>
          {filteredCount !== totalCount && (
            <span className="total-text">
              (전체 {totalCount}명)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentActionButtons;
