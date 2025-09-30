/**
 * @file spreadsheetManager.ts
 * @brief Google Sheets API 관리 유틸리티
 * @details Google Sheets와의 모든 상호작용을 담당하는 중앙화된 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { appendRow } from 'papyrus-db';
import { updateSheetCell } from './googleSheetUtils';
import type { Post, Event, DateRange, CustomPeriod, Student, Staff } from '../../types/app';
import type { Template } from '../../hooks/features/templates/useTemplateUI';

/**
 * @brief 스프레드시트 ID 찾기 함수
 * @param {string} name - 찾을 스프레드시트의 이름
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 * @details Google Drive API를 사용하여 지정된 이름의 스프레드시트를 검색합니다.
 */
export const findSpreadsheetById = async (name: string): Promise<string | null> => {
    try {
        // Google API가 초기화되지 않은 경우
        if (!(window as any).gapi || !(window as any).gapi.client) {
            console.warn('Google API가 초기화되지 않았습니다.');
            return null;
        }

        const response = await (window as any).gapi.client.drive.files.list({
            q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
            fields: 'files(id, name)'
        });
        
        if (response.result.files && response.result.files.length > 0) {
            const fileId = response.result.files[0].id;
            console.log(`Found '${name}' spreadsheet with ID:`, fileId);
            return fileId;
        } else {
            console.warn(`Could not find spreadsheet with name '${name}'`);
            return null;
        }
    } catch (error) {
        console.warn(`Error searching for ${name} spreadsheet:`, error);
        return null;
    }
};

// 게시글 관련 함수들
export const fetchPosts = async (boardSpreadsheetId: string, boardSheetName: string): Promise<Post[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: boardSpreadsheetId,
            range: `${boardSheetName}!A:E`,
        });

        const data = response.result.values;
        if (data && data.length > 1) {
            const parsedPosts: Post[] = data.slice(1).map((row: string[]) => ({
                id: row[0],
                author: row[1],
                title: row[2],
                contentPreview: row[3],
                date: new Date().toISOString().slice(0, 10),
                views: 0,
                likes: 0,
            })).reverse();
            return parsedPosts;
        }
        return [];
    } catch (error) {
        console.error('Error fetching posts from Google Sheet:', error);
        return [];
    }
};

export const addPost = async (
    boardSpreadsheetId: string, 
    boardSheetName: string, 
    postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>
): Promise<void> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: boardSpreadsheetId,
            range: `${boardSheetName}!A:A`,
        });

        const lastRow = response.result.values ? response.result.values.length : 0;
        const newPostId = `fb-${lastRow + 1}`;

        const newPostForSheet = {
            'no_freeBoard': newPostId,
            'writer_freeBoard': postData.author,
            'title_freeBoard': postData.title,
            'content_freeBoard': postData.contentPreview,
            'file_freeBoard': '',
        };

        await appendRow(boardSpreadsheetId, boardSheetName, newPostForSheet);
        console.log('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving post to Google Sheet:', error);
        throw error;
    }
};

// 공지사항 관련 함수들
export const fetchAnnouncements = async (announcementSpreadsheetId: string, announcementSheetName: string): Promise<Post[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: announcementSpreadsheetId,
            range: `${announcementSheetName}!A:E`,
        });

        const data = response.result.values;
        if (data && data.length > 1) {
            const parsedAnnouncements: Post[] = data.slice(1).map((row: string[]) => ({
                id: row[0],
                author: row[1],
                title: row[2],
                contentPreview: row[3],
                date: new Date().toISOString().slice(0, 10),
                views: 0,
                likes: 0,
            })).reverse();
            return parsedAnnouncements;
        }
        return [];
    } catch (error) {
        console.error('Error fetching announcements from Google Sheet:', error);
        return [];
    }
};

export const addAnnouncement = async (
    announcementSpreadsheetId: string, 
    announcementSheetName: string, 
    postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>
): Promise<void> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: announcementSpreadsheetId,
            range: `${announcementSheetName}!A:A`,
        });

        const lastRow = response.result.values ? response.result.values.length : 0;
        const newPostId = `an-${lastRow + 1}`;

        const newPostForSheet = {
            'no_notice': newPostId,
            'writer_notice': postData.author,
            'title_notice': postData.title,
            'content_notice': postData.contentPreview,
            'file_notice': '',
        };

        await appendRow(announcementSpreadsheetId, announcementSheetName, newPostForSheet);
        console.log('공지사항이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving announcement to Google Sheet:', error);
        throw error;
    }
};

