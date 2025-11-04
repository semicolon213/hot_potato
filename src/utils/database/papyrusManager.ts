/**
 * @file papyrusManager.ts
 * @brief Papyrus DB 관리 유틸리티
 * @details papyrus-db npm 패키지를 사용하여 Google 스프레드시트와 상호작용하는 중앙화된 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { deleteRow } from 'papyrus-db/dist/sheets/delete';
import { ENV_CONFIG } from '../../config/environment';
import type { StaffMember, Committee as CommitteeType } from '../../types/features/staff';

// 헬퍼 함수들
const addRow = async (spreadsheetId: string, sheetName: string, data: any) => {
    await append(spreadsheetId, sheetName, data);
};

const updateRow = async (spreadsheetId: string, sheetName: string, key: string, data: any) => {
    await update(spreadsheetId, sheetName, key, data);
};

// papyrus-db에 Google API 인증 설정
const setupPapyrusAuth = () => {
    if (window.gapi && window.gapi.client) {
        // papyrus-db가 gapi.client를 사용하도록 설정
        (window as any).papyrusAuth = {
            client: window.gapi.client
        };
    }
};
import type { Post, Event, DateRange, CustomPeriod, Student, Staff } from '../../types/app';
import type { Template } from '../../hooks/features/templates/useTemplateUI';

// 스프레드시트 ID들을 저장할 변수들
let hotPotatoDBSpreadsheetId: string | null = null;
let boardSpreadsheetId: string | null = null;
let announcementSpreadsheetId: string | null = null;
let calendarProfessorSpreadsheetId: string | null = null;
let calendarStudentSpreadsheetId: string | null = null;
let studentSpreadsheetId: string | null = null;
let staffSpreadsheetId: string | null = null;

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
        const token = localStorage.getItem('googleAccessToken');
        if (!token) {
            console.warn(`Google API 인증 토큰이 없습니다. 스프레드시트 '${name}' 검색을 건너뜁니다.`);
            return null;
        }

        // 토큰을 gapi client에 설정
        try {
            window.gapi.client.setToken({ access_token: token });
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
                    console.log(`✅ 스프레드시트 '${name}' 발견, ID:`, fileId);
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
 * @brief 스프레드시트 ID들 초기화
 */
