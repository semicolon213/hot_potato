// React import (React 17+에서는 JSX만 쓸 때는 생략 가능)
import React from "react";

// SearchBar 컴포넌트의 props 타입 정의
interface Props {
    searchTerm: string;                    // 현재 검색어 상태
    setSearchTerm: (v: string) => void;    // 검색어 변경 함수
    filterOption: string;                  // 현재 필터 옵션 상태
    setFilterOption: (v: string) => void;  // 필터 옵션 변경 함수
    // setActiveTab: (v: string) => void;  // (현재 미사용, 필요 없으면 삭제)
    // 예를 들어 초기화 버튼 클릭 시 탭도 전체로 바꾸고 싶을 때 쓰려는 기능임
    reset: () => void;                     // 검색/필터 상태 초기화 함수
}

// SearchBar 컴포넌트 정의
export function SearchBar({
                              searchTerm,
                              setSearchTerm,
                              filterOption,
                              setFilterOption,
                              // setActiveTab, // (현재 미사용, 필요 없으면 삭제)
                              reset,
                          }: Props) {
    return (
        <div className="new-search-bar-container">
            {/* 검색 입력 영역 */}
            <div className="new-search-input-wrapper">
                {/* 검색 아이콘 (SVG 등) */}
                <div className="new-search-icon-circle">
                    {/* ...SVG 생략... */}
                </div>
                {/* 검색어 입력 필드 */}
                <input
                    type="text"
                    className="new-search-input"
                    placeholder="템플릿 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // 입력 변화 시 상태 업데이트
                />
            </div>
            {/* 필터 및 초기화 버튼 영역 */}
            <div className="new-filter-buttons">
                {/* 필터 드롭다운 */}
                <div className="new-filter-dropdown">
                    <select
                        className="new-filter-select"
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)} // 옵션 변경 시 상태 업데이트
                    >
                        <option>자주 사용</option>
                        <option>최신순</option>
                        <option>이름순</option>
                    </select>
                </div>
                {/* 검색/필터 상태 초기화 버튼 */}
                <button
                    className="new-reset-button"
                    onClick={reset} // 클릭 시 검색어, 필터, 탭 등 초기화
                >
                    초기화
                </button>
            </div>
        </div>
    );
}
