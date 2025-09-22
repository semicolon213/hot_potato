import { updateSheetCell } from "./utils/googleSheetUtils";
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./index.css"; // Global styles and theme variables
import "./components/PendingApproval.css"; // 승인 대기 화면 스타일
import "./components/Login.css"; // 인증 관련 스타일
import { GoogleOAuthProvider } from '@react-oauth/google';
import { appendRow } from 'papyrus-db'; // Google Sheets API 접근용
import Login from './components/auth/Login';
import PendingApproval from './components/auth/PendingApproval';
import Admin from './pages/Admin';
import Students from './pages/Students';

import MyCalendarPage from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Docbox from "./pages/Docbox";
import DocumentManagement from "./pages/DocumentManagement";
import EmptyDocument from "./pages/EmptyDocument";
import Mypage from "./pages/Mypage";
import NewDocument from "./pages/NewDocument";
import Preferences from "./pages/Preferences";
import Board from "./pages/Board/Board";
import NewBoardPost from "./pages/Board/NewBoardPost";
import AnnouncementsPage from "./pages/Announcements/Announcements";
import NewAnnouncementPost from "./pages/Announcements/NewAnnouncementPost";
import Proceedings from "./pages/proceedings";
import { getSheetData } from "./utils/googleSheetUtils";

import type { Template } from "./hooks/useTemplateUI";
import type { DateRange, CustomPeriod } from "./hooks/useCalendarContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// 중앙화된 Google API 초기화 상태 관리
let isGoogleAPIInitialized = false;
let googleAPIInitPromise: Promise<void> | null = null;

// gapi 초기화 상태 리셋 함수 (새로고침 시 호출)
const resetGoogleAPIState = () => {
    console.log("Google API 상태 리셋");
    isGoogleAPIInitialized = false;
    googleAPIInitPromise = null;
};

// 페이지 로드 시 상태 리셋
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', resetGoogleAPIState);
}

// 직접 구현한 Google API 초기화 함수
const initializeGoogleAPIOnce = async (hotPotatoDBSpreadsheetId: string | null): Promise<void> => {
    // 이미 초기화되었으면 바로 반환
    if (isGoogleAPIInitialized) {
        return;
    }

    // 이미 초기화 중이면 기존 Promise 반환
    if (googleAPIInitPromise) {
        return googleAPIInitPromise;
    }

    // 새로운 초기화 Promise 생성
    googleAPIInitPromise = (async () => {
        try {
            console.log("Google API 초기화 시작 (직접 구현)");

            // gapi 스크립트가 로드될 때까지 대기 (더 빠른 체크)
            const waitForGapi = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 30; // 3초로 더 단축

                    const checkGapi = () => {
                        attempts++;

                        // gapiLoaded 플래그와 gapi 객체 모두 확인
                        if (typeof window !== 'undefined' &&
                            ((window as any).gapiLoaded || (window as any).gapi)) {
                            console.log("gapi 스크립트 로드 완료");
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            reject(new Error("gapi 스크립트 로드 타임아웃"));
                        } else {
                            // 더 빠른 체크 간격 (100ms)
                            setTimeout(checkGapi, 100);
                        }
                    };

                    checkGapi();
                });
            };

            await waitForGapi();

            const gapi = (window as any).gapi;

            // 더 정확한 초기화 상태 확인 (Gmail API, Docs API 포함)
            const isClientInitialized = gapi.client &&
                gapi.client.sheets &&
                gapi.client.sheets.spreadsheets &&
                gapi.client.gmail &&
                gapi.client.gmail.users &&
                gapi.client.docs &&
                gapi.client.docs.documents;

            if (isClientInitialized) {
                console.log("Google API가 이미 초기화되어 있습니다.");
                isGoogleAPIInitialized = true;
                return;
            }

            console.log("Google API Client Library 초기화 중...");

            // Google API Client Library 초기화 (Modern Way)
            await new Promise<void>((resolve, reject) => {
                gapi.load('client', async () => {
                    try {
                        console.log("gapi.load('client') 완료, Discovery Docs 로드 시작...");

                        await gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4');
                        await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                        await gapi.client.load('https://gmail.googleapis.com/$discovery/rest?version=v1');
                        await gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1');

                        console.log("Discovery Docs 로드 완료");

                        const savedToken = localStorage.getItem('googleAccessToken');
                        if (savedToken) {
                            gapi.client.setToken({ access_token: savedToken });
                            console.log("저장된 토큰 복원 성공");

                            try {
                                if (hotPotatoDBSpreadsheetId) {
                                    await gapi.client.sheets.spreadsheets.get({
                                        spreadsheetId: hotPotatoDBSpreadsheetId,
                                        ranges: ['document_template!A1:A1'],
                                        includeGridData: false
                                    });
                                    console.log("토큰 유효성 검증 성공");
                                }
                            } catch (tokenError) {
                                console.warn("토큰 유효성 검증 실패:", tokenError);
                                localStorage.removeItem('googleAccessToken');
                            }
                        } else {
                            console.log("저장된 토큰 없음");
                        }

                        isGoogleAPIInitialized = true;
                        resolve();
                    } catch (error) {
                        console.error("Google API Client Library 초기화 실패:", error);
                        reject(error);
                    }
                });
            });

        } catch (error) {
            console.error("Google API 초기화 실패:", error);
            isGoogleAPIInitialized = false;
            googleAPIInitPromise = null;
            throw error;
        }
    })();

    return googleAPIInitPromise;
};

export interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  colorId: string;
  startDateTime: string;
  endDateTime: string;
}

// Post interface shared between Board and App
export interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  contentPreview: string;
}


// User interface from feature/login
export interface User {
    email: string;
    name: string;
    studentId: string;
    isAdmin: boolean;
    isApproved: boolean;
    accessToken?: string; // accessToken을 포함하도록 수정
}

type PageType = 'dashboard' | 'admin' | 'board' | 'documents' | 'calendar' | 'users' | 'settings' | 'new-board-post' | 'announcements' | 'new-announcement-post' | 'document_management' | 'docbox' | 'new_document' | 'preferences' | 'mypage' | 'empty_document' | 'proceedings' | 'students' | 'staff';

const App: React.FC = () => {
  // User authentication state (from feature/login)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGapiReady, setIsGapiReady] = useState(false);

    // Original app state (from develop)
    const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // State for Board
    const [posts, setPosts] = useState<Post[]>([]);
    const [isGoogleAuthenticatedForBoard, setIsGoogleAuthenticatedForBoard] = useState(false);
    const [isBoardLoading, setIsBoardLoading] = useState(false);

  // State for Announcements
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [isGoogleAuthenticatedForAnnouncements, setIsGoogleAuthenticatedForAnnouncements] = useState(false);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
  const [documentTemplateSheetId, setDocumentTemplateSheetId] = useState<number | null>(null);
  const [announcementSpreadsheetId, setAnnouncementSpreadsheetId] = useState<string | null>(null);
  const [boardSpreadsheetId, setBoardSpreadsheetId] = useState<string | null>(null);
  const [hotPotatoDBSpreadsheetId, setHotPotatoDBSpreadsheetId] = useState<string | null>(null);
  const [studentSpreadsheetId, setStudentSpreadsheetId] = useState<string | null>(null);
  const [calendarProfessorSpreadsheetId, setCalendarProfessorSpreadsheetId] = useState<string | null>(null);
  const [calendarStudentSpreadsheetId, setCalendarStudentSpreadsheetId] = useState<string | null>(null);
    // State for Calendar
    const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [semesterStartDate, setSemesterStartDate] = useState(new Date());
    const [finalExamsPeriod, setFinalExamsPeriod] = useState<DateRange>({ start: null, end: null });
    const [gradeEntryPeriod, setGradeEntryPeriod] = useState<DateRange>({ start: null, end: null });
    const [customPeriods, setCustomPeriods] = useState<CustomPeriod[]>([]);

  // SHEET_ID는 상수로 정의됨
  const boardSheetName = '시트1';
  const announcementSheetName = '시트1';
    const calendarSheetName = '시트1';

  const deleteTag = (tagToDelete: string) => {
    if (!window.confirm(`'${tagToDelete}' 태그를 정말로 삭제하시겠습니까? 이 태그를 사용하는 모든 템플릿도 함께 삭제됩니다.`)) {
      return;
    }

        // Optimistic UI update
        const oldTemplates = customTemplates;
        const oldTags = tags;

        setTags(tags.filter(tag => tag !== tagToDelete));
        setCustomTemplates(customTemplates.filter(t => t.tag !== tagToDelete));
        console.log(`'${tagToDelete}' 태그 및 관련 템플릿이 삭제되었습니다.`);

    // Background sheet update
    const deleteFromSheet = async () => {
      if (documentTemplateSheetId === null || !hotPotatoDBSpreadsheetId) {
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
        console.log('오류: 시트 정보가 로드되지 않았습니다. 태그 삭제에 실패했습니다.');
        return;
      }

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
        console.error('Error deleting tag from Google Sheet (background):', error);
        console.log('백그라운드 저장 실패: 태그 삭제가 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    };

    deleteFromSheet();
  };

  const updateTag = (oldTag: string, newTag: string) => {
    // Optimistic UI update
    const oldTemplates = customTemplates;
    const oldTags = tags;

    setTags(tags.map(t => t === oldTag ? newTag : t));
    setCustomTemplates(customTemplates.map(t => t.tag === oldTag ? { ...t, tag: newTag } : t));
    console.log(`'${oldTag}' 태그가 '${newTag}'(으)로 수정되었습니다.`);

    // Background sheet update
    const updateSheet = async () => {
      if (documentTemplateSheetId === null || !hotPotatoDBSpreadsheetId) {
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
        console.log('오류: 시트 정보가 로드되지 않았습니다. 태그 수정에 실패했습니다.');
        return;
      }

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
        console.error('Error updating tag in Google Sheet (background):', error);
        console.log('백그라운드 저장 실패: 태그 수정이 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    };

    updateSheet();
  };

  const addTag = async (newTag: string) => {
    if (newTag && !tags.includes(newTag) && hotPotatoDBSpreadsheetId) {
      try {
        const newRow = {
          'template_title': '',
          'tamplateparttitle': '', // Typo as per user's message
          'tag_name': newTag
        };
        await appendRow(hotPotatoDBSpreadsheetId, 'document_template', newRow);
        setTags([...tags, newTag]);
        console.log('새로운 태그가 추가되었습니다.');
      } catch (error) {
        console.error('Error saving tag to Google Sheet:', error);
        console.log('태그 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const addTemplate = async (newDocData: { title: string; description: string; tag: string; }) => {
    if (!hotPotatoDBSpreadsheetId) {
      console.log('오류: 템플릿 시트가 로드되지 않았습니다.');
      return;
    }
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

      // 4. Refresh templates from Google Sheets to get the latest data
      await fetchTemplates();

      console.log('문서가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error creating document or saving to sheet:', error);
      console.log('문서 생성 또는 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteTemplate = async (rowIndex: number) => {
    if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    if (documentTemplateSheetId === null || !hotPotatoDBSpreadsheetId) {
      console.log('시트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

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

      // Refresh templates from Google Sheets to get the latest data
      await fetchTemplates();

      console.log('템플릿이 성공적으로 삭제되었습니다.');

    } catch (error) {
      console.error('Error deleting template from Google Sheet:', error);
      console.log('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };


  const updateTemplate = async (rowIndex: number, newDocData: { title: string; description: string; tag: string; }, oldTitle: string) => {
    try {
      const originalTemplate = customTemplates.find(t => t.rowIndex === rowIndex);
      const documentId = originalTemplate ? originalTemplate.documentId : '';

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

      // Migrate localStorage
      if (oldTitle && oldTitle !== newDocData.title) {
        const oldStorageKey = `template_doc_id_${oldTitle}`;
        const newStorageKey = `template_doc_id_${newDocData.title}`;
        const docIdFromStorage = localStorage.getItem(oldStorageKey);
        if (docIdFromStorage) {
          localStorage.removeItem(oldStorageKey);
          localStorage.setItem(newStorageKey, docIdFromStorage);
        }
      }

      // Refresh templates from Google Sheets to get the latest data
      await fetchTemplates();

      console.log('문서가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating document in Google Sheet:', error);
      console.log('문서 수정 중 오류가 발생했습니다.');
    }
  };

  const updateTemplateFavorite = async (rowIndex: number, favoriteStatus: string | undefined) => {
    if (!hotPotatoDBSpreadsheetId) {
        console.error("Spreadsheet ID is not available.");
        return;
    }
    try {
        // G열은 7번째 열이므로, columnIndex는 6입니다.
        await updateSheetCell(
            hotPotatoDBSpreadsheetId,
            'document_template',
            rowIndex,
            6, // Column G
            favoriteStatus || '' // 새로운 값 또는 빈 문자열로 셀을 비웁니다.
        );
        console.log(`Template favorite status updated in Google Sheets for row ${rowIndex}.`);
        await fetchTemplates(); // 시트와 UI를 동기화하기 위해 템플릿을 다시 불러옵니다.
    } catch (error) {
        console.error('Error updating template favorite status in Google Sheet:', error);
        // 여기서 UI 롤백 로직을 추가할 수 있습니다.
    }
  };

  const fetchPosts = async () => {
    if (!boardSpreadsheetId) return;
    setIsBoardLoading(true);
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
        setPosts(parsedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts from Google Sheet:', error);
      console.log('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsBoardLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    if (!announcementSpreadsheetId) return;
    setIsAnnouncementsLoading(true);
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
        setAnnouncements(parsedAnnouncements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements from Google Sheet:', error);
      console.log('공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!hotPotatoDBSpreadsheetId) return;
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: hotPotatoDBSpreadsheetId,
        range: 'document_template!B2:G', // Range covers B to G columns
      });

      const data = response.result.values;
      if (data && data.length > 0) {
        const allTemplates: Template[] = data.map((row: string[], i: number) => ({
          rowIndex: i + 2,
          title: row[0] || '',       // Column B -> title
          description: row[1] || '', // Column C -> description (was parttitle)
          parttitle: row[1] || '',   // Column C -> parttitle (same as description for compatibility)
          tag: row[2] || '',         // Column D -> tag
          type: row[0] || '',        // Use title as type
          documentId: row[4] || '',  // Column F -> documentId
          favorites_tag: row[5] || '', // Column G -> favorites_tag
        }));

        const filteredTemplates = allTemplates.filter(template => {
          // Filter based on title (B), description (C), and tag (D)
          return template.title && template.description && template.tag;
        });

        console.log('Loaded templates from Google Sheets:', filteredTemplates);
        setCustomTemplates(filteredTemplates);
      } else {
        console.log('No template data found in Google Sheets');
        setCustomTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates from Google Sheet:', error);
    }
  };

  const fetchTags = async () => {
    if (!hotPotatoDBSpreadsheetId) return;
    try {
      // Fetch tags ONLY from the 'tag_name' column (Column E)
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: hotPotatoDBSpreadsheetId,
        range: `document_template!E2:E`, // Corrected to Column E
      });

      const tagColumnValues = response.result.values?.flat().filter(Boolean) || [];
      const uniqueTags = [...new Set(tagColumnValues as string[])];

      setTags(uniqueTags);

    } catch (error) {
      console.error('Error fetching tags from Google Sheet:', error);
      // Fallback to empty array in case of an error
      setTags([]);
    }
  };

  const addPost = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    if (!boardSpreadsheetId) {
      console.log('게시판 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
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
        'file_freeBoard': '', // File handling logic can be added here
      };

      await appendRow(boardSpreadsheetId, boardSheetName, newPostForSheet);
      await fetchPosts(); // Refetch posts after adding a new one
      console.log('게시글이 성공적으로 저장되었습니다.');
      handlePageChange('board');
    } catch (error) {
      console.error('Error saving post to Google Sheet:', error);
      console.log('게시글 저장 중 오류가 발생했습니다.');
    }
  };

  const addAnnouncement = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    if (!announcementSpreadsheetId) {
      console.log('공지사항 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
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
        'file_notice': '', // File handling logic can be added here
      };

      await appendRow(announcementSpreadsheetId, announcementSheetName, newPostForSheet);
      await fetchAnnouncements(); // Refetch announcements after adding a new one
      console.log('공지사항이 성공적으로 저장되었습니다.');
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error saving announcement to Google Sheet:', error);
      console.log('공지사항 저장 중 오류가 발생했습니다.');
    }
  };
// 로그인 상태 확인 (from feature/login)
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('googleAccessToken');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setGoogleAccessToken(savedToken);
        }
        setIsLoading(false);
    }, []);
    const fetchCalendarEvents = async () => {
        const spreadsheetIds = [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId].filter(Boolean) as string[];
        if (spreadsheetIds.length === 0) {
            setCalendarEvents([]);
            return;
        }

        setIsCalendarLoading(true);
        try {
            const allEventsPromises = spreadsheetIds.map(async (spreadsheetId) => {
                const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: `${calendarSheetName}!A:H`,
                });
                const data = response.result.values;

                if (data && data.length > 1) {
                    return data.slice(1).map((row: string[]) => {
                        const startDate = row[2] || '';
                        const endDate = row[3] || '';
                        const startDateTime = row[6] || '';

                        return {
                            id: `${spreadsheetId}-${row[0] || ''}`,
                            title: row[1] || '',
                            startDate: startDate,
                            endDate: endDate,
                            description: row[4] || '',
                            colorId: row[5] || '',
                            startDateTime: startDateTime,
                            endDateTime: row[7] || '',
                            type: row[8] || '',
                        };
                    });
                }
                return [];
            });

            const results = await Promise.all(allEventsPromises);
            const allEvents = results.flat().filter(Boolean);

            const uniqueEvents = allEvents.filter((event, index, self) =>
                index === self.findIndex((e) => e.id === event.id)
            );

            setCalendarEvents(uniqueEvents);
            console.log('Loaded calendar events:', uniqueEvents);
        } catch (error) {
            console.error('Error fetching calendar events from Google Sheet:', error);
            console.log('캘린더 일정을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsCalendarLoading(false);
        }
    };

    const addCalendarEvent = async (eventData: Omit<Event, 'id'>) => {
        const targetSpreadsheetId = calendarStudentSpreadsheetId || calendarProfessorSpreadsheetId;
        if (!targetSpreadsheetId) {
            console.log('캘린더 스프레드시트가 아직 로드되지 않았습니다.');
            return;
        }
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
            'colorId_calendar': eventData.colorId,
            'startDateTime_calendar': eventData.startDateTime,
            'endDateTime_calendar': eventData.endDateTime,
          };

          await appendRow(targetSpreadsheetId, calendarSheetName, newEventForSheet);
          await fetchCalendarEvents(); // Refetch calendar events after adding a new one
          console.log('일정이 성공적으로 추가되었습니다.');
        } catch (error) {
          console.error('Error saving calendar event to Google Sheet:', error);
          console.log('일정 저장 중 오류가 발생했습니다.');
        }
      };

      const updateCalendarEvent = async (eventId: string, eventData: Omit<Event, 'id'>) => {
        console.log("Updating event", eventId, eventData);
        console.log("일정 수정 기능은 아직 구현되지 않았습니다.");
      };

      const deleteCalendarEvent = async (eventId: string) => {
        console.log("Deleting event", eventId);
        console.log("일정 삭제 기능은 아직 구현되지 않았습니다.");
      };

      const saveAcademicScheduleToSheet = async () => {
        if (!calendarStudentSpreadsheetId) {
            alert("학생용 캘린더 시트를 찾을 수 없습니다. 먼저 구글 드라이브에서 'calendar_student' 시트가 있는지 확인해주세요.");
            return;
        }

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

        // 기말고사
        if (finalExamsPeriod.start && finalExamsPeriod.end) {
            eventsToSave.push({ title: '기말고사', startDate: formatDate(finalExamsPeriod.start), endDate: formatDate(finalExamsPeriod.end) });
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

            alert('학사일정이 성공적으로 저장되었습니다.');
            await fetchCalendarEvents(); // Refresh calendar
        } catch (error) {
            console.error('Error saving academic schedule to Google Sheet:', error);
            alert('학사일정 저장 중 오류가 발생했습니다.');
        }
    };

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('googleAccessToken');
    if (storedAccessToken) {
      setGoogleAccessToken(storedAccessToken);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    if (page) {
      setCurrentPage(page as PageType);
    }

    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    document.body.classList.add(`theme-${savedTheme}`);

    const initAndFetch = async () => {
      try {
        console.log("새로고침 후 Google API 초기화 시작");
          await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);

        const fileNames = [
            'notice_professor',
            'calendar_professor',
            'calendar_student',
            'board_professor',
            'hot_potato_DB',
            'student'
        ];

        const setters: { [key: string]: (id: string | null) => void } = {
            'notice_professor': setAnnouncementSpreadsheetId,
            'calendar_professor': setCalendarProfessorSpreadsheetId,
            'calendar_student': setCalendarStudentSpreadsheetId,
            'board_professor': setBoardSpreadsheetId,
            'hot_potato_DB': setHotPotatoDBSpreadsheetId,
            'student': setStudentSpreadsheetId
        };

        await Promise.all(fileNames.map(async (name) => {
            try {
                const response = await (window as any).gapi.client.drive.files.list({
                    q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
                    fields: 'files(id, name)'
                });
                if (response.result.files && response.result.files.length > 0) {
                    if (response.result.files[0].id) {
                        const fileId = response.result.files[0].id;
                        console.log(`Found '${name}' spreadsheet with ID:`, fileId);
                        setters[name](fileId);
                    } else {
                        console.error(`'${name}' spreadsheet found but has no ID.`);
                    }
                } else {
                    console.error(`Could not find spreadsheet with name '${name}'`);
                }
            } catch (error) {
                console.error(`Error searching for ${name} spreadsheet:`, error);
            }
        }));

        // gapi가 초기화된 후 데이터 로드
        const fetchInitialData = async (retryCount = 0) => {
          try {
            const gapi = (window as any).gapi;
            if (gapi && gapi.client && gapi.client.sheets && gapi.client.sheets.spreadsheets) {
              console.log("Google API 초기화 완료, 데이터 로드 시작");
              setIsGapiReady(true);

              // Set auth states to true since we know the user is signed in
              setIsGoogleAuthenticatedForAnnouncements(true);
              setIsGoogleAuthenticatedForBoard(true);

              console.log("모든 데이터 로드 완료");
            } else {
              console.log(`Google API가 아직 초기화되지 않았습니다. 재시도 ${retryCount + 1}/3`);
              if (retryCount < 3) {
                // 500ms 후 다시 시도 (더 빠르게)
                setTimeout(() => fetchInitialData(retryCount + 1), 500);
              } else {
                console.error("Google API 초기화 최대 재시도 횟수 초과");
              }
            }
          } catch (error) {
            console.error("Error during initial data fetch", error);
            if (retryCount < 2) {
              console.log(`데이터 로드 재시도 ${retryCount + 1}/2`);
              setTimeout(() => fetchInitialData(retryCount + 1), 1000);
            } else {
              console.error("데이터 로드 최대 재시도 횟수 초과");
            }
          }
        };

        fetchInitialData();
      } catch (error) {
        console.error("Error during initial gapi load", error);
        // gapi 초기화 실패 시 재시도 (더 빠르게)
        setTimeout(() => {
          console.log("gapi 초기화 재시도");
          initAndFetch();
        }, 1500);
      }
    }

    // 승인된 사용자만 Google Sheets 데이터 로드
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.isApproved) {
        initAndFetch();
      }
    }
  }, []);

  // 로그인 처리 (from feature/login)
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // accessToken을 localStorage에 저장하고 상태를 업데이트합니다.
    if (userData.accessToken) {
      localStorage.setItem('googleAccessToken', userData.accessToken);
      setGoogleAccessToken(userData.accessToken);
    }

    // 승인된 사용자만 Google Sheets 데이터 로드
    if (userData.isApproved) {
      const initAndFetch = async () => {
        try {
          console.log("로그인 후 Google API 초기화 시작");
          // 중앙화된 Google API 초기화 사용
          await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);

        const fileNames = [
            'notice_professor',
            'calendar_professor',
            'calendar_student',
            'board_professor',
            'hot_potato_DB',
            'student'
        ];

        const setters: { [key: string]: (id: string | null) => void } = {
            'notice_professor': setAnnouncementSpreadsheetId,
            'calendar_professor': setCalendarProfessorSpreadsheetId,
            'calendar_student': setCalendarStudentSpreadsheetId,
            'board_professor': setBoardSpreadsheetId,
            'hot_potato_DB': setHotPotatoDBSpreadsheetId,
            'student': setStudentSpreadsheetId
        };

        await Promise.all(fileNames.map(async (name) => {
            try {
                const response = await (window as any).gapi.client.drive.files.list({
                    q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
                    fields: 'files(id, name)'
                });
                if (response.result.files && response.result.files.length > 0) {
                    if (response.result.files[0].id) {
                        const fileId = response.result.files[0].id;
                        console.log(`Found '${name}' spreadsheet with ID:`, fileId);
                        setters[name](fileId);
                    } else {
                        console.error(`'${name}' spreadsheet found but has no ID.`);
                    }
                } else {
                    console.error(`Could not find spreadsheet with name '${name}'`);
                }
            } catch (error) {
                console.error(`Error searching for ${name} spreadsheet:`, error);
            }
        }));

        // gapi가 초기화된 후 데이터 로드
        const fetchInitialData = async (retryCount = 0) => {
          try {
            const gapi = (window as any).gapi;
            if (gapi && gapi.client && gapi.client.sheets && gapi.client.sheets.spreadsheets) {
              console.log("로그인 후 Google API 초기화 완료, 데이터 로드 시작");
              setIsGapiReady(true);

              setIsGoogleAuthenticatedForAnnouncements(true);
              setIsGoogleAuthenticatedForBoard(true);

              console.log("로그인 후 모든 데이터 로드 완료");
            } else {
              console.log(`로그인 후 Google API가 아직 초기화되지 않았습니다. 재시도 ${retryCount + 1}/3`);
              if (retryCount < 3) {
                // 500ms 후 다시 시도 (더 빠르게)
                setTimeout(() => fetchInitialData(retryCount + 1), 500);
              } else {
                console.error("로그인 후 Google API 초기화 최대 재시도 횟수 초과");
              }
            }
          } catch (error) {
            console.error("Error during login data fetch", error);
            if (retryCount < 2) {
              console.log(`로그인 후 데이터 로드 재시도 ${retryCount + 1}/2`);
              setTimeout(() => fetchInitialData(retryCount + 1), 1000);
            } else {
              console.error("로그인 후 데이터 로드 최대 재시도 횟수 초과");
            }
          }
        };

        // gapi 초기화 완료 후 데이터 로드
        fetchInitialData();
      } catch (error) {
        console.error("Error during login gapi load", error);
        // gapi 초기화 실패 시 재시도 (더 빠르게)
        setTimeout(() => {
          console.log("로그인 후 gapi 초기화 재시도");
          initAndFetch();
        }, 1500);
      }
    }
      initAndFetch();
    }
  };

  useEffect(() => {
    if (boardSpreadsheetId) {
      fetchPosts();
    }
  }, [boardSpreadsheetId]);

  useEffect(() => {
    if (announcementSpreadsheetId) {
      fetchAnnouncements();
    }
  }, [announcementSpreadsheetId]);

    useEffect(() => {
        const spreadsheetIds = [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId].filter(Boolean);
        if (spreadsheetIds.length > 0) {
            const fetchInitialCalendarData = async () => {
                try {
                    const gapi = (window as any).gapi;
                    if (gapi && gapi.client && gapi.client.sheets) {
                        await fetchCalendarEvents();
                    }
                } catch (error) {
                    console.error("Error during initial calendar data fetch", error);
                }
            };
            fetchInitialCalendarData();
        }
    }, [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId]);
  useEffect(() => {
    if (hotPotatoDBSpreadsheetId) {
      const fetchTemplateData = async () => {
        try {
          const gapi = (window as any).gapi;
          if (gapi && gapi.client && gapi.client.sheets) {
            const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: hotPotatoDBSpreadsheetId });
            const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
            if (docSheet && docSheet.properties) {
              setDocumentTemplateSheetId(docSheet.properties.sheetId);
            }
            await Promise.all([
              fetchTemplates(),
              fetchTags(),
            ]);
          }
        } catch (error) {
          console.error("Error during template data fetch", error);
        }
      };
      fetchTemplateData();
    }
  }, [hotPotatoDBSpreadsheetId]);

  // 로그아웃 처리 (from feature/login)
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken'); // 키 이름 수정
    // Google 로그아웃
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // 페이지 전환 처리
  const handlePageChange = (pageName: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('page', pageName);
    window.history.pushState({}, '', url.toString());
    setCurrentPage(pageName as PageType);
  };

  // 현재 페이지에 따른 컴포넌트 렌더링 (develop의 모든 페이지 유지)
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "board":
        return <Board
            onPageChange={handlePageChange}
            posts={posts}
            isAuthenticated={isGoogleAuthenticatedForBoard}
            boardSpreadsheetId={boardSpreadsheetId}
            isLoading={isBoardLoading}
            data-oid="d01oi2r" />;
      case "new-board-post":
        return <NewBoardPost onPageChange={handlePageChange} onAddPost={addPost} user={user} isAuthenticated={isGoogleAuthenticatedForBoard} />;
      case "announcements":
        return <AnnouncementsPage
            onPageChange={handlePageChange}
            posts={announcements}
            isAuthenticated={isGoogleAuthenticatedForAnnouncements}
            announcementSpreadsheetId={announcementSpreadsheetId}
            isLoading={isAnnouncementsLoading}
            data-oid="d01oi2r" />;
      case "new-announcement-post":
        return <NewAnnouncementPost onPageChange={handlePageChange} onAddPost={addAnnouncement} user={user} isAuthenticated={isGoogleAuthenticatedForAnnouncements} />;
      case "document_management":
        return (
            <DocumentManagement
                onPageChange={handlePageChange}
                customTemplates={customTemplates}
                data-oid="i8mtyop"
            />
        );
      case "docbox":
        return <Docbox data-oid="t94yibd" />;
      case "new_document":
        return (
            <NewDocument onPageChange={handlePageChange} customTemplates={customTemplates} deleteTemplate={deleteTemplate} tags={tags} addTag={addTag} deleteTag={deleteTag} updateTag={updateTag} addTemplate={addTemplate} updateTemplate={updateTemplate} updateTemplateFavorite={updateTemplateFavorite} data-oid="ou.h__l" />
        );
      case "calendar":
          return <MyCalendarPage
              accessToken={googleAccessToken}
              calendarEvents={calendarEvents}
              addCalendarEvent={addCalendarEvent}
              updateCalendarEvent={updateCalendarEvent}
              deleteCalendarEvent={deleteCalendarEvent}
              semesterStartDate={semesterStartDate}
              setSemesterStartDate={setSemesterStartDate}
              finalExamsPeriod={finalExamsPeriod}
              setFinalExamsPeriod={setFinalExamsPeriod}
              gradeEntryPeriod={gradeEntryPeriod}
              setGradeEntryPeriod={setGradeEntryPeriod}
              customPeriods={customPeriods}
              setCustomPeriods={setCustomPeriods}
              onSaveAcademicSchedule={saveAcademicScheduleToSheet}
              />;
      case "preferences":
        return (
            <Preferences onPageChange={handlePageChange} data-oid="1db782u" />
        );
      case "mypage":
        return <Mypage data-oid="d01oi2r" />;
      case "empty_document":
        return <EmptyDocument data-oid="n.rsz_n" />;
      case "proceedings":
        return <Proceedings />;
      case 'dashboard':
        return <Dashboard hotPotatoDBSpreadsheetId={hotPotatoDBSpreadsheetId} />;
      case 'admin':
        return <Admin />;
      case 'students':
        return <Students onPageChange={handlePageChange} studentSpreadsheetId={studentSpreadsheetId} />;
      case 'staff':
        return <div>교직원 관리 페이지 (구현 예정)</div>;
      case 'documents':
        return <div>문서 페이지 (구현 예정)</div>;
      case 'users':
        return <div>사용자 관리 페이지 (구현 예정)</div>;
      case 'settings':
        return <div>설정 페이지 (구현 예정)</div>;
      default:
        return <Dashboard hotPotatoDBSpreadsheetId={hotPotatoDBSpreadsheetId} />;
    }
  };

  // 로딩 중
  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  // 로그인하지 않은 사용자 (feature/login 방식)
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 승인되지 않은 사용자 (feature/login 방식) - Google API 초기화하지 않음
  if (!user.isApproved) {
    return <PendingApproval user={user} onLogout={handleLogout} />;
  }

  // 승인된 사용자 - develop의 레이아웃과 디자인 유지
  return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="app-container" data-oid="g1w-gjq">
          <Sidebar onPageChange={handlePageChange} user={user} currentPage={currentPage} data-oid="7q1u3ax" />
          <div className="main-panel" data-oid="n9gxxwr">
            <Header onPageChange={handlePageChange} userInfo={user} onLogout={handleLogout} />
            <div className="content" id="dynamicContent" data-oid="nn2e18p">
              {renderCurrentPage()}
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
  );
};

export default App;