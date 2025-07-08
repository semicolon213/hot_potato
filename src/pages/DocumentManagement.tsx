import React from "react";
import "./DocumentManagement.css";

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({
  onPageChange,
}) => {
  const recentDocuments = [
    { name: "2024년 예산 계획안", time: "1일전" },
    { name: "3월 회의록", time: "2시간 전" },
    { name: "인사 발령 안내", time: "어제" },
  ];

  const frequentlyUsedForms = [
    { name: "보고서" },
    { name: "기획안" },
    { name: "회의록" },
  ];

  const documents = [
    {
      docNumber: "DOC-2024-001",
      title: "2024년 1분기 사업계획서",
      author: "이지원",
      lastModified: "2024-03-16",
      dueDate: "2024-03-15",
      status: "진행중",
    },
    {
      docNumber: "DOC-2024-002",
      title: "신규 프로젝트 제안서",
      author: "박서연",
      lastModified: "2024-03-15",
      dueDate: "2024-03-14",
      status: "진행중",
    },
    {
      docNumber: "DOC-2024-003",
      title: "인사 발령 품의서",
      author: "김준호",
      lastModified: "2024-03-14",
      dueDate: "2024-03-13",
      status: "진행중",
    },
    {
      docNumber: "DOC-2024-005",
      title: "연간 교육 계획서",
      author: "강현우",
      lastModified: "2024-03-12",
      dueDate: "2024-03-11",
      status: "진행중",
    },
  ];

  return (
    <div className="content">
      <div className="cards-row">
        <div className="card document-card">
          <div
            className="card-header"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <div className="card-icon-container">
              <div className="card-icon">
                <div className="icon icon-file"></div>
              </div>
            </div>
            <div className="card-title">최근 문서</div>
            <div className="card-subtitle">최근에 열람한 문서를 확인하세요</div>
          </div>

          <div className="items-list">
            {recentDocuments.map((doc, index) => (
              <div className="list-item" key={index}>
                <div className="item-info">
                  <div className="item-name">{doc.name}</div>
                  <div className="item-time">{doc.time}</div>
                </div>
                <div className="item-arrow">
                  <div className="icon icon-chevron-right"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card form-card">
          <div
            className="card-header"
            style={{ backgroundColor: "var(--table-header-bg)" }}
          >
            <div className="card-icon-container">
              <div className="card-icon">
                <div className="icon icon-star"></div>
              </div>
            </div>
            <div className="card-title">자주 찾는 양식</div>
            <div className="card-subtitle">
              자주 사용하는 양식을 빠르게 접근하세요
            </div>
          </div>

          <div className="items-list">
            {frequentlyUsedForms.map((form, index) => (
              <div className="list-item" key={index}>
                <div className="item-info">
                  <div className="item-name">{form.name}</div>
                </div>
                <div className="item-arrow">
                  <div className="icon icon-chevron-right"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              <div className="table-cell title-cell title-bold">
                {doc.title}
              </div>
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

      <div className="stats-container">
        <div
          className="stat-card"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <div className="stat-count" style={{ color: "white" }}>
            12
          </div>
          <div className="stat-title" style={{ color: "white" }}>
            수신 문서함
          </div>
        </div>

        <div
          className="stat-card"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <div className="stat-count" style={{ color: "white" }}>
            8
          </div>
          <div className="stat-title" style={{ color: "white" }}>
            발신 문서함
          </div>
        </div>

        <div
          className="stat-card"
          style={{ backgroundColor: "rgb(243, 238, 234)" }}
        >
          <div className="stat-count" style={{ color: "#333" }}>
            3
          </div>
          <div className="stat-title" style={{ color: "#333" }}>
            임시 저장
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
