import React, { useState } from "react";
import "./NewDocument.css";

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
      <div className="new-search-bar-container">
        <div className="new-search-input-wrapper">
          <div className="new-search-icon-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            className="new-search-input"
            placeholder="템플릿 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="new-filter-buttons">
          <div className="new-filter-dropdown">
            <select
              className="new-filter-select"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option>자주 사용</option>
              <option>최신순</option>
              <option>이름순</option>
            </select>
          </div>
          <button
            className="new-reset-button"
            onClick={() => {
              setSearchTerm("");
              setFilterOption("자주 사용");
              setActiveTab("전체");
            }}
          >
            초기화
          </button>
        </div>
      </div>

      <div className="new-tabs-container">
        <div
          className={`new-tab ${activeTab === "전체" ? "new-active" : ""}`}
          onClick={() => setActiveTab("전체")}
        >
          전체
        </div>
        <div
          className={`new-tab ${activeTab === "회의" ? "new-active" : ""}`}
          onClick={() => setActiveTab("회의")}
        >
          회의
        </div>
        <div
          className={`new-tab ${activeTab === "재정" ? "new-active" : ""}`}
          onClick={() => setActiveTab("재정")}
        >
          재정
        </div>
        <div
          className={`new-tab ${activeTab === "행사" ? "new-active" : ""}`}
          onClick={() => setActiveTab("행사")}
        >
          행사
        </div>
        <div
          className={`new-tab ${activeTab === "보고서" ? "new-active" : ""}`}
          onClick={() => setActiveTab("보고서")}
        >
          보고서
        </div>
      </div>

      <div className="new-templates-container">
        {filteredTemplates.map((template, index) => (
          <div className="new-template-card" key={index}>
            <div className="new-card-content">
              <div className={`new-card-tag new-${template.type}`}>
                {template.tag}
              </div>
              <h3 className="new-card-title">{template.title}</h3>
              <p className="new-card-description">{template.description}</p>
            </div>
            <div className="new-card-footer">
              <button
                className="new-use-button"
                onClick={() => {
                  if (template.type === "empty") {
                    onPageChange("empty_document");
                  } else {
                    alert(`'${template.title}' 템플릿 사용`);
                  }
                }}
              >
                사용하기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewDocument;
