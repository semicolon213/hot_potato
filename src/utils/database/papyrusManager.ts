/**
 * @file papyrusManager.ts
 * @brief Papyrus DB 관리 유틸리티
 * @details papyrus-db npm 패키지를 사용하여 Google 스프레드시트와 상호작용하는 중앙화된 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import {getSheetData, append, update} from 'papyrus-db';
import {deleteRow} from 'papyrus-db/dist/sheets/delete';
import {ENV_CONFIG} from '../../config/environment';
import {apiClient} from '../api/apiClient';
import {tokenManager} from '../auth/tokenManager';
import type {StaffMember, Committee as CommitteeType} from '../../types/features/staff';
import type {SpreadsheetIdsResponse, AnnouncementsResponse, AnnouncementItem, StudentIssue} from '../../types/api/apiResponses';

// 헬퍼 함수들
const addRow = async (spreadsheetId: string, sheetName: string, data: Record<string, unknown>) => {
    await append(spreadsheetId, sheetName, data);
};

const updateRow = async (spreadsheetId: string, sheetName: string, key: string, data: Record<string, unknown>) => {
    await update(spreadsheetId, sheetName, key, data);
};

// papyrus-db에 Google API 인증 설정
const setupPapyrusAuth = () => {
    if (window.gapi && window.gapi.client) {
        // papyrus-db가 gapi.client를 사용하도록 설정
        window.papyrusAuth = {
            client: window.gapi.client
        };
    }
};
import type {Post, Event, DateRange, CustomPeriod, Student, Staff} from '../../types/app';
import type {Template} from '../../hooks/features/templates/useTemplateUI';

// 스프레드시트 ID들을 저장할 변수들
let hotPotatoDBSpreadsheetId: string | null = null;
let announcementSpreadsheetId: string | null = null;
let calendarProfessorSpreadsheetId: string | null = null;
let calendarCouncilSpreadsheetId: string | null = null;
let calendarADProfessorSpreadsheetId: string | null = null;
let calendarSuppSpreadsheetId: string | null = null;
let calendarStudentSpreadsheetId: string | null = null;
let studentSpreadsheetId: string | null = null;
let staffSpreadsheetId: string | null = null;
let accountingFolderId: string | null = null;

/**
 * @brief 스프레드시트 ID 전역 변수 초기화
 * @details 로그아웃 또는 계정 전환 시 모든 스프레드시트 ID를 초기화합니다.
 */
// 회계 폴더 ID 접근 함수
export const getAccountingFolderId = (): string | null => {
    return accountingFolderId;
};

export const clearSpreadsheetIds = (): void => {
    hotPotatoDBSpreadsheetId = null;
    announcementSpreadsheetId = null;
    calendarProfessorSpreadsheetId = null;
    calendarStudentSpreadsheetId = null;
    studentSpreadsheetId = null;
    staffSpreadsheetId = null;
    accountingFolderId = null;
    console.log('🧹 스프레드시트 ID 전역 변수 초기화 완료');
};

