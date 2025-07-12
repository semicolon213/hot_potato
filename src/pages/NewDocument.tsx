// src/pages/NewDocument.tsx
import React, { useState } from "react";
import "./NewDocument.css";
import {
  SearchBar,
  CategoryTabs,
  TemplateList,
} from "../hooks/NewDocumentComponents";

interface NewDocumentProps {
  onPageChange: (pageName: string) => void;
}

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

const NewDocument: React.FC<NewDocumentProps> = ({ onPageChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("자주 사용");
  const [activeTab, setActiveTab] = useState("전체");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
        template.title.includes(searchTerm) ||
        template.description.includes(searchTerm);
    const matchesTab = activeTab === "전체" || template.tag === activeTab;
    return matchesSearch && matchesTab;
  });

  // 템플릿 사용 버튼 클릭 시 동작
  // 준영 : 따로 기능 로직 필요
  const handleUseTemplate = (type: string, title: string) => {
    if (type === "empty") {
      onPageChange("empty_document");
    } else {
      alert(`'${title}' 템플릿 사용`);
    }
  };

  return (
      <div className="new-template-selection new-combined-style">

        {/*템플릿 검색 */}
        <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterOption={filterOption}
            setFilterOption={setFilterOption}
            setActiveTab={setActiveTab}
        />
        {/*카테고리 탭 기능*/}
        <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {/*템플릿 카드*/}
        <TemplateList templates={filteredTemplates} onUseTemplate={handleUseTemplate} />
      </div>
  );
};

export default NewDocument;
