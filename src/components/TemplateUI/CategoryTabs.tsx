interface Props {
    activeTab: string;
    setActiveTab: (v: string) => void;
}

export function CategoryTabs({ activeTab, setActiveTab }: Props) {
    const tabs = ["전체", "회의", "재정", "행사", "보고서"];
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
