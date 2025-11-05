/**
 * @file LedgerList.tsx
 * @brief 장부 목록 컴포넌트
 * @details 장부 목록을 표시하고 장부를 선택할 수 있는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import { useLedgerManagement } from '../../../hooks/features/accounting/useLedgerManagement';
import type { LedgerInfo } from '../../../types/features/accounting';
import './accounting.css';

interface LedgerListProps {
  onSelectLedger?: (ledger: LedgerInfo) => void;
  onCreateLedger?: () => void;
}

export const LedgerList: React.FC<LedgerListProps> = ({
  onSelectLedger,
  onCreateLedger
}) => {
  const { ledgers, isLoading, error, refreshLedgers, createLedger } = useLedgerManagement();

  const handleCreateSuccess = () => {
    refreshLedgers();
  };

  if (isLoading) {
    return (
      <div className="ledger-list-loading">
        <p>장부 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ledger-list-error">
        <p>❌ {error}</p>
        <button onClick={refreshLedgers}>다시 시도</button>
      </div>
    );
  }

  if (ledgers.length === 0) {
    return (
      <div className="ledger-list-empty">
        <p>등록된 장부가 없습니다.</p>
        {onCreateLedger && (
          <button onClick={onCreateLedger} className="create-ledger-btn">
            + 새 장부 만들기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ledger-list">
      <div className="ledger-list-header">
        <h2>장부 목록</h2>
        <div className="ledger-list-actions">
          <button onClick={refreshLedgers} className="refresh-btn">
            새로고침
          </button>
          {onCreateLedger && (
            <button onClick={onCreateLedger} className="create-ledger-btn">
              + 새 장부 만들기
            </button>
          )}
        </div>
      </div>
      
      <div className="ledger-grid">
        {ledgers.map((ledger) => (
          <div 
            key={ledger.folderId} 
            className="ledger-card"
            onClick={() => onSelectLedger?.(ledger)}
          >
            <h3>{ledger.folderName}</h3>
            <div className="ledger-info">
              <p className="ledger-date">
                생성일: {ledger.createdDate 
                  ? new Date(ledger.createdDate).toLocaleDateString('ko-KR')
                  : '알 수 없음'}
              </p>
              <div className="ledger-status">
                <span className={`status-icon ${ledger.spreadsheetId ? 'success' : 'error'}`}>
                  {ledger.spreadsheetId ? '✅' : '❌'}
                </span>
                <span>스프레드시트</span>
              </div>
              <div className="ledger-status">
                <span className={`status-icon ${ledger.evidenceFolderId ? 'success' : 'error'}`}>
                  {ledger.evidenceFolderId ? '✅' : '❌'}
                </span>
                <span>증빙 폴더</span>
              </div>
            </div>
            {onSelectLedger && (
              <button 
                className="ledger-open-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLedger(ledger);
                }}
              >
                장부 열기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

