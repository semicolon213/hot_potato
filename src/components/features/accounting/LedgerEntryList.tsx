/**
 * @file LedgerEntryList.tsx
 * @brief 장부 항목 목록 컴포넌트
 * @details 장부 항목을 표시하고 필터링할 수 있는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getLedgerEntries, getAccounts, getCategories, deleteLedgerEntry, createLedgerEntry, updateLedgerEntry } from '../../../utils/database/accountingManager';
import { FilterPanel } from './FilterPanel';
import type { LedgerEntry, LedgerEntryFilter, Account, Category, CreateLedgerEntryRequest, UpdateLedgerEntryRequest } from '../../../types/features/accounting';
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<LedgerEntry> | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<CreateLedgerEntryRequest>>({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'expense',
    category: '',
    description: '',
    amount: 0,
    source: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || '');
  const [currentPage, setCurrentPage] = useState<{ [monthKey: string]: number }>({});
  
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

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingEntryId(null);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      transactionType: 'expense',
      category: '',
      description: '',
      amount: 0,
      source: ''
    });
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      transactionType: 'expense',
      category: '',
      description: '',
      amount: 0,
      source: ''
    });
  };

  const handleSaveAdd = async () => {
    if (!selectedAccountId) {
      setError('통장 정보를 찾을 수 없습니다.');
      return;
    }

    if (!newEntry.date || !newEntry.category || !newEntry.description || !newEntry.source) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!newEntry.amount || newEntry.amount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      const entryData: CreateLedgerEntryRequest = {
        accountId: selectedAccountId,
        date: new Date(newEntry.date!).toISOString(),
        category: newEntry.category!,
        description: newEntry.description!,
        amount: newEntry.amount!,
        source: newEntry.source!,
        transactionType: newEntry.transactionType || 'expense'
      };

      await createLedgerEntry(
        spreadsheetId,
        entryData,
        userInfo.studentId || userInfo.email || 'unknown'
      );

      setIsAddingNew(false);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        transactionType: 'expense',
        category: '',
        description: '',
        amount: 0,
        source: ''
      });
      await loadEntries();
      await loadData();
    } catch (err: any) {
      console.error('❌ 장부 항목 추가 오류:', err);
      setError(err.message || '장부 항목 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (entry: LedgerEntry) => {
    if (entry.isBudgetExecuted && entry.budgetPlanId) {
      alert('예산안으로 생성된 항목은 수정할 수 없습니다.');
      return;
    }
    setEditingEntryId(entry.entryId);
    setIsAddingNew(false);
    setEditingEntry({
      ...entry,
      date: entry.date.split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingEntry(null);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editingEntryId || !selectedAccountId) {
      return;
    }

    if (!editingEntry.date || !editingEntry.category || !editingEntry.description || !editingEntry.source) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!editingEntry.amount || editingEntry.amount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updateData: UpdateLedgerEntryRequest = {
        accountId: selectedAccountId,
        date: new Date(editingEntry.date).toISOString(),
        category: editingEntry.category,
        description: editingEntry.description,
        amount: editingEntry.amount,
        source: editingEntry.source,
        transactionType: editingEntry.transactionType || 'expense'
      };

      await updateLedgerEntry(spreadsheetId, editingEntryId, updateData);
      
      setEditingEntryId(null);
      setEditingEntry(null);
      await loadEntries();
      await loadData();
    } catch (err: any) {
      console.error('❌ 장부 항목 수정 오류:', err);
      setError(err.message || '장부 항목 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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

  const parseAmount = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const formatAmountForInput = (value: number): string => {
    if (!value) return '';
    return value.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatMonthKey = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  // 월별로 그룹화
  const groupedByMonth = entries.reduce((acc, entry) => {
    const monthKey = formatMonthKey(entry.date);
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, LedgerEntry[]>);

  // 월별로 정렬 (최신순)
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  const categoryNames = categories.map(cat => cat.categoryName);

  const ITEMS_PER_PAGE = 10;

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
            onClick={handleStartAdd}
            className="add-entry-btn"
            disabled={isAddingNew || editingEntryId !== null}
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
      ) : entries.length === 0 && !isAddingNew ? (
        <div className="empty-message">
          장부 항목이 없습니다.
        </div>
      ) : (
        <div className="ledger-entry-list-content">
          {(sortedMonths.length > 0 ? sortedMonths : ['new']).map(monthKey => {
            const monthEntries = groupedByMonth[monthKey] || [];
            const totalPages = Math.ceil(monthEntries.length / ITEMS_PER_PAGE) || 1;
            const page = currentPage[monthKey] || 1;
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const paginatedEntries = monthEntries.slice(startIndex, endIndex);

            // 새 항목 추가 행이 첫 번째 섹션에만 표시되어야 함
            const shouldShowAddRow = isAddingNew && monthKey === (sortedMonths[0] || 'new') && page === 1;

            return (
              <div key={monthKey} className="month-section">
                {monthKey !== 'new' && (
                  <div className="month-header">
                    <h3>{formatMonthLabel(monthKey)} ({monthEntries.length}건)</h3>
                  </div>
                )}
                <div className="ledger-entry-table-wrapper">
                  <table className="ledger-entry-table">
                    <thead>
                      <tr>
                        <th className="col-date">날짜</th>
                        <th className="col-type">유형</th>
                        <th className="col-category">카테고리</th>
                        <th className="col-budget-plan">예산안 이름</th>
                        <th className="col-description">내용</th>
                        <th className="col-amount">금액</th>
                        <th className="col-source">출처</th>
                        <th className="col-balance">잔액</th>
                        <th className="col-action">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 새 항목 추가 행 */}
                      {shouldShowAddRow && (
                        <tr className="editing-row">
                          <td className="cell-date">
                            <input
                              type="date"
                              value={newEntry.date || ''}
                              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                              className="table-input-date"
                              required
                            />
                          </td>
                          <td className="cell-type">
                            <select
                              value={newEntry.transactionType || 'expense'}
                              onChange={(e) => setNewEntry({ ...newEntry, transactionType: e.target.value as 'income' | 'expense' })}
                              className="table-input-select"
                            >
                              <option value="expense">지출</option>
                              <option value="income">수입</option>
                            </select>
                          </td>
                          <td className="cell-category">
                            <select
                              value={newEntry.category || ''}
                              onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                              className="table-input-select"
                              required
                            >
                              <option value="">카테고리 선택</option>
                              {categories.map(cat => (
                                <option key={cat.categoryId} value={cat.categoryName}>
                                  {cat.categoryName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="cell-budget-plan">
                            <span className="budget-plan-title-empty">-</span>
                          </td>
                          <td className="cell-description">
                            <input
                              type="text"
                              value={newEntry.description || ''}
                              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                              placeholder="내용을 입력하세요"
                              className="table-input-text"
                              required
                            />
                          </td>
                          <td className="cell-amount">
                            <input
                              type="text"
                              value={newEntry.amount ? formatAmountForInput(newEntry.amount) : ''}
                              onChange={(e) => {
                                const parsed = parseAmount(e.target.value);
                                setNewEntry({ ...newEntry, amount: parsed });
                              }}
                              placeholder="0"
                              className="table-input-text"
                              required
                            />
                          </td>
                          <td className="cell-source">
                            <input
                              type="text"
                              value={newEntry.source || ''}
                              onChange={(e) => setNewEntry({ ...newEntry, source: e.target.value })}
                              placeholder="출처를 입력하세요"
                              className="table-input-text"
                              required
                            />
                          </td>
                          <td className="cell-balance">-</td>
                          <td className="cell-action">
                            <div className="entry-actions">
                              <button
                                onClick={handleSaveAdd}
                                className="btn-save action-btn"
                                disabled={isLoading}
                              >
                                저장
                              </button>
                              <button
                                onClick={handleCancelAdd}
                                className="btn-cancel action-btn"
                                disabled={isLoading}
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* 기존 항목 행들 */}
                      {monthKey !== 'new' && paginatedEntries.map(entry => {
                        const isEditing = editingEntryId === entry.entryId;
                        const entryData = isEditing ? editingEntry : entry;
                        
                        return (
                          <tr key={entry.entryId} className={isEditing ? 'editing-row' : ''}>
                            <td className="cell-date">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={entryData?.date?.toString().split('T')[0] || ''}
                                  onChange={(e) => setEditingEntry({ ...editingEntry!, date: e.target.value })}
                                  className="table-input-date"
                                  required
                                />
                              ) : (
                                formatDate(entry.date)
                              )}
                            </td>
                            <td className="cell-type">
                              {isEditing ? (
                                <select
                                  value={entryData?.transactionType || 'expense'}
                                  onChange={(e) => setEditingEntry({ ...editingEntry!, transactionType: e.target.value as 'income' | 'expense' })}
                                  className="table-input-select"
                                >
                                  <option value="expense">지출</option>
                                  <option value="income">수입</option>
                                </select>
                              ) : (
                                <span className={`transaction-type-badge ${entry.transactionType}`}>
                                  {entry.transactionType === 'income' ? '수입' : '지출'}
                                </span>
                              )}
                            </td>
                            <td className="cell-category">
                              {isEditing ? (
                                <select
                                  value={entryData?.category || ''}
                                  onChange={(e) => setEditingEntry({ ...editingEntry!, category: e.target.value })}
                                  className="table-input-select"
                                  required
                                >
                                  <option value="">카테고리 선택</option>
                                  {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryName}>
                                      {cat.categoryName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                entry.category
                              )}
                            </td>
                            <td className="cell-budget-plan budget-plan-title-cell">
                              {entry.isBudgetExecuted && entry.budgetPlanTitle ? (
                                <span className="budget-plan-title-display">{entry.budgetPlanTitle}</span>
                              ) : (
                                <span className="budget-plan-title-empty">-</span>
                              )}
                            </td>
                            <td className="cell-description">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={entryData?.description || ''}
                                  onChange={(e) => setEditingEntry({ ...editingEntry!, description: e.target.value })}
                                  className="table-input-text"
                                  required
                                />
                              ) : (
                                entry.description
                              )}
                            </td>
                            <td className={`cell-amount ${isEditing ? '' : `amount-cell ${entry.transactionType}`}`}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={entryData?.amount ? formatAmountForInput(entryData.amount) : ''}
                                  onChange={(e) => {
                                    const parsed = parseAmount(e.target.value);
                                    setEditingEntry({ ...editingEntry!, amount: parsed });
                                  }}
                                  className="table-input-text"
                                  required
                                />
                              ) : (
                                formatAmount(entry.amount)
                              )}
                            </td>
                            <td className="cell-source">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={entryData?.source || ''}
                                  onChange={(e) => setEditingEntry({ ...editingEntry!, source: e.target.value })}
                                  className="table-input-text"
                                  required
                                />
                              ) : (
                                entry.source
                              )}
                            </td>
                            <td className="cell-balance">
                              {isEditing ? '-' : `${entry.balanceAfter.toLocaleString()}원`}
                            </td>
                            <td className="cell-action">
                              <div className="entry-actions">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="btn-save action-btn"
                                      disabled={isLoading}
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="btn-cancel action-btn"
                                      disabled={isLoading}
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(entry)}
                                      className="btn-edit action-btn"
                                      title="수정"
                                      disabled={entry.isBudgetExecuted && entry.budgetPlanId || isAddingNew || editingEntryId !== null}
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry)}
                                      className="btn-delete action-btn"
                                      title="삭제"
                                      disabled={entry.isBudgetExecuted && entry.budgetPlanId || isAddingNew || editingEntryId !== null}
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(prev => ({ ...prev, [monthKey]: Math.max(1, page - 1) }))}
                      disabled={page === 1}
                    >
                      이전
                    </button>
                    <span>{page} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => ({ ...prev, [monthKey]: Math.min(totalPages, page + 1) }))}
                      disabled={page === totalPages}
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

