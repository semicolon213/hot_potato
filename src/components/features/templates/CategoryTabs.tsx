import { useState, useEffect, useRef } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { NotificationModal, ConfirmModal } from '../../ui/NotificationModal';

interface Props {
    activeTab: string;
    setActiveTab: (v: string) => void;
    tags: string[];
    managedTags?: string[];
    staticTags?: string[]; // 기본 태그 (Apps Script에서 관리)
    defaultTags?: string[]; // 레거시 (템플릿에서 추출한 태그)
    isAdmin?: boolean; // 관리자 여부
    addTag: (newTag: string) => void; // 개인 태그 추가
    deleteTag: (tagToDelete: string) => void; // 개인 태그 삭제
    updateTag: (oldTag: string, newTag: string) => void; // 개인 태그 수정
    addStaticTag?: (newTag: string) => void; // 기본 태그 추가 (관리자 전용)
    deleteStaticTag?: (tagToDelete: string) => void; // 기본 태그 삭제 (관리자 전용)
    updateStaticTag?: (oldTag: string, newTag: string) => void; // 기본 태그 수정 (관리자 전용)
    onShowNotification?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void; // 알림 표시 함수
    onShowConfirm?: (message: string, onConfirm: () => void, options?: { title?: string; confirmText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }) => void; // 확인 모달 표시 함수
}