// 템플릿 관련 함수들
export const fetchTemplates = async (hotPotatoDBSpreadsheetId: string): Promise<Template[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: 'document_template!B2:G',
        });

        const data = response.result.values;
        if (data && data.length > 0) {
            const allTemplates: Template[] = data.map((row: string[], i: number) => ({
                rowIndex: i + 2,
                title: row[0] || '',
                description: row[1] || '',
                parttitle: row[1] || '',
                tag: row[2] || '',
                type: row[0] || '',
                documentId: row[4] || '',
                favorites_tag: row[5] || '',
            }));

            const filteredTemplates = allTemplates.filter(template => {
                return template.title && template.description && template.tag;
            });

            console.log('Loaded templates from Google Sheets:', filteredTemplates);
            return filteredTemplates;
        }
        return [];
    } catch (error) {
        console.error('Error fetching templates from Google Sheet:', error);
        return [];
    }
};

export const fetchTags = async (hotPotatoDBSpreadsheetId: string): Promise<string[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: 'document_template!E2:E',
        });

        const tagColumnValues = response.result.values?.flat().filter(Boolean) || [];
        const uniqueTags = [...new Set(tagColumnValues as string[])];
        return uniqueTags;
    } catch (error) {
        console.error('Error fetching tags from Google Sheet:', error);
        return [];
    }
};

export const addTemplate = async (
    hotPotatoDBSpreadsheetId: string,
    newDocData: { title: string; description: string; tag: string; }
): Promise<void> => {
    try {
        // 1. Create a new Google Doc
        const doc = await (window as any).gapi.client.docs.documents.create({
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

        await (window as any).gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: 'document_template!A1',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [newRowData],
            },
        });

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

export const deleteTemplate = async (
    hotPotatoDBSpreadsheetId: string,
    documentTemplateSheetId: number,
    rowIndex: number
): Promise<void> => {
    try {
        await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: documentTemplateSheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1,
                                endIndex: rowIndex,
                            },
                        },
                    },
                ],
            },
        });

        console.log('Template deleted from Google Sheets successfully');
    } catch (error) {
        console.error('Error deleting template from Google Sheet:', error);
        throw error;
    }
};

