import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./index.css"; // Global styles and theme variables
import { GoogleOAuthProvider } from '@react-oauth/google';
import { gapiInit, appendRow } from 'papyrus-db';

import Calendar from "./pages/Calendar";
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
import { initialTemplates } from "./hooks/useTemplateUI";
import type { Template } from "./hooks/useTemplateUI";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [tags, setTags] = useState<string[]>([]);

  const deleteTag = async (tagToDelete: string) => {
    if (documentTemplateSheetId === null) {
      alert('시트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!window.confirm(`'${tagToDelete}' 태그를 정말로 삭제하시겠습니까? 이 태그를 사용하는 모든 템플릿도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      // 1. Get all data from the sheet
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'document_template!A:E',
      });

      const rows = response.result.values;
      if (!rows) {
        alert('시트에서 데이터를 찾을 수 없습니다.');
        return;
      }

      // 2. Find rows to delete
      const requests = rows
        .map((row, index) => ({
          row, 
          rowIndex: index + 1, // 1-based index
        }))
        .filter(({ row }) => row[3] === tagToDelete || row[4] === tagToDelete)
        .map(({ rowIndex }) => ({
          deleteDimension: {
            range: {
              sheetId: documentTemplateSheetId, // This needs to be available
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        }));

      if (requests.length === 0) {
        // If no templates use the tag, it might be a tag-only row. Let's just remove from state.
        setTags(tags.filter(tag => tag !== tagToDelete));
        alert('태그가 삭제되었습니다. (사용하는 템플릿 없음)');
        return;
      }

      // 3. Execute batch update (requests should be in reverse order, but deleteDimension handles this)
      await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: { requests: requests.reverse() }, // Reverse to delete from bottom up
      });

      // 4. Update local state
      await fetchTemplates();
      await fetchTags();

      alert(`'${tagToDelete}' 태그 및 관련 템플릿이 삭제되었습니다.`);

    } catch (error) {
      console.error('Error deleting tag from Google Sheet:', error);
      alert('태그 삭제 중 오류가 발생했습니다.');
    }
  };

  const updateTag = async (oldTag: string, newTag: string) => {
    if (documentTemplateSheetId === null) {
      alert('시트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      // 1. Get all data from the sheet
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'document_template!A:E',
      });

      const rows = response.result.values;
      if (!rows) {
        alert('시트에서 데이터를 찾을 수 없습니다.');
        return;
      }

      // 2. Find all cells with the old tag and create update requests
      const requests = rows.flatMap((row, rowIndex) => {
        if (rowIndex === 0) return []; // Skip header row

        return row.map((cell, colIndex) => {
          if (cell === oldTag) {
            return {
              updateCells: {
                rows: [
                  {
                    values: [
                      {
                        userEnteredValue: { stringValue: newTag },
                      },
                    ],
                  },
                ],
                fields: 'userEnteredValue',
                start: {
                  sheetId: documentTemplateSheetId,
                  rowIndex: rowIndex,
                  columnIndex: colIndex,
                },
              },
            };
          }
          return null;
        }).filter(Boolean)
      });

      if (requests.length === 0) {
        alert('수정할 태그를 시트에서 찾지 못했습니다.');
        return;
      }

      // 3. Execute the batch update
      await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: { requests },
      });

      // 4. Refresh the UI
      await fetchTemplates();
      await fetchTags();

      alert(`'${oldTag}' 태그가 '${newTag}'(으)로 수정되었습니다.`);

    } catch (error) {
      console.error('Error updating tag in Google Sheet:', error);
      alert('태그 수정 중 오류가 발생했습니다.');
    }
  };

  const addTag = async (newTag: string) => {
    if (newTag && !tags.includes(newTag)) {
      try {
        await appendRow(sheetId, 'document_template', { 'tag_name': newTag });
        setTags([...tags, newTag]);
        alert('새로운 태그가 추가되었습니다.');
      } catch (error) {
        console.error('Error saving tag to Google Sheet:', error);
        alert('태그 저장 중 오류가 발생했습니다.');
      }
    }
  };

  // State for Board
  const [posts, setPosts] = useState<Post[]>([]);
  const [isGoogleAuthenticatedForBoard, setIsGoogleAuthenticatedForBoard] = useState(false);

  // State for Announcements
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [isGoogleAuthenticatedForAnnouncements, setIsGoogleAuthenticatedForAnnouncements] = useState(false);
  const [documentTemplateSheetId, setDocumentTemplateSheetId] = useState<number | null>(null);

  const sheetId = '1DJP6g5obxAkev0QpXyzit_t6qfuW4OCa63EEA4O-0no';
  const boardSheetName = 'free_board';
  const announcementSheetName = 'notice';

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
        spreadsheetId: sheetId,
        range: 'document_template!A1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [newRowData],
        },
      });

      // Local state update
      const newTemplate: Template = {
          // rowIndex is not available directly from append, refetching is an option
          // but for now, a local optimistic update is faster.
          rowIndex: templates.length + 1, // This is an approximation for the key
          type: newDocData.title, 
          title: newDocData.title,
          description: newDocData.description,
          tag: newDocData.tag,
      };
      setTemplates(prevTemplates => [...prevTemplates, newTemplate]);

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
        spreadsheetId: sheetId,
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

      setTemplates(prevTemplates => prevTemplates.filter(t => t.rowIndex !== rowIndex));
      alert('템플릿이 성공적으로 삭제되었습니다.');

    } catch (error) {
      console.error('Error deleting template from Google Sheet:', error);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
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
          spreadsheetId: sheetId,
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
          spreadsheetId: sheetId,
          range: 'document_template!B2:D',
      });

      const data = response.result.values;
      if (data && data.length > 0) {
        const parsedTemplates: Template[] = data.map((row: string[], i: number) => ({
          rowIndex: i + 2, // Row index in the sheet (since range starts from B2)
          title: row[0],
          description: row[1],
          tag: row[2],
          type: row[0],
        }));
        setTemplates([...initialTemplates, ...parsedTemplates]);
      } else {
        setTemplates(initialTemplates); // If no templates are on the sheet, just show the initial one
      }
    } catch (error) {
      console.error('Error fetching templates from Google Sheet:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const [tagsResponseD, tagsResponseE] = await Promise.all([
        (window as any).gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `document_template!D2:D`,
        }),
        (window as any).gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `document_template!E2:E`,
        }),
      ]);

      const tagsD = tagsResponseD.result.values?.flat() || [];
      const tagsE = tagsResponseE.result.values?.flat() || [];
      
      const uniqueTags = [...new Set(allTags)];

      setTags(uniqueTags);

    } catch (error) {
      console.error('Error fetching tags from Google Sheet:', error);
      // Fallback to empty array in case of an error
      setTags([]);
    }
  };

  const handleBoardAuth = async () => {
    try {
      await gapiInit(GOOGLE_CLIENT_ID);
      setIsGoogleAuthenticatedForBoard(true);
      alert('Google 인증 성공!');
      fetchPosts();
    } catch (e: any) {
      alert('Google 인증 실패: ' + e.message);
      setIsGoogleAuthenticatedForBoard(false);
    }
  };

  const handleAnnouncementsAuth = async () => {
    try {
      await gapiInit(GOOGLE_CLIENT_ID);
      setIsGoogleAuthenticatedForAnnouncements(true);
      alert('Google 인증 성공!');
      fetchAnnouncements();
    } catch (e: any) {
      alert('Google 인증 실패: ' + e.message);
      setIsGoogleAuthenticatedForAnnouncements(false);
    }
  };

  const addPost = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
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

      await appendRow(sheetId, boardSheetName, newPostForSheet);
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
        spreadsheetId: sheetId,
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

      await appendRow(sheetId, announcementSheetName, newPostForSheet);
      await fetchAnnouncements(); // Refetch announcements after adding a new one
      alert('공지사항이 성공적으로 저장되었습니다.');
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error saving announcement to Google Sheet:', error);
      alert('공지사항 저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('googleAccessToken');
    if (storedAccessToken) {
      setGoogleAccessToken(storedAccessToken);
    }
  }, []);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('googleAccessToken');
    if (storedAccessToken) {
      setGoogleAccessToken(storedAccessToken);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    if (page) {
      setCurrentPage(page);
    }

    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    document.body.classList.add(`theme-${savedTheme}`);

    const fetchInitialData = async () => {
      try {
        const gapi = (window as any).gapi;
        const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
        if (docSheet && docSheet.properties) {
          setDocumentTemplateSheetId(docSheet.properties.sheetId);
        }
        fetchTemplates();
        fetchTags();
      } catch (error) {
        console.error("Error during initial data fetch", error);
      }
    };

    const initAndFetch = async () => {
      try {
        await gapiInit(GOOGLE_CLIENT_ID);
        const authInstance = (window as any).gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
          fetchInitialData();
        }
      } catch (error) {
        console.error("Error during initial gapi load", error);
      }
    }
    initAndFetch();
  }, []);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('googleAccessToken');
    if (storedAccessToken) {
      setGoogleAccessToken(storedAccessToken);
    }
  }, []);

  const handleGoogleLoginSuccess = (profile: any, token: string) => {
    console.log("Google Login Success (App.tsx):", profile);
    setGoogleAccessToken(token);
    localStorage.setItem('googleAccessToken', token);
    fetchInitialData(); // Fetch all data on login
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    if (page) {
      setCurrentPage(page);
    }

    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    document.body.classList.add(`theme-${savedTheme}`);
  }, []);

  const handlePageChange = (pageName: string) => {
    setCurrentPage(pageName);
    history.pushState({ page: pageName }, pageName, `?page=${pageName}`);
  };

  const renderPageContent = () => {
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
      // other cases
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
          <NewDocument onPageChange={handlePageChange} templates={templates} deleteTemplate={deleteTemplate} tags={tags} addTag={addTag} deleteTag={deleteTag} updateTag={updateTag} data-oid="ou.h__l" />
        );

      case "calendar":
        return <Calendar data-oid="uz.ewbm" accessToken={googleAccessToken} />;
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
      case "dashboard":
      default:
        return <Dashboard data-oid="4au2z.y" />;
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container" data-oid="g1w-gjq">
        <Sidebar onPageChange={handlePageChange} data-oid="7q1u3ax" />
        <div className="main-panel" data-oid="n9gxxwr">
          <Header onPageChange={handlePageChange} addTemplate={addTemplate} tags={tags} />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;