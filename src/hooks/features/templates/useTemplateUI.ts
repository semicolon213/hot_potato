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
        
        const getSpreadsheetNameByRole = (role: string): string => {
            switch (role) {
                case 'professor': return '교수용_DB';
                case 'assistant': return '조교용_DB';
                case 'executive': return '집행부용_DB';
                case 'adjunct':
                case 'student':
                default:
                    return ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME;
            }
        };

        const SPREADSHEET_NAME = getSpreadsheetNameByRole(role);
        const DOC_SHEET_NAME = 'documents';

        const isDefault = defaultTemplates.some(t => t.type === type);

        // Default templates with specific URLs
        const defaultTemplateUrls: { [key: string]: string } = {
            "empty": "https://docs.google.com/document/d/1l4Vl6cHIdD8tKZ1heMkaGCHbQsLHYpDm7oRJyLXAnz8/edit?tab=t.0",
            "meeting": "https://docs.google.com/document/d/1ntJqprRvlOAYyq9t008rfErSRkool6d9-KHJD6bZ5Ow/edit?tab=t.0#heading=h.cx6zo1dlxkku",
            "receipt": "https://docs.google.com/document/d/1u4kPt9Pmv0t90f6J5fq_v7K8dVz_nLQr_o80_352w4k/edit?tab=t.0",
            "confirmation": "https://docs.google.com/document/d/104ZD6cKXob-0Hc0FiZS4HjbVlWeF2WO_XQVpy-xFqTM/edit?tab=t.0#heading=h.3i5cswa5iygh",
            "supporting_document_confirmation": "https://docs.google.com/document/d/1R7fR9o8lqrwmhCiy4OR2Kbc3tomGY4yDkH9J0gAq2zE/edit?tab=t.0",
            "fee_deposit_list": "https://docs.google.com/spreadsheets/d/1Detd9Qwc9vexjMTFYAPtISvFJ3utMx-96OxTVCth24w/edit?gid=0#gid=0",
        };

        if (defaultTemplateUrls[type]) {
            window.open(defaultTemplateUrls[type].replace('/edit', '/copy'), '_blank');
            return;
        }

        if (type.startsWith('http')) {
            window.open(type, '_blank');
            return;
        }

        // "내 템플릿" 로직
        if (!isDefault) {
            const storageKey = `template_doc_id_${title}`;
            const documentId = localStorage.getItem(storageKey);

            if (documentId) {
                const newTitle = `[사본] ${title}`;
                const copiedDocument = await copyGoogleDocument(documentId, newTitle);

                if (copiedDocument) {
                    const spreadsheetId = await getSheetIdByName(SPREADSHEET_NAME);
                    if (!spreadsheetId) return;

                    const sheetExists = await checkSheetExists(spreadsheetId, DOC_SHEET_NAME);
                    if (!sheetExists) {
                        await createNewSheet(spreadsheetId, DOC_SHEET_NAME);
                        const header = [['document_id', 'document_number', 'title', 'author', 'created_at', 'last_modified', 'approval_date', 'status', 'url', 'permission']];
                        await appendSheetData(spreadsheetId, DOC_SHEET_NAME, header);
                    }
                    
                    const today = new Date();
                    const datePrefix = today.getFullYear().toString() + 
                                     ('0' + (today.getMonth() + 1)).slice(-2) + 
                                     ('0' + today.getDate()).slice(-2);

                    const docData = await getSheetData(spreadsheetId, DOC_SHEET_NAME, 'B:B');
                    const todayDocs = docData ? docData.filter(row => row[0] && row[0].startsWith(datePrefix)) : [];
                    const newSeq = ('000' + (todayDocs.length + 1)).slice(-3);
                    const newDocNumber = `${datePrefix}-${newSeq}`;

                    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                    const newRow = [
                        copiedDocument.id,
                        newDocNumber,
                        newTitle,
                        userInfo.name || '알 수 없음',
                        today.toISOString(),
                        new Date().toLocaleDateString('ko-KR'),
                        '',
                        '진행중',
                        copiedDocument.webViewLink,
                        role, // Save the selected role
                    ];

                    await appendSheetData(spreadsheetId, DOC_SHEET_NAME, [newRow]);
                    
                    window.open(copiedDocument.webViewLink, '_blank');
                }
                return;
            }
        }

        // Creation logic (for first use or if the previous doc was deleted)
        try {
            const gapi = (window as any).gapi;
            
            console.log('Google Docs API 사용 시도 - gapi 상태:', {
              'gapi': !!gapi,
              'gapi.client': !!gapi?.client,
              'gapi.client.docs': !!gapi?.client?.docs,
              'gapi.client.docs.documents': !!gapi?.client?.docs?.documents
            });
            
            // Google Docs API가 실제로 사용 가능한지 테스트
            let docsApiAvailable = false;
            try {
                // API 객체가 존재하고 create 메서드가 있는지 확인
                if (gapi.client && gapi.client.docs && gapi.client.docs.documents && 
                    typeof gapi.client.docs.documents.create === 'function') {
                    docsApiAvailable = true;
                    console.log('Google Docs API 사용 가능 확인됨');
                } else {
                    console.warn('Google Docs API 객체는 존재하지만 create 메서드가 없습니다.');
                    
                    // 잠시 대기 후 다시 시도 (타이밍 문제 해결)
                    console.log('1초 후 Google Docs API 재확인 시도...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // 재확인
                    if (gapi.client && gapi.client.docs && gapi.client.docs.documents && 
                        typeof gapi.client.docs.documents.create === 'function') {
                        docsApiAvailable = true;
                        console.log('Google Docs API 재확인 성공 - 사용 가능');
                    } else {
                        console.warn('Google Docs API 재확인 실패 - 여전히 사용할 수 없습니다.');
                    }
                }
            } catch (error) {
                console.warn('Google Docs API 사용 가능성 테스트 실패:', error);
            }
            
            // Google Docs API가 로드되지 않았거나 사용할 수 없는 경우
            if (!docsApiAvailable) {
                console.warn('Google Docs API가 사용할 수 없습니다. Google Drive API를 사용합니다.');
                
                // Google Drive API를 사용하여 문서 생성 (fallback)
                if (!gapi.client.drive || !gapi.client.drive.files) {
                    console.error('Google Drive API도 로드되지 않았습니다.');
                    alert('Google API를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                
                console.log('Google Drive API를 사용하여 문서 생성 시도...');
                
                // Google Drive API로 새 문서 생성
                const response = await gapi.client.drive.files.create({
                    resource: {
                        name: title,
                        mimeType: 'application/vnd.google-apps.document'
                    }
                });
                
                const docId = response.result.id;
                console.log(`Created document '${title}' with ID: ${docId} (via Drive API)`);
                
                let docUrl;
                if (!isDefault) {
                    const storageKey = `template_doc_id_${title}`;
                    localStorage.setItem(storageKey, docId);
                    docUrl = `https://docs.google.com/document/d/${docId}/edit`;
                } else {
                    docUrl = `https://docs.google.com/document/d/${docId}/edit`;
                }
                window.open(docUrl, '_blank');
                return;
            }
            
            console.log('Google Docs API로 문서 생성 시도...');
            const response = await gapi.client.docs.documents.create({
                title: title,
            });

            const docId = response.result.documentId;
            console.log(`Created document '${title}' with ID: ${docId} (via Docs API)`);

            let docUrl;
            if (!isDefault) {
                const storageKey = `template_doc_id_${title}`;
                localStorage.setItem(storageKey, docId);
                // Open with /edit the FIRST time so the user can create the template
                docUrl = `https://docs.google.com/document/d/${docId}/edit`;
            } else {
                docUrl = `https://docs.google.com/document/d/${docId}/edit`;
            }
            window.open(docUrl, '_blank');

        } catch (error) {
            console.error('Error creating Google Doc:', error);
            
            // 403 Forbidden 오류인 경우 스코프 문제일 가능성이 높음
            if ((error as any).status === 403 || ((error as any).result && (error as any).result.error && (error as any).result.error.code === 403)) {
                alert('Google Docs API 사용 권한이 없습니다. 로그아웃 후 다시 로그인해주세요.');
            } else {
                alert('Google Docs에서 문서를 생성하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
            }
        }
    }, [onPageChange]);

    // 훅에서 관리하는 상태, 함수들을 객체로 반환
    return {
        filteredTemplates, // 필터링/정렬된 템플릿 목록
        onUseTemplate,     // 템플릿 사용 함수
    };
}
