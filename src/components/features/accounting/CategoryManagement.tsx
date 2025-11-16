/**
 * @file CategoryManagement.tsx
 * @brief 카테고리 관리 컴포넌트
 * @details 장부의 카테고리를 추가, 수정, 삭제하는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../utils/database/accountingManager';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
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
    } catch (err: unknown) {
      console.error('❌ 카테고리 추가 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '카테고리 추가에 실패했습니다.';
      setError(errorMessage);
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.categoryName);
    setEditCategoryDescription(category.description || '');
    setIsEditModalOpen(true);
    setError(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryDescription('');
    setError(null);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (!editCategoryName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    // 중복 체크 (자기 자신 제외)
    if (categories.some(cat => 
      cat.categoryId !== editingCategory.categoryId && 
      cat.categoryName.toLowerCase() === editCategoryName.trim().toLowerCase()
    )) {
      setError('이미 존재하는 카테고리 이름입니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateCategory(
        spreadsheetId,
        editingCategory.categoryId,
        editCategoryName.trim(),
        editCategoryDescription.trim()
      );

      await loadCategories();
      handleCloseEditModal();
      setError(null);
    } catch (err: unknown) {
      console.error('❌ 카테고리 수정 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '카테고리 수정에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`카테고리 "${category.categoryName}"를 삭제하시겠습니까?\n\n사용 중인 항목이 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteCategory(spreadsheetId, category.categoryId);
      await loadCategories();
      setError(null);
    } catch (err: unknown) {
      console.error('❌ 카테고리 삭제 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다.';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    <>
      <div className="category-table-wrapper">
        <table className="category-table">
          <thead>
            <tr>
              <th className="col-category-name">카테고리 이름</th>
              <th className="col-category-description">설명</th>
              <th className="col-category-usage">사용 횟수</th>
              <th className="col-category-actions">작업</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  <td className="cell-category-name"></td>
                  <td className="cell-category-description"></td>
                  <td className="cell-category-usage"></td>
                  <td className="cell-category-actions"></td>
                </tr>
              ))
            ) : filteredCategories.length === 0 ? (
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="cell-category-name"></td>
                  <td className="cell-category-description"></td>
                  <td className="cell-category-usage"></td>
                  <td className="cell-category-actions"></td>
                </tr>
              ))
            ) : (
              <>
                {filteredCategories.map(category => (
                  <tr key={category.categoryId}>
                    <td className="cell-category-name">{category.categoryName}</td>
                    <td className="cell-category-description">{category.description || ''}</td>
                    <td className="cell-category-usage">{category.usageCount}회</td>
                    <td className="cell-category-actions">
                      <div className="category-actions">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="btn-edit"
                          title="수정"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="btn-delete"
                          title="삭제"
                          disabled={category.usageCount > 0}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length < 10 && Array.from({ length: 10 - filteredCategories.length }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="cell-category-name"></td>
                    <td className="cell-category-description"></td>
                    <td className="cell-category-usage"></td>
                    <td className="cell-category-actions"></td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
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

      {/* 카테고리 수정 모달 */}
      {isEditModalOpen && editingCategory && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>카테고리 수정</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-category-name">
                  카테고리 이름 <span className="required">*</span>
                </label>
                <input
                  id="edit-category-name"
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => {
                    setEditCategoryName(e.target.value);
                    setError(null);
                  }}
                  placeholder="예: MT, 회식, 소모품 등"
                  autoFocus
                  className={error && !editCategoryName.trim() ? 'input-error' : ''}
                />
                <p className="form-hint">
                  카테고리 이름을 변경하면 장부 항목과 예산안의 카테고리도 자동으로 업데이트됩니다.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="edit-category-description">설명</label>
                <textarea
                  id="edit-category-description"
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  placeholder="카테고리 설명 (선택사항)"
                  rows={3}
                  className="category-description-textarea"
                />
                <p className="form-hint">카테고리 설명은 자유롭게 수정할 수 있으며, 다른 항목에 영향을 주지 않습니다.</p>
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
                onClick={handleCloseEditModal}
                disabled={isLoading}
                className="btn-cancel"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={isLoading || !editCategoryName.trim()}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    수정 중...
                  </>
                ) : (
                  '수정'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

