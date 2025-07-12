import React from "react";

interface CategoryTabsProps {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const categories = ["전체", "회의", "재정", "행사", "보고서"];

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="new-tabs-container">
            {categories.map((cat) => (
                <div
                    key={cat}
                    className={`new-tab ${activeTab === cat ? "new-active" : ""}`}
                    onClick={() => setActiveTab(cat)}
                >
                    {cat}
                </div>
            ))}
        </div>
    );
};

export default CategoryTabs;