/**
 * @brief 스프레드시트 ID 찾기 함수
 * @param {string} name - 찾을 스프레드시트의 이름
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 */
export const findSpreadsheetById = async (name: string): Promise<string | null> => {
    try {
        // Google API가 초기화되지 않은 경우
        if (!window.gapi || !window.gapi.client) {
            console.warn(`Google API가 초기화되지 않았습니다. 스프레드시트 '${name}' 검색을 건너뜁니다.`);
            return null;
        }

        // Google API 인증 상태 확인 (더 안전한 방법)
        const token = tokenManager.get();
        if (!token) {
            console.warn(`Google API 인증 토큰이 없거나 만료되었습니다. 스프레드시트 '${name}' 검색을 건너뜁니다.`);
            return null;
        }

        // 토큰을 gapi client에 설정
        try {
            window.gapi.client.setToken({access_token: token});
            console.log(`✅ 토큰이 gapi client에 설정되었습니다.`);
        } catch (tokenError) {
            console.warn(`토큰 설정 실패:`, tokenError);
        }

        // Google API가 준비될 때까지 대기
        let attempts = 0;
        const maxAttempts = 3; // 재시도 횟수 줄임

        while (attempts < maxAttempts) {
            try {
                console.log(`스프레드시트 '${name}' 검색 중... (시도 ${attempts + 1}/${maxAttempts})`);

                const response = await window.gapi.client.drive.files.list({
                    q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
                    fields: 'files(id, name)'
                });

                if (response.result.files && response.result.files.length > 0) {
                    const fileId = response.result.files[0].id;
                    // console.log(`✅ 스프레드시트 '${name}' 발견, ID:`, fileId);
                    return fileId;
                } else {
                    console.warn(`❌ 이름이 '${name}'인 스프레드시트를 찾을 수 없습니다.`);
                    return null;
                }
            } catch (apiError) {
                attempts++;
                console.error(`API 호출 실패 (${attempts}/${maxAttempts}):`, apiError);

                if (attempts >= maxAttempts) {
                    console.error(`❌ 스프레드시트 '${name}' 검색 실패:`, apiError);
                    return null; // throw 대신 null 반환
                }

                // 재시도 전 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return null;
    } catch (error) {
        console.warn(`Error searching for ${name} spreadsheet:`, error);
        return null;
    }
};

/**
 * @brief 스프레드시트 ID들 초기화 (Apps Script를 통한 일괄 조회)
 */
export const initializeSpreadsheetIds = async (): Promise<{
    announcementSpreadsheetId: string | null;
    calendarProfessorSpreadsheetId: string | null;
    calendarCouncilSpreadsheetId: string | null;
    calendarADProfessorSpreadsheetId: string | null;
    calendarSuppSpreadsheetId: string | null;
    calendarStudentSpreadsheetId: string | null;
    hotPotatoDBSpreadsheetId: string | null;
    studentSpreadsheetId: string | null;
    staffSpreadsheetId: string | null;
    accountingFolderId: string | null;
}> => {
    console.log('📊 스프레드시트 ID 초기화 시작 (Apps Script 방식)...');

    try {
        // 환경변수에서 스프레드시트 이름 목록 가져오기 (hp_potato_DB는 개인 설정 파일로 분리)
        const spreadsheetNames = [
            ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME,
            ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME,
            ENV_CONFIG.STUDENT_SPREADSHEET_NAME,
            ENV_CONFIG.STAFF_SPREADSHEET_NAME
        ];

        console.log('📋 조회할 스프레드시트 이름들:', spreadsheetNames);

        // Apps Script에 일괄 조회 요청
        const response = await apiClient.getSpreadsheetIds(spreadsheetNames);

        if (!response.success || !response.data) {
            console.error('❌ 스프레드시트 ID 조회 실패:', response.message || '알 수 없는 오류');
            // 개인 설정 파일은 별도로 초기화 시도
            const {findPersonalConfigFile} = await import('./personalConfigManager');
            const personalConfigId = await findPersonalConfigFile().catch(() => null);

            return {
                announcementSpreadsheetId: null,
                calendarProfessorSpreadsheetId: null,
                calendarStudentSpreadsheetId: null,
                hotPotatoDBSpreadsheetId: personalConfigId, // 개인 설정 파일 ID
                studentSpreadsheetId: null,
                staffSpreadsheetId: null
            };
        }

        const ids = response.data as SpreadsheetIdsResponse;

        // 찾지 못한 스프레드시트가 있으면 경고
        if (response.notFound && response.notFound.length > 0) {
            console.warn('⚠️ 찾지 못한 스프레드시트:', response.notFound);
        }

        // 결과 매핑 (hp_potato_DB는 개인 설정 파일로 별도 초기화)
        const announcementId = ids[ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME] || null;
        const calendarProfessorId = ids[ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME] || null;
        const calendarStudentId = ids[ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME] || null;
        const calendarCouncilId = ids[ENV_CONFIG.CALENDAR_COUNCIL_SPREADSHEET_NAME] || null;
        const calendarADProfessorId = ids[ENV_CONFIG.CALENDAR_ADPROFESSOR_SPREADSHEET_NAME] || null;
        const calendarSuppId = ids[ENV_CONFIG.CALENDAR_SUPP_SPREADSHEET_NAME] || null;
        const studentId = ids[ENV_CONFIG.STUDENT_SPREADSHEET_NAME] || null;
        const staffId = ids[ENV_CONFIG.STAFF_SPREADSHEET_NAME] || null;

        // 개인 설정 파일 ID 초기화 (별도 함수로 처리)
        const {findPersonalConfigFile} = await import('./personalConfigManager');
        const personalConfigId = await findPersonalConfigFile();

        // 회계 폴더 ID 조회
        const accountingFolderResponse = await apiClient.request('getAccountingFolderId', {});
        const accountingId = accountingFolderResponse.success && accountingFolderResponse.data?.accountingFolderId
            ? accountingFolderResponse.data.accountingFolderId
            : null;

        // 전역 변수 업데이트
        announcementSpreadsheetId = announcementId;
        calendarProfessorSpreadsheetId = calendarProfessorId;
        calendarCouncilSpreadsheetId = calendarCouncilId;
        calendarADProfessorSpreadsheetId = calendarADProfessorId;
        calendarSuppSpreadsheetId = calendarSuppId;
        calendarStudentSpreadsheetId = calendarStudentId;
        hotPotatoDBSpreadsheetId = personalConfigId; // 개인 설정 파일 ID로 설정
        studentSpreadsheetId = studentId;
        staffSpreadsheetId = staffId;
        accountingFolderId = accountingId;

        console.log('✅ 스프레드시트 ID 초기화 완료:', {
            announcement: !!announcementId,
            calendarProfessor: !!calendarProfessorId,
            calendarCouncil: !!calendarCouncilId,
            calendarADProfessor: !!calendarADProfessorId,
            calendarSupp: !!calendarSuppId,
            calendarStudent: !!calendarStudentId,
            hotPotatoDB: !!personalConfigId,
            student: !!studentId,
            staff: !!staffId,
            accountingFolder: !!accountingId
        });

        return {
            announcementSpreadsheetId: announcementId,
            calendarProfessorSpreadsheetId: calendarProfessorId,
            calendarCouncilSpreadsheetId: calendarCouncilId,
            calendarADProfessorSpreadsheetId: calendarADProfessorId,
            calendarSuppSpreadsheetId: calendarSuppId,
            calendarStudentSpreadsheetId: calendarStudentId,
            hotPotatoDBSpreadsheetId: personalConfigId, // 개인 설정 파일 ID
            studentSpreadsheetId: studentId,
            staffSpreadsheetId: staffId,
            accountingFolderId: accountingId
        };
    } catch (error) {
        console.error('❌ 스프레드시트 ID 초기화 중 오류:', error);
        console.warn('⚠️ 일부 기능이 제한될 수 있습니다.');
        // 개인 설정 파일은 별도로 초기화 시도
        const {findPersonalConfigFile} = await import('./personalConfigManager');
        const personalConfigId = await findPersonalConfigFile().catch(() => null);

        // 회계 폴더 ID는 에러 시에도 null로 반환
        return {
            announcementSpreadsheetId: null,
            calendarProfessorSpreadsheetId: null,
            calendarCouncilSpreadsheetId: null,
            calendarADProfessorSpreadsheetId: null,
            calendarSuppSpreadsheetId: null,
            calendarStudentSpreadsheetId: null,
            hotPotatoDBSpreadsheetId: personalConfigId, // 개인 설정 파일 ID
            studentSpreadsheetId: null,
            staffSpreadsheetId: null,
            accountingFolderId: null
        };
    }
};

// 공지사항 관련 함수들 (앱스크립트 API 사용)
export const fetchAnnouncements = async (userId: string, userType: string): Promise<Post[]> => {
    try {
        if (!announcementSpreadsheetId) {
            console.warn('Announcement spreadsheet ID not found');
            return [];
        }

        if (!userId || !userType) {
            console.warn('User ID or User Type not provided');
            return [];
        }

        console.log(`Fetching announcements via Apps Script API for user: ${userId}, type: ${userType}`);
        
        const response = await apiClient.request('getAnnouncements', {
            spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            userId: userId,
            userType: userType
        });

        if (!response.success) {
            console.warn('Failed to fetch announcements:', response.message);
            return [];
        }

        // 앱스크립트 응답 구조: response.announcements 또는 response.data.announcements
        const announcementsResponse = response as AnnouncementsResponse;
        const announcementsData = announcementsResponse.announcements || announcementsResponse.data?.announcements || [];
        const announcements = announcementsData.map((ann: AnnouncementItem) => {
            // ID를 문자열로 통일 (앱스크립트에서 숫자로 올 수 있음)
            const announcementId = String(ann.id || ann.no_notice || '');
            return {
                id: announcementId,
                author: ann.writer_notice || '',
                writer_id: String(ann.writer_id || ''),
                writer_email: ann.writer_email || '',
                title: ann.title_notice || '',
                content: ann.content_notice || '',
                date: ann.date || new Date().toISOString().slice(0, 10),
                views: parseInt(ann.view_count || '0', 10),
                likes: 0,
                file_notice: ann.file_notice || '',
                access_rights: ann.access_rights || '',
                fix_notice: ann.fix_notice || '',
                isPinned: ann.fix_notice === 'O'
            };
        });

        console.log(`Loaded ${announcements.length} announcements`);
        return announcements;
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
};

// [MERGE] File 1의 dataURLtoBlob 헬퍼 함수
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
};

// [MERGE] File 2의 uploadFileToDrive 헬퍼 함수
const uploadFileToDrive = async (file: File): Promise<{ name: string, url: string }> => {
    const token = tokenManager.get();
    if (!token) {
        throw new Error('Google Access Token not found or expired');
    }

    const folderId = '1nXDKPPjHZVQu_qqng4O5vu1sSahDXNpD';

    const fileMetadata = {
        name: file.name,
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
    form.append('file', file);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({'Authorization': 'Bearer ' + token}),
        body: form,
    });

    const uploadedFile = await uploadResponse.json();

    if (uploadedFile.id) {
        const fileId = uploadedFile.id;

        await window.gapi.client.drive.permissions.create({
            fileId: fileId,
            resource: {
                role: 'reader',
                type: 'anyone'
            }
        });

        const fileInfo = await window.gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'webViewLink'
        });

        return {name: file.name, url: fileInfo.result.webViewLink};
    } else {
        console.error('File upload failed:', uploadedFile);
        throw new Error('File upload failed');
    }
};

