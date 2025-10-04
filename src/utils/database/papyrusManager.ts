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
import type { Post, Event, DateRange, CustomPeriod, Student, Staff } from '../../types/app';
import type { Template } from '../../hooks/features/templates/useTemplateUI';

// 스프레드시트 ID들을 저장할 변수들
let hotPotatoDBSpreadsheetId: string | null = null;
let boardSpreadsheetId: string | null = null;
let announcementSpreadsheetId: string | null = null;
let calendarProfessorSpreadsheetId: string | null = null;
let calendarStudentSpreadsheetId: string | null = null;
let studentSpreadsheetId: string | null = null;

/**
 * @brief 스프레드시트 ID 찾기 함수
 * @param {string} name - 찾을 스프레드시트의 이름
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 */
export const findSpreadsheetById = async (name: string): Promise<string | null> => {
    try {
        // Google API가 초기화되지 않은 경우
        if (!(window as any).gapi || !(window as any).gapi.client) {
            console.warn(`Google API가 초기화되지 않았습니다. 스프레드시트 '${name}' 검색을 건너뜁니다.`);
            return null;
        }

        // Google API가 준비될 때까지 대기
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            try {
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
            } catch (apiError) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw apiError;
                }
                console.log(`API 호출 실패, 재시도 중... (${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
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
}> => {
    console.log('스프레드시트 ID 초기화 시작...');
    
    try {
        // 순차적으로 스프레드시트 ID 찾기 (안정성을 위해)
        const announcementId = await findSpreadsheetById(ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME);
        const calendarProfessorId = await findSpreadsheetById(ENV_CONFIG.CALENDAR_PROFESSOR_SPREADSHEET_NAME);
        const calendarStudentId = await findSpreadsheetById(ENV_CONFIG.CALENDAR_STUDENT_SPREADSHEET_NAME);
        const boardId = await findSpreadsheetById(ENV_CONFIG.BOARD_SPREADSHEET_NAME);
        const hotPotatoDBId = await findSpreadsheetById(ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME);
        const studentId = await findSpreadsheetById(ENV_CONFIG.STUDENT_SPREADSHEET_NAME);

        announcementSpreadsheetId = announcementId;
        calendarProfessorSpreadsheetId = calendarProfessorId;
        calendarStudentSpreadsheetId = calendarStudentId;
        boardSpreadsheetId = boardId;
        hotPotatoDBSpreadsheetId = hotPotatoDBId;
        studentSpreadsheetId = studentId;
        
        console.log('스프레드시트 ID 초기화 완료:', {
            announcement: !!announcementId,
            calendarProfessor: !!calendarProfessorId,
            calendarStudent: !!calendarStudentId,
            board: !!boardId,
            hotPotatoDB: !!hotPotatoDBId,
            student: !!studentId
        });

        return {
            announcementSpreadsheetId: announcementId,
            calendarProfessorSpreadsheetId: calendarProfessorId,
            calendarStudentSpreadsheetId: calendarStudentId,
            boardSpreadsheetId: boardId,
            hotPotatoDBSpreadsheetId: hotPotatoDBId,
            studentSpreadsheetId: studentId
        };
    } catch (error) {
        console.error('스프레드시트 ID 초기화 중 오류:', error);
        return {
            announcementSpreadsheetId: null,
            calendarProfessorSpreadsheetId: null,
            calendarStudentSpreadsheetId: null,
            boardSpreadsheetId: null,
            hotPotatoDBSpreadsheetId: null,
            studentSpreadsheetId: null
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
      contentPreview: row[3] || '',
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      likes: 0,
    })).reverse();
    
    console.log(`Loaded ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('Error fetching posts from Google Sheet:', error);
    return [];
  }
};

export const addPost = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>): Promise<void> => {
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
      postData.contentPreview,
      ''
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
      title: row[2] || '',
      contentPreview: row[3] || '',
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      likes: 0,
    })).reverse();
    
    console.log(`Loaded ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error fetching announcements from Google Sheet:', error);
    return [];
  }
};

export const addAnnouncement = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>): Promise<void> => {
  try {
    if (!announcementSpreadsheetId) {
      throw new Error('Announcement spreadsheet ID not found');
    }

    const data = await getSheetData(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME);
    const lastRow = data && data.values ? data.values.length : 0;
    const newPostId = `an-${lastRow + 1}`;

    const newAnnouncementForSheet = [
      newPostId,
      postData.author,
      postData.title,
      postData.contentPreview,
      ''
    ];

    await append(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME, [newAnnouncementForSheet]);
    console.log('공지사항이 성공적으로 저장되었습니다.');
  } catch (error) {
    console.error('Error saving announcement to Google Sheet:', error);
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
    await (window as any).gapi.client.sheets.spreadsheets.values.update({
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
      phone_num: row[3] || '',
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

export const fetchStaff = async (): Promise<Staff[]> => {
  try {
    if (!studentSpreadsheetId) {
      console.warn('Student spreadsheet ID not found');
      return [];
    }

    const data = await getSheetData(studentSpreadsheetId, ENV_CONFIG.STAFF_SHEET_NAME);
    
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

    const eventsToSave: Array<{
      title: string;
      startDate: string;
      endDate: string;
      type?: string;
    }> = [];

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

  try {
    // 기존 학사일정 이벤트 삭제 (papyrus-db에서는 직접 삭제 기능이 제한적이므로 스킵)
    console.log('학사일정 이벤트 저장 시작:', eventsToSave.length, '개');

    // 새로운 이벤트들 생성
    for (const event of eventsToSave) {
      await append(calendarSpreadsheetId, ENV_CONFIG.CALENDAR_SHEET_NAME, [[
        event.title,
        event.startDate,
        event.endDate,
        '',
        '',
        '',
        '',
        (event.type && tagLabels[event.type]) || event.type || '',
        '',
        '',
        ''
      ]]);
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
