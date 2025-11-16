/**
 * @file Accounting.tsx
 * @brief 회계 메인 페이지
 * @details 장부 목록을 표시하고 회계 기능에 접근할 수 있는 메인 페이지입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { LedgerList } from '../components/features/accounting/LedgerList';
import { CreateLedgerModal } from '../components/features/accounting/CreateLedgerModal';
import { LedgerDetail } from '../components/features/accounting/LedgerDetail';
import { useLedgerManagement } from '../hooks/features/accounting/useLedgerManagement';
import StatCard from '../components/features/documents/StatCard';
import { FaBook, FaWallet, FaChartLine, FaPlus } from 'react-icons/fa';
import type { LedgerInfo } from '../types/features/accounting';
import './Accounting.css';

interface AccountingProps {
  onPageChange?: (pageName: string) => void;
}

const Accounting: React.FC<AccountingProps> = ({ onPageChange }) => {
  const [selectedLedger, setSelectedLedger] = useState<LedgerInfo | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { ledgers } = useLedgerManagement();

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

  // 통계 계산
  const totalLedgersCount = ledgers.length;
  const activeLedgersCount = ledgers.filter(ledger => ledger.spreadsheetId).length;
  const inactiveLedgersCount = ledgers.filter(ledger => !ledger.spreadsheetId).length;

  const accountingStatCards = [
    {
      count: totalLedgersCount,
      title: '전체 장부',
      backgroundColor: '#E3F2FD',
      textColor: '#000000',
      icon: FaBook,
      iconColor: '#1976D2',
    },
    {
      count: activeLedgersCount,
      title: '활성 장부',
      backgroundColor: '#E8F5E9',
      textColor: '#000000',
      icon: FaWallet,
      iconColor: '#388E3C',
    },
    {
      count: inactiveLedgersCount,
      title: '비활성 장부',
      backgroundColor: '#FFF9C4',
      textColor: '#000000',
      icon: FaChartLine,
      iconColor: '#F57C00',
    },
  ];

  if (selectedLedger) {
    return (
      <div className="accounting-page">
        <LedgerDetail
          ledger={selectedLedger}
          onBack={() => setSelectedLedger(null)}
          onSelectLedger={handleSelectLedger}
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
      {/* 통계 카드 */}
      <div className="stats-container">
        {accountingStatCards.map((stat, index) => (
          <StatCard
            key={index}
            count={stat.count}
            title={stat.title}
            backgroundColor={stat.backgroundColor}
            textColor={stat.textColor}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
        {!selectedLedger && (
          <StatCard
            count={0}
            title="새 장부"
            backgroundColor="#FCE4EC"
            textColor="#000000"
            icon={FaPlus}
            iconColor="#C2185B"
            onClick={handleCreateLedger}
          />
        )}
      </div>

      <div className="accounting-list-section">
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

