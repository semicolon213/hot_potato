import React from "react";
import InfoCard from "../components/document/InfoCard";
import DocumentList from "../components/document/DocumentList";
import StatCard from "../components/document/StatCard";

interface Document {
  docNumber: string;
  title: string;
  author: string;
  lastModified: string;
  dueDate: string;
  status: string;
}

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange }) => {
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

  const documentColumns = [
    { key: 'docNumber' as const, header: '문서번호', width: '15%', cellClassName: 'doc-number-cell' },
    { key: 'title' as const, header: '제목', width: '25%', cellClassName: 'title-cell' },
    { key: 'author' as const, header: '작성자', width: '15%', cellClassName: 'author-cell' },
    { key: 'lastModified' as const, header: '최근 수정일', width: '15%', cellClassName: 'date-cell' },
    { key: 'dueDate' as const, header: '기한일', width: '15%', cellClassName: 'date-cell' },
    {
      key: 'status' as const,
      header: '상태',
      width: '15%',
      cellClassName: 'status-cell',
      render: (row: Document) => (
        <div className={`status-badge ${row.status.toLowerCase()}`}>
          <div className="status-text">{row.status}</div>
        </div>
      ),
    },
  ];

  const documents: Document[] = [
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
      status: "완료",
    },
    {
      docNumber: "DOC-2024-003",
      title: "인사 발령 품의서",
      author: "김준호",
      lastModified: "2024-03-14",
      dueDate: "2024-03-13",
      status: "반려",
    },
    {
      docNumber: "DOC-2024-005",
      title: "연간 교육 계획서",
      author: "강현우",
      lastModified: "2024-03-12",
      dueDate: "2024-03-11",
      status: "임시저장",
    },
  ];

  const statCards = [
    {
      count: 12,
      title: "수신 문서함",
      backgroundColor: "var(--primary)",
      textColor: "white",
    },
    {
      count: 8,
      title: "발신 문서함",
      backgroundColor: "var(--secondary)",
      textColor: "white",
    },
    {
      count: 3,
      title: "임시 저장",
      backgroundColor: "rgb(243, 238, 234)",
      textColor: "#333",
    },
  ];

  return (
    <div className="content">
      <div className="cards-row">
        <InfoCard
          title="최근 문서"
          subtitle="최근에 열람한 문서를 확인하세요"
          icon="icon-file"
          backgroundColor="var(--accent)"
          items={recentDocuments}
        />
        <InfoCard
          title="자주 찾는 양식"
          subtitle="자주 사용하는 양식을 빠르게 접근하세요"
          icon="icon-star"
          backgroundColor="var(--table-header-bg)"
          items={frequentlyUsedForms}
        />
      </div>

      <DocumentList<Document>
        title="문서함"
        columns={documentColumns}
        data={documents}
        onPageChange={onPageChange}
      />

      <div className="stats-container">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            count={card.count}
            title={card.title}
            backgroundColor={card.backgroundColor}
            textColor={card.textColor}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentManagement;