import React from "react";
import "./DocumentList.css";

interface Document {
  docNumber: string;
  title: string;
  author: string;
  lastModified: string;
  dueDate: string;
  status: string;
}

interface DocumentListProps {
  documents: Document[];
  onPageChange: (pageName: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onPageChange }) => {
  return (
    <div className="document-container">
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
          <div
            className="submenu-item"
            onClick={() => onPageChange("docbox")}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="view-all-button" style={{ color: "#e0e0e0" }}>
              모두 보기
            </div>
          </div>
        </div>

        <div className="table-header">
          <div className="table-header-cell doc-number-cell">문서번호</div>
          <div className="table-header-cell title-cell">제목</div>
          <div className="table-header-cell author-cell">작성자</div>
          <div className="table-header-cell date-cell">최근 수정일</div>
          <div className="table-header-cell date-cell">기한일</div>
          <div className="table-header-cell status-cell">상태</div>
        </div>

        {documents.map((doc, index) => (
          <div className="table-row" key={index}>
            <div className="table-cell doc-number-cell">{doc.docNumber}</div>
            <div className="table-cell title-cell title-bold">{doc.title}</div>
            <div className="table-cell author-cell">{doc.author}</div>
            <div className="table-cell date-cell">{doc.lastModified}</div>
            <div className="table-cell date-cell">{doc.dueDate}</div>
            <div className="table-cell status-cell">
              <div className="status-badge">
                <div className="status-text">{doc.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
