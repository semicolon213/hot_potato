/**
 * @file useTemplateUI.ts
 * @brief 템플릿 UI 관리 훅
 * @details 템플릿 목록, 검색, 필터링, CRUD 작업을 관리하는 커스텀 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useMemo, useCallback, useState, useEffect } from "react";
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
 * @brief 기본 템플릿 목록 (동적으로 로드됨)
 * @details 앱스크립트에서 hot_potato/문서/양식 폴더의 파일들을 가져와서 사용합니다.
 */
export const defaultTemplates: Template[] = [
    { type: "empty", title: "빈 문서", description: "아무것도 없는 빈 문서에서 시작합니다.", tag: "기본" },
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
    // 동적 템플릿 상태
    const [dynamicTemplates, setDynamicTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);

    // 동적 템플릿 로드 함수
    const loadDynamicTemplates = useCallback(async () => {
        setIsLoadingTemplates(true);
        setTemplateError(null);
        
        try {
            console.log('📄 동적 템플릿 로드 시작');
            const result = await apiClient.getTemplates();
            
            if (result.success && result.data) {
                console.log('📄 동적 템플릿 로드 성공:', result.data);
                setDynamicTemplates(result.data);
            } else {
                console.error('📄 동적 템플릿 로드 실패:', result.message);
                setTemplateError(result.message || '템플릿을 불러올 수 없습니다');
            }
        } catch (error) {
            console.error('📄 동적 템플릿 로드 오류:', error);
            setTemplateError('템플릿을 불러오는 중 오류가 발생했습니다');
        } finally {
            setIsLoadingTemplates(false);
        }
    }, []);

    // 컴포넌트 마운트 시 동적 템플릿 로드
    useEffect(() => {
        loadDynamicTemplates();
    }, [loadDynamicTemplates]);

    // 기본 템플릿과 동적 템플릿 결합
    const allDefaultTemplates = useMemo(() => {
        return [...defaultTemplates, ...dynamicTemplates];
    }, [dynamicTemplates]);

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
        
        const isDefault = allDefaultTemplates.some(t => t.type === type);

        // 특별한 처리가 필요한 템플릿들 (스프레드시트 등)
        const specialTemplateUrls: { [key: string]: string } = {
            "fee_deposit_list": "https://docs.google.com/spreadsheets/d/1Detd9Qwc9vexjMTFYAPtISvFJ3utMx-96OxTVCth24w/edit?gid=0#gid=0",
        };

        // 스프레드시트 템플릿의 경우 기존 방식 사용 (URL 복사)
        if (specialTemplateUrls[type]) {
            window.open(specialTemplateUrls[type].replace('/edit', '/copy'), '_blank');
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
            // 커스텀 템플릿의 경우 documentId를 사용하여 템플릿 복사
            if (!isDefault) {
                console.log('📄 커스텀 템플릿 복사 시도:', { title, type, creatorEmail, role });
                
                // documentId가 있는 경우 템플릿 복사
                if (type && type.length > 10) { // documentId는 보통 긴 문자열
                    try {
                        const copyResult = await copyGoogleDocument(type, title);
                        if (copyResult.success && copyResult.documentUrl) {
                            console.log('📄 템플릿 복사 성공:', copyResult);
                            window.open(copyResult.documentUrl, '_blank');
                            alert('문서가 성공적으로 생성되었습니다!');
                            return;
                        } else {
                            console.error('📄 템플릿 복사 실패:', copyResult);
                        }
                    } catch (copyError) {
                        console.error('📄 템플릿 복사 오류:', copyError);
                    }
                }
            }

            // API를 통한 문서 생성 (기본 템플릿 또는 복사 실패 시)
            console.log('📄 API를 통한 문서 생성 시도:', { title, type, creatorEmail, role });
            
            const result = await apiClient.createDocument({
                title: title,
                templateType: isDefault ? type : 'custom', // 커스텀 템플릿의 경우 'custom'으로 설정
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
        allDefaultTemplates, // 모든 기본 템플릿 (정적 + 동적)
        isLoadingTemplates, // 동적 템플릿 로딩 상태
        templateError,     // 템플릿 로딩 오류
        loadDynamicTemplates, // 동적 템플릿 다시 로드 함수
    };
}
