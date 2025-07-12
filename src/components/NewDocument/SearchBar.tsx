import React from "react";

interface SearchBarProps {
    searchTerm: string;
    filterOption: string;
    setSearchTerm: (value: string) => void;
    setFilterOption: (value: string) => void;
    setActiveTab: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 searchTerm,
                                                 filterOption,
                                                 setSearchTerm,
                                                 setFilterOption,
                                                 setActiveTab,
                                             }) => {
    return (
        <div className="new-search-bar-container">
            <div className="new-search-input-wrapper">
                <div className="new-search-icon-circle">
                    {/* 🔍 Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <input
                    type="text"
                    className="new-search-input"
                    placeholder="템플릿 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="new-filter-buttons">
                <div className="new-filter-dropdown">
                    <select
                        className="new-filter-select"
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)}
                    >
                        <option>자주 사용</option>
                        <option>최신순</option>
                        <option>이름순</option>
                    </select>
                </div>
                <button
                    className="new-reset-button"
                    onClick={() => {
                        setSearchTerm("");
                        setFilterOption("자주 사용");
                        setActiveTab("전체");
                    }}
                >
                    초기화
                </button>
            </div>
        </div>
    );
};

export default SearchBar;
