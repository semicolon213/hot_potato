// src/hooks/NewDocumentComponents.tsx
// import React from "react";

// SearchBar 컴포넌트
export function SearchBar({
                              searchTerm,
                              setSearchTerm,
                              filterOption,
                              setFilterOption,
                              setActiveTab,
                          }: {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    filterOption: string;
    setFilterOption: (v: string) => void;
    setActiveTab: (v: string) => void;
}) {
    return (
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
    );
}

// CategoryTabs 컴포넌트
export function CategoryTabs({
                                 activeTab,
                                 setActiveTab,
                             }: {
    activeTab: string;
    setActiveTab: (v: string) => void;
}) {
    const tabs = ["전체", "회의", "재정", "행사", "보고서"];
    return (
        <div className="new-tabs-container">
            {tabs.map((tab) => (
                <div
                    key={tab}
                    className={`new-tab ${activeTab === tab ? "new-active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </div>
            ))}
        </div>
    );
}

// TemplateCard 컴포넌트
export function TemplateCard({
                                 template,
                                 onUse,
                             }: {
    template: {
        type: string;
        title: string;
        description: string;
        tag: string;
    };
    onUse: (type: string, title: string) => void;
}) {
    return (
        <div className="new-template-card">
            <div className="new-card-content">
                <div className={`new-card-tag new-${template.type}`}>{template.tag}</div>
                <h3 className="new-card-title">{template.title}</h3>
                <p className="new-card-description">{template.description}</p>
            </div>
            <div className="new-card-footer">
                <button
                    className="new-use-button"
                    onClick={() => onUse(template.type, template.title)}
                >
                    사용하기
                </button>
            </div>
        </div>
    );
}

// TemplateList 컴포넌트
export function TemplateList({
                                 templates,
                                 onUseTemplate,
                             }: {
    templates: {
        type: string;
        title: string;
        description: string;
        tag: string;
    }[];
    onUseTemplate: (type: string, title: string) => void;
}) {
    return (
        <div className="new-templates-container">
            {templates.map((template, idx) => (
                <TemplateCard
                    key={template.title + idx}
                    template={template}
                    onUse={onUseTemplate}
                />
            ))}
        </div>
    );
}
