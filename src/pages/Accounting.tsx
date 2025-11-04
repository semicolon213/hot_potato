/**
 * @file Accounting.tsx
 * @brief 회계 메인 페이지
 * @details 장부 목록을 표시하고 회계 기능에 접근할 수 있는 메인 페이지입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState } from 'react';
import { LedgerList } from '../components/features/accounting/LedgerList';
import { CreateLedgerModal } from '../components/features/accounting/CreateLedgerModal';
import { LedgerDetail } from '../components/features/accounting/LedgerDetail';
import type { LedgerInfo } from '../types/features/accounting';
import './Accounting.css';

interface AccountingProps {
  onPageChange?: (pageName: string) => void;
}

const Accounting: React.FC<AccountingProps> = ({ onPageChange }) => {
  const [selectedLedger, setSelectedLedger] = useState<LedgerInfo | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSelectLedger = (ledger: LedgerInfo) => {
    setSelectedLedger(ledger);
  };

  const handleCreateLedger = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    // 장부 목록 새로고침은 LedgerList 내부에서 처리됨
  };

  if (selectedLedger) {
    return (
      <div className="accounting-page">
        <LedgerDetail
          ledger={selectedLedger}
          onBack={() => setSelectedLedger(null)}
        />
        <CreateLedgerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  return (
    <div className="accounting-page">
      <div className="accounting-header">
        <h1>회계 관리</h1>
      </div>
      <div className="accounting-content">
        <LedgerList
          onSelectLedger={handleSelectLedger}
          onCreateLedger={handleCreateLedger}
        />
      </div>
      <CreateLedgerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Accounting;

