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
      const newTemplateForSheet = {
        'template_title': newDocData.title,
        'template_parttitle': newDocData.description,
        'tag': newDocData.tag,
      };

      await appendRow(sheetId, 'document_template', newTemplateForSheet);

      const newTemplate: Template = {
          type: newDocData.title, // Or a slugified version
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
      }
    } catch (error) {
      console.error('Error fetching templates from Google Sheet:', error);
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

    const initAndFetch = async () => {
      try {
        await gapiInit(GOOGLE_CLIENT_ID);
        const gapi = (window as any).gapi;
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
          const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sheetId });
          const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
          if (docSheet && docSheet.properties) {
            setDocumentTemplateSheetId(docSheet.properties.sheetId);
          }
          fetchTemplates();
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
    fetchTemplates(); // Fetch templates on login
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
          <NewDocument onPageChange={handlePageChange} templates={templates} deleteTemplate={deleteTemplate} data-oid="ou.h__l" />
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
          <Header onPageChange={handlePageChange} onGoogleLoginSuccess={handleGoogleLoginSuccess} addTemplate={addTemplate} />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;