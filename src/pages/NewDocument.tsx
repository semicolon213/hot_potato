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
}

export default function NewDocument({ 
    onPageChange, 
    customTemplates, 
    deleteTemplate, 
    tags, 
    addTag, 
    deleteTag, 
    updateTag 
}: TemplatePageProps) {
    
    // Lifted state for global search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("전체");
    const [filterOption, setFilterOption] = useState("자주 사용");

    const resetFilters = () => {
        setSearchTerm("");
        setActiveTab("전체");
        setFilterOption("자주 사용");
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
                        <div className="new-templates-container">
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
                        <h2 className="section-title">내 템플릿</h2>
                        <TemplateList
                            templates={filteredCustomTemplates}
                            onUseTemplate={onUseTemplate}
                            onDeleteTemplate={deleteTemplate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}