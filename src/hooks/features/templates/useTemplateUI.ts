/**
 * @file useTemplateUI.ts
 * @brief 템플릿 UI 관리 훅
 * @details 템플릿 목록, 검색, 필터링, CRUD 작업을 관리하는 커스텀 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useMemo, useCallback } from "react";
import {
    copyGoogleDocument,
    getSheetIdByName,
    checkSheetExists,
    createNewSheet,
    getSheetData,
    appendSheetData
} from "../../../utils/google/googleSheetUtils";
import { ENV_CONFIG } from "../../../config/environment";
import { apiClient } from "../../../utils/api/apiClient";

/**
 * @brief 템플릿 데이터 타입 정의
 * @details Google Sheets와 연동되는 템플릿 데이터의 구조를 정의합니다.
 */
export interface Template {
    rowIndex?: number;      // Google Sheet row index, optional for initial templates
    type: string;          // 템플릿 종류 (예: meeting, finance 등)
    title: string;         // 템플릿 제목
    description: string;   // 템플릿 설명
    tag: string;           // 카테고리 태그 (예: 회의, 재정 등)
    partTitle?: string;    // For filtering
    documentId?: string;   // Google Doc ID
    favoritesTag?: string; // 즐겨찾기 태그
}

/**
 * @brief 기본 템플릿 목록
 * @details 시스템에서 제공하는 기본 템플릿들의 배열입니다.
 */
export const defaultTemplates: Template[] = [
    { type: "empty", title: "빈 문서", description: "아무것도 없는 빈 문서에서 시작합니다.", tag: "기본" },
    { type: "meeting", title: "회의록", description: "회의 내용을 기록하는 템플릿", tag: "회의" },
    { type: "receipt", title: "영수증", description: "지출 증빙을 위한 영수증 템플릿", tag: "재정" },
    { type: "confirmation", title: "학과 행사 대표자 확인서", description: "학과 행사에 대한 대표자의 확인 서명 템플릿", tag: "증명" },
    { type: "supporting_document_confirmation", title: "증빙서류 확인서", description: "증빙 서류 확인을 위한 템플릿", tag: "증명" },
    { type: "fee_deposit_list", title: "학회비 입금자 명단", description: "학회비 입금자 명단 확인용 템플릿", tag: "재정" },
];

/**
 * @brief 기본 템플릿 태그 목록
 * @details 기본 템플릿에서 추출한 고유한 태그들의 배열입니다.
 */
export const defaultTemplateTags = [...new Set(defaultTemplates.map(template => template.tag))];

/**
 * @brief 초기 템플릿 데이터 배열
 * @details 빈 배열로 초기화되는 템플릿 데이터입니다.
 */
export const initialTemplates: Template[] = [];

/**
 * @brief 템플릿 UI 관리 커스텀 훅
 * @details 템플릿 목록, 검색, 필터링, CRUD 작업을 관리하는 커스텀 훅입니다.
 * @param {Template[]} templates - 템플릿 목록
 * @param {Function} onPageChange - 페이지 변경 핸들러
 * @param {string} searchTerm - 검색어
 * @param {string} activeTab - 활성 탭
 * @returns {Object} 템플릿 관련 상태와 핸들러 함수들
 */
export function useTemplateUI(
    templates: Template[], 
    onPageChange: (pageName: string) => void,
    searchTerm: string,
    activeTab: string
) {
    

    // 필터링 및 정렬된 템플릿 목록을 계산 (searchTerm, filterOption, activeTab이 바뀔 때마다 재계산)
    const filteredTemplates = useMemo(() => {
        let result = templates;

        // 1) 탭(카테고리) 필터링
        if (activeTab !== "전체") result = result.filter((template) => template.tag === activeTab);

        // 2) 검색어 필터링
        if (searchTerm.trim())
            result = result.filter(
                (template) => template.title.includes(searchTerm) || template.description.includes(searchTerm)
            );

        return result;
    }, [templates, searchTerm, activeTab]);

    // 템플릿 사용 버튼 클릭 시 실행되는 함수
    const onUseTemplate = useCallback(async (type: string, title: string, role: string) => {
        console.log('📄 템플릿 사용 시작:', { type, title, role });
        
        const isDefault = defaultTemplates.some(t => t.type === type);

        // Default templates with specific URLs - 기존 방식 유지
        const defaultTemplateUrls: { [key: string]: string } = {
            "empty": "https://docs.google.com/document/d/1l4Vl6cHIdD8tKZ1heMkaGCHbQsLHYpDm7oRJyLXAnz8/edit?tab=t.0",
            "meeting": "https://docs.google.com/document/d/1ntJqprRvlOAYyq9t008rfErSRkool6d9-KHJD6bZ5Ow/edit?tab=t.0#heading=h.cx6zo1dlxkku",
            "receipt": "https://docs.google.com/document/d/1u4kPt9Pmv0t90f6J5fq_v7K8dVz_nLQr_o80_352w4k/edit?tab=t.0",
            "confirmation": "https://docs.google.com/document/d/104ZD6cKXob-0Hc0FiZS4HjbVlWeF2WO_XQVpy-xFqTM/edit?tab=t.0#heading=h.3i5cswa5iygh",
            "supporting_document_confirmation": "https://docs.google.com/document/d/1R7fR9o8lqrwmhCiy4OR2Kbc3tomGY4yDkH9J0gAq2zE/edit?tab=t.0",
            "fee_deposit_list": "https://docs.google.com/spreadsheets/d/1Detd9Qwc9vexjMTFYAPtISvFJ3utMx-96OxTVCth24w/edit?gid=0#gid=0",
        };

        // 기본 템플릿의 경우 기존 방식 사용 (URL 복사)
        if (defaultTemplateUrls[type]) {
            window.open(defaultTemplateUrls[type].replace('/edit', '/copy'), '_blank');
            return;
        }

        // URL인 경우 직접 열기
        if (type.startsWith('http')) {
            window.open(type, '_blank');
            return;
        }

        // 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const creatorEmail = userInfo.email || '';

        if (!creatorEmail) {
            alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
            return;
        }

        try {
            // API를 통한 문서 생성
            console.log('📄 API를 통한 문서 생성 시도:', { title, type, creatorEmail, role });
            
            const result = await apiClient.createDocument({
                title: title,
                templateType: type,
                creatorEmail: creatorEmail,
                editors: [], // 필요시 편집자 추가
                role: role
            });

            if (result.success && result.data) {
                console.log('📄 문서 생성 성공:', result.data);
                
                // 생성된 문서 열기
                window.open(result.data.documentUrl, '_blank');
                
                // 성공 메시지
                alert('문서가 성공적으로 생성되었습니다!');
            } else {
                console.error('📄 문서 생성 실패:', result);
                alert('문서 생성에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('📄 문서 생성 오류:', error);
            alert('문서 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
        }
    }, [onPageChange]);

    // 훅에서 관리하는 상태, 함수들을 객체로 반환
    return {
        filteredTemplates, // 필터링/정렬된 템플릿 목록
        onUseTemplate,     // 템플릿 사용 함수
    };
}
