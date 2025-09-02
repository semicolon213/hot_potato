import { useState } from "react";
import { useTemplateUI, defaultTemplates, defaultTemplateTags } from "../hooks/useTemplateUI";
import type { Template } from "../hooks/useTemplateUI";
import "../components/TemplateUI/TemplateUI.css";

// UI Components
import {
    SearchBar,
    CategoryTabs,
    TemplateList,
    TemplateCard
} from "../components/TemplateUI";

interface TemplatePageProps {
  onPageChange: (pageName: string) => void;
  customTemplates: Template[];
  deleteTemplate: (rowIndex: number) => void;
  tags: string[];
  addTag: (newTag: string) => void;
  deleteTag: (tagToDelete: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  addTemplate: (newDocData: { title: string; description: string; tag: string; }) => void;
}

export default function NewDocument({ 
    onPageChange, 
    customTemplates, 
    deleteTemplate, 
    tags, 
    addTag, 
    deleteTag, 
    updateTag, 
    addTemplate
}: TemplatePageProps) {
    
    // Lifted state for global search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("전체");
    const [filterOption, setFilterOption] = useState("자주 사용");

    // + 새 문서 모달 상태 추가 (3개 필드)
    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [newDocData, setNewDocData] = useState({
        title: "",
        description: "",
        tag: ""
    });

    const resetFilters = () => {
        setSearchTerm("");
        setActiveTab("전체");
        setFilterOption("자주 사용");
    };

    // 새 문서 모달 제출 처리
    const handleNewDocSubmit = () => {
        if (!newDocData.title.trim() || !newDocData.description.trim() || !newDocData.tag.trim()) {
            alert("모든 필드를 입력해주세요.");
            return;
        }

        addTemplate(newDocData);

        // 모달 닫기 및 상태 초기화
        setShowNewDocModal(false);
        setNewDocData({
            title: "",
            description: "",
            tag: ""
        });
    };

    // 모달 취소 처리
    const handleNewDocCancel = () => {
        setShowNewDocModal(false);
        setNewDocData({
            title: "",
            description: "",
            tag: ""
        });
    };

    // 입력값 변경 처리
    const handleInputChange = (field: string, value: string) => {
        setNewDocData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // --- Filtering Logic ---

    // 1. Filter Default Templates
    const filteredDefaultTemplates = defaultTemplates.filter(template => {
        if (activeTab !== "전체" && template.tag !== activeTab) {
            return false;
        }
        if (searchTerm && !template.title.toLowerCase().includes(searchTerm.toLowerCase()) && !template.description.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        return true;
    });

    // 2. Get filtered Custom Templates from the hook
    const { 
        filteredTemplates: filteredCustomTemplates, 
        onUseTemplate 
    } = useTemplateUI(customTemplates, onPageChange, searchTerm, activeTab);

    // Combine all unique tags for the CategoryTabs
    const allTags = [...new Set([...tags, ...defaultTemplates.map(t => t.tag)])];

    return (
        <div>
            {/* Top Level Controls */}
            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterOption={filterOption}
                setFilterOption={setFilterOption}
                reset={resetFilters}
            />
            <CategoryTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                tags={allTags} 
                managedTags={tags}
                defaultTags={defaultTemplateTags}
                addTag={addTag} 
                deleteTag={deleteTag} 
                updateTag={updateTag} 
            />

            {/* Side-by-Side Layout */}
            <div className="new-document-layout">
                {/* Left Sidebar: Default Templates */}
                <div className="layout-sidebar">
                    <div className="template-section">
                        <h2 className="section-title">기본 템플릿</h2>
                        <div className="new-templates-container" style={{ paddingLeft: '20px' }}>
                            {filteredDefaultTemplates.map(template => (
                                <TemplateCard
                                    key={template.type}
                                    template={template}
                                    onUse={onUseTemplate}
                                    onDelete={() => {}} // No delete for default templates
                                    isFixed={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Main Area: Custom Templates */}
                <div className="layout-main">
                    <div className="template-section">
                        <h2 className="section-title" style={{ position: 'relative' }}>
                            내 템플릿
                            <span
                                className="new-tab add-tag-button"
                                onClick={() => setShowNewDocModal(true)}
                                style={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                + 새 템플릿
                            </span>
                        </h2>
                        <TemplateList
                            templates={filteredCustomTemplates}
                            onUseTemplate={onUseTemplate}
                            onDeleteTemplate={deleteTemplate}
                        />
                    </div>
                </div>
            </div>
            {/* 새 문서 모달 - 3개 필드 */}
            {showNewDocModal && (
                <div className="modal-overlay" onClick={handleNewDocCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>새 문서 만들기</h2>
                            <button className="modal-close" onClick={handleNewDocCancel}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="doc-title">제목</label>
                                <input
                                    id="doc-title"
                                    type="text"
                                    className="modal-input"
                                    placeholder="문서 제목을 입력하세요 (예: 회의록)"
                                    value={newDocData.title}
                                    onChange={(e) => handleInputChange("title", e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="doc-description">상세정보</label>
                                <textarea
                                    id="doc-description"
                                    className="modal-textarea"
                                    placeholder="문서에 대한 상세 설명을 입력하세요 (예: 회의 내용을 기록하는 템플릿)"
                                    value={newDocData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="doc-tag">태그</label>
                                <select
                                    id="doc-tag"
                                    className="modal-input"
                                    value={newDocData.tag}
                                    onChange={(e) => handleInputChange("tag", e.target.value)}
                                >
                                    <option value="" disabled>태그를 선택하세요</option>
                                    {tags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-button cancel" onClick={handleNewDocCancel}>
                                취소
                            </button>
                            <button className="modal-button confirm" onClick={handleNewDocSubmit}>
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}