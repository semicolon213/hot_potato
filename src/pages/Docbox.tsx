import React, { useState, useEffect } from "react";
import "./Docbox.css";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId } from "../utils/googleSheetUtils";

interface Document {
  id: string;
  title: string;
  author: string;
  lastModified: string;
  url: string;
  documentNumber: string;
  approvalDate: string;
  status: string;
}

const Docbox: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("전체");
  const [selectedSort, setSelectedSort] = useState<string>("최신순");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    const SPREADSHEET_NAME = 'hot_potato_DB';
    const DOC_SHEET_NAME = 'documents';

    const fetchAndSyncDocuments = async () => {
      console.log("Fetching and syncing documents...");
      const sheetId = await getSheetIdByName(SPREADSHEET_NAME);
      if (!sheetId) return;

      const data = await getSheetData(sheetId, DOC_SHEET_NAME, 'A:I');
      if (!data || data.length <= 1) {
        setDocuments([]);
        return;
      }

      const header = data[0];
      const initialDocs: Document[] = data.slice(1).map(row => {
        const doc: any = {};
        header.forEach((key, index) => {
          doc[key] = row[index];
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
        };
      }).filter(doc => doc.id); // Ensure documents have an ID

      const gapi = (window as any).gapi;
      if (!gapi?.client?.drive || initialDocs.length === 0) {
        setDocuments(initialDocs);
        return;
      }

      const batch = gapi.client.newBatch();
      initialDocs.forEach(doc => {
        batch.add(gapi.client.drive.files.get({ fileId: doc.id, fields: 'name' }), { id: doc.id });
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
          const docIndex = syncedDocs.findIndex(d => d.id === docId);

          if (docIndex !== -1 && latestTitle && latestTitle !== syncedDocs[docIndex].title) {
            console.log(`Syncing title for ${docId}: "${syncedDocs[docIndex].title}" -> "${latestTitle}"`);
            syncedDocs[docIndex].title = latestTitle;
            updateTitleInSheetByDocId(sheetId, DOC_SHEET_NAME, docId, latestTitle);
          }
        });

        setDocuments(syncedDocs);

      } catch (error) {
        console.error("Error during title sync on load:", error);
        setDocuments(initialDocs);
      }
    };

    // Initial fetch
    fetchAndSyncDocuments();

    // Set up event listener for tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAndSyncDocuments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleResetFilters = () => {
    setSelectedAuthor("전체");
    setSelectedSort("최신순");
    setStartDate("");
    setEndDate("");
  };

  const handleRowClick = (url: string) => {
    window.open(url, '_blank');
  };

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesAuthor = selectedAuthor === "전체" || doc.author === selectedAuthor;
      const docDate = new Date(doc.lastModified.replace(/\./g, '-').slice(0, -1));
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && docDate < start) return false;
      if (end && docDate > end) return false;
      return matchesAuthor;
    })
    .sort((a, b) => {
      if (selectedSort === "최신순") {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      } else if (selectedSort === "오래된순") {
        return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      } else if (selectedSort === "제목순") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const authors = ["전체", ...new Set(documents.map(doc => doc.author))];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocs(filteredDocuments.map((doc) => doc.id));
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

  const handleDelete = () => {
    alert("삭제 기능은 현재 구현되지 않았습니다.");
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

  return (
    <div className="content" id="dynamicContent">
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
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

          <div className="filter-group">
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
        </div>
        <div className="filter-row second-row">
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

              <span className="date-separator">~</span>
              <input
                type="date"
                className="date-input"
                placeholder="종료일"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
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
            <span className="icon-print"></span>
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
              <div className="section-title" style={{ color: "white" }}>
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
                checked={filteredDocuments.length > 0 && selectedDocs.length === filteredDocuments.length}
              />
            </div>
            <div className="table-header-cell doc-number-cell">문서번호</div>
            <div className="table-header-cell title-cell">제목</div>
            <div className="table-header-cell author-cell">기안자</div>
            <div className="table-header-cell date-cell">최근 수정일</div>
            <div className="table-header-cell approval-date-cell">결재일</div>
            <div className="table-header-cell status-cell">상태</div>
          </div>

          {filteredDocuments.map((doc) => (
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
              <div className="table-cell title-cell title-bold" onClick={() => handleRowClick(doc.url)} style={{cursor: 'pointer'}}>
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
          ))}
        </div>
      </div>

      <div className="pagination">
        <div className="per-page">
          페이지당 항목:
          <select className="per-page-select">
            <option>10</option>
            <option>20</option>
          </select>
        </div>

        <div className="pagination-controls">
          <button className="pagination-btn prev-btn">&lt;</button>
          <button className="pagination-btn page-btn active">1</button>
          <button className="pagination-btn page-btn">2</button>
          <button className="pagination-btn page-btn">3</button>
          <button className="pagination-btn next-btn">&gt;</button>
        </div>

        <div className="pagination-info">
          총 {filteredDocuments.length}개 중 1-
          {Math.min(10, filteredDocuments.length)}
        </div>
      </div>
    </div>
  );
};

export default Docbox;
