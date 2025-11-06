/**
 * @file CategoryManagement.tsx
 * @brief 카테고리 관리 컴포넌트
 * @details 장부의 카테고리를 추가, 수정, 삭제하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { getCategories, createCategory } from '../../../utils/database/accountingManager';
import type { Category } from '../../../types/features/accounting';
import './accounting.css';

interface CategoryManagementProps {
  spreadsheetId: string;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  spreadsheetId
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, [spreadsheetId]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories(spreadsheetId);
      setCategories(categoriesData);
    } catch (err) {
      console.error('❌ 카테고리 로드 오류:', err);
      setError('카테고리를 불러오는데 실패했습니다.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    // 중복 체크
    if (categories.some(cat => cat.categoryName.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      setError('이미 존재하는 카테고리입니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userInfo = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

      await createCategory(
        spreadsheetId,
        newCategoryName.trim(),
        newCategoryDescription.trim(),
        userInfo.studentId || userInfo.email || 'unknown'
      );

      await loadCategories();
      setIsAddModalOpen(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setError(null);
    } catch (err: any) {
      console.error('❌ 카테고리 추가 오류:', err);
      setError(err.message || '카테고리 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && newCategoryName.trim()) {
      e.preventDefault();
      handleAddCategory();
    }
  };

  // 검색 필터링
  const filteredCategories = categories.filter(category =>
    category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="category-management">
      <div className="category-management-header">
        <div className="category-header-left">
          <h3>카테고리 관리</h3>
          <span className="category-count">총 {categories.length}개</span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="add-category-btn"
        >
          <span className="btn-icon">+</span>
          카테고리 추가
        </button>
      </div>

      {/* 검색 바 */}
      {categories.length > 0 && (
        <div className="category-search">
          <input
            type="text"
            placeholder="카테고리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="category-search-input"
          />
        </div>
      )}

      {/* 카테고리 목록 */}
      <div className="category-list">
        {categories.length === 0 ? (
          <div className="empty-category-state">
            <div className="empty-icon">📁</div>
            <p className="empty-message">등록된 카테고리가 없습니다</p>
            <p className="empty-hint">카테고리를 추가하여 장부 항목을 분류하세요</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="add-category-btn-empty"
            >
              첫 카테고리 추가하기
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-category-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-message">검색 결과가 없습니다</p>
            <button
              onClick={() => setSearchTerm('')}
              className="add-category-btn-empty"
            >
              검색 초기화
            </button>
          </div>
        ) : (
          <div className="category-grid">
            {filteredCategories.map(category => (
              <div key={category.categoryId} className="category-card">
                <div className="category-card-header">
                  <h4 className="category-name">{category.categoryName}</h4>
                  <span className="category-usage-badge">
                    {category.usageCount}회 사용
                  </span>
                </div>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 추가 모달 */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>카테고리 추가</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="category-name">
                  카테고리 이름 <span className="required">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="예: MT, 회식, 소모품 등"
                  autoFocus
                  className={error && !newCategoryName.trim() ? 'input-error' : ''}
                />
                <p className="form-hint">장부 항목을 분류할 카테고리 이름을 입력하세요</p>
              </div>

              <div className="form-group">
                <label htmlFor="category-description">설명</label>
                <textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="카테고리 설명 (선택사항)"
                  rows={3}
                  className="category-description-textarea"
                />
                <p className="form-hint">카테고리에 대한 추가 설명을 입력할 수 있습니다</p>
              </div>

              {error && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isLoading}
                className="btn-cancel"
              >
                취소
              </button>
              <button
                onClick={handleAddCategory}
                disabled={isLoading || !newCategoryName.trim()}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    추가 중...
                  </>
                ) : (
                  '추가'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

