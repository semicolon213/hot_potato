/**
 * @file LedgerEntryList.tsx
 * @brief 장부 항목 목록 컴포넌트
 * @details 장부 항목을 표시하고 필터링할 수 있는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getLedgerEntries, getAccounts, getCategories, deleteLedgerEntry } from '../../../utils/database/accountingManager';
import { AddLedgerEntryModal } from './AddLedgerEntryModal';
import { EditLedgerEntryModal } from './EditLedgerEntryModal';
import { FilterPanel } from './FilterPanel';
import type { LedgerEntry, LedgerEntryFilter, Account, Category } from '../../../types/features/accounting';
import './accounting.css';

interface LedgerEntryListProps {
  spreadsheetId: string;
  accountId?: string;
}

export const LedgerEntryList: React.FC<LedgerEntryListProps> = ({
  spreadsheetId,
  accountId
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<LedgerEntryFilter>({ transactionType: 'all' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || '');
  
  // loadEntries를 useCallback으로 먼저 정의
  const loadEntries = useCallback(async (accountId?: string) => {
    // accountId 파라미터가 있으면 사용, 없으면 selectedAccountId 사용
    const targetAccountId = accountId || selectedAccountId;
    
    if (!targetAccountId) {
      console.warn('⚠️ 통장 ID가 없어 장부 항목을 로드할 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 필터 변환: 'all'인 경우 undefined로, categories 배열에서 첫 번째 값 추출
      const convertedFilter = {
        ...filter,
        transactionType: filter.transactionType === 'all' ? undefined : (filter.transactionType as 'income' | 'expense' | undefined),
        category: filter.categories && filter.categories.length > 0 ? filter.categories[0] : undefined,
        searchTerm: filter.searchTerm || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined
      };
      // undefined 값 제거
      Object.keys(convertedFilter).forEach(key => {
        if ((convertedFilter as any)[key] === undefined) {
          delete (convertedFilter as any)[key];
        }
      });
      
      console.log('📋 장부 항목 로드:', { spreadsheetId, targetAccountId, filter, convertedFilter });
      
      const entriesData = await getLedgerEntries(
        spreadsheetId,
        targetAccountId,
        convertedFilter as any
      );
      console.log('✅ 장부 항목 로드 완료:', entriesData.length, '개');
      setEntries(entriesData);
    } catch (err) {
      console.error('❌ 장부 항목 조회 오류:', err);
      setError('장부 항목을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [spreadsheetId, selectedAccountId, filter]);

  // 장부마다 통장이 하나이므로 첫 번째 통장 사용
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].accountId);
    }
  }, [accounts]);

  useEffect(() => {
    loadData();
  }, [spreadsheetId]);

  useEffect(() => {
    // accounts가 로드되고 selectedAccountId가 설정된 후에만 장부 항목 로드
    if (accounts.length > 0 && selectedAccountId) {
      loadEntries();
    }
  }, [spreadsheetId, selectedAccountId, filter, accounts.length, loadEntries]);

  const loadData = async () => {
    try {
      console.log('📋 통장 및 카테고리 로드 시작:', spreadsheetId);
      const [accountsData, categoriesData] = await Promise.all([
        getAccounts(spreadsheetId),
        getCategories(spreadsheetId)
      ]);
      console.log('✅ 통장 목록:', accountsData);
      console.log('✅ 카테고리 목록:', categoriesData);
      
      setAccounts(accountsData);
      setCategories(categoriesData);

      if (accountsData.length > 0) {
        const firstAccountId = accountsData[0].accountId;
        console.log('🔍 첫 번째 통장 ID:', firstAccountId);
        if (!selectedAccountId || selectedAccountId !== firstAccountId) {
          console.log('✅ 통장 ID 설정:', firstAccountId);
          setSelectedAccountId(firstAccountId);
          // 통장 ID가 설정되면 자동으로 장부 항목 로드
          loadEntries(firstAccountId);
        }
      } else {
        console.warn('⚠️ 통장이 없습니다.');
        setError('통장 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('❌ 데이터 로드 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleAddSuccess = () => {
    loadEntries();
    loadData(); // 잔액 업데이트를 위해
  };

  const handleEditSuccess = () => {
    loadEntries();
    loadData(); // 잔액 업데이트를 위해
  };

  const handleEdit = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (entry: LedgerEntry) => {
    if (!window.confirm('정말로 이 장부 항목을 삭제하시겠습니까?')) {
      return;
    }

    if (!selectedAccountId) {
      alert('통장 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      await deleteLedgerEntry(spreadsheetId, entry.entryId, selectedAccountId);
      await loadEntries();
      await loadData(); // 잔액 업데이트를 위해
    } catch (err: any) {
      console.error('❌ 장부 항목 삭제 오류:', err);
      setError(err.message || '장부 항목 삭제에 실패했습니다.');
      alert('장부 항목 삭제에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const categoryNames = categories.map(cat => cat.categoryName);

  return (
    <div className="ledger-entry-list">
      <div className="ledger-entry-list-header">
        <h2>장부 항목</h2>
        <div className="ledger-entry-list-actions">
          {accounts.length > 0 && (
            <div className="account-info-display">
              <span className="account-name">{accounts[0].accountName}</span>
              <span className="account-balance">잔액: {accounts[0].currentBalance.toLocaleString()}원</span>
            </div>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="add-entry-btn"
          >
            + 항목 추가
          </button>
        </div>
      </div>

      <FilterPanel
        categories={categoryNames}
        onFilterChange={setFilter}
        initialFilter={filter}
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">
          로딩 중...
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-message">
          장부 항목이 없습니다.
        </div>
      ) : (
        <div className="ledger-entry-table-container">
          <table className="ledger-entry-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>유형</th>
                <th>카테고리</th>
                <th>내용</th>
                <th>금액</th>
                <th>출처</th>
                <th>잔액</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.entryId}>
                  <td>{formatDate(entry.date)}</td>
                  <td>
                    <span className={`transaction-type-badge ${entry.transactionType}`}>
                      {entry.transactionType === 'income' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td>{entry.category}</td>
                  <td>{entry.description}</td>
                  <td className={`amount-cell ${entry.transactionType}`}>
                    {formatAmount(entry.amount)}
                  </td>
                  <td>{entry.source}</td>
                  <td>{entry.balanceAfter.toLocaleString()}원</td>
                  <td>
                    <div className="entry-actions">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="btn-edit"
                        title="수정"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="btn-delete"
                        title="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLedgerEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        spreadsheetId={spreadsheetId}
      />

      <EditLedgerEntryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEntry(null);
        }}
        onSuccess={handleEditSuccess}
        spreadsheetId={spreadsheetId}
        entry={selectedEntry}
      />
    </div>
  );
};

