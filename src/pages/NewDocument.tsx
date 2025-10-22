import { useState, useMemo, useEffect, useCallback } from "react";
import { useTemplateUI, defaultTemplates, defaultTemplateTags } from "../hooks/features/templates/useTemplateUI";
import type { Template } from "../hooks/features/templates/useTemplateUI";
import { ENV_CONFIG } from "../config/environment";
import { apiClient } from "../utils/api/apiClient";
import "../components/features/templates/TemplateUI.css";
import "../styles/pages/NewDocument.css";
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
    
    // 파일명 입력 모달 상태
    const [showFileNameModal, setShowFileNameModal] = useState(false);
    const [documentTitle, setDocumentTitle] = useState("");
    
    // 문서 생성 후 선택 모달 상태
    const [showAfterCreateModal, setShowAfterCreateModal] = useState(false);
    const [createdDocumentUrl, setCreatedDocumentUrl] = useState("");
    
    // 파일명 입력 모달 함수들
    const openFileNameModal = (template: Template) => {
        setSelectedTemplate(template);
        setDocumentTitle("");
        setShowFileNameModal(true);
    };
    
    const closeFileNameModal = () => {
        setShowFileNameModal(false);
        setDocumentTitle("");
        setSelectedTemplate(null);
    };
    
    const openPermissionModal = () => {
        setShowFileNameModal(false);
        setIsPermissionModalOpen(true);
    };
    
    // 문서 생성 후 선택 모달 함수들
    const openDocument = () => {
        if (createdDocumentUrl) {
            window.open(createdDocumentUrl, '_blank');
        }
        setShowAfterCreateModal(false);
        setCreatedDocumentUrl("");
    };
    
    const goToDocbox = () => {
        setShowAfterCreateModal(false);
        setCreatedDocumentUrl("");
        onPageChange('docbox');
    };
    
    const closeAfterCreateModal = () => {
        setShowAfterCreateModal(false);
        setCreatedDocumentUrl("");
    };
    
    // 실제 문서 생성 함수
    const createDocument = async () => {
        if (!selectedTemplate || !documentTitle.trim()) return;

        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const creatorEmail = userInfo.email || '';

        // 선택된 그룹들의 이메일 수집
        const groupEmails = selectedGroups.map(group => ENV_CONFIG.GROUP_EMAILS[group]).filter(Boolean);
        
        // 개별 이메일과 그룹 이메일 합치기
        const allEditors = [...groupEmails, ...individualEmails.filter(email => email.trim())];

        try {
            console.log('📄 권한 부여 문서 생성:', {
                selectedTemplate,
                selectedGroups,
                individualEmails,
                allEditors
            });
            
            console.log('📄 권한 설정 상세 정보:', {
                creatorEmail,
                groupEmails,
                individualEmails,
                allEditors: allEditors,
                editorsCount: allEditors.length
            });

            console.log('선택된 템플릿 정보:', {
                title: selectedTemplate.title,
                documentId: selectedTemplate.documentId,
                type: selectedTemplate.type,
                templateType: selectedTemplate.documentId || selectedTemplate.type
            });
            
            const result = await apiClient.createDocument({
                title: documentTitle, // 사용자가 입력한 제목 사용
                templateType: selectedTemplate.documentId || selectedTemplate.type,
                creatorEmail: creatorEmail,
                editors: allEditors,
                role: 'student' // 기본값으로 student 설정
            });

            if (result.success) {
                console.log('📄 문서 생성 성공:', result);
                
                // 디버그 정보 표시
                if (result.debug) {
                    console.log('🔍 디버그 정보:', result.debug);
                    console.log('📋 요청된 편집자:', result.debug.requestedEditors);
                    console.log('🔐 권한 설정 성공:', result.debug.permissionSuccess);
                    console.log('📝 권한 설정 메시지:', result.debug.permissionMessage);
                    console.log('✅ 권한 부여된 사용자:', result.debug.grantedUsers);
                    console.log('👥 현재 편집자 목록:', result.debug.currentEditors);
                }
                
                // 권한 설정 결과 확인
                if (result.permissionResult) {
                    console.log('🔐 권한 설정 결과:', result.permissionResult);
                    if (result.permissionResult.successCount > 0) {
                        console.log(`✅ ${result.permissionResult.successCount}명에게 권한 부여 완료`);
                    }
                    if (result.permissionResult.failCount > 0) {
                        console.warn(`⚠️ ${result.permissionResult.failCount}명 권한 부여 실패`);
                    }
                }
                
                setCreatedDocumentUrl(result.data.documentUrl);
                closePermissionModal();
                setShowAfterCreateModal(true);
            } else {
                console.error('📄 문서 생성 실패:', result);
                alert('문서 생성에 실패했습니다: ' + result.message);
            }
        } catch (error) {
            console.error('📄 문서 생성 오류:', error);
            alert('문서 생성 중 오류가 발생했습니다.');
        }
    };

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
        setIsPermissionModalOpen,
        selectedTemplate,
        setSelectedTemplate,
        permissionType,
        setPermissionType,
        selectedGroups,
        setSelectedGroups,
        individualEmails,
        setIndividualEmails,
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
        
        if (template) {
            openFileNameModal(template);
        } else {
            // 기본 템플릿의 경우
            const defaultTemplate = defaultTemplateItems.find(t => t.type === type);
            if (defaultTemplate) {
                openFileNameModal(defaultTemplate);
            }
        }
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
            {/* 새 문서 모달 - 개선된 UI */}
            {showNewDocModal && (
                <div className="document-modal-overlay" onClick={handleNewDocCancel}>
                    <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="document-modal-header">
                            <div className="header-left">
                                <h2>📄 새 문서 만들기</h2>
                                <p className="header-subtitle">문서의 기본 정보를 입력해주세요</p>
                            </div>
                            <button className="document-modal-close" onClick={handleNewDocCancel}>
                                <span>&times;</span>
                            </button>
                        </div>
                        
                        <div className="document-modal-body">
                            <div className="form-section">
                                <div className="form-group-large">
                                    <label htmlFor="doc-title" className="form-label-large">
                                        <span className="label-icon">📝</span>
                                        문서 제목
                                    </label>
                                    <input
                                        id="doc-title"
                                        type="text"
                                        className="form-input-large"
                                        placeholder="예: 2024년 1월 정기회의록"
                                        value={newDocData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        autoFocus
                                    />
                                    <div className="input-hint">문서를 식별할 수 있는 명확한 제목을 입력하세요</div>
                                </div>

                                <div className="form-group-large">
                                    <label htmlFor="doc-description" className="form-label-large">
                                        <span className="label-icon">📋</span>
                                        상세 설명
                                    </label>
                                    <textarea
                                        id="doc-description"
                                        className="form-textarea-large"
                                        placeholder="문서의 목적이나 내용에 대한 간단한 설명을 입력하세요"
                                        value={newDocData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        rows={4}
                                    />
                                    <div className="input-hint">문서의 용도나 특별한 사항을 기록해두세요</div>
                                </div>

                                <div className="form-group-large">
                                    <label htmlFor="doc-tag" className="form-label-large">
                                        <span className="label-icon">🏷️</span>
                                        카테고리
                                    </label>
                                    <select
                                        id="doc-tag"
                                        className="form-select-large"
                                        value={newDocData.tag}
                                        onChange={(e) => handleInputChange("tag", e.target.value)}
                                    >
                                        <option value="" disabled>카테고리를 선택하세요</option>
                                        {orderedTags.map(tag => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                    <div className="input-hint">문서를 분류할 카테고리를 선택하세요</div>
                                </div>
                            </div>
                        </div>

                        <div className="document-modal-actions">
                            <button type="button" className="action-btn cancel-btn" onClick={handleNewDocCancel}>
                                <span>취소</span>
                            </button>
                            <button 
                                type="button" 
                                className="action-btn save-btn" 
                                onClick={handleNewDocSubmit}
                                disabled={!newDocData.title.trim()}
                            >
                                <span>📄 문서 생성</span>
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

            {/* 파일명 입력 모달 */}
            {showFileNameModal && selectedTemplate && (
                <div className="filename-modal-overlay" onClick={closeFileNameModal}>
                    <div className="filename-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="filename-modal-header">
                            <div className="header-left">
                                <h2>📝 파일명 입력</h2>
                                <p className="header-subtitle">생성할 문서의 제목을 입력해주세요</p>
                            </div>
                            <button className="filename-modal-close" onClick={closeFileNameModal}>
                                <span>&times;</span>
                            </button>
                        </div>
                        
                        <div className="filename-modal-body">
                            <div className="template-info">
                                <div className="template-icon">📄</div>
                                <div className="template-details">
                                    <h3>{selectedTemplate.title}</h3>
                                    <p>템플릿을 사용하여 문서를 생성합니다</p>
                                </div>
                            </div>

                            <div className="filename-section">
                                <div className="form-group-large">
                                    <label htmlFor="filename-input" className="form-label-large">
                                        <span className="label-icon">📝</span>
                                        문서 제목
                                    </label>
                                    <input
                                        id="filename-input"
                                        type="text"
                                        className="form-input-large"
                                        placeholder="예: 2024년 1월 정기회의록"
                                        value={documentTitle}
                                        onChange={(e) => setDocumentTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="input-hint">문서를 식별할 수 있는 명확한 제목을 입력하세요</div>
                                </div>
                            </div>
                        </div>

                        <div className="filename-modal-actions">
                            <button type="button" className="action-btn cancel-btn" onClick={closeFileNameModal}>
                                <span>취소</span>
                            </button>
                            <button 
                                type="button" 
                                className="action-btn save-btn" 
                                onClick={openPermissionModal}
                                disabled={!documentTitle.trim()}
                            >
                                <span>다음 단계</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 권한 설정 모달 - 개선된 UI */}
            {isPermissionModalOpen && selectedTemplate && (
                <div className="permission-modal-overlay" onClick={closePermissionModal}>
                    <div className="permission-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="permission-modal-header">
                            <div className="header-left">
                                <h2>🔐 문서 생성 설정</h2>
                                <p className="header-subtitle">문서 접근 권한을 설정해주세요</p>
                            </div>
                            <button className="permission-modal-close" onClick={closePermissionModal}>
                                <span>&times;</span>
                            </button>
                        </div>
                        
                        <div className="permission-modal-body">
                            <div className="template-info">
                                <div className="template-icon">📄</div>
                                <div className="template-details">
                                    <h3>{selectedTemplate.title}</h3>
                                    <p>문서를 생성합니다</p>
                                </div>
                            </div>

                            <div className="permission-section">
                                <h4 className="section-title">문서 접근 권한</h4>
                                <div className="permission-options">
                                    <button
                                        type="button"
                                        className={`permission-option ${permissionType === 'private' ? 'active' : ''}`}
                                        onClick={() => setPermissionType('private')}
                                    >
                                        <div className="option-icon">🔒</div>
                                        <div className="option-content">
                                            <div className="option-title">나만 보기</div>
                                            <div className="option-desc">개인 문서로 생성</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        className={`permission-option ${permissionType === 'shared' ? 'active' : ''}`}
                                        onClick={() => setPermissionType('shared')}
                                    >
                                        <div className="option-icon">👥</div>
                                        <div className="option-content">
                                            <div className="option-title">권한 부여</div>
                                            <div className="option-desc">다른 사용자와 공유</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {permissionType === 'shared' && (
                                <div className="sharing-options">
                                    <h4 className="section-title">공유 설정</h4>
                                    
                                    <div className="group-permissions-section">
                                        <h5 className="subsection-title">그룹 권한</h5>
                                        <div className="group-permissions">
                                            {Object.entries(ENV_CONFIG.GROUP_EMAILS).map(([key, email]) => (
                                                <label key={key} className="group-permission-item">
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
                                                    <span className="checkbox-custom"></span>
                                                    <span className="group-name">
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

                                    <div className="individual-emails-section">
                                        <h5 className="subsection-title">개별 이메일</h5>
                                        <div className="individual-emails">
                                            {individualEmails.map((email, index) => (
                                                <div key={index} className="email-input-group">
                                                    <input
                                                        type="email"
                                                        placeholder="이메일 주소를 입력하세요"
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
                                                        title="이메일 제거"
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
                                                <span>+</span> 이메일 추가
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="permission-modal-actions">
                            <button type="button" className="action-btn cancel-btn" onClick={closePermissionModal}>
                                <span>취소</span>
                            </button>
                            <button type="button" className="action-btn save-btn" onClick={createDocument}>
                                <span>📄 문서 생성</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 문서 생성 후 선택 모달 */}
            {showAfterCreateModal && (
                <div className="after-create-modal-overlay" onClick={closeAfterCreateModal}>
                    <div className="after-create-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="after-create-modal-header">
                            <div className="header-left">
                                <h2>🎉 문서 생성 완료!</h2>
                                <p className="header-subtitle">문서가 성공적으로 생성되었습니다</p>
                            </div>
                            <button className="after-create-modal-close" onClick={closeAfterCreateModal}>
                                <span>&times;</span>
                            </button>
                        </div>
                        
                        <div className="after-create-modal-body">
                            <div className="success-info">
                                <div className="success-icon">✅</div>
                                <div className="success-details">
                                    <h3>{documentTitle}</h3>
                                    <p>문서가 Google Drive에 저장되었습니다</p>
                                </div>
                            </div>

                            <div className="action-options">
                                <h4 className="options-title">다음에 무엇을 하시겠습니까?</h4>
                                <div className="option-buttons">
                                    <button 
                                        type="button" 
                                        className="option-btn primary-btn" 
                                        onClick={openDocument}
                                    >
                                        <div className="option-icon">📄</div>
                                        <div className="option-content">
                                            <div className="option-title">문서 바로 보기</div>
                                            <div className="option-desc">새 탭에서 문서를 열어 편집합니다</div>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        className="option-btn secondary-btn" 
                                        onClick={goToDocbox}
                                    >
                                        <div className="option-icon">📁</div>
                                        <div className="option-content">
                                            <div className="option-title">문서함으로 이동</div>
                                            <div className="option-desc">문서함에서 생성된 문서를 확인합니다</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="after-create-modal-actions">
                            <button type="button" className="action-btn cancel-btn" onClick={closeAfterCreateModal}>
                                <span>닫기</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default NewDocument;