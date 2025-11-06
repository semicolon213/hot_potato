import React, { useState, useEffect } from "react";
import "../styles/pages/Docbox.css";
import "../styles/pages/NewDocument.css";
import { addRecentDocument } from "../utils/helpers/localStorageUtils";
import { BiLoaderAlt, BiShareAlt, BiUpload } from "react-icons/bi";
import { loadAllDocuments } from "../utils/helpers/loadDocumentsFromDrive";
import { uploadSharedDocument, uploadPersonalDocument } from "../utils/google/documentUploader";
import { ENV_CONFIG } from "../config/environment";
import { apiClient } from "../utils/api/apiClient";
import { fetchTags as fetchPersonalTags } from "../utils/database/personalTagManager";
import EmailAutocomplete from "../components/ui/common/EmailAutocomplete";
import type { DocumentInfo } from "../types/documents";


interface DocboxProps {
  searchTerm: string;
}

const Docbox: React.FC<DocboxProps> = ({ searchTerm }) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<string>("전체");
  const [selectedTag, setSelectedTag] = useState<string>("전체");
  const [selectedType, setSelectedType] = useState<string>("전체");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 정렬 상태 추가
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // 문서 업로드 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadTag, setUploadTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // 권한 설정 상태 (권한 선택에 따라 문서 타입 결정)
  const [permissionType, setPermissionType] = useState<'private' | 'shared'>('shared');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [individualEmails, setIndividualEmails] = useState<string[]>(['']);

  // 태그 상태
  const [staticTags, setStaticTags] = useState<string[]>([]);
  const [personalTags, setPersonalTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        console.log("📄 Docbox에서 문서 로딩 시작...");
        const allDocs = await loadAllDocuments();
        console.log("📄 로딩된 문서 수:", allDocs.length);
        setDocuments(allDocs);
      } catch (error) {
        console.error("📄 문서 로딩 오류:", error);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDocuments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 태그 목록 로드
  useEffect(() => {
    const loadTags = async () => {
      setIsLoadingTags(true);
      try {
        // 기본 태그 로드
        const staticTagsResponse = await apiClient.getStaticTags();
        if (staticTagsResponse.success && staticTagsResponse.data) {
          setStaticTags(staticTagsResponse.data);
        }

        // 개인 태그 로드
        const personalTagsData = await fetchPersonalTags();
        setPersonalTags(personalTagsData);
      } catch (error) {
        console.error('태그 로드 오류:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (showUploadModal) {
      loadTags();
    }
  }, [showUploadModal]);

  const handleResetFilters = () => {
    setSelectedCreator("전체");
    setSelectedTag("전체");
    setSelectedType("전체");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setSortConfig(null);
  };

  // 정렬 함수 추가
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowClick = (doc: DocumentInfo) => {
    addRecentDocument(doc);
    window.open(doc.url, '_blank');
  };

  // 문서 타입을 한국어로 변환
  const typeMap: { [key: string]: string } = {
    'shared': '공유',
    'personal': '개인'
  };

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch = searchTerm === '' || doc.title.replace(/\s/g, '').toLowerCase().includes(searchTerm.replace(/\s/g, '').toLowerCase());
      const matchesCreator = selectedCreator === "전체" || doc.creator === selectedCreator;
      const matchesTag = selectedTag === "전체" || doc.tag === selectedTag;
      const matchesType = selectedType === "전체" || typeMap[doc.documentType] === selectedType;
      
      let docDate = null;
      const match = doc.documentNumber.match(/(\d{8})/);
      if (match) {
        const dateStr = match[1];
        docDate = new Date(dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8));
      }

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      if (start || end) {
        if (!docDate) return false;
        if (start && docDate < start) return false;
        if (end && docDate > end) return false;
      }

      return matchesSearch && matchesCreator && matchesTag && matchesType;
    })
    .sort((a, b) => {
      if (sortConfig) {
        let aValue: any;
        let bValue: any;
        
        switch (sortConfig.key) {
          case 'documentNumber':
            aValue = a.documentNumber;
            bValue = b.documentNumber;
            break;
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'creator':
            aValue = a.creator;
            bValue = b.creator;
            break;
          case 'lastModified':
            aValue = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
            bValue = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));
            break;
          case 'tag':
            aValue = a.tag;
            bValue = b.tag;
            break;
          case 'documentType':
            aValue = typeMap[a.documentType] || a.documentType;
            bValue = typeMap[b.documentType] || b.documentType;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      
      // 기본 정렬: 최신순
      const dateA = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
      const dateB = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.originalIndex - a.originalIndex;
    });

  // 동적 필터 옵션 생성
  const creators = ["전체", ...new Set(documents.map(doc => doc.creator).filter(Boolean))];
  const tags = ["전체", ...new Set(documents.map(doc => doc.tag).filter(Boolean))];
  const types = ["전체", ...new Set(documents.map(doc => typeMap[doc.documentType] || doc.documentType).filter(Boolean))];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocs(paginatedDocuments.map((doc) => doc.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleDocCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    if (e.target.checked) {
      setSelectedDocs((prev) => [...prev, docId]);
    } else {
      setSelectedDocs((prev) => prev.filter((id) => id !== docId));
    }
  };

  // 삭제 기능 제거 - 문서는 Google Drive에서 직접 관리

  const handleShare = () => {
    if (selectedDocs.length !== 1) {
      alert("공유할 문서 1개를 선택하세요.");
      return;
    }
    const docToShare = documents.find(doc => doc.id === selectedDocs[0]);
    if (docToShare) {
      navigator.clipboard.writeText(docToShare.url)
        .then(() => alert("문서 링크가 클립보드에 복사되었습니다."))
        .catch(() => alert("링크 복사에 실패했습니다."));
    }
  };

  // 업로드 모달 열기
  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadFileName('');
    setUploadTag('');
    setPermissionType('shared');
    setSelectedGroups([]);
    setIndividualEmails(['']);
  };

  // 업로드 모달 닫기
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadFileName('');
    setUploadTag('');
    setIsUploading(false);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // 파일명이 비어있으면 파일명으로 설정
      if (!uploadFileName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadFileName(nameWithoutExt);
      }
    }
  };

  // 문서 업로드 실행
  const handleUpload = async () => {
    if (!uploadFile || !uploadFileName.trim()) {
      alert('파일과 파일명을 입력해주세요.');
      return;
    }

    // 권한 부여를 선택했을 때만 태그 필수
    if (permissionType === 'shared' && !uploadTag.trim()) {
      alert('태그를 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const creatorEmail = userInfo.email || '';

      let result;
      
      if (permissionType === 'shared') {
        // 공유 문서 업로드 (권한 부여 선택 시)
        const groupEmails = selectedGroups.map(group => ENV_CONFIG.GROUP_EMAILS[group as keyof typeof ENV_CONFIG.GROUP_EMAILS]).filter(Boolean) as string[];
        const allEditors = [...groupEmails, ...individualEmails.filter(email => email.trim())];
        
        result = await uploadSharedDocument(
          uploadFile,
          uploadFileName,
          uploadTag,
          creatorEmail,
          allEditors
        );
      } else {
        // 개인 문서 업로드 (나만 보기 선택 시)
        result = await uploadPersonalDocument(
          uploadFile,
          uploadFileName,
          uploadTag || '개인',
          creatorEmail
        );
      }

      if (result.success) {
        alert('문서가 성공적으로 업로드되었습니다.');
        closeUploadModal();
        
        // 문서 목록 새로고침
        setIsLoading(true);
        const allDocs = await loadAllDocuments();
        setDocuments(allDocs);
        setIsLoading(false);
      } else {
        alert(`업로드 실패: ${result.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

  return (
    <div className="content docbox-padding" id="dynamicContent">
      <div className="filter-section">
        <div className="filter-row" style={{ marginBottom: 0, alignItems: 'flex-end' }}>
          <div className="filter-group author-sort-filter">
            <div className="filter-label">생성자</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
              >
                {creators.map(creator => <option key={creator}>{creator}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group author-sort-filter">
            <div className="filter-label">태그</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                {tags.map(tag => <option key={tag}>{tag}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group author-sort-filter">
            <div className="filter-label">유형</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group date-group">
            <div className="filter-label">기간</div>
            <div className="date-range">
              <input
                type="date"
                className="date-input"
                placeholder="시작일"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <span className="date-separator">~
              </span>
              <input
                type="date"
                className="date-input"
                placeholder="종료일"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-actions" style={{ marginBottom: '0px' }}>
            <button className="btn-reset" onClick={handleResetFilters}>
                필터 초기화
            </button>
          </div>
        </div>
      </div>

      <div className="doc-list-header">
        <div className="doc-count">
          <span className="count-text">
            총 {filteredDocuments.length}개의 문서
          </span>
        </div>
        <div className="doc-actions">
          <button className="btn-print" onClick={openUploadModal} style={{ marginRight: '8px' }}>
            <BiUpload color="black" style={{ fontSize: '14px' }} />
            업로드
          </button>
          <button className="btn-print" onClick={handleShare}>
            <BiShareAlt color="black" style={{ fontSize: '14px' }} />
            공유
          </button>
        </div>
      </div>

      <div className="docbox-container">
        <div className="table-container">
          <div
            className="section-header"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <div className="section-title-container">
              <div className="section-title no-line" style={{ color: "white", margin: "10px 0 0 20px" }}>
                문서함
              </div>
            </div>
          </div>

          <div className="table-header">
            <div className="table-header-cell checkbox-cell">
              <input
                type="checkbox"
                className="doc-checkbox"
                id="select-all"
                onChange={handleSelectAll}
                checked={filteredDocuments.length > 0 && selectedDocs.length === paginatedDocuments.length && paginatedDocuments.length > 0}
              />
            </div>
            <div 
              className="table-header-cell doc-number-cell sortable" 
              onClick={() => handleSort('documentNumber')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>문서고유번호</span>
                {sortConfig?.key === 'documentNumber' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <div 
              className="table-header-cell title-cell sortable" 
              onClick={() => handleSort('title')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>문서이름</span>
                {sortConfig?.key === 'title' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <div 
              className="table-header-cell author-cell sortable" 
              onClick={() => handleSort('creator')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>생성자</span>
                {sortConfig?.key === 'creator' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <div 
              className="table-header-cell date-cell sortable" 
              onClick={() => handleSort('lastModified')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>수정시간</span>
                {sortConfig?.key === 'lastModified' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <div 
              className="table-header-cell tag-cell sortable" 
              onClick={() => handleSort('tag')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>태그</span>
                {sortConfig?.key === 'tag' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <div 
              className="table-header-cell type-cell sortable" 
              onClick={() => handleSort('documentType')}
              style={{ cursor: 'pointer' }}
            >
              <div className="header-content">
                <span>유형</span>
                {sortConfig?.key === 'documentType' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="table-row">
              <div className="table-cell loading-cell">
                <BiLoaderAlt className="spinner" />
                <span>문서를 불러오는 중입니다...</span>
              </div>
            </div>
          ) : paginatedDocuments.length > 0 ? (
            paginatedDocuments.map((doc) => (
            <div className="table-row" key={doc.id}>
              <div className="table-cell checkbox-cell">
                <input
                  type="checkbox"
                  className="doc-checkbox"
                  id={`doc-${doc.id}`}
                  onChange={(e) => handleDocCheckboxChange(e, doc.id)}
                  checked={selectedDocs.includes(doc.id)}
                />
              </div>
              <div className="table-cell doc-number-cell">{doc.documentNumber}</div>
              <div className="table-cell title-cell title-bold" onClick={() => handleRowClick(doc)} style={{cursor: 'pointer'}}>
                {doc.title}
              </div>
              <div className="table-cell author-cell">{doc.creator}</div>
              <div className="table-cell date-cell">{doc.lastModified}</div>
              <div className="table-cell tag-cell">{doc.tag}</div>
              <div className="table-cell type-cell">{doc.documentType === 'shared' ? '공유' : '개인'}</div>
            </div>
          ))
          ) : (
            <div className="table-row">
              <div className="table-cell no-results-cell">
                문서가 없습니다.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pagination">
        <div className="per-page">
          페이지당 항목:
          <select className="per-page-select" value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option>10</option>
            <option>20</option>
          </select>
        </div>

        <div className="pagination-controls">
          <button className="pagination-btn prev-btn" onClick={handlePrevPage} disabled={currentPage === 1}>&lt;</button>
          {pageNumbers.map(number => (
            <button 
              key={number} 
              className={`pagination-btn page-btn ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          ))}
          <button className="pagination-btn next-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>&gt;</button>
        </div>

        <div className="pagination-info">
          총 {filteredDocuments.length}개 중 {filteredDocuments.length > 0 ? startIndex : 0}-
          {endIndex}
        </div>
      </div>

      {/* 문서 업로드 모달 */}
      {showUploadModal && (
        <div className="document-modal-overlay" onClick={closeUploadModal}>
          <div className="document-modal-content has-file-upload" onClick={(e) => e.stopPropagation()}>
            <div className="document-modal-header">
              <div className="header-left">
                <h2>📤 문서 업로드</h2>
                <p className="header-subtitle">파일을 업로드하고 문서 정보를 입력해주세요</p>
              </div>
              <button className="document-modal-close" onClick={closeUploadModal}>
                <span>&times;</span>
              </button>
            </div>
            
            <div className="document-modal-body">
              {/* 파일 선택 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label htmlFor="upload-file" className="form-label-large">
                    <span className="label-icon">📁</span>
                    파일 선택
                  </label>
                  <div className="file-upload-area">
                    <input
                      id="upload-file"
                      type="file"
                      accept=".docx,.xlsx,.doc,.xls,.pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                      disabled={isUploading}
                    />
                    <div className="file-upload-display" onClick={() => !isUploading && document.getElementById('upload-file')?.click()}>
                      {uploadFile ? (
                        <div className="uploaded-file">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{uploadFile.name}</span>
                          <span className="file-size">({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <span className="upload-icon">📁</span>
                          <span className="upload-text">파일을 선택하거나 여기에 드래그하세요</span>
                          <span className="upload-hint">지원 형식: .docx, .xlsx, .doc, .xls, .pdf</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 파일명 입력 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label htmlFor="upload-filename" className="form-label-large">
                    <span className="label-icon">📝</span>
                    파일명
                  </label>
                  <input
                    id="upload-filename"
                    type="text"
                    className="form-input-large"
                    placeholder="예: 2024년 1월 정기회의록"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    disabled={isUploading}
                  />
                  <div className="input-hint">문서를 식별할 수 있는 명확한 파일명을 입력하세요</div>
                </div>

                {/* 태그 선택 */}
                <div className="form-group-large">
                  <label htmlFor="upload-tag" className="form-label-large">
                    <span className="label-icon">🏷️</span>
                    태그
                  </label>
                  <select
                    id="upload-tag"
                    className="form-select-large"
                    value={uploadTag}
                    onChange={(e) => setUploadTag(e.target.value)}
                    disabled={isUploading || isLoadingTags}
                  >
                    <option value="">선택 안 함</option>
                    {staticTags.length > 0 && (
                      <optgroup label="기본 태그">
                        {staticTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </optgroup>
                    )}
                    {personalTags.length > 0 && (
                      <optgroup label="개인 태그">
                        {personalTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="input-hint">
                    {permissionType === 'shared' 
                      ? '문서를 분류할 태그를 선택하세요 (필수)' 
                      : '문서를 분류할 태그를 선택하세요 (선택사항)'
                    }
                  </div>
                </div>
              </div>

              {/* 문서 접근 권한 설정 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label className="form-label-large">
                    <span className="label-icon">🔐</span>
                    문서 접근 권한
                  </label>
                  <div className="permission-options">
                    <button
                      type="button"
                      className={`permission-option ${permissionType === 'private' ? 'active' : ''}`}
                      onClick={() => setPermissionType('private')}
                      disabled={isUploading}
                    >
                      <div className="option-icon">🔒</div>
                      <div className="option-content">
                        <div className="option-title">나만 보기</div>
                        <div className="option-desc">개인 문서 폴더에 저장</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`permission-option ${permissionType === 'shared' ? 'active' : ''}`}
                      onClick={() => setPermissionType('shared')}
                      disabled={isUploading}
                    >
                      <div className="option-icon">👥</div>
                      <div className="option-content">
                        <div className="option-title">권한 부여</div>
                        <div className="option-desc">공유 문서 폴더에 저장</div>
                      </div>
                    </button>
                  </div>
                </div>

                {permissionType === 'shared' && (
                  <div className="sharing-options">
                    <h4 className="section-title">공유 설정</h4>
                    
                    <div className="group-permissions-section">
                      <h5 className="subsection-title">그룹 권한</h5>
                      <div className="group-permissions">
                        {Object.entries(ENV_CONFIG.GROUP_EMAILS).map(([key, email]) => (
                          <label key={key} className="group-permission-item">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, key]);
                                } else {
                                  setSelectedGroups(selectedGroups.filter(group => group !== key));
                                }
                              }}
                              disabled={isUploading}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="group-name">
                              {key === 'STUDENT' && '학생'}
                              {key === 'COUNCIL' && '집행부'}
                              {key === 'PROFESSOR' && '교수'}
                              {key === 'ADJUNCT_PROFESSOR' && '겸임교원'}
                              {key === 'ASSISTANT' && '조교'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="individual-emails-section">
                      <h5 className="subsection-title">개별 이메일</h5>
                      <div className="individual-emails">
                        {individualEmails.map((email, index) => (
                          <div key={index} className="email-input-group">
                            <EmailAutocomplete
                              value={email}
                              onChange={(value) => {
                                const newEmails = [...individualEmails];
                                newEmails[index] = value;
                                setIndividualEmails(newEmails);
                              }}
                              placeholder="이름이나 이메일을 입력하세요"
                              disabled={isUploading}
                              className="email-input"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newEmails = individualEmails.filter((_, i) => i !== index);
                                setIndividualEmails(newEmails);
                              }}
                              className="remove-email-btn"
                              title="이메일 제거"
                              disabled={isUploading}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIndividualEmails([...individualEmails, ''])}
                          className="add-email-btn"
                          disabled={isUploading}
                        >
                          <span>+</span> 이메일 추가
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="document-modal-actions">
              <button 
                type="button" 
                className="action-btn cancel-btn" 
                onClick={closeUploadModal}
                disabled={isUploading}
              >
                <span>취소</span>
              </button>
              <button 
                type="button" 
                className="action-btn save-btn" 
                onClick={handleUpload}
                disabled={!uploadFile || !uploadFileName.trim() || (permissionType === 'shared' && !uploadTag.trim()) || isUploading}
              >
                <span>
                  {isUploading ? '업로드 중...' : '📤 업로드'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docbox;
