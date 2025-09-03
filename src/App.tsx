import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./index.css"; // Global styles and theme variables
import { GoogleOAuthProvider } from '@react-oauth/google';
import { appendRow } from 'papyrus-db'; // Google Sheets API 접근용
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';

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

import type { Template } from "./hooks/useTemplateUI";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Sheets API 접근을 위한 설정
const SHEET_ID = '1DJP6g5obxAkev0QpXyzit_t6qfuW4OCa63EEA4O-0no';

// 중앙화된 Google API 초기화 상태 관리
let isGoogleAPIInitialized = false;
let googleAPIInitPromise: Promise<void> | null = null;

// 직접 구현한 Google API 초기화 함수
const initializeGoogleAPIOnce = async (): Promise<void> => {
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
      
      // gapi 스크립트가 로드될 때까지 대기
      const waitForGapi = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5초 대기
          
          const checkGapi = () => {
            attempts++;
            
            if (typeof window !== 'undefined' && (window as any).gapi) {
              console.log("gapi 스크립트 로드 완료");
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error("gapi 스크립트 로드 타임아웃"));
            } else {
              setTimeout(checkGapi, 100);
            }
          };
          
          checkGapi();
        });
      };
      
      await waitForGapi();
      
      const gapi = (window as any).gapi;
      
      // 이미 초기화되어 있는지 확인
      if (gapi.client && gapi.client.getToken && gapi.client.getToken()) {
        console.log("Google API가 이미 초기화되어 있습니다.");
        isGoogleAPIInitialized = true;
        return;
      }
      
      console.log("Google API Client Library 초기화 중...");
      
      // Google API Client Library 초기화
      await new Promise<void>((resolve, reject) => {
        gapi.load('client:auth2', async () => {
          try {
            console.log("gapi.load 완료, client.init 시작...");
            
            await gapi.client.init({
              clientId: GOOGLE_CLIENT_ID,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
              scope: 'https://www.googleapis.com/auth/spreadsheets'
            });
            
            console.log("Google API Client Library 초기화 성공!");
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
interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessToken?: string; // accessToken을 포함하도록 수정
}

type PageType = 'dashboard' | 'admin' | 'board' | 'documents' | 'calendar' | 'users' | 'settings' | 'new-board-post' | 'announcements' | 'new-announcement-post' | 'document_management' | 'docbox' | 'new_document' | 'preferences' | 'mypage' | 'empty_document' | 'proceedings';

const App: React.FC = () => {
  // User authentication state (from feature/login)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Original app state (from develop)
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // State for Board
  const [posts, setPosts] = useState<Post[]>([]);
  const [isGoogleAuthenticatedForBoard, setIsGoogleAuthenticatedForBoard] = useState(false);

  // State for Announcements
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [isGoogleAuthenticatedForAnnouncements, setIsGoogleAuthenticatedForAnnouncements] = useState(false);
  const [documentTemplateSheetId, setDocumentTemplateSheetId] = useState<number | null>(null);

  // SHEET_ID는 상수로 정의됨
  const boardSheetName = 'free_board';
  const announcementSheetName = 'notice';

  const deleteTag = (tagToDelete: string) => {
    if (!window.confirm(`'${tagToDelete}' 태그를 정말로 삭제하시겠습니까? 이 태그를 사용하는 모든 템플릿도 함께 삭제됩니다.`)) {
      return;
    }

    // Optimistic UI update
    const oldTemplates = customTemplates;
    const oldTags = tags;

    setTags(tags.filter(tag => tag !== tagToDelete));
    setCustomTemplates(customTemplates.filter(t => t.tag !== tagToDelete));
    alert(`'${tagToDelete}' 태그 및 관련 템플릿이 삭제되었습니다.`);

    // Background sheet update
    const deleteFromSheet = async () => {
      if (documentTemplateSheetId === null) {
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
        alert('오류: 시트 정보가 로드되지 않았습니다. 태그 삭제에 실패했습니다.');
        return;
      }

      try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.get({
          spreadsheetId: sheetId,
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
            spreadsheetId: sheetId,
            resource: { requests },
          });
        }
      } catch (error) {
        console.error('Error deleting tag from Google Sheet (background):', error);
        alert('백그라운드 저장 실패: 태그 삭제가 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
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
    alert(`'${oldTag}' 태그가 '${newTag}'(으)로 수정되었습니다.`);

    // Background sheet update
    const updateSheet = async () => {
      if (documentTemplateSheetId === null) {
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
        alert('오류: 시트 정보가 로드되지 않았습니다. 태그 수정에 실패했습니다.');
        return;
      }

      try {
        const response = await (window as any).gapi.client.sheets.spreadsheets.get({
          spreadsheetId: sheetId,
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
            spreadsheetId: sheetId,
            resource: { requests },
          });
        }
      } catch (error) {
        console.error('Error updating tag in Google Sheet (background):', error);
        alert('백그라운드 저장 실패: 태그 수정이 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    };

    updateSheet();
  };

  const addTag = async (newTag: string) => {
    if (newTag && !tags.includes(newTag)) {
      try {
        const newRow = {
          'template_title': '',
          'tamplateparttitle': '', // Typo as per user's message
          'tag_name': newTag
        };
        await appendRow(SHEET_ID, 'document_template', newRow);
        setTags([...tags, newTag]);
        alert('새로운 태그가 추가되었습니다.');
      } catch (error) {
        console.error('Error saving tag to Google Sheet:', error);
        alert('태그 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const addTemplate = async (newDocData: { title: string; description: string; tag: string; }) => {
    try {
      const newRowData = [
        '', // A column - empty
        newDocData.title, // B column
        newDocData.description, // C column
        newDocData.tag, // D column
        '', // E column - empty
      ];

      await (window as any).gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'document_template!A1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [newRowData],
        },
      });

      console.log('Template saved to Google Sheets successfully');
      
      // Refresh templates from Google Sheets to get the latest data
      await fetchTemplates();

      alert('문서가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error saving document to Google Sheet:', error);
      alert('문서 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteTemplate = async (rowIndex: number) => {
    if (documentTemplateSheetId === null) {
      alert('시트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
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
      
      alert('템플릿이 성공적으로 삭제되었습니다.');

    } catch (error) {
      console.error('Error deleting template from Google Sheet:', error);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
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
      }
    } catch (error) {
      console.error('Error fetching posts from Google Sheet:', error);
      alert('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
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
      }
    } catch (error) {
      console.error('Error fetching announcements from Google Sheet:', error);
      alert('공지사항을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'document_template!B2:E', // Range covers B, C, D, E columns
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
    try {
      // Fetch tags ONLY from the 'tag_name' column (Column E)
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
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

  const handleBoardAuth = async () => {
    try {
      await initializeGoogleAPIOnce();
      setIsGoogleAuthenticatedForBoard(true);
      alert('Google 인증 성공!');
      
      // 인증 후 데이터 로드
      try {
        fetchPosts();
      } catch (error) {
        console.error("Error fetching posts after auth:", error);
        alert('인증은 성공했지만 데이터 로드에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('Google 인증 실패:', e);
      alert('Google 인증 실패: ' + e.message);
      setIsGoogleAuthenticatedForBoard(false);
    }
  };

  const handleAnnouncementsAuth = async () => {
    try {
      await initializeGoogleAPIOnce();
      setIsGoogleAuthenticatedForAnnouncements(true);
      alert('Google 인증 성공!');
      
      // 인증 후 데이터 로드
      try {
        fetchAnnouncements();
      } catch (error) {
        console.error("Error fetching announcements after auth:", error);
        alert('인증은 성공했지만 데이터 로드에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('Google 인증 실패:', e);
      alert('Google 인증 실패: ' + e.message);
      setIsGoogleAuthenticatedForAnnouncements(false);
    }
  };

  const addPost = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
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

      await appendRow(SHEET_ID, boardSheetName, newPostForSheet);
      await fetchPosts(); // Refetch posts after adding a new one
      alert('게시글이 성공적으로 저장되었습니다.');
      handlePageChange('board');
    } catch (error) {
      console.error('Error saving post to Google Sheet:', error);
      alert('게시글 저장 중 오류가 발생했습니다.');
    }
  };

  const addAnnouncement = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
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

      await appendRow(SHEET_ID, announcementSheetName, newPostForSheet);
      await fetchAnnouncements(); // Refetch announcements after adding a new one
      alert('공지사항이 성공적으로 저장되었습니다.');
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error saving announcement to Google Sheet:', error);
      alert('공지사항 저장 중 오류가 발생했습니다.');
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

    // Google Sheets 데이터는 로그인된 사용자만 가져오도록 수정
    const fetchInitialData = async () => {
      try {
        // Set auth states to true since we know the user is signed in
        setIsGoogleAuthenticatedForAnnouncements(true);
        setIsGoogleAuthenticatedForBoard(true);

        const gapi = (window as any).gapi;
        const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
        if (docSheet && docSheet.properties) {
          setDocumentTemplateSheetId(docSheet.properties.sheetId);
        }
        fetchTemplates();
        fetchTags();
        fetchAnnouncements();
        fetchPosts();
      } catch (error) {
        console.error("Error during initial data fetch", error);
      }
    };

    const initAndFetch = async () => {
      try {
        await initializeGoogleAPIOnce();
        
        // gapi가 초기화된 후 데이터 로드
        const fetchInitialData = async () => {
          try {
            const gapi = (window as any).gapi;
            if (gapi && gapi.client && gapi.client.sheets) {
              const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
              const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
              if (docSheet && docSheet.properties) {
                setDocumentTemplateSheetId(docSheet.properties.sheetId);
              }
              fetchTemplates();
              fetchTags();
              fetchAnnouncements();
              fetchPosts();
            } else {
              console.log("Google API가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
              // 2초 후 다시 시도
              setTimeout(fetchInitialData, 2000);
            }
          } catch (error) {
            console.error("Error during initial data fetch", error);
            // 오류 발생 시에도 기본 데이터는 로드 시도
            try {
              fetchTemplates();
              fetchTags();
              fetchAnnouncements();
              fetchPosts();
            } catch (fallbackError) {
              console.error("Fallback data fetch also failed", fallbackError);
            }
          }
        };
        
        fetchInitialData();
      } catch (error) {
        console.error("Error during initial gapi load", error);
        // gapi 초기화 실패 시에도 기본 데이터 로드 시도
        try {
          fetchTemplates();
          fetchTags();
          fetchAnnouncements();
          fetchPosts();
        } catch (fallbackError) {
          console.error("Fallback data fetch failed", fallbackError);
        }
      }
    }

    // 로그인된 사용자가 있을 때만 Google Sheets 데이터 로드
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      initAndFetch();
    }
  }, []);

  // 로그인 처리 (from feature/login)
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // 로그인 성공 후 Google Sheets 데이터 로드
    const initAndFetch = async () => {
      try {
        // 중앙화된 Google API 초기화 사용
        await initializeGoogleAPIOnce();
        
        // gapi가 초기화된 후 데이터 로드
        const fetchInitialData = async () => {
          try {
            setIsGoogleAuthenticatedForAnnouncements(true);
            setIsGoogleAuthenticatedForBoard(true);

            const gapi = (window as any).gapi;
            if (gapi && gapi.client && gapi.client.sheets) {
              const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
              const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
              if (docSheet && docSheet.properties) {
                setDocumentTemplateSheetId(docSheet.properties.sheetId);
              }
              fetchTemplates();
              fetchTags();
              fetchAnnouncements();
              fetchPosts();
            } else {
              console.log("Google API가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
              // 2초 후 다시 시도
              setTimeout(fetchInitialData, 2000);
            }
          } catch (error) {
            console.error("Error during initial data fetch", error);
            // 오류 발생 시에도 기본 데이터는 로드 시도
            try {
              fetchTemplates();
              fetchTags();
              fetchAnnouncements();
              fetchPosts();
            } catch (fallbackError) {
              console.error("Fallback data fetch also failed", fallbackError);
            }
          }
        };
        
        // gapi 초기화 완료 후 데이터 로드
        fetchInitialData();
      } catch (error) {
        console.error("Error during initial gapi load", error);
        // gapi 초기화 실패 시에도 기본 데이터 로드 시도
        try {
          fetchTemplates();
          fetchTags();
          fetchAnnouncements();
          fetchPosts();
        } catch (fallbackError) {
          console.error("Fallback data fetch failed", fallbackError);
        }
      }
    }
    initAndFetch();
  };

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
    setCurrentPage(pageName as PageType);
  };

  // 현재 페이지에 따른 컴포넌트 렌더링 (develop의 모든 페이지 유지)
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "board":
        return <Board
            onPageChange={handlePageChange}
            posts={posts}
            onAuth={handleBoardAuth}
            isAuthenticated={isGoogleAuthenticatedForBoard}
            data-oid="d01oi2r" />;
      case "new-board-post":
        return <NewBoardPost onPageChange={handlePageChange} onAddPost={addPost} />;
      case "announcements":
        return <AnnouncementsPage
            onPageChange={handlePageChange}
            posts={announcements}
            onAuth={handleAnnouncementsAuth}
            isAuthenticated={isGoogleAuthenticatedForAnnouncements}
            data-oid="d01oi2r" />;
      case "new-announcement-post":
        return <NewAnnouncementPost onPageChange={handlePageChange} onAddPost={addAnnouncement} />;
      case "document_management":
        return (
            <DocumentManagement
                onPageChange={handlePageChange}
                data-oid="i8mtyop"
            />
        );
      case "docbox":
        return <Docbox data-oid="t94yibd" />;
      case "new_document":
        return (
            <NewDocument onPageChange={handlePageChange} customTemplates={customTemplates} deleteTemplate={deleteTemplate} tags={tags} addTag={addTag} deleteTag={deleteTag} updateTag={updateTag} addTemplate={addTemplate} data-oid="ou.h__l" />
        );
      case "calendar":
        return <MyCalendarPage data-oid="uz.ewbm" accessToken={googleAccessToken} />;
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
        return <Dashboard />;
      case 'admin':
        return <AdminPanel />;
      case 'documents':
        return <div>문서 페이지 (구현 예정)</div>;
      case 'users':
        return <div>사용자 관리 페이지 (구현 예정)</div>;
      case 'settings':
        return <div>설정 페이지 (구현 예정)</div>;
      default:
        return <Dashboard />;
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

  // 승인되지 않은 사용자 (feature/login 방식)
  if (!user.isApproved) {
    return (
        <div className="pending-approval">
          <div className="pending-card">
            <h2>승인 대기 중</h2>
            <p>관리자 승인을 기다리고 있습니다.</p>
            <div className="user-info">
              <p><strong>이름:</strong> {user.name}</p>
              <p><strong>이메일:</strong> {user.email}</p>
              <p><strong>학번/교번:</strong> {user.studentId}</p>
              <p><strong>구분:</strong> {user.isAdmin ? '관리자 요청' : '일반 사용자'}</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          </div>
        </div>
    );
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
