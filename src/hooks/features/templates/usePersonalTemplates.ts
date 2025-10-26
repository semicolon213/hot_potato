/**
 * @file usePersonalTemplates.ts
 * @brief 개인 템플릿 관리 훅
 * @details 사용자의 개인 드라이브에서 "hot potato/문서/개인 양식" 폴더의 템플릿을 가져오는 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useCallback, useEffect } from "react";
import { fetchFavorites, addFavorite, removeFavorite } from "../../../utils/database/personalFavoriteManager";

/**
 * @brief 템플릿 데이터 타입 정의 (개인 템플릿용)
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
    isPersonal?: boolean;  // 개인 템플릿 여부
}

/**
 * @brief 개인 템플릿 데이터 타입 정의
 * @details 개인 드라이브에서 가져온 템플릿 데이터의 구조를 정의합니다.
 */
export interface PersonalTemplateData {
    id: string;              // Google Doc ID
    name: string;            // 템플릿 이름
    modifiedTime: string;    // 수정 시간
    isPersonal: true;        // 개인 템플릿임을 표시
    tag?: string;           // 카테고리 태그 (파일명에서 추출)
    description?: string;   // 설명 (파일명에서 추출)
    partTitle?: string;     // TemplateCard에서 사용하는 partTitle
    fileType?: string;     // 유형 (파일명에서 추출)
    mimeType?: string;     // MIME 타입 (application/vnd.google-apps.document, application/vnd.google-apps.spreadsheet)
    isFavorite?: boolean;   // 즐겨찾기 여부 (파일명에서 추출)
}

/**
 * @brief 개인 템플릿 관리 커스텀 훅
 * @details 사용자의 개인 드라이브에서 템플릿을 가져오고 관리하는 훅입니다.
 * @returns {Object} 개인 템플릿 관련 상태와 핸들러 함수들
 */
