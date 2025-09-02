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
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<string[]>([]);

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
        // Explicitly set other columns to empty strings to avoid 'FALSE'
        const newRow = {
          'template_title': '',
          'tamplateparttitle': '', // Typo as per user's message
          'tag_name': newTag
        };
        await appendRow(sheetId, 'document_template', newRow);
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
          rowIndex: customTemplates.length + 1, // This is an approximation for the key
          type: newDocData.title, 
          title: newDocData.title,
          description: newDocData.description,
          tag: newDocData.tag,
      };
      setCustomTemplates(prevTemplates => [...prevTemplates, newTemplate]);

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

      setCustomTemplates(prevTemplates => prevTemplates.filter(t => t.rowIndex !== rowIndex));
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
          range: 'document_template!B2:E', // Range is OK, covers B, C, D, E
      });

      const data = response.result.values;
      if (data && data.length > 0) {
        const allTemplates: Template[] = data.map((row: string[], i: number) => ({
          rowIndex: i + 2,
          title: row[0] || '',       // Column B -> title
          description: '',           // No source for description, set to empty
          parttitle: row[1] || '',   // Column C -> parttitle
          tag: row[2] || '',         // Column D -> tag
          type: row[0] || '',
        }));

        const filteredTemplates = allTemplates.filter(template => {
          // Filter based on title (B), parttitle (C), and tag (D)
          return template.title && template.parttitle && template.tag;
        });

        setCustomTemplates(filteredTemplates);
      } else {
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
          spreadsheetId: sheetId,
          range: `document_template!E2:E`, // Corrected to Column E
      });

      const tagColumnValues = response.result.values?.flat().filter(Boolean) || [];
      const uniqueTags = [...new Set(tagColumnValues)];

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
        // Set auth states to true since we know the user is signed in
        setIsGoogleAuthenticatedForAnnouncements(true);
        setIsGoogleAuthenticatedForBoard(true); // Also do this for the board for consistency

        const gapi = (window as any).gapi;
        const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
        if (docSheet && docSheet.properties) {
          setDocumentTemplateSheetId(docSheet.properties.sheetId);
        }
        fetchTemplates();
        fetchTags();
        fetchAnnouncements(); // Fetch announcements
        fetchPosts(); // Fetch board posts
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
          <NewDocument onPageChange={handlePageChange} customTemplates={customTemplates} deleteTemplate={deleteTemplate} tags={tags} addTag={addTag} deleteTag={deleteTag} updateTag={updateTag} addTemplate={addTemplate} data-oid="ou.h__l" />
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
          <Header onPageChange={handlePageChange} />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;