export const initializeSpreadsheetIds = async (): Promise<{
    announcementSpreadsheetId: string | null;
    calendarProfessorSpreadsheetId: string | null;
    calendarStudentSpreadsheetId: string | null;
    boardSpreadsheetId: string | null;
    hotPotatoDBSpreadsheetId: string | null;
    studentSpreadsheetId: string | null;
    staffSpreadsheetId: string | null;
}> => {
    console.log('스프레드시트 ID 초기화 시작...');

    try {
        // Google API 인증 상태 확인 (더 안전한 방법)
        const token = localStorage.getItem('googleAccessToken');
        if (!token) {
            console.warn('Google API 인증 토큰이 없습니다. 스프레드시트 ID 초기화를 건너뜁니다.');
            return {
                announcementSpreadsheetId: null,
                calendarProfessorSpreadsheetId: null,
                calendarStudentSpreadsheetId: null,
                boardSpreadsheetId: null,
                hotPotatoDBSpreadsheetId: null,
                studentSpreadsheetId: null,
                staffSpreadsheetId: null
            };
        }

        // 토큰을 gapi client에 설정
        try {
            window.gapi.client.setToken({ access_token: token });
            console.log(`✅ 토큰이 gapi client에 설정되었습니다.`);
        } catch (tokenError) {
            console.warn(`토큰 설정 실패:`, tokenError);
        }

        // 순차적으로 스프레드시트 ID 찾기 (안정성을 위해)
        console.log('📋 스프레드시트 검색 시작...');
        console.log('검색할 스프레드시트 이름들:', {
            announcement: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
            calendarProfessor: ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME,
            calendarStudent: ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME,
            board: ENV_CONFIG.BOARD_SPREADSHEET_NAME,
            hotPotatoDB: ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME,
            student: ENV_CONFIG.STUDENT_SPREADSHEET_NAME
        });

        const announcementId = await findSpreadsheetById(ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME);
        console.log('📢 공지사항 스프레드시트 ID:', announcementId);

        const calendarProfessorId = await findSpreadsheetById(ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME);
        console.log('📅 교수 캘린더 스프레드시트 ID:', calendarProfessorId);

        const calendarStudentId = await findSpreadsheetById(ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME);
        console.log('📅 학생 캘린더 스프레드시트 ID:', calendarStudentId);

        const boardId = await findSpreadsheetById(ENV_CONFIG.BOARD_SPREADSHEET_NAME);
        console.log('📋 게시판 스프레드시트 ID:', boardId);

        const hotPotatoDBId = await findSpreadsheetById(ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME);
        console.log('🥔 핫포테이토 DB 스프레드시트 ID:', hotPotatoDBId);

        const studentId = await findSpreadsheetById(ENV_CONFIG.STUDENT_SPREADSHEET_NAME);
        console.log('👥 학생 스프레드시트 ID:', studentId);

        const staffId = await findSpreadsheetById(ENV_CONFIG.STAFF_SPREADSHEET_NAME);
        console.log('👥 교직원 스프레드시트 ID:', staffId);

        announcementSpreadsheetId = announcementId;
        calendarProfessorSpreadsheetId = calendarProfessorId;
        calendarStudentSpreadsheetId = calendarStudentId;
        boardSpreadsheetId = boardId;
        hotPotatoDBSpreadsheetId = hotPotatoDBId;
        studentSpreadsheetId = studentId;
        staffSpreadsheetId = staffId;

        console.log('스프레드시트 ID 초기화 완료:', {
            announcement: !!announcementId,
            calendarProfessor: !!calendarProfessorId,
            calendarStudent: !!calendarStudentId,
            board: !!boardId,
            hotPotatoDB: !!hotPotatoDBId,
            student: !!studentId,
            staff: !!staffId
        });

        return {
            announcementSpreadsheetId: announcementId,
            calendarProfessorSpreadsheetId: calendarProfessorId,
            calendarStudentSpreadsheetId: calendarStudentId,
            boardSpreadsheetId: boardId,
            hotPotatoDBSpreadsheetId: hotPotatoDBId,
            studentSpreadsheetId: studentId,
            staffSpreadsheetId: staffId
        };
    } catch (error) {
        console.error('❌ 스프레드시트 ID 초기화 중 오류:', error);
        console.warn('⚠️ 일부 기능이 제한될 수 있습니다.');
        return {
            announcementSpreadsheetId: null,
            calendarProfessorSpreadsheetId: null,
            calendarStudentSpreadsheetId: null,
            boardSpreadsheetId: null,
            hotPotatoDBSpreadsheetId: null,
            studentSpreadsheetId: null,
            staffSpreadsheetId: null
        };
    }
};

// 게시글 관련 함수들
export const fetchPosts = async (): Promise<Post[]> => {
    try {
        if (!boardSpreadsheetId) {
            console.warn('Board spreadsheet ID not found');
            return [];
        }

        // papyrus-db 인증 설정
        setupPapyrusAuth();

        console.log(`Fetching posts from spreadsheet: ${boardSpreadsheetId}, sheet: ${ENV_CONFIG.BOARD_SHEET_NAME}`);
        const data = await getSheetData(boardSpreadsheetId, ENV_CONFIG.BOARD_SHEET_NAME);
        console.log('Posts data received:', data);

        if (!data || !data.values || data.values.length <= 1) {
            console.log('No posts data or insufficient rows');
            return [];
        }

        const posts = data.values.slice(1).map((row: string[]) => ({
            id: row[0] || '',
            author: row[1] || '',
            title: row[2] || '',
            content: row[3] || '',
            date: row[5] || new Date().toISOString().slice(0, 10),
            views: 0,
            likes: 0,
            writer_id: row[6] || ''
        })).reverse();

        console.log(`Loaded ${posts.length} posts`);
        return posts;
    } catch (error) {
        console.error('Error fetching posts from Google Sheet:', error);
        return [];
    }
};

export const addPost = async (boardSpreadsheetId: string, postData: { title: string; content: string; author: string; writer_id: string; }): Promise<void> => {
    try {
        if (!boardSpreadsheetId) {
            throw new Error('Board spreadsheet ID not found');
        }

        const data = await getSheetData(boardSpreadsheetId, ENV_CONFIG.BOARD_SHEET_NAME);
        const lastRow = data && data.values ? data.values.length : 0;
        const newPostId = `fb-${lastRow + 1}`;

        const newPostForSheet = [
            newPostId,
            postData.author,
            postData.title,
            postData.content,
            '',
            new Date().toISOString().slice(0, 10),
            postData.writer_id
        ];

        await append(boardSpreadsheetId, ENV_CONFIG.BOARD_SHEET_NAME, [newPostForSheet]);
        console.log('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving post to Google Sheet:', error);
        throw error;
    }
};