export const updateTemplate = async (
    hotPotatoDBSpreadsheetId: string,
    rowIndex: number,
    newDocData: { title: string; description: string; tag: string; },
    documentId: string
): Promise<void> => {
    try {
        const newRowData = [
            '', // A column - empty
            newDocData.title, // B column
            newDocData.description, // C column
            newDocData.tag, // D column
            '', // E column - empty
            documentId // F column - documentId
        ];

        await (window as any).gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: `document_template!A${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [newRowData],
            },
        });

        console.log('Template updated in Google Sheets successfully');
    } catch (error) {
        console.error('Error updating document in Google Sheet:', error);
        throw error;
    }
};

export const updateTemplateFavorite = async (
    hotPotatoDBSpreadsheetId: string,
    rowIndex: number,
    favoriteStatus: string | undefined
): Promise<void> => {
    try {
        await updateSheetCell(
            hotPotatoDBSpreadsheetId,
            'document_template',
            rowIndex,
            6, // Column G
            favoriteStatus || ''
        );
        console.log(`Template favorite status updated in Google Sheets for row ${rowIndex}.`);
    } catch (error) {
        console.error('Error updating template favorite status in Google Sheet:', error);
        throw error;
    }
};

// 캘린더 관련 함수들
export const fetchCalendarEvents = async (
    calendarProfessorSpreadsheetId: string | null,
    calendarStudentSpreadsheetId: string | null,
    calendarSheetName: string
): Promise<Event[]> => {
    const spreadsheetIds = [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId].filter(Boolean) as string[];
    if (spreadsheetIds.length === 0) {
        console.log('No calendar spreadsheet IDs available');
        return [];
    }

    try {
        const allEventsPromises = spreadsheetIds.map(async (spreadsheetId) => {
            try {
                console.log(`Fetching calendar events from spreadsheet: ${spreadsheetId}`);
                
                // 먼저 시트가 존재하는지 확인
                const sheetResponse = await (window as any).gapi.client.sheets.spreadsheets.get({
                    spreadsheetId: spreadsheetId,
                    ranges: [calendarSheetName]
                });
                
                if (!sheetResponse.result.sheets || sheetResponse.result.sheets.length === 0) {
                    console.log(`Sheet '${calendarSheetName}' not found in spreadsheet ${spreadsheetId}`);
                    return [];
                }

                // 데이터가 있는지 확인하기 위해 작은 범위부터 시도
                const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: `${calendarSheetName}!A1:I1`, // 헤더만 먼저 확인
                });
                
                const headerData = response.result.values;
                if (!headerData || headerData.length === 0) {
                    console.log(`No data found in sheet '${calendarSheetName}' of spreadsheet ${spreadsheetId}`);
                    return [];
                }

                // 전체 데이터 가져오기
                const fullResponse = await (window as any).gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: `${calendarSheetName}!A:J`,
                });
                
                const data = fullResponse.result.values;
                if (data && data.length > 1) {
                    return data.slice(1).map((row: string[], index: number) => {
                        const startDate = row[2] || '';
                        const endDate = row[3] || '';
                        const startDateTime = row[6] || '';

                        return {
                            id: `${spreadsheetId}-${row[0] || index}`,
                            title: row[1] || '',
                            startDate: startDate,
                            endDate: endDate,
                            description: row[4] || '',
                            colorId: row[5] || '',
                            startDateTime: startDateTime,
                            endDateTime: row[7] || '',
                            type: row[8] || '',
                            rrule: row[9] || '',
                        };
                    });
                }
                return [];
            } catch (sheetError) {
                console.error(`Error fetching from spreadsheet ${spreadsheetId}:`, sheetError);
                return [];
            }
        });

        const results = await Promise.all(allEventsPromises);
        const allEvents = results.flat().filter(Boolean);

        const uniqueEvents = allEvents.filter((event, index, self) =>
            index === self.findIndex((e) => e.id === event.id)
        );

        console.log('Loaded calendar events:', uniqueEvents);
        return uniqueEvents;
    } catch (error) {
        console.error('Error fetching calendar events from Google Sheet:', error);
        return [];
    }
};

export const addCalendarEvent = async (
    targetSpreadsheetId: string,
    calendarSheetName: string,
    eventData: Omit<Event, 'id'>
): Promise<void> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: targetSpreadsheetId,
            range: `${calendarSheetName}!A:A`,
        });

        const lastRow = response.result.values ? response.result.values.length : 0;
        const newEventId = `cal-${lastRow + 1}`;

        const newEventForSheet = {
            'id_calendar': newEventId,
            'title_calendar': eventData.title,
            'startDate_calendar': eventData.startDate,
            'endDate_calendar': eventData.endDate,
            'description_calendar': eventData.description,
            'startDateTime_calendar': eventData.startDateTime,
            'endDateTime_calendar': eventData.endDateTime,
            'tag_calendar': eventData.type || '',
            'colorId_calendar': (eventData as any).color || '',
            'recurrence_rule_calendar': (eventData as any).rrule || '',
            'attendees_calendar': (eventData as any).attendees || '' // NEW
        };

        await appendRow(targetSpreadsheetId, calendarSheetName, newEventForSheet);
        console.log('일정이 성공적으로 추가되었습니다.');
    } catch (error) {
        console.error('Error saving calendar event to Google Sheet:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (
    spreadsheetId: string,
    sheetName: string,
    eventId: string,
    eventData: Omit<Event, 'id'>
): Promise<void> => {
    try {
        // 1. Find the row index for the eventId
        const idColumnRange = `${sheetName}!A:A`;
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: idColumnRange,
        });

        const ids = response.result.values;
        if (!ids) {
            throw new Error(`Could not find any IDs in sheet ${sheetName}.`);
        }

        const sheetEventId = eventId.substring(spreadsheetId.length + 1);
        let rowIndex = ids.findIndex((row: string[]) => row[0] === sheetEventId);

        // Fallback for older ID format that might not be composite
        if (rowIndex === -1) {
            rowIndex = ids.findIndex((row: string[]) => row[0] === eventId);
        }

        if (rowIndex === -1) {
            throw new Error(`Event with ID ${eventId} (or derived ID ${sheetEventId}) not found in sheet.`);
        }
        
        const targetRow = rowIndex + 1;

        const finalSheetEventId = ids[rowIndex][0];

        // 2. Prepare the new row data in the correct order
        const newRowData = [
            finalSheetEventId, // A: id
            eventData.title, // B: title
            eventData.startDate, // C: startDate
            eventData.endDate, // D: endDate
            eventData.description || '', // E: description
            (eventData as any).color || '', // F: color
            eventData.startDateTime || '', // G: startDateTime
            eventData.endDateTime || '', // H: endDateTime
            eventData.type || '', // I: type
            (eventData as any).rrule || '', // J: rrule
            (eventData as any).attendees || '' // K: attendees
        ];

        // 3. Update the row
        const updateRange = `${sheetName}!A${targetRow}:K${targetRow}`;
        await (window as any).gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: updateRange,
            valueInputOption: 'RAW',
            resource: {
                values: [newRowData],
            },
        });

        console.log(`Event ${finalSheetEventId} updated successfully in row ${targetRow}.`);

    } catch (error) {
        console.error('Error updating calendar event in Google Sheet:', error);
        throw error;
    }
};

export const fetchStudents = async (spreadsheetId: string, sheetName: string): Promise<Student[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A:G`,
        });

        const data = response.result.values;
        if (data && data.length > 1) {
            const students: Student[] = data.slice(1).map((row: string[]) => ({
                no: row[0] || '',
                name: row[1] || '',
                address: row[2] || '',
                phone_num: row[3] || '',
                grade: row[4] || '',
                state: row[5] || '',
                council: row[6] || '',
            }));
            return students;
        }
        return [];
    } catch (error) {
        console.error('Error fetching students from Google Sheet:', error);
        return [];
    }
};

