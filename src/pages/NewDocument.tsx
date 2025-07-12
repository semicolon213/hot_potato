import React, { useState } from "react";
import "../components/NewDocument/NewDocument.css";
import { SearchBar, CategoryTabs, TemplateList } from "../components/NewDocument";

interface NewDocumentProps {
  onPageChange: (pageName: string) => void;
}

const NewDocument: React.FC<NewDocumentProps> = ({ onPageChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("자주 사용");
  const [activeTab, setActiveTab] = useState("전체");

  const templates = [
    {
      type: "meeting",
      title: "회의록",
      description: "팀 회의 내용을 체계적으로 기록하는 양식입니다.",
      tag: "회의",
    },
    {
      type: "finance",
      title: "학회비 명단",
      description: "회비 납부 현황을 관리하는 템플릿입니다.",
      tag: "재정",
    },
    {
      type: "event",
      title: "행사 확인서",
      description: "각종 행사의 계획 및 결과를 문서화합니다.",
      tag: "행사",
    },
    {
      type: "report",
      title: "지출 보고서",
      description: "프로젝트 및 활동 지출 내역을 정리합니다.",
      tag: "보고서",
    },
    {
      type: "empty",
      title: "빈 문서",
      description: "처음부터 새로운 문서를 작성합니다.",
      tag: "빈 문서",
    },
    {
      type: "report",
      title: "프로젝트 계획서",
      description: "프로젝트 목표와 일정을 체계적으로 정리합니다.",
      tag: "보고서",
    },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
        template.title.includes(searchTerm) ||
        template.description.includes(searchTerm);
    const matchesTab = activeTab === "전체" || template.tag === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
      <div className="new-template-selection new-combined-style">
        {/* 검색 바 */}
        <SearchBar
            searchTerm={searchTerm}
            filterOption={filterOption}
            setSearchTerm={setSearchTerm}
            setFilterOption={setFilterOption}
            setActiveTab={setActiveTab}
        />

        {/* 탭 */}
        <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />

         {/*템플릿 목록*/}
        <TemplateList templates={filteredTemplates} onUseTemplate={onPageChange} />
      </div>
  );
};

export default NewDocument;
