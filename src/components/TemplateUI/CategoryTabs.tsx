import { useState } from 'react';

interface Props {
    activeTab: string;
    setActiveTab: (v: string) => void;
    tags: string[];
    addTag: (newTag: string) => void;
}

export function CategoryTabs({ activeTab, setActiveTab, tags, addTag }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState("");

    const handleAddTag = () => {
        if (newTag.trim() !== "") {
            addTag(newTag.trim());
            setNewTag("");
            setIsAdding(false);
        }
    };

    return (
        <div className="new-tabs-container">
            {["전체", ...tags].map((tab) => (
                <div
                    key={tab}
                    className={`new-tab ${activeTab === tab ? "new-active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </div>
            ))}
            {isAdding ? (
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
            )}
        </div>
    );
}