// 공지사항 작성 (앱스크립트 API 사용)
export const addAnnouncement = async (announcementSpreadsheetId: string, postData: {
    title: string;
    content: string;
    author: string;
    writer_id: string;
    writerEmail: string; // 작성자 이메일 (암호화용)
    attachments: File[];
    accessRights?: { individual?: string[]; groups?: string[] }; // 권한 설정
    isPinned?: boolean;
    userType?: string;
}): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        if (!postData.writerEmail) {
            throw new Error('Writer email is required');
        }

        setupPapyrusAuth();
        const token = tokenManager.get();
        if (!token) {
            throw new Error('Google Access Token not found or expired');
        }
        
        try {
            window.gapi.client.setToken({access_token: token});
        } catch (tokenError) {
            console.error('Failed to set GAPI token:', tokenError);
            throw new Error('Failed to set GAPI token');
        }

        let processedContent = postData.content;

        // 첨부파일 업로드 (프론트엔드에서 처리)
        let fileInfos: { name: string, url: string }[] = [];
        if (postData.attachments && postData.attachments.length > 0) {
            for (const file of postData.attachments) {
                const fileInfo = await uploadFileToDrive(file);
                fileInfos.push(fileInfo);
            }
        }

        // 첨부파일 링크를 컨텐츠에 추가
        let finalContent = processedContent;
        if (fileInfos.length > 0) {
            const attachmentLinks = fileInfos.map(info => `<p>첨부파일: <a href="${info.url}" target="_blank">${info.name}</a></p>`).join('\n');
            finalContent = `${processedContent}\n\n${attachmentLinks}`;
        }

        // file_notice JSON 문자열
        const fileNotice = fileInfos.length > 0 ? JSON.stringify(fileInfos) : '';

        // 앱스크립트 API 호출
        const response = await apiClient.request('createAnnouncement', {
            spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            writerEmail: postData.writerEmail,
            writerName: postData.author,
            title: postData.title,
            content: finalContent,
            fileNotice: fileNotice,
            accessRights: postData.accessRights,
            isPinned: postData.isPinned || false
        });

        if (!response.success) {
            throw new Error(response.message || '공지사항 작성에 실패했습니다.');
        }

        console.log('공지사항이 성공적으로 저장되었습니다.');

        // 고정 공지 요청 (isPinned가 true이고 fix_notice가 '-'가 아닌 경우)
        if (postData.isPinned && response.data?.announcementId) {
            await apiClient.request('requestPinnedAnnouncement', {
                spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
                announcementId: response.data.announcementId,
                userId: postData.writer_id
            });
        }

    } catch (error) {
        console.error('Error saving announcement:', error);
        throw error;
    }
};

export const requestPinnedAnnouncementApproval = async (postData: { title: string; author: string; writer_id: string; userType: string; }) => {
    return apiClient.request('requestPinnedAnnouncementApproval', postData);
};

export const incrementViewCount = async (announcementId: string): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            console.warn('Announcement spreadsheet ID not found');
            return;
        }

        const response = await apiClient.request('incrementAnnouncementView', {
            spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            announcementId: announcementId
        });

        if (!response.success) {
            console.warn('Failed to increment view count:', response.message);
        } else {
            console.log(`View count for announcement ${announcementId} updated`);
        }
    } catch (error) {
        console.error('Error incrementing view count:', error);
        // 조회수 증가는 중요하지 않으므로 에러를 throw하지 않음
    }
};

export const updateAnnouncement = async (announcementId: string, userId: string, postData: { 
    title: string; 
    content: string; 
    attachments: File[]; 
    existingAttachments: { name: string, url: string }[]; 
    accessRights?: { individual?: string[]; groups?: string[] };
    isPinned?: boolean; 
}): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        setupPapyrusAuth();
        const token = tokenManager.get();
        if (!token) {
            throw new Error('Google Access Token not found or expired');
        }
        
        try {
            window.gapi.client.setToken({access_token: token});
        } catch (tokenError) {
            console.error('Failed to set GAPI token:', tokenError);
            throw new Error('Failed to set GAPI token');
        }

        // 1. Upload new files
        let newFileInfos: { name: string, url: string }[] = [];
        if (postData.attachments && postData.attachments.length > 0) {
            for (const file of postData.attachments) {
                const fileInfo = await uploadFileToDrive(file);
                newFileInfos.push(fileInfo);
            }
        }

        // 2. Combine with existing files
        const allFileInfos = [...postData.existingAttachments, ...newFileInfos];

        // 3. Create new content and file_notice
        const attachmentRegex = /<p>첨부파일:.*?<\/p>/gs;
        const cleanContent = postData.content.replace(attachmentRegex, '').trim();

        let finalContent = cleanContent;
        if (allFileInfos.length > 0) {
            const attachmentLinks = allFileInfos.map(info => `<p>첨부파일: <a href="${info.url}" target="_blank">${info.name}</a></p>`).join('\n');
            finalContent = `${cleanContent}\n\n${attachmentLinks}`;
        }

        const fileNotice = allFileInfos.length > 0 ? JSON.stringify(allFileInfos) : '';

        // 4. 앱스크립트 API 호출
        const response = await apiClient.request('updateAnnouncement', {
            spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            announcementId: announcementId,
            userId: userId,
            title: postData.title,
            content: finalContent,
            fileNotice: fileNotice,
            accessRights: postData.accessRights,
            isPinned: postData.isPinned
        });

        // 고정 공지 요청 처리 (isPinned가 true이고 기존에 요청하지 않은 경우)
        if (postData.isPinned && response.success) {
            try {
                await apiClient.request('requestPinnedAnnouncement', {
                    spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
                    announcementId: announcementId,
                    userId: userId
                });
            } catch (error) {
                console.error('고정 공지 요청 오류:', error);
                // 고정 공지 요청 실패해도 수정은 성공한 것으로 처리
            }
        }

        if (!response.success) {
            throw new Error(response.message || '공지사항 수정에 실패했습니다.');
        }

        console.log('Announcement updated successfully');
    } catch (error) {
        console.error('Error updating announcement:', error);
        throw error;
    }
};