// 공지사항 관련 함수들
export const fetchAnnouncements = async (): Promise<Post[]> => {
    try {
        if (!announcementSpreadsheetId) {
            console.warn('Announcement spreadsheet ID not found');
            return [];
        }

        console.log(`Fetching announcements from spreadsheet: ${announcementSpreadsheetId}, sheet: ${ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME}`);
        const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
        console.log('Announcements data received:', data);

        if (!data || !data.values || data.values.length <= 1) {
            console.log('No announcements data or insufficient rows');
            return [];
        }

        const announcements = data.values.slice(1).map((row: string[]) => ({
            id: row[0] || '',
            author: row[1] || '',
            writer_id: row[2] || '',
            title: row[3] || '',
            content: row[4] || '',
            date: row[5] || new Date().toISOString().slice(0, 10),
            views: parseInt(row[6] || '0', 10),
            likes: 0,
            file_notice: row[7] || ''
        })).reverse();

        console.log(`Loaded ${announcements.length} announcements`);
        return announcements;
    } catch (error) {
        console.error('Error fetching announcements from Google Sheet:', error);
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
    return new Blob([u8arr], { type: mime });
};

// [MERGE] File 2의 uploadFileToDrive 헬퍼 함수
const uploadFileToDrive = async (file: File): Promise<{ name: string, url: string }> => {
    const token = localStorage.getItem('googleAccessToken');
    if (!token) {
        throw new Error('Google Access Token not found');
    }

    const folderId = '1nXDKPPjHZVQu_qqng4O5vu1sSahDXNpD';

    const fileMetadata = {
        name: file.name,
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', file);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + token }),
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

        return { name: file.name, url: fileInfo.result.webViewLink };
    } else {
        console.error('File upload failed:', uploadedFile);
        throw new Error('File upload failed');
    }
};

// [MERGE] File 1과 File 2의 addAnnouncement 함수 병합
export const addAnnouncement = async (announcementSpreadsheetId: string, postData: { title: string; content: string; author: string; writer_id: string; attachments: File[]; }): Promise<void> => {
    setupPapyrusAuth();

    const token = localStorage.getItem('googleAccessToken');
    if (!token) {
        throw new Error('Google Access Token not found');
    }
    try {
        window.gapi.client.setToken({ access_token: token });
    } catch (tokenError) {
        console.error('Failed to set GAPI token:', tokenError);
        throw new Error('Failed to set GAPI token');
    }

    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        let processedContent = postData.content;

        // --- File 1의 Base64 이미지 처리 로직 ---
        const imgRegex = /<img src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g;
        let match;
        const uploadPromises = [];

        while ((match = imgRegex.exec(postData.content)) !== null) {
            const base64Src = match[1];
            const blob = dataURLtoBlob(base64Src);
            const folderId = '1nXDKPPjHZVQu_qqng4O5vu1sSahDXNpD'; // Same folder as attachments

            const fileMetadata = {
                name: `announcement-image-${Date.now()}`,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            form.append('file', blob);

            const uploadPromise = fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + token }),
                body: form,
            })
                .then(response => response.json())
                .then(async uploadedFile => {
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
                            fields: 'thumbnailLink' // 썸네일 링크 사용
                        });
                        return { base64Src, url: fileInfo.result.thumbnailLink };
                    } else {
                        console.error('File upload failed:', uploadedFile);
                        return { base64Src, url: null };
                    }
                });
            uploadPromises.push(uploadPromise);
        }

        const uploadedImages = await Promise.all(uploadPromises);
        uploadedImages.forEach(image => {
            if (image.url) {
                processedContent = processedContent.replace(image.base64Src, image.url);
            }
        });
        // --- File 1의 Base64 이미지 처리 로직 끝 ---


        // --- File 2의 다중 첨부파일 처리 로직 ---
        let fileInfos: { name: string, url: string }[] = [];
        if (postData.attachments && postData.attachments.length > 0) {
            for (const file of postData.attachments) {
                const fileInfo = await uploadFileToDrive(file); // 헬퍼 함수 사용
                fileInfos.push(fileInfo);
            }
        }
        // --- File 2의 다중 첨부파일 처리 로직 끝 ---


        // --- 데이터 시트 저장 로직 (병합) ---
        const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
        const lastRow = data && data.values ? data.values.length : 0;
        const newPostId = `${lastRow + 1}`;

        // Base64 처리된 컨텐츠와 첨부파일 링크 병합
        let finalContent = processedContent;
        if (fileInfos.length > 0) {
            const attachmentLinks = fileInfos.map(info => `<p>첨부파일: <a href="${info.url}" target="_blank">${info.name}</a></p>`).join('\n');
            finalContent = `${processedContent}\n\n${attachmentLinks}`;
        }

        // file_notice 컬럼에 JSON 문자열로 저장
        const fileNotice = fileInfos.length > 0 ? JSON.stringify(fileInfos) : '';

        const newAnnouncementForSheet = [
            newPostId,
            postData.author,
            postData.writer_id,
            postData.title,
            finalContent, // 병합된 컨텐츠
            new Date().toISOString().slice(0, 10),
            0, // view_count
            fileNotice // JSON 문자열
        ];

        await append(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME, [newAnnouncementForSheet]);
        console.log('공지사항이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving announcement to Google Sheet:', error);
        throw error;
    }
};

