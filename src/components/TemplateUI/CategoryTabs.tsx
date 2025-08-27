interface Props {
    activeTab: string;
    setActiveTab: (v: string) => void;
}

export const tabs = ["전체", "회의", "재정", "행사", "보고서"];

export function CategoryTabs({ activeTab, setActiveTab }: Props) {
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
