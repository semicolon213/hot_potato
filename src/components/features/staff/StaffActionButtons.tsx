/**
 * @file StaffActionButtons.tsx
 * @brief 교직원 액션 버튼 컴포넌트
 * @details 학생관리 액션 버튼 구조를 재사용한 교직원 액션 버튼입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useRef } from 'react';

interface StaffActionButtonsProps {
  onExportCSV: () => void;
  onDownloadTemplate: () => void;
  onFileUpload: (file: File) => void;
  filteredCount: number;
  totalCount: number;
  activeTab: 'staff' | 'committee';
}

const StaffActionButtons: React.FC<StaffActionButtonsProps> = ({
  onExportCSV,
  onDownloadTemplate,
  onFileUpload,
  filteredCount,
  totalCount,
  activeTab
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
          <span className="btn-icon">⬇️</span>
          <span className="btn-text">CSV 다운로드</span>
        </button>
        <button 
          className="template-btn"
          onClick={onDownloadTemplate}
        >
          <span className="btn-icon">📄</span>
          <span className="btn-text">양식 다운로드</span>
        </button>
        <button 
          className="import-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="btn-icon">📤</span>
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
        <span className="count-info">
          {filteredCount} / {totalCount}명 표시
        </span>
      </div>
    </div>
  );
};

export default StaffActionButtons;