export const fetchStaff = async (spreadsheetId: string, sheetName: string): Promise<Staff[]> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A:H`,
        });

        const data = response.result.values;
        if (data && data.length > 1) {
            const staff: Staff[] = data.slice(1).map((row: string[]) => ({
                no: row[0] || '',
                pos: row[1] || '',
                name: row[2] || '',
                tel: row[3] || '',
                phone: row[4] || '',
                email: row[5] || '',
                date: row[6] || '',
                note: row[7] || '',
            }));
            return staff;
        }
        return [];
    } catch (error) {
        console.error('Error fetching staff from Google Sheet:', error);
        return [];
    }
};

// 학사일정 저장 함수
export const saveAcademicScheduleToSheet = async (
    calendarStudentSpreadsheetId: string,
    calendarSheetName: string,
    scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        midtermExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }
): Promise<void> => {
    const { semesterStartDate, finalExamsPeriod, midtermExamsPeriod, gradeEntryPeriod, customPeriods } = scheduleData;

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper for inclusive date calculation, as per user preference
    const addInclusiveDays = (startDate: Date, days: number) => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + days - 1);
        return newDate;
    };

    const eventsToSave = [];

    // 개강일
    eventsToSave.push({ title: '개강일', startDate: formatDate(semesterStartDate), endDate: formatDate(semesterStartDate) });

    // 수업일수 events
    const classDay30 = addInclusiveDays(semesterStartDate, 30);
    const classDay60 = addInclusiveDays(semesterStartDate, 60);
    const classDay90 = addInclusiveDays(semesterStartDate, 90);
    eventsToSave.push({ title: '수업일수 30일', startDate: formatDate(classDay30), endDate: formatDate(classDay30) });
    eventsToSave.push({ title: '수업일수 60일', startDate: formatDate(classDay60), endDate: formatDate(classDay60) });
    eventsToSave.push({ title: '수업일수 90일', startDate: formatDate(classDay90), endDate: formatDate(classDay90) });

    // 중간고사
    if (midtermExamsPeriod.start && midtermExamsPeriod.end) {
        eventsToSave.push({ title: '중간고사', startDate: formatDate(midtermExamsPeriod.start), endDate: formatDate(midtermExamsPeriod.end), type: 'exam' });
    }

    // 기말고사
    if (finalExamsPeriod.start && finalExamsPeriod.end) {
        eventsToSave.push({ title: '기말고사', startDate: formatDate(finalExamsPeriod.start), endDate: formatDate(finalExamsPeriod.end), type: 'exam' });
    }

    // 성적입력 및 강의평가
    if (gradeEntryPeriod.start && gradeEntryPeriod.end) {
        eventsToSave.push({ title: '성적입력 및 강의평가', startDate: formatDate(gradeEntryPeriod.start), endDate: formatDate(gradeEntryPeriod.end) });
    }

    // Custom periods
    customPeriods.forEach(p => {
        if (p.period.start && p.period.end) {
            eventsToSave.push({ title: p.name, startDate: formatDate(p.period.start), endDate: formatDate(p.period.end) });
        }
    });

    const values = eventsToSave.map((event, index) => [
        `acad-${index + 1}`,
        event.title,
        event.startDate,
        event.endDate,
        '', // description
        '', // colorId
        '', // startDateTime
        '', // endDateTime
        event.type || '', // Column I for type
    ]);

    try {
        // Clear existing academic events (e.g., rows A2:H100)
        await (window as any).gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: calendarStudentSpreadsheetId,
            range: `${calendarSheetName}!A2:H100`, // Assuming academic events are within this range
        });

        // Append new events
        await (window as any).gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: calendarStudentSpreadsheetId,
            range: `${calendarSheetName}!A2`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values,
            },
        });

        console.log('학사일정이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving academic schedule to Google Sheet:', error);
        throw error;
    }
};

// 태그 관련 함수들
export const addTag = async (hotPotatoDBSpreadsheetId: string, newTag: string): Promise<void> => {
    try {
        const newRow = {
            'template_title': '',
            'tamplateparttitle': '', // Typo as per user's message
            'tag_name': newTag
        };
        await appendRow(hotPotatoDBSpreadsheetId, 'document_template', newRow);
        console.log('새로운 태그가 추가되었습니다.');
    } catch (error) {
        console.error('Error saving tag to Google Sheet:', error);
        throw error;
    }
};

export const deleteTag = async (
    hotPotatoDBSpreadsheetId: string,
    documentTemplateSheetId: number,
    tagToDelete: string
): Promise<void> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.get({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            ranges: ['document_template!A:E'],
            includeGridData: true,
        });

        const gridData = response.result.sheets[0].data[0];
        const rowsToDelete = new Set<number>();

        if (gridData.rowData) {
            for (let rowIndex = 0; rowIndex < gridData.rowData.length; rowIndex++) {
                const row = gridData.rowData[rowIndex];
                if (row.values) {
                    // Check column D (index 3) and E (index 4)
                    const tagD = row.values[3]?.formattedValue;
                    const tagE = row.values[4]?.formattedValue;
                    if (tagD === tagToDelete || tagE === tagToDelete) {
                        rowsToDelete.add(rowIndex);
                    }
                }
            }
        }

        if (rowsToDelete.size > 0) {
            const requests = Array.from(rowsToDelete).sort((a, b) => b - a).map(rowIndex => ({
                deleteDimension: {
                    range: {
                        sheetId: documentTemplateSheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex,
                        endIndex: rowIndex + 1,
                    },
                },
            }));

            await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: hotPotatoDBSpreadsheetId,
                resource: { requests },
            });
        }
    } catch (error) {
        console.error('Error deleting tag from Google Sheet:', error);
        throw error;
    }
};

export const updateTag = async (
    hotPotatoDBSpreadsheetId: string,
    documentTemplateSheetId: number,
    oldTag: string,
    newTag: string
): Promise<void> => {
    try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.get({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            ranges: ['document_template!A:E'],
            includeGridData: true,
        });

        const gridData = response.result.sheets[0].data[0];
        const requests = [];

        if (gridData.rowData) {
            for (let rowIndex = 0; rowIndex < gridData.rowData.length; rowIndex++) {
                const row = gridData.rowData[rowIndex];
                if (row.values) {
                    for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
                        const cell = row.values[colIndex];
                        if (cell.formattedValue === oldTag) {
                            requests.push({
                                updateCells: {
                                    rows: [{ values: [{ userEnteredValue: { stringValue: newTag } }] }],
                                    fields: 'userEnteredValue',
                                    start: { sheetId: documentTemplateSheetId, rowIndex, columnIndex: colIndex },
                                },
                            });
                        }
                    }
                }
            }
        }

        if (requests.length > 0) {
            await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: hotPotatoDBSpreadsheetId,
                resource: { requests },
            });
        }
    } catch (error) {
        console.error('Error updating tag in Google Sheet:', error);
        throw error;
    }
};
