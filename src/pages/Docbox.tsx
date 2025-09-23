import React, { useState, useEffect } from "react";
import "./Docbox.css";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId, deleteRowsByDocIds, updateLastModifiedInSheetByDocId } from "../utils/googleSheetUtils";
import { addRecentDocument } from "../utils/localStorageUtils";
import { BiLoaderAlt, BiShareAlt } from "react-icons/bi";

interface Document {
  id: string;
  title: string;
  author: string;
  lastModified: string;
  url: string;
  documentNumber: string;
  approvalDate: string;
  status: string;
  originalIndex: number;
}

interface DocboxProps {
  searchTerm: string;
}

const Docbox: React.FC<DocboxProps> = ({ searchTerm }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("전체");
  const [selectedSort, setSelectedSort] = useState<string>("최신순");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const SPREADSHEET_NAME = 'hot_potato_DB';
    const DOC_SHEET_NAME = 'documents';

    const fetchAndSyncDocuments = async () => {
      console.log("Fetching and syncing documents...");
      const sheetId = await getSheetIdByName(SPREADSHEET_NAME);
      if (!sheetId) {
        return;
      }

      const data = await getSheetData(sheetId, DOC_SHEET_NAME, 'A:I');
      if (!data || data.length <= 1) {
        setDocuments([]);
        return;
      }

      const header = data[0];
      const initialDocs: Document[] = data.slice(1).map((row, index) => {
        const doc: any = {};
        header.forEach((key, hIndex) => {
          doc[key] = row[hIndex];
        });
        return {
          id: doc.document_id,
          title: doc.title,
          author: doc.author,
          lastModified: doc.last_modified,
          url: doc.url,
          documentNumber: doc.document_number,
          approvalDate: doc.approval_date,
          status: doc.status,
          originalIndex: index,
        };
      }).filter(doc => doc.id); // Ensure documents have an ID

      const gapi = (window as any).gapi;
      if (!gapi?.client?.drive || initialDocs.length === 0) {
        setDocuments(initialDocs);
        return;
      }

      const batch = gapi.client.newBatch();
      initialDocs.forEach(doc => {
        batch.add(gapi.client.drive.files.get({ fileId: doc.id, fields: 'name,modifiedTime' }), { id: doc.id });
      });

      try {
        const batchResponse = await batch;
        const driveResults = batchResponse.result;
        const syncedDocs = [...initialDocs];

        Object.keys(driveResults).forEach(docId => {
          const response = driveResults[docId];
          if (!response || !response.result) {
            console.warn(`No result for docId ${docId} in batch response.`);
            return;
          }
          
          const latestTitle = response.result.name;
          const latestModifiedTime = response.result.modifiedTime;
          const docIndex = syncedDocs.findIndex(d => d.id === docId);

          if (docIndex !== -1) {
            if (latestTitle && latestTitle !== syncedDocs[docIndex].title) {
              console.log(`Syncing title for ${docId}: "${syncedDocs[docIndex].title}" -> "${latestTitle}"`);
              syncedDocs[docIndex].title = latestTitle;
              updateTitleInSheetByDocId(sheetId, DOC_SHEET_NAME, docId, latestTitle);
            }
            if (latestModifiedTime && new Date(latestModifiedTime).getTime() !== new Date(syncedDocs[docIndex].lastModified).getTime()) {
              const date = new Date(latestModifiedTime);
              const formattedDate = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}. ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
              syncedDocs[docIndex].lastModified = formattedDate;
              updateLastModifiedInSheetByDocId(sheetId, DOC_SHEET_NAME, docId, formattedDate);
            }
          }
        });

        setDocuments(syncedDocs);

      } catch (error) {
        console.error("Error during title sync on load:", error);
        setDocuments(initialDocs);
      }
    };

    const loadDocs = async () => {
      setIsLoading(true);
      try {
        await fetchAndSyncDocuments();
      } finally {
        setIsLoading(false);
      }
    };

    loadDocs();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDocs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleResetFilters = () => {
    setSelectedAuthor("전체");
    setSelectedSort("최신순");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleRowClick = (doc: Document) => {
    addRecentDocument(doc);
    window.open(doc.url, '_blank');
  };

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch = searchTerm === '' || doc.title.replace(/\s/g, '').toLowerCase().includes(searchTerm.replace(/\s/g, '').toLowerCase());
      const matchesAuthor = selectedAuthor === "전체" || doc.author === selectedAuthor;
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

      return matchesSearch && matchesAuthor;
    })
    .sort((a, b) => {
      const dateA = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
      const dateB = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));

      if (selectedSort === "최신순") {
        const dateDiff = dateB.getTime() - dateA.getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.originalIndex - a.originalIndex; // newest index first
      } else if (selectedSort === "오래된순") {
        const dateDiff = dateA.getTime() - dateB.getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.originalIndex - b.originalIndex; // oldest index first
      } else if (selectedSort === "제목순") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const authors = ["전체", ...new Set(documents.map(doc => doc.author))];

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

  const handleDelete = async () => {
    if (selectedDocs.length === 0) {
      alert("삭제할 문서를 선택하세요.");
      return;
    }

    if (window.confirm(`선택된 ${selectedDocs.length}개의 문서를 정말 삭제하시겠습니까?`)) {
      try {
        const SPREADSHEET_NAME = 'hot_potato_DB';
        const DOC_SHEET_NAME = 'documents';
        const sheetId = await getSheetIdByName(SPREADSHEET_NAME);
        if (!sheetId) {
          alert("스프레드시트를 찾을 수 없습니다.");
          return;
        }

        await deleteRowsByDocIds(sheetId, DOC_SHEET_NAME, selectedDocs);

        setDocuments(prevDocs => prevDocs.filter(doc => !selectedDocs.includes(doc.id)));
        setSelectedDocs([]);

        alert("선택한 문서가 삭제되었습니다.");

      } catch (error) {
        console.error("문서 삭제 중 오류 발생:", error);
        alert("문서 삭제 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      }
    }
  };

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
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <div className="filter-group author-sort-filter">
            <div className="filter-label">기안자</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                {authors.map(author => <option key={author}>{author}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group author-sort-filter">
            <div className="filter-label">정렬</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
              >
                <option>최신순</option>
                <option>오래된순</option>
                <option>제목순</option>
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
        </div>
        <div className="filter-row" style={{ marginTop: "0" }}>
            <div className="filter-actions" style={{width: "100%"}}>
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
          <button className="btn-print" onClick={handleShare}>
            <BiShareAlt color="black" size={14} />
            공유
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            <span className="icon-trash"></span>
            삭제
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
            <div className="table-header-cell doc-number-cell">문서번호</div>
            <div className="table-header-cell title-cell">제목</div>
            <div className="table-header-cell author-cell">기안자</div>
            <div className="table-header-cell date-cell">최근 수정일</div>
            <div className="table-header-cell approval-date-cell">결재일</div>
            <div className="table-header-cell status-cell">상태</div>
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
              <div className="table-cell author-cell">{doc.author}</div>
              <div className="table-cell date-cell">{doc.lastModified}</div>
              <div className="table-cell approval-date-cell">{doc.approvalDate}</div>
              <div className="table-cell status-cell">
                <div className={`status-badge ${doc.status?.toLowerCase()}`}>
                  <div className="status-text">{doc.status}</div>
                </div>
              </div>
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
    </div>
  );
};

export default Docbox;
