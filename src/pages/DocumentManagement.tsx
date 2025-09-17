import React from "react";
import InfoCard from "../components/document/InfoCard";
import DocumentList from "../components/document/DocumentList";
import StatCard from "../components/document/StatCard";
import { useDocumentTable, type Document } from "../hooks/useDocumentTable";
import { useTemplateUI, type Template } from "../hooks/useTemplateUI";

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
  customTemplates: Template[];
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange, customTemplates }) => {
  const { documentColumns, documents } = useDocumentTable();
  const { onUseTemplate } = useTemplateUI(customTemplates, onPageChange, '', '전체');

  const recentDocuments = [
    { name: "2024년 예산 계획안", time: "1일전" },
    { name: "3월 회의록", time: "2시간 전" },
    { name: "인사 발령 안내", time: "어제" },
  ];

  const frequentlyUsedForms = Array.from(
    customTemplates
      .filter(template => template.favorites_tag)
      .reduce((map, template) => {
        if (!map.has(template.favorites_tag!)) {
          map.set(template.favorites_tag!, {
            name: template.favorites_tag!,
            type: template.type,
            title: template.title,
          });
        }
        return map;
      }, new Map<string, { name: string; type: string; title: string; } >()).values()
  );

  const handleFavoriteClick = (item: { name: string; type: string; title: string; }) => {
    onUseTemplate(item.type, item.title);
  };

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
          title="즐겨찾기"
          subtitle="자주 사용하는 양식을 빠르게 접근하세요"
          icon="icon-star"
          backgroundColor="var(--table-header-bg)"
          items={frequentlyUsedForms}
          onItemClick={handleFavoriteClick}
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
