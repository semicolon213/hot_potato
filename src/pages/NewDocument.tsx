import { useTemplateUI } from "../hooks/useTemplateUI";
import type { Template } from "../hooks/useTemplateUI";
import "../components/TemplateUI/TemplateUI.css";

// 2. UI 컴포넌트들 import (검색바, 카테고리 탭, 템플릿 리스트)
import {
    SearchBar,
    CategoryTabs,
    TemplateList,
} from "../components/TemplateUI";

interface TemplatePageProps {
  onPageChange: (pageName: string) => void;
  templates: Template[];
  deleteTemplate: (templateType: string) => void;
}

// 3. TemplatePage 컴포넌트 정의 (메인 템플릿 페이지)
export default function TemplatePage({ onPageChange, templates, deleteTemplate }: TemplatePageProps) {
    // 커스텀 훅에서 상태와 함수들을 가져옴
    const {
        searchTerm,         // 검색어 상태
        setSearchTerm,      // 검색어 변경 함수
        filterOption,       // 필터 옵션 상태
        setFilterOption,    // 필터 옵션 변경 함수
        activeTab,          // 현재 활성화된 탭 상태
        setActiveTab,       // 탭 변경 함수
        filteredTemplates,  // 필터링/정렬된 템플릿 목록
        onUseTemplate,      // 템플릿 사용 이벤트 핸들러
        reset,              // 검색/필터/탭 상태 초기화 함수
    } = useTemplateUI(templates, onPageChange);

    // 4. UI 렌더링
    return (
        <div>
            {/* 검색바: 검색어, 필터, 초기화 등 props 전달 */}
            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterOption={filterOption}
                setFilterOption={setFilterOption}
                // setActiveTab={setActiveTab} 추후 기능 넣을거
                reset={reset}
            />
            {/* 카테고리 탭: 현재 탭, 탭 변경 함수 전달 */}
            <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {/* 템플릿 리스트: 필터링된 템플릿 데이터와 사용 이벤트 전달 */}
            <TemplateList
                templates={filteredTemplates}
                onUseTemplate={onUseTemplate}
                onDeleteTemplate={deleteTemplate}
            />
        </div>
    );
}