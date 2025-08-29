import { useState, useEffect } from 'react';

interface Props {
    activeTab: string;
    setActiveTab: (v: string) => void;
    tags: string[];
    addTag: (newTag: string) => void;
    deleteTag: (tagToDelete: string) => void;
    updateTag: (oldTag: string, newTag: string) => void;
}

export function CategoryTabs({ activeTab, setActiveTab, tags, addTag, deleteTag, updateTag }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    useEffect(() => {
        if (!isEditMode) {
            setEditingTag(null);
        }
    }, [isEditMode]);

    const handleAddTag = () => {
        if (newTag.trim() !== "") {
            addTag(newTag.trim());
            setNewTag("");
            setIsAdding(false);
        }
    };

    const handleUpdateTag = () => {
        if (editingTag && editingText.trim() !== "") {
            updateTag(editingTag, editingText.trim());
            setEditingTag(null);
            setEditingText("");
        }
    };

    const startEditing = (tag: string) => {
        setEditingTag(tag);
        setEditingText(tag);
    };

    return (
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
                            <button onClick={() => startEditing(tab)} className="edit-tag-button">E</button>
                            <button onClick={() => deleteTag(tab)} className="delete-tag-button">X</button>
                        </>
                    )}
                </div>
            ))}
            
            {!isEditMode && (
                isAdding ? (
                    <div className="new-tag-input-container">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            className="new-tag-input"
                            autoFocus
                        />
                        <button onClick={handleAddTag} className="new-tag-button">추가</button>
                        <button onClick={() => setIsAdding(false)} className="new-tag-button cancel">취소</button>
                    </div>
                ) : (
                    <div className="new-tab add-tag-button" onClick={() => setIsAdding(true)}>
                        + 새 태그
                    </div>
                )
            )}

            <div className="new-tab manage-tag-button" onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? '완료' : '태그 관리'}
            </div>
        </div>
    );
}