export function usePersonalTemplates() {
    const [personalTemplates, setPersonalTemplates] = useState<PersonalTemplateData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * @brief Google Drive API로 개인 템플릿 폴더 찾기
     * @details "hot potato/문서/개인 양식" 폴더 경로를 단계별로 탐색합니다.
     */
    const findPersonalTemplateFolder = useCallback(async (): Promise<string | null> => {
        try {
            console.log('🔍 개인 템플릿 폴더 찾기 시작');

            // 1단계: 루트에서 "hot potato" 폴더 찾기
            const hotPotatoResponse = await gapi.client.drive.files.list({
                q: "'root' in parents and name='hot potato' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields: 'files(id,name)',
                spaces: 'drive',
                orderBy: 'name'
            });

            if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
                console.log('❌ hot potato 폴더를 찾을 수 없습니다');
                return null;
            }

            const hotPotatoFolder = hotPotatoResponse.result.files[0];
            console.log('✅ hot potato 폴더 찾음:', hotPotatoFolder.id);

            // 2단계: hot potato 폴더에서 "문서" 폴더 찾기
            const documentResponse = await gapi.client.drive.files.list({
                q: `'${hotPotatoFolder.id}' in parents and name='문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id,name)',
                spaces: 'drive',
                orderBy: 'name'
            });

            if (!documentResponse.result.files || documentResponse.result.files.length === 0) {
                console.log('❌ 문서 폴더를 찾을 수 없습니다');
                return null;
            }

            const documentFolder = documentResponse.result.files[0];
            console.log('✅ 문서 폴더 찾음:', documentFolder.id);

            // 3단계: 문서 폴더에서 "개인 양식" 폴더 찾기
            const personalTemplateResponse = await gapi.client.drive.files.list({
                q: `'${documentFolder.id}' in parents and name='개인 양식' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id,name)',
                spaces: 'drive',
                orderBy: 'name'
            });

            if (!personalTemplateResponse.result.files || personalTemplateResponse.result.files.length === 0) {
                console.log('❌ 개인 양식 폴더를 찾을 수 없습니다');
                return null;
            }

            const personalTemplateFolder = personalTemplateResponse.result.files[0];
            console.log('✅ 개인 양식 폴더 찾음:', personalTemplateFolder.id);

            return personalTemplateFolder.id;
        } catch (error) {
            console.error('❌ 개인 템플릿 폴더 찾기 오류:', error);
            return null;
        }
    }, []);

    /**
     * @brief 개인 템플릿 목록 가져오기
     * @details 개인 양식 폴더에서 Google Docs 파일들을 가져와서 템플릿 목록을 생성합니다.
     * 기본 템플릿과 동일한 방식으로 파일명을 파싱하여 처리합니다.
     */
    const loadPersonalTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('📄 개인 템플릿 로드 시작');

            // 개인 템플릿 폴더 찾기
            const folderId = await findPersonalTemplateFolder();
            if (!folderId) {
                setError('개인 템플릿 폴더를 찾을 수 없습니다. hot potato/문서/개인 양식 폴더가 존재하는지 확인해주세요.');
                return;
            }

            // 개인 양식 폴더의 Google Docs와 Sheets 파일들 가져오기
            const templatesResponse = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and (mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false`,
                fields: 'files(id,name,modifiedTime,owners,mimeType)',
                spaces: 'drive',
                orderBy: 'name'
            });

            if (!templatesResponse.result.files) {
                console.log('📄 개인 템플릿 폴더에 문서나 스프레드시트가 없습니다');
                setPersonalTemplates([]);
                return;
            }

            // 즐겨찾기 목록 가져오기
            const favorites = await fetchFavorites();
            console.log('📄 현재 즐겨찾기 목록:', favorites);

            // 템플릿 데이터 변환 (개인 양식 전용 파싱 방식)
            const templates: PersonalTemplateData[] = templatesResponse.result.files.map(file => {
                // 파일 제목 파싱: "유형 / 템플릿명 / 템플릿설명"
                const titleParts = file.name.split(' / ');
                
                // 파싱된 데이터 추출
                const fileType = titleParts[0] || '문서';
                const templateName = titleParts[1] || file.name;
                const templateDescription = titleParts[2] || templateName; // 설명이 없으면 템플릿명 사용

                // 파일 타입 접미사 제거 - 순수한 설명만 사용
                const finalDescription = templateDescription;

                // 즐겨찾기 상태 확인
                const isFavorite = favorites.some(
                    fav => fav.type === '개인' && fav.favorite === templateName
                );

                return {
                    id: file.id,
                    name: templateName,
                    title: templateName, // TemplateCard에서 사용하는 title 필드 추가
                    modifiedTime: (file as any).modifiedTime,
                    isPersonal: true,
                    tag: fileType, // 유형이 태그 역할
                    description: finalDescription,
                    partTitle: titleParts[2] || templateName, // 순수한 설명만 (파일타입 접미사 제외)
                    fileType,
                    mimeType: (file as any).mimeType, // MIME 타입 추가
                    isFavorite // 실제 즐겨찾기 상태
                };
            });

            console.log('✅ 개인 템플릿 로드 성공:', templates.length + '개');
            console.log('📄 개인 템플릿 목록:', templates);
            
            // 디버깅을 위한 상세 로그
            templates.forEach((template, index) => {
                console.log(`📄 템플릿 ${index + 1}:`, {
                    원본파일명: templatesResponse.result.files[index].name,
                    fileType: template.fileType,
                    templateName: template.name,
                    tag: template.tag,
                    description: template.description
                });
            });
            setPersonalTemplates(templates);
        } catch (error) {
            console.error('❌ 개인 템플릿 로드 오류:', error);
            setError('개인 템플릿을 불러오는 중 오류가 발생했습니다: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [findPersonalTemplateFolder]);

    /**
     * @brief 개인 템플릿을 일반 템플릿 형식으로 변환
     * @details PersonalTemplateData를 Template 형식으로 변환합니다.
     * 기본 템플릿과 동일한 구조로 변환하여 일관성을 유지합니다.
     */
    const convertToTemplate = useCallback((personalTemplate: PersonalTemplateData): Template => {
        return {
            type: personalTemplate.id, // documentId를 type으로 사용 (기본 템플릿과 동일)
            title: personalTemplate.name,
            description: personalTemplate.description || '개인 템플릿 파일',
            tag: personalTemplate.fileType || personalTemplate.tag || '개인', // fileType을 우선 사용
            documentId: personalTemplate.id,
            partTitle: personalTemplate.partTitle, // PersonalTemplateData에서 설정된 partTitle 사용
            isPersonal: true, // 개인 템플릿임을 표시
            favoritesTag: personalTemplate.isFavorite ? personalTemplate.name : undefined // 즐겨찾기 정보 포함
        };
    }, []);

    /**
     * @brief 개인 템플릿들을 일반 템플릿 형식으로 변환
     * @details PersonalTemplate 배열을 Template 배열로 변환합니다.
     */
    const convertToTemplates = useCallback((personalTemplates: PersonalTemplateData[]): Template[] => {
        return personalTemplates.map(convertToTemplate);
    }, [convertToTemplate]);

    // 컴포넌트 마운트 시 개인 템플릿 로드
    useEffect(() => {
        loadPersonalTemplates();
    }, [loadPersonalTemplates]);


    /**
     * @brief 개인 템플릿 즐겨찾기 토글
     * @details 개인 설정 파일을 사용하여 즐겨찾기 상태를 변경합니다.
     */
    const togglePersonalTemplateFavorite = useCallback(async (template: PersonalTemplateData) => {
        try {
            console.log('⭐ 개인 템플릿 즐겨찾기 토글:', template);
            
            // 개인 설정 파일을 사용한 즐겨찾기 관리
            const favoriteData = {
                type: '개인' as const,
                favorite: template.name
            };

            // 현재 즐겨찾기 상태 확인
            const existingFavorites = await fetchFavorites();
            const isCurrentlyFavorite = existingFavorites.some(
                fav => fav.type === '개인' && fav.favorite === template.name
            );

            if (isCurrentlyFavorite) {
                // 즐겨찾기 해제
                const success = await removeFavorite(favoriteData);
                if (success) {
                    console.log('✅ 개인 템플릿 즐겨찾기 해제 완료');
                    // 개인 템플릿 목록 다시 로드하여 UI 업데이트
                    await loadPersonalTemplates();
                    return { success: true };
                }
            } else {
                // 즐겨찾기 추가
                const success = await addFavorite(favoriteData);
                if (success) {
                    console.log('✅ 개인 템플릿 즐겨찾기 추가 완료');
                    // 개인 템플릿 목록 다시 로드하여 UI 업데이트
                    await loadPersonalTemplates();
                    return { success: true };
                }
            }
            
            return { success: false, error: '즐겨찾기 업데이트 실패' };
            
        } catch (error) {
            console.error('❌ 개인 템플릿 즐겨찾기 토글 실패:', error);
            return { success: false, error: error.message };
        }
    }, []);

    return {
        personalTemplates,
        isLoading,
        error,
        loadPersonalTemplates,
        convertToTemplate,
        convertToTemplates,
        togglePersonalTemplateFavorite
    };
}
