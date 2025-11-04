/**
 * @file LedgerDetail.tsx
 * @brief 장부 상세 페이지
 * @details 선택된 장부의 상세 정보와 항목을 표시하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from 'react';
import { LedgerEntryList } from './LedgerEntryList';
import { CategoryManagement } from './CategoryManagement';
import { AccountDisplay } from './AccountDisplay';
import { BudgetPlanList } from './BudgetPlanList';
import type { LedgerInfo } from '../../../types/features/accounting';
import './accounting.css';

interface LedgerDetailProps {
  ledger: LedgerInfo;
  onBack: () => void;
}

type TabType = 'entries' | 'accounts' | 'categories' | 'budgets';

export const LedgerDetail: React.FC<LedgerDetailProps> = ({
  ledger,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('entries');

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
        <h1>{ledger.folderName}</h1>
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

