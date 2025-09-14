import React, { useState } from "react";
import "./Docbox.css";

interface Document {
  id: string;
  docNumber: string;
  title: string;
  author: string;
  lastModified: string;
  dueDate: string;
  status: string;
}

const initialDocuments: Document[] = [
];

const Docbox: React.FC = () => {
  const [documents] = useState<Document[]>(initialDocuments);
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("전체");
  const [selectedSort, setSelectedSort] = useState<string>("최신순");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocs(documents.map((doc) => doc.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleDocCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const docId = e.target.id.replace("doc-", "");
    if (e.target.checked) {
      setSelectedDocs((prev) => [...prev, docId]);
    } else {
      setSelectedDocs((prev) => prev.filter((id) => id !== docId));
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus("전체");
    setSelectedAuthor("전체");
    setSelectedSort("최신순");
    setSelectedCategory("전체");
    setStartDate("");
    setEndDate("");
  };

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesStatus =
        selectedStatus === "전체" || doc.status === selectedStatus;
      const matchesAuthor =
        selectedAuthor === "전체" || doc.author === selectedAuthor;
      // Add date filtering logic here if needed
      return matchesStatus && matchesAuthor;
    })
    .sort((a, b) => {
      if (selectedSort === "최신순") {
        return (
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
        );
      } else if (selectedSort === "오래된순") {
        return (
          new Date(a.lastModified).getTime() -
          new Date(b.lastModified).getTime()
        );
      } else if (selectedSort === "제목순") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  return (
    <div className="content" id="dynamicContent">
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <div className="filter-label">상태</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option>전체</option>
                <option>진행중</option>
                <option>완료</option>
                <option>반려</option>
                <option>임시저장</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">기안자</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                <option>전체</option>
                <option>나나</option>
                <option>이지원</option>
                <option>박서연</option>
                <option>김준호</option>
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

          <div className="filter-group">
            <div className="filter-label">카테고리</div>
            <div className="select-container">
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option>전체</option>
                <option>정기 회의</option>
                <option>부서 회의</option>
                <option>프로젝트 회의</option>
                <option>이사회</option>
                <option>전체 회의</option>
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
          <button className="btn-download">
            <span className="icon-download"></span>
            다운로드
          </button>
          <button className="btn-print">
            <span className="icon-print"></span>
            공유
          </button>
          <button className="btn-delete">
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
                checked={
                  selectedDocs.length === documents.length &&
                  documents.length > 0
                }
              />
            </div>
            <div className="table-header-cell doc-number-cell">문서번호</div>
            <div className="table-header-cell title-cell">제목</div>
            <div className="table-header-cell author-cell">기안자</div>
            <div className="table-header-cell date-cell">최근 수정일</div>
            <div className="table-header-cell date-cell">기한일</div>
            <div className="table-header-cell status-cell">상태</div>
          </div>

          {filteredDocuments.map((doc) => (
            <div className="table-row" key={doc.id}>
              <div className="table-cell checkbox-cell">
                <input
                  type="checkbox"
                  className="doc-checkbox"
                  id={`doc-${doc.id}`}
                  onChange={handleDocCheckboxChange}
                  checked={selectedDocs.includes(doc.id)}
                />
              </div>
              <div className="table-cell doc-number-cell">{doc.docNumber}</div>
              <div className="table-cell title-cell title-bold">
                {doc.title}
              </div>
              <div className="table-cell author-cell">{doc.author}</div>
              <div className="table-cell date-cell">{doc.lastModified}</div>
              <div className="table-cell date-cell">{doc.dueDate}</div>
              <div className="table-cell status-cell">
                <div
                  className={`status-badge ${doc.status === "완료" ? "complete" : doc.status === "반려" ? "rejected" : doc.status === "임시저장" ? "temp" : "progress"}`}
                >
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