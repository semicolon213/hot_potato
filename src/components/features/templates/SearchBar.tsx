import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

// SearchBar 컴포넌트의 props 타입 정의
interface Props {
    searchTerm: string;                    // 현재 검색어 상태
    setSearchTerm: (v: string) => void;    // 검색어 변경 함수
}

// SearchBar 컴포넌트 정의
export function SearchBar({
                              searchTerm,
                              setSearchTerm,
                          }: Props) {
    return (
        <div className="search-filter-section">
            <div className="search-controls">
                <div className="search-input-group">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="템플릿 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            className="clear-search-btn"
                            onClick={() => setSearchTerm('')}
                            title="검색어 지우기"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