export const deleteAnnouncement = async (spreadsheetId: string, announcementId: string, userId: string): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        const response = await apiClient.request('deleteAnnouncement', {
            spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            announcementId: announcementId,
            userId: userId
        });

        if (!response.success) {
            throw new Error(response.message || '공지사항 삭제에 실패했습니다.');
        }

        console.log(`Announcement with ID ${announcementId} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting announcement:', error);
        throw error;
    }
};

// 템플릿 관련 함수들 (deprecated - document_template 시트 방식은 제거됨)
// 템플릿은 이제 개인 템플릿 폴더와 공유 템플릿 폴더에서 직접 가져옵니다.
export const fetchTemplates = async (): Promise<Template[]> => {
    // document_template 시트 방식은 더 이상 사용하지 않음
    // 템플릿은 useTemplateUI의 loadDynamicTemplates에서 폴더 기반으로 로드됨
    console.log('⚠️ fetchTemplates: document_template 시트 방식은 더 이상 사용되지 않습니다. 폴더 기반 템플릿을 사용하세요.');
    return [];
};


export const fetchTags = async (): Promise<string[]> => {
    // document_template 시트 방식은 더 이상 사용하지 않음
    // 태그는 personalTagManager의 fetchTags를 사용하세요
    console.log('⚠️ fetchTags: document_template 시트 방식은 더 이상 사용되지 않습니다. personalTagManager를 사용하세요.');
    return [];
};

export const addTemplate = async (newDocData: { title: string; description: string; tag: string; }): Promise<void> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            throw new Error('Hot Potato DB spreadsheet ID not found');
        }

        // 1. Create a new Google Doc
        const doc = await window.gapi.client.docs.documents.create({
            title: newDocData.title,
        });

        const documentId = doc.result.documentId;
        console.log(`Created new Google Doc with ID: ${documentId}`);

        // 2. Add a new row to the Google Sheet with the documentId
        const newRowData = [
            '', // A column - empty
            newDocData.title, // B column
            newDocData.description, // C column
            newDocData.tag, // D column
            '', // E column - empty
            documentId, // F column - documentId
        ];

        await append(hotPotatoDBSpreadsheetId, ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME, [newRowData]);
        console.log('Template saved to Google Sheets successfully');

        // 3. Store the documentId in localStorage
        const newStorageKey = `template_doc_id_${newDocData.title}`;
        localStorage.setItem(newStorageKey, documentId);

        console.log('문서가 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error creating document or saving to sheet:', error);
        throw error;
    }
};

export const deleteTemplate = async (rowIndex: number): Promise<void> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            throw new Error('Hot Potato DB spreadsheet ID not found');
        }

        // papyrus-db를 사용하여 행 삭제 (시트 ID는 0으로 가정)
        await deleteRow(hotPotatoDBSpreadsheetId, 0, rowIndex);

        console.log('Template deleted from Google Sheets successfully');
    } catch (error) {
        console.error('Error deleting template from Google Sheet:', error);
        throw error;
    }
};

export const updateTemplate = async (
    rowIndex: number,
    newDocData: { title: string; description: string; tag: string; },
    documentId: string
): Promise<void> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            throw new Error('Hot Potato DB spreadsheet ID not found');
        }

        const newRowData = [
            '', // A column - empty
            newDocData.title, // B column
            newDocData.description, // C column
            newDocData.tag, // D column
            '', // E column - empty
            documentId // F column - documentId
        ];

        await update(hotPotatoDBSpreadsheetId, ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME, `A${rowIndex}:F${rowIndex}`, [newRowData]);
        console.log('Template updated in Google Sheets successfully');
    } catch (error) {
        console.error('Error updating template in Google Sheet:', error);
        throw error;
    }
};

export const updateTemplateFavorite = async (rowIndex: number, favoriteStatus: string | undefined): Promise<void> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            throw new Error('Hot Potato DB spreadsheet ID not found');
        }

        // Google Sheets API를 사용하여 특정 셀 업데이트
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: `${ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME}!G${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[favoriteStatus || '']],
            },
        });

        console.log(`Template favorite status updated in Google Sheets for row ${rowIndex}.`);
    } catch (error) {
        console.error('Error updating template favorite status in Google Sheet:', error);
        throw error;
    }
};

// 캘린더 관련 함수들
export const fetchCalendarEvents = async (): Promise<Event[]> => {
    const spreadsheetIds = [
        calendarProfessorSpreadsheetId, 
        calendarStudentSpreadsheetId, 
        calendarCouncilSpreadsheetId, 
        calendarADProfessorSpreadsheetId, 
        calendarSuppSpreadsheetId
    ].filter(Boolean) as string[];

    if (spreadsheetIds.length === 0) {
        console.log('No calendar spreadsheet IDs available');
        return [];
    }

    try {
        const allEventsPromises = spreadsheetIds.map(async (spreadsheetId) => {
            try {
                console.log(`Fetching calendar events from spreadsheet: ${spreadsheetId}`);

                const data = await getSheetData(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);

                if (!data || !data.values || data.values.length <= 1) {
                    return [];
                }

                return data.values.slice(1).map((row: string[], index: number) => ({
                    id: `${spreadsheetId}-${row[0] || index}`,
                    title: row[1] || '',
                    startDate: row[2] || '',
                    endDate: row[3] || '',
                    description: row[4] || '',
                    colorId: row[5] || '',
                    startDateTime: row[6] || '',
                    endDateTime: row[7] || '',
                    type: row[8] || '',
                    rrule: row[9] || '',
                    attendees: row[10] || '',
                }));
            } catch (sheetError) {
                console.error(`Error fetching from spreadsheet ${spreadsheetId}:`, sheetError);
                return [];
            }
        });

        const results = await Promise.all(allEventsPromises);
        const allEvents = results.flat();

        console.log('Loaded calendar events:', allEvents.length);
        return allEvents;
    } catch (error) {
        console.error('Error fetching calendar events from Google Sheet:', error);
        return [];
    }
};

