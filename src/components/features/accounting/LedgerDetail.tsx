/**
 * @file LedgerDetail.tsx
 * @brief 장부 상세 페이지
 * @details 선택된 장부의 상세 정보와 항목을 표시하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect, useRef } from 'react';
import { LedgerEntryList } from './LedgerEntryList';
import { CategoryManagement } from './CategoryManagement';
import { AccountDisplay } from './AccountDisplay';
import { BudgetPlanList } from './BudgetPlanList';
import { useLedgerManagement } from '../../../hooks/features/accounting/useLedgerManagement';
import type { LedgerInfo } from '../../../types/features/accounting';
import './accounting.css';

interface LedgerDetailProps {
  ledger: LedgerInfo;
  onBack: () => void;
  onSelectLedger?: (ledger: LedgerInfo) => void;
}

type TabType = 'entries' | 'accounts' | 'categories' | 'budgets';

export const LedgerDetail: React.FC<LedgerDetailProps> = ({
  ledger,
  onBack,
  onSelectLedger
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('entries');
  const [showLedgerDropdown, setShowLedgerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { ledgers } = useLedgerManagement();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLedgerDropdown(false);
      }
    };

    if (showLedgerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLedgerDropdown]);

  const handleLedgerSelect = (selectedLedger: LedgerInfo) => {
    if (onSelectLedger) {
      onSelectLedger(selectedLedger);
    }
    setShowLedgerDropdown(false);
  };

  if (!ledger.spreadsheetId) {
    return (
      <div className="accounting-page">
        <div className="accounting-header">
          <button onClick={onBack} className="back-btn">← 뒤로</button>
          <h1>{ledger.folderName}</h1>
        </div>
        <div className="accounting-content">
          <p className="error-message">스프레드시트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-page">
      <div className="accounting-header">
        <button onClick={onBack} className="back-btn">← 뒤로</button>
        <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
          <h1 
            style={{ 
              cursor: onSelectLedger ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => onSelectLedger && setShowLedgerDropdown(!showLedgerDropdown)}
          >
            {ledger.folderName}
            {onSelectLedger && (
              <span style={{ fontSize: '0.8em', color: '#666' }}>▼</span>
            )}
          </h1>
          {showLedgerDropdown && onSelectLedger && ledgers.length > 0 && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '200px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              {ledgers.map((l) => (
                <div
                  key={l.folderId}
                  onClick={() => handleLedgerSelect(l)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    backgroundColor: l.folderId === ledger.folderId ? '#f0f0f0' : 'white',
                    fontWeight: l.folderId === ledger.folderId ? 'bold' : 'normal'
                  }}
                  onMouseEnter={(e) => {
                    if (l.folderId !== ledger.folderId) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (l.folderId !== ledger.folderId) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {l.folderName}
                  {l.folderId === ledger.folderId && (
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.9em' }}>(현재)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="accounting-content">
        <div className="ledger-tabs">
          <button
            className={`tab-button ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => setActiveTab('entries')}
          >
            장부 항목
          </button>
          <button
            className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            통장
          </button>
          <button
            className={`tab-button ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            예산 계획
          </button>
          <button
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            카테고리
          </button>
        </div>

        <div className="ledger-tab-content">
          {activeTab === 'entries' && (
            <LedgerEntryList spreadsheetId={ledger.spreadsheetId} />
          )}
          {activeTab === 'accounts' && (
            <AccountDisplay spreadsheetId={ledger.spreadsheetId} />
          )}
          {activeTab === 'budgets' && (
            <BudgetPlanList spreadsheetId={ledger.spreadsheetId} />
          )}
          {activeTab === 'categories' && (
            <CategoryManagement spreadsheetId={ledger.spreadsheetId} />
          )}
        </div>
      </div>
    </div>
  );
};