export function CategoryTabs({ 
    activeTab, 
    setActiveTab, 
    tags, 
    managedTags, 
    staticTags = [], 
    defaultTags, 
    isAdmin = false,
    addTag, 
    deleteTag, 
    updateTag,
    addStaticTag,
    deleteStaticTag,
    updateStaticTag,
    onShowNotification,
    onShowConfirm
}: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [isAddingStatic, setIsAddingStatic] = useState(false); // 기본 태그 추가 모드
    const [newStaticTag, setNewStaticTag] = useState("");
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ tag: string; x: number; y: number } | null>(null);
    
    // 입력 필드 ref (포커스 복원용)
    const staticTagInputRef = useRef<HTMLInputElement>(null);
    const personalTagInputRef = useRef<HTMLInputElement>(null);
    const createMenuRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 생성 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setShowCreateMenu(false);
            }
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        if (showCreateMenu || contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCreateMenu, contextMenu]);

    // 개인 태그 추가
    const handleAddTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag === "") return;

        if (managedTags && managedTags.length >= 10) {
            if (onShowNotification) {
                onShowNotification("최대 10개의 개인 태그만 추가할 수 있습니다.", "warning");
            } else {
                alert("최대 10개의 개인 태그만 추가할 수 있습니다.");
            }
            // 알림 후 포커스 복원
            setTimeout(() => {
                personalTagInputRef.current?.focus();
            }, 100);
            setIsAdding(false);
            return;
        }

        if (trimmedTag.length > 8) {
            if (onShowNotification) {
                onShowNotification("태그 이름은 최대 8글자까지 가능합니다.", "warning");
            } else {
                alert("태그 이름은 최대 8글자까지 가능합니다.");
            }
            // 알림 후 포커스 복원
            setTimeout(() => {
                personalTagInputRef.current?.focus();
            }, 100);
            return;
        }

        addTag(trimmedTag);
        setNewTag("");
        setIsAdding(false);
    };

    // 기본 태그 추가 (관리자 전용)
    const handleAddStaticTag = () => {
        if (!isAdmin || !addStaticTag) {
            if (onShowNotification) {
                onShowNotification("기본 태그는 관리자만 추가할 수 있습니다.", "warning");
            } else {
                alert("기본 태그는 관리자만 추가할 수 있습니다.");
            }
            setIsAddingStatic(false);
            return;
        }

        const trimmedTag = newStaticTag.trim();
        if (trimmedTag === "") return;

        if (trimmedTag.length > 8) {
            if (onShowNotification) {
                onShowNotification("태그 이름은 최대 8글자까지 가능합니다.", "warning");
            } else {
                alert("태그 이름은 최대 8글자까지 가능합니다.");
            }
            // 알림 후 포커스 복원
            setTimeout(() => {
                staticTagInputRef.current?.focus();
            }, 100);
            return;
        }

        if (staticTags.includes(trimmedTag)) {
            if (onShowNotification) {
                onShowNotification("이미 존재하는 기본 태그입니다.", "warning");
            } else {
                alert("이미 존재하는 기본 태그입니다.");
            }
            // 알림 후 포커스 복원
            setTimeout(() => {
                staticTagInputRef.current?.focus();
            }, 100);
            return;
        }

        addStaticTag(trimmedTag);
        setNewStaticTag("");
        setIsAddingStatic(false);
    };

    const handleUpdateTag = () => {
        if (editingTag && editingText.trim() !== "") {
            const trimmedNewTag = editingText.trim();
            
            // 기본 태그인지 개인 태그인지 확인
            const isStatic = staticTags.includes(editingTag);
            
            if (isStatic) {
                // 기본 태그 수정 (관리자 전용)
                if (!isAdmin || !updateStaticTag) {
                    if (onShowNotification) {
                        onShowNotification("기본 태그는 관리자만 수정할 수 있습니다.", "warning");
                    } else {
                        alert("기본 태그는 관리자만 수정할 수 있습니다.");
                    }
                    setEditingTag(null);
                    setEditingText("");
                    return;
                }
                
                if (trimmedNewTag.length > 8) {
                    if (onShowNotification) {
                        onShowNotification("태그 이름은 최대 8글자까지 가능합니다.", "warning");
                    } else {
                        alert("태그 이름은 최대 8글자까지 가능합니다.");
                    }
                    return;
                }
                
                updateStaticTag(editingTag, trimmedNewTag);
            } else {
                // 개인 태그 수정
                if (trimmedNewTag.length > 8) {
                    if (onShowNotification) {
                        onShowNotification("태그 이름은 최대 8글자까지 가능합니다.", "warning");
                    } else {
                        alert("태그 이름은 최대 8글자까지 가능합니다.");
                    }
                    return;
                }
                
                updateTag(editingTag, trimmedNewTag);
            }
            
            setEditingTag(null);
            setEditingText("");
        }
    };

    const startEditing = (tag: string) => {
        setEditingTag(tag);
        setEditingText(tag);
    };

    // 태그를 기본 태그와 개인 태그로 분리
    const staticTagSet = new Set(staticTags);
    const staticTagList = tags.filter(tag => staticTagSet.has(tag));
    const personalTagList = tags.filter(tag => !staticTagSet.has(tag));

    const renderTag = (tab: string) => (
        <div
            key={tab}
            className={`new-tab ${activeTab === tab ? "new-active" : ""}`}
            onClick={() => !editingTag && setActiveTab(tab)}
            onContextMenu={(e) => {
                if (tab !== '전체') {
                    e.preventDefault();
                    setContextMenu({ tag: tab, x: e.clientX, y: e.clientY });
                }
            }}
        >
            {editingTag === tab ? (
                <input 
                    type="text"
                    className="tag-edit-input"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag()}
                    onBlur={handleUpdateTag}
                    autoFocus
                />
            ) : (
                <span>{tab}</span>
            )}
        </div>
    );

    return (
        <div className="category-tabs-wrapper">
            <div className="tabs-header">
                <div className="new-tabs-container">
                    {/* 전체 태그 */}
                    {renderTag("전체")}
                    
                    {/* 기본 태그들 */}
                    {staticTagList.map(tab => renderTag(tab))}
                    
                    {/* 기본 태그와 개인 태그 사이 구분선 */}
                    {staticTagList.length > 0 && personalTagList.length > 0 && (
                        <div className="tag-divider"></div>
                    )}
                    
                    {/* 개인 태그들 */}
                    {personalTagList.map(tab => renderTag(tab))}
                    
                    {/* 기본 태그 추가 입력 (관리자 전용) */}
                    {isAdmin && addStaticTag && isAddingStatic && (
                        <div className="new-tag-input-container">
                            <input
                                ref={staticTagInputRef}
                                type="text"
                                value={newStaticTag}
                                onChange={(e) => {
                                    if (e.target.value.length <= 8) {
                                        setNewStaticTag(e.target.value);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddStaticTag();
                                    } else if (e.key === 'Escape') {
                                        setIsAddingStatic(false);
                                        setNewStaticTag("");
                                        setShowCreateMenu(false);
                                    }
                                }}
                                placeholder="기본 태그명"
                                className="new-tag-input static"
                                autoFocus
                            />
                            <button onClick={handleAddStaticTag} className="new-tag-button">추가</button>
                            <button onClick={() => {
                                setIsAddingStatic(false);
                                setNewStaticTag("");
                                setShowCreateMenu(false);
                            }} className="new-tag-button cancel">취소</button>
                        </div>
                    )}
                    
                    {/* 개인 태그 추가 입력 */}
                    {managedTags && managedTags.length < 10 && isAdding && (
                        <div className="new-tag-input-container">
                            <input
                                ref={personalTagInputRef}
                                type="text"
                                value={newTag}
                                onChange={(e) => {
                                    if (e.target.value.length <= 8) {
                                        setNewTag(e.target.value);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddTag();
                                    } else if (e.key === 'Escape') {
                                        setIsAdding(false);
                                        setNewTag("");
                                        setShowCreateMenu(false);
                                    }
                                }}
                                placeholder="개인 태그명"
                                className="new-tag-input personal"
                                autoFocus
                            />
                            <button onClick={handleAddTag} className="new-tag-button">추가</button>
                            <button onClick={() => {
                                setIsAdding(false);
                                setNewTag("");
                                setShowCreateMenu(false);
                            }} className="new-tag-button cancel">취소</button>
                        </div>
                    )}
                </div>

                {!isAdding && !isAddingStatic && (
                    <div className="tag-create-wrapper" ref={createMenuRef}>
                        <button 
                            className="tag-create-toggle"
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            disabled={managedTags && managedTags.length >= 10 && !isAdmin}
                        >
                            태그 생성
                        </button>
                        {showCreateMenu && (
                            <div className="tag-create-menu">
                                {isAdmin && addStaticTag && (
                                    <button
                                        className="tag-create-menu-item"
                                        onClick={() => {
                                            setIsAddingStatic(true);
                                            setIsAdding(false);
                                            setShowCreateMenu(false);
                                        }}
                                    >
                                        기본 태그
                                    </button>
                                )}
                                {managedTags && managedTags.length < 10 && (
                                    <button
                                        className="tag-create-menu-item"
                                        onClick={() => {
                                            setIsAdding(true);
                                            setIsAddingStatic(false);
                                            setShowCreateMenu(false);
                                        }}
                                    >
                                        개인 태그
                                    </button>
                                )}
                                {managedTags && managedTags.length >= 10 && !isAdmin && (
                                    <div className="tag-create-menu-item disabled">
                                        최대 태그 수 도달
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 컨텍스트 메뉴 */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="tag-context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                >
                    {(() => {
                        const tag = contextMenu.tag;
                        const isStaticTag = staticTags.includes(tag);
                        const isPersonalTag = managedTags?.includes(tag);
                        
                        // 기본 태그는 관리자만 수정/삭제 가능
                        if (isStaticTag && isAdmin && updateStaticTag && deleteStaticTag) {
                            return (
                                <>
                                    <button
                                        type="button"
                                        className="tag-context-menu-item"
                                        onClick={() => {
                                            startEditing(tag);
                                            setContextMenu(null);
                                        }}
                                    >
                                        <BiEdit />
                                        수정
                                    </button>
                                    <div className="tag-context-menu-divider"></div>
                                    <button
                                        type="button"
                                        className="tag-context-menu-item tag-context-menu-item-danger"
                                        onClick={() => {
                                            if (onShowConfirm) {
                                                onShowConfirm(
                                                    `기본 태그 "${tag}"를 삭제하시겠습니까?`,
                                                    () => {
                                                        deleteStaticTag(tag);
                                                        setContextMenu(null);
                                                    },
                                                    { type: 'warning' }
                                                );
                                            } else if (window.confirm(`기본 태그 "${tag}"를 삭제하시겠습니까?`)) {
                                                deleteStaticTag(tag);
                                                setContextMenu(null);
                                            } else {
                                                setContextMenu(null);
                                            }
                                        }}
                                    >
                                        <BiTrash />
                                        삭제
                                    </button>
                                </>
                            );
                        }
                        
                        // 개인 태그는 모두 수정/삭제 가능
                        if (isPersonalTag) {
                            return (
                                <>
                                    <button
                                        type="button"
                                        className="tag-context-menu-item"
                                        onClick={() => {
                                            startEditing(tag);
                                            setContextMenu(null);
                                        }}
                                    >
                                        <BiEdit />
                                        수정
                                    </button>
                                    <div className="tag-context-menu-divider"></div>
                                    <button
                                        type="button"
                                        className="tag-context-menu-item tag-context-menu-item-danger"
                                        onClick={() => {
                                            if (onShowConfirm) {
                                                onShowConfirm(
                                                    `개인 태그 "${tag}"를 삭제하시겠습니까?`,
                                                    () => {
                                                        deleteTag(tag);
                                                        setContextMenu(null);
                                                    },
                                                    { type: 'warning' }
                                                );
                                            } else if (window.confirm(`개인 태그 "${tag}"를 삭제하시겠습니까?`)) {
                                                deleteTag(tag);
                                                setContextMenu(null);
                                            } else {
                                                setContextMenu(null);
                                            }
                                        }}
                                    >
                                        <BiTrash />
                                        삭제
                                    </button>
                                </>
                            );
                        }
                        
                        return null;
                    })()}
                </div>
            )}
        </div>
    );
}