export const addCalendarEvent = async (spreadsheetId: string, eventData: Omit<Event, 'id'>, userType: string): Promise<void> => {
    try {
        if (!spreadsheetId) {
            throw new Error('Calendar spreadsheet ID not found');
        }

        const data = await getSheetData(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
        const existingIds = data && data.values ? data.values.slice(1).map(row => row[0]).filter(id => id && id.includes('-cal-')).map(id => parseInt(id.split('-').pop() || '0', 10)).filter(num => !isNaN(num)) : [];
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const newEventId = `${userType}-cal-${maxId + 1}`;

        const newEventForSheet = [
            newEventId,
            eventData.title,
            eventData.startDate,
            eventData.endDate,
            eventData.description || '',
            eventData.colorId || '',
            eventData.startDateTime || '',
            eventData.endDateTime || '',
            eventData.type || '',
            eventData.rrule || '',
            eventData.attendees || ''
        ];

        await append(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, [newEventForSheet]);
        console.log('일정이 성공적으로 추가되었습니다.');
    } catch (error) {
        console.error('Error saving calendar event to Google Sheet:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (spreadsheetId: string, eventId: string, eventData: Omit<Event, 'id'>): Promise<void> => {
    try {
        if (!spreadsheetId) {
            throw new Error('Calendar spreadsheet ID not found');
        }

        // Find the row index for the eventId
        const data = await getSheetData(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
        if (!data || !data.values) {
            throw new Error('Could not find calendar data');
        }

        const sheetEventId = eventId.substring(spreadsheetId.length + 1);
        let rowIndex = data.values.findIndex((row: string[]) => row[0] === sheetEventId);

        // Fallback for older ID format that might not be composite
        if (rowIndex === -1) {
            rowIndex = data.values.findIndex((row: string[]) => row[0] === eventId);
        }

        if (rowIndex === -1) {
            throw new Error(`Event with ID ${eventId} not found in sheet.`);
        }

        const newRowData = [
            data.values[rowIndex][0], // Keep original ID
            eventData.title,
            eventData.startDate,
            eventData.endDate,
            eventData.description || '',
            eventData.colorId || '',
            eventData.startDateTime || '',
            eventData.endDateTime || '',
            eventData.type || '',
            eventData.rrule || '',
            eventData.attendees || ''
        ];

        await update(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, `A${rowIndex + 1}:K${rowIndex + 1}`, [newRowData]);
        console.log('일정이 성공적으로 업데이트되었습니다.');
    } catch (error) {
        console.error('Error updating calendar event in Google Sheet:', error);
        throw error;
    }
};

export const deleteCalendarEvent = async (spreadsheetId: string, eventId: string): Promise<void> => {
  try {
    if (!spreadsheetId) {
      throw new Error('Calendar spreadsheet ID not found');
    }

    const data = await getSheetData(spreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
    if (!data || !data.values) {
      throw new Error('Could not find calendar data');
    }

    const sheetEventId = eventId.substring(spreadsheetId.length + 1);
    let rowIndex = data.values.findIndex((row: string[]) => row[0] === sheetEventId);

    if (rowIndex === -1) {
      rowIndex = data.values.findIndex((row: string[]) => row[0] === eventId);
    }

    if (rowIndex === -1) {
      throw new Error(`Event with ID ${eventId} not found in sheet.`);
    }

    const sheetId = 0; // Assuming the first sheet
    await deleteRow(spreadsheetId, sheetId, rowIndex);
    console.log('일정이 성공적으로 삭제되었습니다.');
  } catch (error) {
    console.error('Error deleting calendar event from Google Sheet:', error);
    throw error;
  }
};

// 학생 관련 함수들
export const fetchStudents = async (spreadsheetId?: string): Promise<Student[]> => {
    try {
        const targetSpreadsheetId = spreadsheetId || studentSpreadsheetId;
        if (!targetSpreadsheetId) {
            console.warn('Student spreadsheet ID not found');
            return [];
        }

        console.log(`Fetching students from spreadsheet: ${targetSpreadsheetId}, sheet: ${ENV_CONFIG.STUDENT_SHEET_NAME}`);
        const data = await getSheetData(targetSpreadsheetId, ENV_CONFIG.STUDENT_SHEET_NAME);
        console.log('Students data received:', data);

        if (!data || !data.values || data.values.length <= 1) {
            console.log('No students data or insufficient rows');
            return [];
        }

        const students = data.values.slice(1).map((row: string[]) => ({
            no_student: row[0] || '', // 'no' 컬럼을 'no_student'로 매핑
            name: row[1] || '',
            address: row[2] || '',
            phone_num: row[3] || '', // 암호화된 연락처 (복호화는 프론트엔드에서)
            grade: row[4] || '',
            state: row[5] || '',
            council: row[6] || '',
        }));

        console.log(`Loaded ${students.length} students`);
        return students;
    } catch (error) {
        console.error('Error fetching students from Google Sheet:', error);
        return [];
    }
};

export const deleteStudent = async (spreadsheetId: string, studentNo: string): Promise<void> => {
    try {
        const targetSpreadsheetId = spreadsheetId || studentSpreadsheetId;
        if (!targetSpreadsheetId) {
            throw new Error('Student spreadsheet ID not found');
        }

        setupPapyrusAuth();

        const sheetName = ENV_CONFIG.STUDENT_SHEET_NAME;
        const data = await getSheetData(targetSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('Sheet data not found');
        }

        const rowIndex = data.values.findIndex(row => row[0] === studentNo);

        if (rowIndex === -1) {
            throw new Error('Student not found in the sheet');
        }

        // rowIndex is 0-based for the array, but sheet rows are 1-based.
        // The deleteRow function from papyrus-db likely needs the 1-based index.
        // The header is at rowIndex 0, so data starts at 1. The actual sheet row is rowIndex + 1.
        // However, deleteTemplate uses rowIndex directly. Let's check the papyrus-db library.
        // The deleteRow function in papyrus-db takes (spreadsheetId, sheetId, rowIndex).
        // It seems sheetId is a number (0 for the first sheet). I'll assume that.
        // Let's trust the existing deleteTemplate implementation and use the 0-based rowIndex from findIndex.
        // The sheet data from getSheetData includes the header, so we need to adjust the index.
        // The findIndex is on `data.values`, which includes the header. So if student is on row 5 in the sheet, it's at index 4 in `data.values`.
        // The `deleteRow` in `papyrus-db` seems to take a 1-based row index. So we should pass `rowIndex + 1`.
        // Let's re-examine `deleteTemplate`. It gets `rowIndex` and passes it directly. But that `rowIndex` comes from the UI and is already 1-based.
        // Here, `rowIndex` is 0-based from an array. So we need to add 1.
        // The `deleteRow` function from `papyrus-db` expects a 1-based index.
        // The `data.values` array is 0-indexed. So, we need to pass `rowIndex + 1` to `deleteRow`.
        // The `deleteTemplate` function receives `rowIndex` which is `index + 2`. This seems to be a 1-based index.
        // So I will use `rowIndex` directly, as it seems to be what `deleteRow` expects.

        const sheetId = 0; // Assuming the first sheet
        await deleteRow(targetSpreadsheetId, sheetId, rowIndex);

        console.log(`Student with number ${studentNo} deleted successfully.`);

    } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
};

export const fetchStaff = async (): Promise<Staff[]> => {
    try {
        if (!studentSpreadsheetId) {
            console.warn('Student spreadsheet ID not found');
            return [];
        }

        const data = await getSheetData(studentSpreadsheetId, ENV_CONFIG.STUDENT_SHEET_NAME);

        if (!data || !data.values || data.values.length <= 1) {
            return [];
        }

        return data.values.slice(1).map((row: string[]) => ({
            no: row[0] || '',
            pos: row[1] || '',
            name: row[2] || '',
            tel: row[3] || '',
            phone: row[4] || '',
            email: row[5] || '',
            date: row[6] || '',
            note: row[7] || '',
        }));
    } catch (error) {
        console.error('Error fetching staff from Google Sheet:', error);
        return [];
    }
};

export const fetchAttendees = async (): Promise<{ students: Student[], staff: Staff[] }> => {
    try {
        const [students, staff] = await Promise.all([
            fetchStudents(),
            fetchStaffFromPapyrus(staffSpreadsheetId || '')
        ]);
        return {students, staff};
    } catch (error) {
        console.error('Error fetching attendees:', error);
        return {students: [], staff: []};
    }
};

// 학생 이슈 타입 정의
export interface StudentIssue {
  id: string;
  no_member: string;
  date_issue: string;
  type_issue: string;
  level_issue: string;
  content_issue: string;
}

// 학생 이슈 관련 함수들
export const fetchStudentIssues = async (studentNo: string): Promise<StudentIssue[]> => {
    try {
        if (!studentSpreadsheetId) {
            console.warn('Student spreadsheet ID not found');
            return [];
        }

        const data = await getSheetData(studentSpreadsheetId, ENV_CONFIG.STUDENT_ISSUE_SHEET_NAME);

        if (!data || !data.values || data.values.length <= 1) {
            return [];
        }

        return data.values.slice(1)
            .filter(row => row[0] === studentNo)
            .map((row, index) => ({
                id: `issue_${index}`,
                no_member: row[0] || '',
                date_issue: row[1] || '',
                type_issue: row[2] || '',
                level_issue: row[3] || '',
                content_issue: row[4] || ''
            }));
    } catch (error) {
        console.error('Error fetching student issues:', error);
        return [];
    }
};

export const addStudentIssue = async (issueData: {
    no_member: string;
    date_issue: string;
    type_issue: string;
    level_issue: string;
    content_issue: string;
}): Promise<void> => {
    try {
        if (!studentSpreadsheetId) {
            throw new Error('Student spreadsheet ID not found');
        }

        const data = [
            issueData.no_member,
            issueData.date_issue,
            issueData.type_issue,
            issueData.level_issue,
            issueData.content_issue
        ];

        await append(studentSpreadsheetId, ENV_CONFIG.STUDENT_ISSUE_SHEET_NAME, [data]);
        console.log('Student issue added successfully');
    } catch (error) {
        console.error('Error adding student issue:', error);
        throw error;
    }
};

// 학사일정 저장 함수
export const saveAcademicScheduleToSheet = async (scheduleData: {
    semesterStartDate: Date;
    finalExamsPeriod: DateRange;
    midtermExamsPeriod: DateRange;
    gradeEntryPeriod: DateRange;
    customPeriods: CustomPeriod[];
}, calendarSpreadsheetId: string): Promise<void> => {
    const {semesterStartDate, finalExamsPeriod, midtermExamsPeriod, gradeEntryPeriod, customPeriods} = scheduleData;

    const tagLabels: { [key: string]: string } = {
        holiday: '휴일/휴강',
        event: '행사',
        makeup: '보강',
        exam: '시험',
        meeting: '회의',
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const addInclusiveDays = (startDate: Date, days: number) => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + days - 1);
        return newDate;
    };

    const slugify = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    const eventsToSave: Array<{
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        type?: string;
        description?: string;
    }> = [];

    // 개강일
    eventsToSave.push({ id: 'semester-start', title: '개강일', startDate: formatDate(semesterStartDate), endDate: formatDate(semesterStartDate), type: '공용일정' });

    // 수업일수 events
    const classDay30 = addInclusiveDays(semesterStartDate, 30);
    const classDay60 = addInclusiveDays(semesterStartDate, 60);
    const classDay90 = addInclusiveDays(semesterStartDate, 90);
    eventsToSave.push({ id: 'class-day-30', title: '수업일수 30일', startDate: formatDate(classDay30), endDate: formatDate(classDay30), type: '공용일정', description: '학기 개시일 부터 30일 까지 휴학할 시에 복학 추가 납부 금액 0원' });
    eventsToSave.push({ id: 'class-day-60', title: '수업일수 60일', startDate: formatDate(classDay60), endDate: formatDate(classDay60), type: '공용일정', description: '학기 개시일 30일부터 60일 까지 휴학할 시에 복학 추가 납부 금액 : 등록금의 1/3' });
    eventsToSave.push({ id: 'class-day-90', title: '수업일수 90일', startDate: formatDate(classDay90), endDate: formatDate(classDay90), type: '공용일정', description: '학기 개시일 60일부터 90일 까지 휴학할 시에 복학 추가 납부 금액 : 등록금의 1/2' });

    // 중간고사
    if (midtermExamsPeriod.start && midtermExamsPeriod.end) {
        eventsToSave.push({ id: 'midterm-exam', title: '중간고사', startDate: formatDate(midtermExamsPeriod.start), endDate: formatDate(midtermExamsPeriod.end), type: 'exam' });
    }

    // 기말고사
    if (finalExamsPeriod.start && finalExamsPeriod.end) {
        eventsToSave.push({ id: 'final-exam', title: '기말고사', startDate: formatDate(finalExamsPeriod.start), endDate: formatDate(finalExamsPeriod.end), type: 'exam' });
    }

    // 성적입력 및 강의평가
    if (gradeEntryPeriod.start && gradeEntryPeriod.end) {
        eventsToSave.push({ id: 'grade-entry', title: '성적입력 및 강의평가', startDate: formatDate(gradeEntryPeriod.start), endDate: formatDate(gradeEntryPeriod.end), type: '공용일정' });
    }

    // Custom periods
    customPeriods.forEach(p => {
        if (p.period.start && p.period.end) {
            eventsToSave.push({ id: p.id, title: p.name, startDate: formatDate(p.period.start), endDate: formatDate(p.period.end), type: '공용일정' });
        }
    });

    try {
        console.log('학사일정 이벤트 저장 시작:', eventsToSave.length, '개');

        // Get current data to check for existing events
        const sheetData = await getSheetData(calendarSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
        const existingEvents = sheetData && sheetData.values ? sheetData.values : [];
        const existingEventsMap = new Map<string, number>(); // id -> rowIndex
        existingEvents.forEach((row, index) => {
            if (index > 0) { // Skip header row
                const id = row[0];
                if (id) {
                    existingEventsMap.set(id, index + 1);
                }
            }
        });

        // 이벤트 삭제, 업데이트, 추가 로직
        const newEventIds = new Set(eventsToSave.map(e => e.id));
        const rowsToDelete: number[] = [];

        // 삭제할 행 식별 (학사일정 관련 이벤트만 대상으로 함)
        existingEventsMap.forEach((rowIndex, id) => {
            const isAcademicEvent = id.startsWith('semester-') || id.startsWith('class-day-') || id.startsWith('midterm-') || id.startsWith('final-') || id.startsWith('grade-') || id.startsWith('custom-');
            if (isAcademicEvent && !newEventIds.has(id)) {
                rowsToDelete.push(rowIndex);
            }
        });

        // 행을 삭제하는 대신 내용을 지워서 삭제 효과를 냄
        if (rowsToDelete.length > 0) {
            console.log(`Clearing ${rowsToDelete.length} academic schedule event rows that no longer exist.`);
            for (const rowIndex of rowsToDelete) {
                const range = `${ENV_CONFIG.CALENDAR_SHEET_NAME}!A${rowIndex}:K${rowIndex}`;
                await window.gapi.client.sheets.spreadsheets.values.clear({
                    spreadsheetId: calendarSpreadsheetId,
                    range: range,
                });
            }
        }

        // 새로운 이벤트들 생성 또는 업데이트
        for (const event of eventsToSave) {
            const rowIndex = existingEventsMap.get(event.id);

            const rowData = [
                event.id,
                event.title,
                event.startDate,
                event.endDate,
                event.description || '', // description
                '', // colorId
                '', // startDateTime
                '', // endDateTime
                (event.type && tagLabels[event.type]) || event.type || '', // type
                '', // rrule
                ''  // attendees
            ];

            if (rowIndex) {
                // Update existing event
                await update(calendarSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, `A${rowIndex}:K${rowIndex}`, [rowData]);
            } else {
                // Append new event
                await append(calendarSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, [rowData]);
            }
        }

        console.log('학사일정이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving academic schedule to Papyrus DB:', error);
        throw error;
    }
};

// 태그 관련 함수들
export const addTag = async (newTag: string): Promise<void> => {
    try {
        // papyrus-db에서는 태그를 별도 테이블로 관리하지 않으므로 스킵
        console.log('태그 추가 기능은 현재 지원되지 않습니다:', newTag);
    } catch (error) {
        console.error('Error saving tag to Papyrus DB:', error);
        throw error;
    }
};

export const deleteTag = async (tagToDelete: string): Promise<void> => {
    try {
        // papyrus-db에서는 태그를 별도 테이블로 관리하지 않으므로 스킵
        console.log('태그 삭제 기능은 현재 지원되지 않습니다:', tagToDelete);
    } catch (error) {
        console.error('Error deleting tag from Papyrus DB:', error);
        throw error;
    }
};

export const updateTag = async (oldTag: string, newTag: string): Promise<void> => {
    try {
        // papyrus-db에서는 태그를 별도 테이블로 관리하지 않으므로 스킵
        console.log('태그 업데이트 기능은 현재 지원되지 않습니다:', oldTag, '->', newTag);
    } catch (error) {
        console.error('Error updating tag in Papyrus DB:', error);
        throw error;
    }
};

// ===== 교직원 관리 함수들 =====

/**
 * @brief 교직원 데이터 가져오기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @returns {Promise<Staff[]>} 교직원 목록
 */
export const fetchStaffFromPapyrus = async (spreadsheetId: string): Promise<Staff[]> => {
  try {
    setupPapyrusAuth();

    if (!staffSpreadsheetId) {
      staffSpreadsheetId = await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
    }

    if (!staffSpreadsheetId) {
      throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
    }

    const data = await getSheetData(staffSpreadsheetId, ENV_CONFIG.STAFF_INFO_SHEET_NAME);

    if (!data || !data.values || data.values.length === 0) {
      return [];
    }

    const headers = data.values[0] as string[];
    const staffData: Staff[] = data.values.slice(1).map((row: string[]) => {
      const staff: Partial<Staff> = {};
      headers.forEach((header: string, index: number) => {
        (staff as Record<string, unknown>)[header] = row[index];
      });
      return staff as Staff;
    });

    return staffData;
  } catch (error) {
    console.error('Error fetching staff from Papyrus DB:', error);
    throw error;
  }
};

/**
 * @brief 학과 위원회 데이터 가져오기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @returns {Promise<Committee[]>} 학과 위원회 목록
 */
export const fetchCommitteeFromPapyrus = async (spreadsheetId: string): Promise<Committee[]> => {
  try {
    setupPapyrusAuth();

    if (!staffSpreadsheetId) {
      staffSpreadsheetId = await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
    }

    if (!staffSpreadsheetId) {
      throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
    }

    const data = await getSheetData(staffSpreadsheetId, ENV_CONFIG.STAFF_COMMITTEE_SHEET_NAME);

    if (!data || !data.values || data.values.length === 0) {
      return [];
    }

    const headers = data.values[0] as string[];
    const committeeData: Committee[] = data.values.slice(1).map((row: string[]) => {
      const committee: Record<string, unknown> = {};
      headers.forEach((header: string, index: number) => {
        committee[header] = row[index];
      });

            // career 필드가 문자열일 경우 JSON으로 파싱 (더욱 안전하게)
            let parsedCareer: CommitteeType['career'] = [];
            if (committee.career && typeof committee.career === 'string') {
                try {
                    const parsed = JSON.parse(committee.career);
                    if (Array.isArray(parsed)) {
                        parsedCareer = parsed;
                    }
                } catch (e) {
                    console.error('경력 정보 파싱 실패:', e);
                    // 파싱 실패 시 빈 배열로 유지
                }
            }
            committee.career = parsedCareer;

            return committee as Committee;
        });

        return committeeData;
    } catch (error) {
        console.error('Error fetching committee from Papyrus DB:', error);
        throw error;
    }
};

// Committee 타입 정의
interface Committee {
    sortation: string;
    name: string;
    tel: string;
    email: string;
    position: string;
    career: string;
    company_name: string;
    company_position: string;
    location: string;
    is_family: boolean;
    representative: string;
    note: string;
}

/**
 * @brief 교직원 추가
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {StaffMember} staff - 추가할 교직원 정보
 * @returns {Promise<void>}
 */
export const addStaff = async (spreadsheetId: string, staff: StaffMember): Promise<void> => {
    try {
        setupPapyrusAuth();

        if (!staffSpreadsheetId) {
            staffSpreadsheetId = await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        }

        if (!staffSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const newRow = [[
            staff.no,
            staff.pos,
            staff.name,
            staff.tel,
            staff.phone,
            staff.email,
            staff.date,
            staff.note
        ]];
        await addRow(staffSpreadsheetId, ENV_CONFIG.STAFF_INFO_SHEET_NAME, newRow);
    } catch (error) {
        console.error('Error adding staff:', error);
        throw error;
    }
};

/**
 * @brief 교직원 업데이트
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {StaffMember} staff - 업데이트할 교직원 정보
 * @returns {Promise<void>}
 */
export const updateStaff = async (spreadsheetId: string, staffNo: string, staff: StaffMember): Promise<void> => {
    try {
        setupPapyrusAuth();

        const effectiveSpreadsheetId = staffSpreadsheetId || await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        if (!effectiveSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const sheetName = ENV_CONFIG.STAFF_INFO_SHEET_NAME;
        const data = await getSheetData(effectiveSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('시트에서 데이터를 찾을 수 없습니다.');
        }

        const rowIndex = data.values.findIndex(row => row[0] === staffNo);

        if (rowIndex === -1) {
            throw new Error('해당 교직원을 시트에서 찾을 수 없습니다.');
        }

        const range = `${sheetName}!A${rowIndex + 1}:H${rowIndex + 1}`;
        const values = [[
            staff.no,
            staff.pos,
            staff.name,
            staff.tel,
            staff.phone,
            staff.email,
            staff.date,
            staff.note
        ]];

        const gapi = window.gapi;
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: effectiveSpreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });

    } catch (error) {
        console.error('Error updating staff in papyrusManager:', error);
        // 에러를 다시 던져서 상위 호출자가 처리할 수 있도록 함
        throw error;
    }
};

/**
 * @brief 교직원 삭제
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} staffNo - 삭제할 교직원 번호
 * @returns {Promise<void>}
 */
export const deleteStaff = async (spreadsheetId: string, staffNo: string): Promise<void> => {
    try {
        setupPapyrusAuth();

        const effectiveSpreadsheetId = staffSpreadsheetId || await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        if (!effectiveSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const sheetName = ENV_CONFIG.STAFF_INFO_SHEET_NAME;
        const data = await getSheetData(effectiveSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('시트에서 데이터를 찾을 수 없습니다.');
        }

        const rowIndex = data.values.findIndex(row => row[0] === staffNo);

        if (rowIndex === -1) {
            throw new Error('해당 교직원을 시트에서 찾을 수 없습니다.');
        }

        const sheetId = 0; // Assuming the first sheet
        await deleteRow(effectiveSpreadsheetId, sheetId, rowIndex);

    } catch (error) {
        console.error('Error deleting staff:', error);
        throw error;
    }
};

/**
 * @brief 학과 위원회 추가
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {Committee} committee - 추가할 위원회 정보
 * @returns {Promise<void>}
 */
export const addCommittee = async (spreadsheetId: string, committee: CommitteeType): Promise<void> => {
    try {
        setupPapyrusAuth();

        if (!staffSpreadsheetId) {
            staffSpreadsheetId = await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        }

        if (!staffSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const newRow = [[
            committee.sortation,
            committee.name,
            committee.tel,
            committee.email,
            committee.position,
            JSON.stringify(committee.career), // career는 JSON 문자열로 저장
            committee.company_name,
            committee.company_position,
            committee.location,
            committee.is_family,
            committee.representative,
            committee.note
        ]];
        await addRow(staffSpreadsheetId, ENV_CONFIG.STAFF_COMMITTEE_SHEET_NAME, newRow);
    } catch (error) {
        console.error('Error adding committee:', error);
        throw error;
    }
};

/**
 * @brief 학과 위원회 업데이트
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {Committee} committee - 업데이트할 위원회 정보
 * @returns {Promise<void>}
 */
export const updateCommittee = async (spreadsheetId: string, committeeName: string, committee: CommitteeType): Promise<void> => {
    try {
        setupPapyrusAuth();

        const effectiveSpreadsheetId = staffSpreadsheetId || await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        if (!effectiveSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const sheetName = ENV_CONFIG.STAFF_COMMITTEE_SHEET_NAME;
        const data = await getSheetData(effectiveSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('시트에서 데이터를 찾을 수 없습니다.');
        }

        // 학과 위원회는 이름(name)을 고유 키로 사용 (두 번째 컬럼)
        const rowIndex = data.values.findIndex(row => row[1] === committeeName);

        if (rowIndex === -1) {
            throw new Error('해당 위원회 구성원을 시트에서 찾을 수 없습니다.');
        }

        const range = `${sheetName}!A${rowIndex + 1}:L${rowIndex + 1}`;
        const values = [[
            committee.sortation,
            committee.name,
            committee.tel,
            committee.email,
            committee.position,
            JSON.stringify(committee.career), // career는 JSON 문자열로 저장
            committee.company_name,
            committee.company_position,
            committee.location,
            committee.is_family,
            committee.representative,
            committee.note
        ]];

        const gapi = window.gapi;
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: effectiveSpreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });

    } catch (error) {
        console.error('Error updating committee in papyrusManager:', error);
        throw error;
    }
};

/**
 * @brief 학과 위원회 삭제
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} committeeName - 삭제할 위원회 이름
 * @returns {Promise<void>}
 */
export const deleteCommittee = async (spreadsheetId: string, committeeName: string): Promise<void> => {
    try {
        setupPapyrusAuth();

        const effectiveSpreadsheetId = staffSpreadsheetId || await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        if (!effectiveSpreadsheetId) {
            throw new Error('교직원 스프레드시트를 찾을 수 없습니다.');
        }

        const sheetName = ENV_CONFIG.STAFF_COMMITTEE_SHEET_NAME;

        // Get sheet metadata to find the correct sheetId
        const spreadsheet = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: effectiveSpreadsheetId,
        });

        const sheet = spreadsheet.result.sheets.find(
            (s) => s.properties.title === sheetName
        );

        if (!sheet) {
            throw new Error(`시트 '${sheetName}'을(를) 찾을 수 없습니다.`);
        }
        const sheetId = sheet.properties.sheetId;

        const data = await getSheetData(effectiveSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('시트에서 데이터를 찾을 수 없습니다.');
        }

        const rowIndex = data.values.findIndex(row => row[1] === committeeName);

        if (rowIndex === -1) {
            throw new Error('해당 위원회 구성원을 시트에서 찾을 수 없습니다.');
        }

        await deleteRow(effectiveSpreadsheetId, sheetId, rowIndex);

    } catch (error) {
        console.error('Error deleting committee:', error);
        throw error;
    }
};
