import { useState, useEffect, useRef } from 'react';
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    
    // 입력 필드 ref (포커스 복원용)
    const staticTagInputRef = useRef<HTMLInputElement>(null);
    const personalTagInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditMode) {
            setEditingTag(null);
        }
    }, [isEditMode]);

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

    return (
        <div className="category-tabs-wrapper">
            <div className="tabs-header">
                <div className="new-tabs-container">
                    {["전체", ...tags].map((tab) => (
                        <div
                            key={tab}
                            className={`new-tab ${activeTab === tab ? "new-active" : ""}`}
                            onClick={() => !isEditMode && !editingTag && setActiveTab(tab)}
                        >
                            {editingTag === tab ? (
                                <input 
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag()}
                                    onBlur={handleUpdateTag}
                                    autoFocus
                                />
                            ) : (
                                <>{tab}</>
                            )}

                            {isEditMode && tab !== '전체' && (
                                <>
                                    {/* 기본 태그 관리 (관리자 전용) */}
                                    {staticTags.includes(tab) ? (
                                        isAdmin && updateStaticTag && deleteStaticTag ? (
                                            <>
                                                <button 
                                                    onClick={() => startEditing(tab)} 
                                                    className="edit-tag-button"
                                                    title="기본 태그 수정 (관리자)"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (onShowConfirm) {
                                                            onShowConfirm(
                                                                `기본 태그 "${tab}"를 삭제하시겠습니까?`,
                                                                () => deleteStaticTag(tab),
                                                                { type: 'warning' }
                                                            );
                                                        } else if (window.confirm(`기본 태그 "${tab}"를 삭제하시겠습니까?`)) {
                                                            deleteStaticTag(tab);
                                                        }
                                                    }} 
                                                    className="delete-tag-button"
                                                    title="기본 태그 삭제 (관리자)"
                                                >
                                                    🗑️
                                                </button>
                                                <span className="tag-badge static" title="기본 태그">기본</span>
                                            </>
                                        ) : (
                                            <span className="tag-badge static" title="기본 태그">기본</span>
                                        )
                                    ) : (
                                        /* 개인 태그 관리 */
                                        managedTags?.includes(tab) && (
                                            <>
                                                <button 
                                                    onClick={() => startEditing(tab)} 
                                                    className="edit-tag-button"
                                                    title="개인 태그 수정"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (onShowConfirm) {
                                                            onShowConfirm(
                                                                `개인 태그 "${tab}"를 삭제하시겠습니까?`,
                                                                () => deleteTag(tab),
                                                                { type: 'warning' }
                                                            );
                                                        } else if (window.confirm(`개인 태그 "${tab}"를 삭제하시겠습니까?`)) {
                                                            deleteTag(tab);
                                                        }
                                                    }} 
                                                    className="delete-tag-button"
                                                    title="개인 태그 삭제"
                                                >
                                                    🗑️
                                                </button>
                                                <span className="tag-badge personal" title="개인 태그">개인</span>
                                            </>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    
                    {!isEditMode && (
                        <>
                            {/* 기본 태그 추가 버튼 (관리자 전용) */}
                            {isAdmin && addStaticTag && (
                                isAddingStatic ? (
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
                                        }} className="new-tag-button cancel">취소</button>
                                    </div>
                                ) : (
                                    <div 
                                        className="new-tab add-tag-button static" 
                                        onClick={() => {
                                            setIsAdding(false); // 개인 태그 추가 모드 끄기
                                            setIsAddingStatic(true);
                                        }}
                                        title="기본 태그 추가 (관리자)"
                                    >
                                        + 기본 태그
                                    </div>
                                )
                            )}
                            
                            {/* 개인 태그 추가 버튼 */}
                            {managedTags && managedTags.length < 10 ? (
                                isAdding ? (
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
                                        }} className="new-tag-button cancel">취소</button>
                                    </div>
                                ) : (
                                    <div 
                                        className="new-tab add-tag-button personal" 
                                        onClick={() => {
                                            setIsAddingStatic(false); // 기본 태그 추가 모드 끄기
                                            setIsAdding(true);
                                        }}
                                    >
                                        + 새 태그
                                    </div>
                                )
                            ) : (
                                <div className="new-tab add-tag-button disabled" title="최대 10개의 개인 태그만 추가할 수 있습니다.">
                                    최대 태그 수 도달
                                </div>
                            )}
                        </>
                    )}
                </div>

                <button 
                    className={`tag-management-toggle ${isEditMode ? 'active' : ''}`}
                    onClick={() => setIsEditMode(!isEditMode)}
                >
                    {isEditMode ? '완료' : '태그 관리'}
                </button>
            </div>
        </div>
    );
}