export const incrementViewCount = async (announcementId: string): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
        if (!data || !data.values) {
            throw new Error('Could not get sheet data');
        }

        const rowIndex = data.values.findIndex(row => row[0] === announcementId);
        if (rowIndex === -1) {
            // This is not an error, as the sheet may not have been updated yet.
            console.log(`Announcement with ID ${announcementId} not found in sheet. It might be a new post.`);
            return;
        }

        const currentViews = parseInt(data.values[rowIndex][6] || '0', 10);
        const newViews = currentViews + 1;

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: announcementSpreadsheetId,
            range: `${ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME}!G${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[newViews]]
            }
        });

        console.log(`View count for announcement ${announcementId} updated to ${newViews}`);
    } catch (error) {
        console.error('Error incrementing view count:', error);
        // We don't throw error here as it is not critical.
    }
};

// [MERGE] File 2의 updateAnnouncement 함수
export const updateAnnouncement = async (announcementId: string, postData: { title: string; content: string; }): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
        if (!data || !data.values) {
            throw new Error('Could not get sheet data');
        }

        const rowIndex = data.values.findIndex(row => row[0] === announcementId);
        if (rowIndex === -1) {
            throw new Error(`Announcement with ID ${announcementId} not found in sheet.`);
        }

        // Title is in column D (index 3), Content is in column E (index 4)
        const range = `${ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME}!D${rowIndex + 1}:E${rowIndex + 1}`;
        const values = [[postData.title, postData.content]];

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: announcementSpreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });

        console.log(`Announcement ${announcementId} updated successfully`);
    } catch (error) {
        console.error('Error updating announcement:', error);
        throw error;
    }
};

// [MERGE] File 2의 deleteAnnouncement 함수
export const deleteAnnouncement = async (announcementSpreadsheetId: string, announcementId: string): Promise<void> => {
    try {
        if (!announcementSpreadsheetId) {
            throw new Error('Announcement spreadsheet ID not found');
        }

        const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
        if (!data || !data.values) {
            throw new Error('Could not get sheet data');
        }

        const rowIndex = data.values.findIndex(row => row[0] === announcementId);
        if (rowIndex === -1) {
            throw new Error(`Announcement with ID ${announcementId} not found in sheet.`);
        }

        // Assuming the announcement sheet is the first sheet (sheetId = 0)
        const sheetId = 0;
        await deleteRow(announcementSpreadsheetId, sheetId, rowIndex);

        console.log(`Announcement ${announcementId} deleted successfully`);
    } catch (error) {
        console.error('Error deleting announcement:', error);
        throw error;
    }
};

// 템플릿 관련 함수들
export const fetchTemplates = async (): Promise<Template[]> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            console.warn('Hot Potato DB spreadsheet ID not found');
            return [];
        }

        console.log(`Fetching templates from spreadsheet: ${hotPotatoDBSpreadsheetId}, sheet: ${ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME}`);
        const data = await getSheetData(hotPotatoDBSpreadsheetId, ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME);
        console.log('Templates data received:', data);

        if (!data || !data.values || data.values.length <= 1) {
            console.log('No templates data or insufficient rows');
            return [];
        }

        const templates = data.values.slice(1).map((row: string[], index: number) => ({
            rowIndex: index + 2,
            title: row[0] || '',
            description: row[1] || '',
            partTitle: row[1] || '',
            tag: row[2] || '',
            type: row[0] || '',
            documentId: row[4] || '',
            favoritesTag: row[5] || '',
        }));

        console.log(`Loaded ${templates.length} templates`);
        return templates;
    } catch (error) {
        console.error('Error fetching templates from Google Sheet:', error);
        return [];
    }
};

export const fetchTags = async (): Promise<string[]> => {
    try {
        if (!hotPotatoDBSpreadsheetId) {
            console.warn('Hot Potato DB spreadsheet ID not found');
            return [];
        }

        const data = await getSheetData(hotPotatoDBSpreadsheetId, ENV_CONFIG.DOCUMENT_TEMPLATE_SHEET_NAME);

        if (!data || !data.values || data.values.length <= 1) {
            return [];
        }

        const tags = data.values.slice(1).map((row: string[]) => row[2]).filter(Boolean);
        return [...new Set(tags)];
    } catch (error) {
        console.error('Error fetching tags from Google Sheet:', error);
        return [];
    }
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
    const spreadsheetIds = [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId].filter(Boolean) as string[];
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

        const eventMap = new Map<string, Event>(); // stableId -> Event

        results.forEach((eventsFromSheet, i) => {
            const sheetId = spreadsheetIds[i];
            eventsFromSheet.forEach(event => {
                const stableId = event.id.replace(`${sheetId}-`, '');
                eventMap.set(stableId, event);
            });
        });

        const uniqueEvents = Array.from(eventMap.values());

        console.log('Loaded calendar events:', uniqueEvents);
        return uniqueEvents;
    } catch (error) {
        console.error('Error fetching calendar events from Google Sheet:', error);
        return [];
    }
};

export const addCalendarEvent = async (eventData: Omit<Event, 'id'>): Promise<void> => {
    try {
        const targetSpreadsheetId = calendarStudentSpreadsheetId || calendarProfessorSpreadsheetId;
        if (!targetSpreadsheetId) {
            throw new Error('Calendar spreadsheet ID not found');
        }

        const data = await getSheetData(targetSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
        const lastRow = data && data.values ? data.values.length : 0;
        const newEventId = `cal-${lastRow + 1}`;

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

        await append(targetSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, [newEventForSheet]);
        console.log('일정이 성공적으로 추가되었습니다.');
    } catch (error) {
        console.error('Error saving calendar event to Google Sheet:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (eventId: string, eventData: Omit<Event, 'id'>): Promise<void> => {
    try {
        const targetSpreadsheetId = calendarStudentSpreadsheetId || calendarProfessorSpreadsheetId;
        if (!targetSpreadsheetId) {
            throw new Error('Calendar spreadsheet ID not found');
        }

        // Find the row index for the eventId
        const data = await getSheetData(targetSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME);
        if (!data || !data.values) {
            throw new Error('Could not find calendar data');
        }

        const sheetEventId = eventId.substring(targetSpreadsheetId.length + 1);
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

        await update(targetSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, `A${rowIndex + 1}:K${rowIndex + 1}`, [newRowData]);
        console.log('일정이 성공적으로 업데이트되었습니다.');
    } catch (error) {
        console.error('Error updating calendar event in Google Sheet:', error);
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
        return { students, staff };
    } catch (error) {
        console.error('Error fetching attendees:', error);
        return { students: [], staff: [] };
    }
};

// 학생 이슈 관련 함수들
export const fetchStudentIssues = async (studentNo: string): Promise<any[]> => {
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
    const { semesterStartDate, finalExamsPeriod, midtermExamsPeriod, gradeEntryPeriod, customPeriods } = scheduleData;

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
            .replace(/\-\-+/g, '-')       // Replace multiple - with single -
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
                await (window as any).gapi.client.sheets.spreadsheets.values.clear({
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

        const headers = data.values[0];
        const staffData: Staff[] = data.values.slice(1).map((row: any[]) => {
            const staff: Partial<Staff> = {};
            headers.forEach((header: string, index: number) => {
                (staff as any)[header] = row[index];
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

        const headers = data.values[0];
        const committeeData: Committee[] = data.values.slice(1).map((row: any[]) => {
            const committee: { [key: string]: any } = {};
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

        const gapi = (window as any).gapi;
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

        const gapi = (window as any).gapi;
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
        const data = await getSheetData(effectiveSpreadsheetId, sheetName);

        if (!data || !data.values || data.values.length === 0) {
            throw new Error('시트에서 데이터를 찾을 수 없습니다.');
        }

        const rowIndex = data.values.findIndex(row => row[1] === committeeName);

        if (rowIndex === -1) {
            throw new Error('해당 위원회 구성원을 시트에서 찾을 수 없습니다.');
        }

        const sheetId = 1; // Assuming the second sheet
        await deleteRow(effectiveSpreadsheetId, sheetId, rowIndex);

    } catch (error) {
        console.error('Error deleting committee:', error);
        throw error;
    }
};