/**
 * @file LedgerDetail.tsx
 * @brief 장부 상세 페이지
 * @details 선택된 장부의 상세 정보와 항목을 표시하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { LedgerEntryList } from './LedgerEntryList';
import { CategoryManagement } from './CategoryManagement';
import { AccountDisplay } from './AccountDisplay';
import { BudgetPlanList } from './BudgetPlanList';
import { LedgerExportModal } from './LedgerExportModal';
import { useLedgerManagement } from '../../../hooks/features/accounting/useLedgerManagement';
import type { LedgerInfo, LedgerEntry } from '../../../types/features/accounting';
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
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isBudgetCreateModalOpen, setIsBudgetCreateModalOpen] = useState(false);
  const [entryListControls, setEntryListControls] = useState<{
    sortedMonths: string[];
    selectedMonthTab: string | null;
    itemsPerPage: number;
    groupedByMonth: Record<string, LedgerEntry[]>;
    formatMonthLabel: (monthKey: string) => string;
    handleAddMonthTab: () => void;
    onMonthTabChange: (monthKey: string) => void;
    onItemsPerPageChange: (value: number) => void;
    finalBalance: number;
  } | null>(null);

  // 이전 컨트롤 값을 저장하기 위한 ref
  const prevControlsRef = useRef<string>('');

  // onControlsRender를 useCallback으로 메모이제이션하여 무한 루프 방지
  const handleControlsRender = useCallback((controls: {
    sortedMonths: string[];
    selectedMonthTab: string | null;
    itemsPerPage: number;
    groupedByMonth: Record<string, LedgerEntry[]>;
    formatMonthLabel: (monthKey: string) => string;
    handleAddMonthTab: () => void;
    onMonthTabChange: (monthKey: string) => void;
    onItemsPerPageChange: (value: number) => void;
    finalBalance: number;
  }) => {
    // 변경된 값만 추출하여 비교 (함수 제외)
    const controlsKey = JSON.stringify({
      sortedMonths: controls.sortedMonths,
      selectedMonthTab: controls.selectedMonthTab,
      itemsPerPage: controls.itemsPerPage,
      finalBalance: controls.finalBalance,
      groupedByMonthKeys: Object.keys(controls.groupedByMonth)
    });
    
    // 이전 값과 다를 때만 업데이트
    if (prevControlsRef.current !== controlsKey) {
      prevControlsRef.current = controlsKey;
      setEntryListControls(controls);
    }
  }, []);
  
  // 항목 추가 핸들러
  const handleAddEntry = () => {
    setIsAddingNew(true);
    // 첫 번째 페이지로 이동하여 인라인 추가 행이 보이도록 함
    if (entryListControls && entryListControls.selectedMonthTab) {
      // 현재 선택된 월 탭의 첫 번째 페이지로 이동
      const currentMonth = entryListControls.selectedMonthTab;
      entryListControls.onMonthTabChange(currentMonth);
    } else if (entryListControls && entryListControls.sortedMonths.length > 0) {
      // 월 탭이 있으면 첫 번째 월 탭 선택
      entryListControls.onMonthTabChange(entryListControls.sortedMonths[0]);
    }
  };

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
      <>
        <div className="accounting-header">
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
          <button onClick={onBack} className="back-btn">목록으로</button>
        </div>
        <div className="accounting-content">
          <p className="error-message">스프레드시트를 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="accounting-header">
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
        {activeTab === 'entries' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="export-btn"
              disabled={entries.length === 0}
            >
              내보내기
            </button>
            <button onClick={onBack} className="back-btn">목록으로</button>
          </div>
        )}
        {activeTab !== 'entries' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {activeTab === 'budgets' && (
              <button 
                onClick={() => setIsBudgetCreateModalOpen(true)}
                className="back-btn"
              >
                예산안 생성
              </button>
            )}
            <button onClick={onBack} className="back-btn">목록으로</button>
          </div>
        )}
      </div>

      {/* 장부 항목 컨트롤 (월별 탭, 페이지당 항목 수) */}
      {activeTab === 'entries' && entryListControls && (
        <div className="ledger-entry-controls">
          {/* 월별 탭 */}
          <div className="month-tabs">
            <button
              className="month-nav-btn"
              onClick={() => {
                const currentIndex = entryListControls.sortedMonths.findIndex(
                  m => m === entryListControls.selectedMonthTab
                );
                // 1개씩 앞으로 이동 (이전 월)
                if (currentIndex > 0) {
                  entryListControls.onMonthTabChange(entryListControls.sortedMonths[currentIndex - 1]);
                }
              }}
              disabled={entryListControls.sortedMonths.findIndex(m => m === entryListControls.selectedMonthTab) === 0}
            >
              <FaChevronLeft />
            </button>
            {entryListControls.selectedMonthTab && (() => {
              const monthEntries = entryListControls.groupedByMonth[entryListControls.selectedMonthTab] || [];
              
              return (
                <div className="month-display">
                  <span className="month-display-item active">
                    {entryListControls.formatMonthLabel(entryListControls.selectedMonthTab)} ({monthEntries.length})
                  </span>
                </div>
              );
            })()}
            <button
              className="month-nav-btn"
              onClick={() => {
                const currentIndex = entryListControls.sortedMonths.findIndex(
                  m => m === entryListControls.selectedMonthTab
                );
                // 1개씩 뒤로 이동 (다음 월)
                if (currentIndex < entryListControls.sortedMonths.length - 1) {
                  entryListControls.onMonthTabChange(entryListControls.sortedMonths[currentIndex + 1]);
                }
              }}
              disabled={entryListControls.sortedMonths.findIndex(m => m === entryListControls.selectedMonthTab) === entryListControls.sortedMonths.length - 1}
            >
              <FaChevronRight />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {entryListControls.finalBalance !== undefined && (
              <button className="tab-button final-balance-tab" disabled>
                최종 잔액: {entryListControls.finalBalance.toLocaleString()}원
              </button>
            )}
            <button
              className="add-entry-btn"
              onClick={handleAddEntry}
              disabled={isAddingNew}
              title="항목 추가"
            >
              <FaPlus />
              <span>항목 추가</span>
            </button>
          </div>
        </div>
      )}

      <div className="accounting-content">
        {activeTab === 'entries' && (
          <LedgerEntryList 
              spreadsheetId={ledger.spreadsheetId}
              onEntriesChange={setEntries}
              onAddClick={handleAddEntry}
              addDisabled={isAddingNew}
              isAddingNew={isAddingNew}
              onAddingNewChange={setIsAddingNew}
              onControlsRender={handleControlsRender}
            />
        )}
        {activeTab === 'accounts' && (
          <AccountDisplay spreadsheetId={ledger.spreadsheetId} />
        )}
        {activeTab === 'budgets' && (
          <BudgetPlanList 
            spreadsheetId={ledger.spreadsheetId}
            isCreateModalOpen={isBudgetCreateModalOpen}
            onCloseCreateModal={() => setIsBudgetCreateModalOpen(false)}
          />
        )}
        {activeTab === 'categories' && (
          <CategoryManagement spreadsheetId={ledger.spreadsheetId} />
        )}
      </div>
      {activeTab === 'entries' && (
        <LedgerExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          entries={entries}
          spreadsheetId={ledger.spreadsheetId}
        />
      )}
    </>
  );
};

