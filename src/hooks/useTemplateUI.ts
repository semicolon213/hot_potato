import { useState, useMemo } from "react";

// 1. 템플릿 데이터의 타입 정의
export interface Template {
    rowIndex?: number;      // Google Sheet row index, optional for initial templates
    type: string;          // 템플릿 종류 (예: meeting, finance 등)
    title: string;         // 템플릿 제목
    description: string;   // 템플릿 설명
    tag: string;           // 카테고리 태그 (예: 회의, 재정 등)
}

// 2. 초기 템플릿 데이터 배열
export const initialTemplates: Template[] = [
    { type: "empty", title: "빈 문서", description: "아무것도 없는 빈 문서에서 시작합니다.", tag: "기본" }
];

// 3. 템플릿 관련 상태와 로직을 관리하는 커스텀 훅
export function useTemplateUI(templates: Template[], onPageChange: (pageName: string) => void) {
    // 검색어 상태
    const [searchTerm, setSearchTerm] = useState("");
    // 필터 옵션 상태 ("자주 사용", "최신순", "이름순" 등)
    const [filterOption, setFilterOption] = useState("자주 사용");
    // 현재 활성화된 탭(카테고리) 상태 ("전체", "회의", "재정" 등)
    const [activeTab, setActiveTab] = useState("전체");

    // 필터링 및 정렬된 템플릿 목록을 계산 (searchTerm, filterOption, activeTab이 바뀔 때마다 재계산)
    const filteredTemplates = useMemo(() => {
        let result = templates;

        // 1) 탭(카테고리) 필터링
        if (activeTab !== "전체") result = result.filter((t) => t.tag === activeTab);

        // 2) 검색어 필터링
        if (searchTerm.trim())
            result = result.filter(
                (t) => t.title.includes(searchTerm) || t.description.includes(searchTerm)
            );

        // 3) 정렬 옵션
        if (filterOption === "이름순") {
            result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        }
        // "자주 사용", "최신순" 등은 별도 정렬 로직 필요시 추가

        return result;
    }, [templates, searchTerm, filterOption, activeTab]);

    // 템플릿 사용 버튼 클릭 시 실행되는 함수
    const onUseTemplate = (type: string, title: string) => {
        if (type === "empty") {
            onPageChange("empty_document");
        } else if (type === "meeting") {
            window.open("https://docs.google.com/document/d/1ntJqprRvlOAYyq9t008rfErSRkool6d9-KHJD6bZ5Ow/edit?tab=t.0#heading=h.cx6zo1dlxkku", "_blank");
        } else if (type === "finance" || type === "event" || type === "report") {
            onPageChange("proceedings");
        } else {
            alert(`"${title}" 템플릿을 사용합니다!`);
        }
        // 실제로는 템플릿 생성 등 추가 로직을 구현할 수 있음
    };

    // 검색, 필터, 탭 상태를 모두 초기화하는 함수
    const reset = () => {
        setSearchTerm("");
        setFilterOption("자주 사용");
        setActiveTab("전체");
    };

    // 훅에서 관리하는 상태, 함수들을 객체로 반환
    return {
        searchTerm,        // 검색어
        setSearchTerm,     // 검색어 변경 함수
        filterOption,      // 필터 옵션
        setFilterOption,   // 필터 옵션 변경 함수
        activeTab,         // 현재 활성 탭
        setActiveTab,      // 탭 변경 함수
        filteredTemplates, // 필터링/정렬된 템플릿 목록
        onUseTemplate,     // 템플릿 사용 함수
        reset,             // 상태 초기화 함수
    };
}
