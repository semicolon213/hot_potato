// React import (React 17+에서는 JSX만 쓸 때는 생략 가능)


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
        </div>
    );
}
