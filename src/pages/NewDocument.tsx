import { useState, useMemo, useEffect, useCallback } from "react";
import { useTemplateUI, defaultTemplates, defaultTemplateTags } from "../hooks/features/templates/useTemplateUI";
import type { Template } from "../hooks/features/templates/useTemplateUI";
import { ENV_CONFIG } from "../config/environment";
import "../components/features/templates/TemplateUI.css";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

// UI Components
import {
    SearchBar,
    CategoryTabs,
    TemplateList,
  } from "../components/features/templates";
  import { SortableTemplateCard } from "../components/features/templates/SortableTemplateCard";
  import StudentDetailModal from "../components/ui/StudentDetailModal";

interface TemplatePageProps {
  onPageChange: (pageName: string) => void;
  customTemplates: Template[];
  deleteTemplate: (rowIndex: number) => void;
  tags: string[];
  addTag: (newTag: string) => void;
  deleteTag: (tagToDelete: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  addTemplate: (newDocData: { title: string; description: string; tag: string; }) => void;
  updateTemplate: (rowIndex: number, newDocData: { title: string; description:string; tag: string; }, oldTitle: string) => void;
  updateTemplateFavorite: (rowIndex: number, favoriteStatus: string | undefined) => void;
  isTemplatesLoading?: boolean;
}

function NewDocument({ 
    onPageChange, 
    customTemplates, 
    deleteTemplate, 
    tags, 
    addTag, 
    deleteTag, 
    updateTag, 
    addTemplate,
    updateTemplate,
    updateTemplateFavorite,
    isTemplatesLoading
}: TemplatePageProps) {
    
    // Lifted state for global search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("전체");

    const [defaultTemplateItems, setDefaultTemplateItems] = useState<Template[]>([]);
    const [customTemplateItems, setCustomTemplateItems] = useState(customTemplates);

    // 즐겨찾기 로직 추가
    const handleToggleFavorite = useCallback((toggledTemplate: Template) => {
        const favoriteCount = customTemplateItems.filter(t => t.favoritesTag).length;
        const isCurrentlyFavorite = !!toggledTemplate.favoritesTag;

        if (!isCurrentlyFavorite && favoriteCount >= 3) {
            alert("즐겨찾기는 최대 3개까지 추가할 수 있습니다.");
            return;
        }

        const newFavoritesTag = isCurrentlyFavorite ? undefined : toggledTemplate.title;

        // API 호출
        if (toggledTemplate.rowIndex) {
            updateTemplateFavorite(toggledTemplate.rowIndex, newFavoritesTag);
        }

    }, [customTemplateItems]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDefaultDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setDefaultTemplateItems((items) => {
                const oldIndex = items.findIndex((item) => item.type === active.id);
                const newIndex = items.findIndex((item) => item.type === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('defaultTemplateOrder', JSON.stringify(newItems.map(item => item.type)));
                return newItems;
            });
        }
    };

    const handleCustomDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCustomTemplateItems((items) => {
                const oldIndex = items.findIndex((item) => (item.rowIndex ? item.rowIndex.toString() : item.title) === active.id);
                const newIndex = items.findIndex((item) => (item.rowIndex ? item.rowIndex.toString() : item.title) === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('customTemplateOrder', JSON.stringify(newItems.map(item => item.rowIndex ? item.rowIndex.toString() : item.title)));
                return newItems;
            });
        }
    };

    // + 새 문서 모달 상태 추가 (3개 필드)
    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [newDocData, setNewDocData] = useState({
        title: "",
        description: "",
        tag: ""
    });

    // Edit modal state
    const [showEditDocModal, setShowEditDocModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);

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

    const handleEditInputChange = (field: string, value: string) => {
        if (editingTemplate) {
            setEditingTemplate({
                ...editingTemplate,
                [field]: value,
            });
        }
    };
    
    const handleEditClick = (template: Template) => {
        setOriginalTemplate(template);
        setEditingTemplate(template);
        setShowEditDocModal(true);
    };

    const handleEditDocCancel = () => {
        setShowEditDocModal(false);
        setEditingTemplate(null);
        setOriginalTemplate(null);
    };

    const handleUpdateDocSubmit = () => {
        if (editingTemplate && originalTemplate) {
            if (!editingTemplate.title.trim() || !editingTemplate.description.trim() || !editingTemplate.tag.trim()) {
                alert("모든 필드를 입력해주세요.");
                return;
            }
            updateTemplate(editingTemplate.rowIndex!, {
                title: editingTemplate.title,
                description: editingTemplate.description,
                tag: editingTemplate.tag,
            }, originalTemplate.title);
            handleEditDocCancel();
        }
    };

    // --- Filtering Logic ---

    // 1. Filter Default Templates
    const filteredDefaultTemplates = defaultTemplateItems.filter(template => {
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
        onUseTemplate,
        allDefaultTemplates,
        isLoadingTemplates,
        templateError,
        loadDynamicTemplates,
        testDriveApi,
        testTemplateFolderDebug,
        testSpecificFolder,
        // 권한 설정 모달 관련
        isPermissionModalOpen,
        selectedTemplate,
        permissionType,
        setPermissionType,
        selectedGroups,
        setSelectedGroups,
        individualEmails,
        setIndividualEmails,
        createDocument,
        closePermissionModal,
    } = useTemplateUI(customTemplateItems, onPageChange, searchTerm, activeTab);

    // 동적 템플릿이 로드되면 기본 템플릿 목록 업데이트
    useEffect(() => {
        if (allDefaultTemplates.length > 0) {
            const storedDefaultOrder = localStorage.getItem('defaultTemplateOrder');
            if (storedDefaultOrder) {
                const orderedIds = JSON.parse(storedDefaultOrder);
                const orderedTemplates = orderedIds.map((id: string) => allDefaultTemplates.find(t => t.type === id)).filter(Boolean);
                setDefaultTemplateItems(orderedTemplates as Template[]);
            } else {
                setDefaultTemplateItems(allDefaultTemplates);
            }
        }
    }, [allDefaultTemplates]);

    useEffect(() => {
        const storedCustomOrder = localStorage.getItem('customTemplateOrder');
        if (storedCustomOrder) {
            const orderedIds = JSON.parse(storedCustomOrder);
            const baseTemplates = [...customTemplates];
            const orderedTemplates = orderedIds
                .map((id: string) => baseTemplates.find(t => (t.rowIndex ? t.rowIndex.toString() : t.title) === id))
                .filter((t: any): t is Template => !!t);
            
            const newTemplates = baseTemplates.filter(t => !orderedIds.includes(t.rowIndex ? t.rowIndex.toString() : t.title));
            setCustomTemplateItems([...orderedTemplates, ...newTemplates]);

        } else {
            setCustomTemplateItems(customTemplates);
        }
    }, [customTemplates]);

    const handleUseTemplateClick = (type: string, title: string) => {
        // 커스텀 템플릿의 경우 documentId를 찾아서 전달
        const template = customTemplateItems.find(t => t.title === title);
        const templateType = template?.documentId || type;
        
        console.log('📄 템플릿 클릭:', { type, title, templateType, template });
        
        // @ts-ignore
        onUseTemplate(templateType, title, 'student'); // Bypass the modal and use default role
    };

    // 올바른 순서로 태그를 정렬합니다: 기본 태그를 먼저, 그 다음 커스텀 태그를 표시합니다.
    const orderedTags = useMemo(() => {
        // Create a unique array of default tags, preserving their first-seen order.
        const uniqueDefaultTags = [...new Set(defaultTemplateTags)];
        const defaultTagSet = new Set(uniqueDefaultTags);
        const customTags = tags.filter(tag => !defaultTagSet.has(tag));
        return [...uniqueDefaultTags, ...customTags];
    }, [tags]);

    return (
        <div>
            {/* Top Level Controls */}
            <CategoryTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                tags={orderedTags} 
                managedTags={tags}
                defaultTags={defaultTemplateTags}
                addTag={addTag} 
                deleteTag={deleteTag} 
                updateTag={updateTag} 
            />

            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            {/* Side-by-Side Layout */}
            <div className="new-document-layout">
                {/* Left Sidebar: Default Templates */}
                <div className="layout-sidebar">
                    <div className="template-section">
                        <h2 className="section-title">
                            기본 템플릿
                            {isLoadingTemplates && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>로딩 중...</span>}
                        </h2>
                        {templateError && (
                            <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>
                                {templateError}
                                <button 
                                    onClick={loadDynamicTemplates}
                                    style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px' }}
                                >
                                    다시 시도
                                </button>
                                <button 
                                    onClick={async () => {
                                        const result = await testDriveApi();
                                        alert(result.message);
                                    }}
                                    style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Drive API 테스트
                                </button>
                                <button 
                                    onClick={async () => {
                                        const result = await testTemplateFolderDebug();
                                        if (result.success && result.data) {
                                            const debugInfo = result.data.debugInfo || [];
                                            alert(`디버깅 결과:\n${debugInfo.join('\n')}`);
                                        } else {
                                            alert(result.message);
                                        }
                                    }}
                                    style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    폴더 디버깅
                                </button>
                                <button 
                                    onClick={async () => {
                                        const result = await testSpecificFolder();
                                        if (result.success && result.data) {
                                            const debugInfo = result.data.debugInfo || [];
                                            alert(`특정 폴더 테스트 결과:\n${debugInfo.join('\n')}`);
                                        } else {
                                            alert(result.message);
                                        }
                                    }}
                                    style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px' }}
                                >
                                    특정 폴더 테스트
                                </button>
                            </div>
                        )}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragEnd={handleDefaultDragEnd}
                        >
                            <SortableContext
                                items={filteredDefaultTemplates.map(t => t.type)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="new-templates-container">
                                    {filteredDefaultTemplates.map(template => (
                                        <SortableTemplateCard
                                            key={template.type}
                                            id={template.type}
                                            template={template}
                                            onUse={handleUseTemplateClick} // No delete for default templates
                                            onDelete={() => {}} // No delete for default templates
                                            onEdit={() => {}} // No edit for default templates
                                            isFixed={true}
                                            defaultTags={defaultTemplateTags} // Pass defaultTemplateTags
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
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
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    fontWeight: 'normal',
                                    fontSize: '14px',
                                    color: '#007bff'
                                }}
                            >
                                + 새 템플릿
                            </span>
                        </h2>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragEnd={handleCustomDragEnd}
                        >
                            <SortableContext
                                items={filteredCustomTemplates.map(t => t.rowIndex ? t.rowIndex.toString() : t.title)}
                                strategy={rectSortingStrategy}
                            >
                                <TemplateList
                                    templates={filteredCustomTemplates}
                                    onUseTemplate={handleUseTemplateClick}
                                    onDeleteTemplate={deleteTemplate}
                                    onEditTemplate={handleEditClick} // Pass the handler here
                                    defaultTags={defaultTemplateTags} // Pass defaultTemplateTags
                                    onToggleFavorite={handleToggleFavorite} // Pass down the function
                                    isLoading={isTemplatesLoading}
                                />
                            </SortableContext>
                        </DndContext>
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
                                    {orderedTags.map(tag => (
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

            {/* Edit Document Modal */}
            {showEditDocModal && editingTemplate && (
                <div className="modal-overlay" onClick={handleEditDocCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>정보 수정</h2>
                            <button className="modal-close" onClick={handleEditDocCancel}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="edit-doc-title">제목</label>
                                <input
                                    id="edit-doc-title"
                                    type="text"
                                    className="modal-input"
                                    value={editingTemplate.title}
                                    onChange={(e) => handleEditInputChange("title", e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-doc-description">상세정보</label>
                                <textarea
                                    id="edit-doc-description"
                                    className="modal-textarea"
                                    value={editingTemplate.description}
                                    onChange={(e) => handleEditInputChange("description", e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-doc-tag">태그</label>
                                <select
                                    id="edit-doc-tag"
                                    className="modal-input"
                                    value={editingTemplate.tag}
                                    onChange={(e) => handleEditInputChange("tag", e.target.value)}
                                >
                                    {orderedTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-button cancel" onClick={handleEditDocCancel}>
                                취소
                            </button>
                            <button className="modal-button confirm" onClick={handleUpdateDocSubmit}>
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 권한 설정 모달 */}
            {isPermissionModalOpen && selectedTemplate && (
                <div className="modal-overlay" onClick={closePermissionModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>문서 생성 설정</h2>
                            <button className="close-modal" onClick={closePermissionModal}>
                                &times;
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-description">
                                <strong>{selectedTemplate.title}</strong> 문서를 생성합니다.
                            </div>

                            {/* 권한 타입 선택 */}
                            <div className="form-group">
                                <label>문서 접근 권한</label>
                                <div className="permission-type-buttons">
                                    <button
                                        type="button"
                                        className={`permission-button ${permissionType === 'private' ? 'active' : ''}`}
                                        onClick={() => setPermissionType('private')}
                                    >
                                        나만 보기
                                    </button>
                                    <button
                                        type="button"
                                        className={`permission-button ${permissionType === 'shared' ? 'active' : ''}`}
                                        onClick={() => setPermissionType('shared')}
                                    >
                                        권한 부여
                                    </button>
                                </div>
                            </div>

                            {permissionType === 'shared' && (
                                <>
                                    {/* 그룹 권한 */}
                                    <div className="form-group">
                                        <label>그룹 권한</label>
                                        <div className="group-checkboxes">
                                            {Object.entries(ENV_CONFIG.GROUP_EMAILS).map(([key, email]) => (
                                                <label key={key} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroups.includes(key)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedGroups([...selectedGroups, key]);
                                                            } else {
                                                                setSelectedGroups(selectedGroups.filter(group => group !== key));
                                                            }
                                                        }}
                                                    />
                                                    <span className="checkbox-text">
                                                        {key === 'STUDENT' && '학생'}
                                                        {key === 'COUNCIL' && '집행부'}
                                                        {key === 'PROFESSOR' && '교수'}
                                                        {key === 'ADJUNCT_PROFESSOR' && '겸임교원'}
                                                        {key === 'ASSISTANT' && '조교'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 개인 권한 */}
                                    <div className="form-group">
                                        <label>개인 권한 (직접 입력)</label>
                                        <div className="individual-emails-container">
                                            {individualEmails.map((email, index) => (
                                                <div key={index} className="email-input-row">
                                                    <input
                                                        type="email"
                                                        placeholder="개인 이메일을 입력하세요"
                                                        value={email}
                                                        onChange={(e) => {
                                                            const newEmails = [...individualEmails];
                                                            newEmails[index] = e.target.value;
                                                            setIndividualEmails(newEmails);
                                                        }}
                                                        className="email-input"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newEmails = individualEmails.filter((_, i) => i !== index);
                                                            setIndividualEmails(newEmails);
                                                        }}
                                                        className="remove-email-btn"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setIndividualEmails([...individualEmails, ''])}
                                                className="add-email-btn"
                                            >
                                                + 이메일 추가
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={closePermissionModal}>
                                취소
                            </button>
                            <button type="button" className="save-btn" onClick={createDocument}>
                                문서 생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default NewDocument;