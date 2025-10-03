/**
 * @file App.tsx
 * @brief Hot Potato 메인 애플리케이션 컴포넌트
 * @details React 애플리케이션의 진입점으로, 인증 상태에 따라 다른 화면을 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import PageRenderer from "./components/layout/PageRenderer";
import "./index.css"; // Global styles and theme variables
import "./components/features/auth/PendingApproval.css"; // 승인 대기 화면 스타일
import "./components/features/auth/Login.css"; // 인증 관련 스타일
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/features/auth/Login';
import PendingApproval from './components/features/auth/PendingApproval';
import { useAppState } from './hooks/core/useAppState';
import {
  addPost,
  addAnnouncement,
  addCalendarEvent,
  addTemplate,
  deleteTemplate,
  updateTemplate,
  updateTemplateFavorite,
  addTag,
  deleteTag,
  updateTag,
  saveAcademicScheduleToSheet,
    fetchPosts,
    fetchAnnouncements,
    fetchTemplates,
    fetchCalendarEvents,
    updateCalendarEvent
  } from './utils/google/spreadsheetManager';import type { Post, Event, DateRange, CustomPeriod } from './types/app';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * @brief 메인 애플리케이션 컴포넌트
 * @details 사용자 인증 상태에 따라 로그인, 승인 대기, 메인 애플리케이션 화면을 렌더링합니다.
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const App: React.FC = () => {
  const {
    // User state
    user,
    setUser,
    isLoading,

    // Page state
    currentPage,
    setCurrentPage,
    googleAccessToken,
    searchTerm,
    setSearchTerm,

    // Template state
    customTemplates,
    setCustomTemplates,
    isTemplatesLoading,
    tags,
    setTags,
    documentTemplateSheetId,

    // Board state
    posts,
    setPosts,
    isGoogleAuthenticatedForBoard,
    isBoardLoading,
    boardSpreadsheetId,

    // Announcements state
    announcements,
    setAnnouncements,
    isGoogleAuthenticatedForAnnouncements,
    isAnnouncementsLoading,
    announcementSpreadsheetId,

    // Calendar state
    calendarEvents,
    setCalendarEvents,
    semesterStartDate,
    setSemesterStartDate,
    finalExamsPeriod,
    setFinalExamsPeriod,
    midtermExamsPeriod,
    setMidtermExamsPeriod,
    gradeEntryPeriod,
    setGradeEntryPeriod,
    customPeriods,
    setCustomPeriods,
    calendarProfessorSpreadsheetId,
    calendarStudentSpreadsheetId,

    // Other spreadsheet IDs
    hotPotatoDBSpreadsheetId,
    studentSpreadsheetId,

    // Constants
    boardSheetName,
    announcementSheetName,
    calendarSheetName
  } = useAppState();

  // 로그인 처리
  const handleLogin = (userData: any) => {
    console.log('로그인 처리 시작:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.accessToken) {
      localStorage.setItem('googleAccessToken', userData.accessToken);
      setGoogleAccessToken(userData.accessToken);
    }
    console.log('✅ 로그인 완료 - 데이터 로딩은 useAppState에서 자동 처리됩니다');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken');
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // 페이지 전환 처리
  const handlePageChange = (pageName: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('page', pageName);
    window.history.pushState({}, '', url.toString());
    setCurrentPage(pageName as any);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSearchSubmit = () => {
    if (currentPage !== 'docbox') {
      handlePageChange('docbox');
    }
  };

  // 게시글 추가 핸들러
  const handleAddPost = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    if (!boardSpreadsheetId) {
      console.log('게시판 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
    try {
      await addPost(boardSpreadsheetId, boardSheetName, postData);
      // 게시글 목록 새로고침
      const updatedPosts = await fetchPosts(boardSpreadsheetId, boardSheetName);
      setPosts(updatedPosts);
      handlePageChange('board');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // 공지사항 추가 핸들러
  const handleAddAnnouncement = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    if (!announcementSpreadsheetId) {
      console.log('공지사항 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
    try {
      await addAnnouncement(announcementSpreadsheetId, announcementSheetName, postData);
      // 공지사항 목록 새로고침
      const updatedAnnouncements = await fetchAnnouncements(announcementSpreadsheetId, announcementSheetName);
      setAnnouncements(updatedAnnouncements);
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error adding announcement:', error);
    }
  };

  // 캘린더 이벤트 추가 핸들러
  const handleAddCalendarEvent = async (eventData: Omit<Event, 'id'>) => {
    const targetSpreadsheetId = calendarStudentSpreadsheetId || calendarProfessorSpreadsheetId;
    if (!targetSpreadsheetId) {
      console.log('캘린더 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
    try {
      await addCalendarEvent(targetSpreadsheetId, calendarSheetName, eventData);
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents(
        calendarProfessorSpreadsheetId,
        calendarStudentSpreadsheetId,
        calendarSheetName
      );
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error adding calendar event:', error);
    }
  };

  // 캘린더 이벤트 업데이트 핸들러
  const handleUpdateCalendarEvent = async (eventId: string, eventData: Omit<Event, 'id'>) => {
    const targetSpreadsheetId = calendarStudentSpreadsheetId || calendarProfessorSpreadsheetId;
    if (!targetSpreadsheetId) {
      console.log('캘린더 스프레드시트가 아직 로드되지 않았습니다.');
      return;
    }
    try {
      await updateCalendarEvent(targetSpreadsheetId, calendarSheetName, eventId, eventData);
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents(
        calendarProfessorSpreadsheetId,
        calendarStudentSpreadsheetId,
        calendarSheetName
      );
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error updating calendar event:', error);
    }
  };

  // 캘린더 이벤트 삭제 핸들러
  const handleDeleteCalendarEvent = async (eventId: string) => {
    console.log("Deleting event", eventId);
    console.log("일정 삭제 기능은 아직 구현되지 않았습니다.");
  };

  // 학사일정 저장 핸들러
  const handleSaveAcademicSchedule = async (scheduleData: {
    semesterStartDate: Date;
    finalExamsPeriod: DateRange;
    midtermExamsPeriod: DateRange;
    gradeEntryPeriod: DateRange;
    customPeriods: CustomPeriod[];
  }) => {
    if (!calendarStudentSpreadsheetId) {
      alert("학생용 캘린더 시트를 찾을 수 없습니다. 먼저 구글 드라이브에서 'calendar_student' 시트가 있는지 확인해주세요.");
      return;
    }

    try {
      await saveAcademicScheduleToSheet(calendarStudentSpreadsheetId, calendarSheetName, scheduleData);
      alert('학사일정이 성공적으로 저장되었습니다.');
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents(
        calendarProfessorSpreadsheetId,
        calendarStudentSpreadsheetId,
        calendarSheetName
      );
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving academic schedule:', error);
      alert('학사일정 저장 중 오류가 발생했습니다.');
    }
  };

  // 템플릿 관련 핸들러들
  const handleDeleteTemplate = async (rowIndex: number) => {
    if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    if (documentTemplateSheetId === null || !hotPotatoDBSpreadsheetId) {
      console.log('시트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      await deleteTemplate(hotPotatoDBSpreadsheetId, documentTemplateSheetId, rowIndex);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates(hotPotatoDBSpreadsheetId);
      setCustomTemplates(updatedTemplates);
      console.log('템플릿이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting template:', error);
      console.log('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddTag = async (newTag: string) => {
    if (newTag && !tags.includes(newTag) && hotPotatoDBSpreadsheetId) {
      try {
        await addTag(hotPotatoDBSpreadsheetId, newTag);
        setTags([...tags, newTag]);
        console.log('새로운 태그가 추가되었습니다.');
      } catch (error) {
        console.error('Error saving tag:', error);
        console.log('태그 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
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
        await deleteTag(hotPotatoDBSpreadsheetId, documentTemplateSheetId, tagToDelete);
      } catch (error) {
        console.error('Error deleting tag from Google Sheet (background):', error);
        console.log('백그라운드 저장 실패: 태그 삭제가 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    };

    deleteFromSheet();
  };

  const handleUpdateTag = (oldTag: string, newTag: string) => {
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
        await updateTag(hotPotatoDBSpreadsheetId, documentTemplateSheetId, oldTag, newTag);
      } catch (error) {
        console.error('Error updating tag in Google Sheet (background):', error);
        console.log('백그라운드 저장 실패: 태그 수정이 시트에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    };

    updateSheet();
  };

  const handleAddTemplate = async (newDocData: { title: string; description: string; tag: string; }) => {
    if (!hotPotatoDBSpreadsheetId) {
      console.log('오류: 템플릿 시트가 로드되지 않았습니다.');
      return;
    }
    try {
      await addTemplate(hotPotatoDBSpreadsheetId, newDocData);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates(hotPotatoDBSpreadsheetId);
      setCustomTemplates(updatedTemplates);
      console.log('문서가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error creating document or saving to sheet:', error);
      console.log('문서 생성 또는 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTemplate = async (rowIndex: number, newDocData: { title: string; description: string; tag: string; }, oldTitle: string) => {
    try {
      const originalTemplate = customTemplates.find(t => t.rowIndex === rowIndex);
      const documentId = originalTemplate ? originalTemplate.documentId : '';

      await updateTemplate(hotPotatoDBSpreadsheetId!, rowIndex, newDocData, documentId || '');

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

      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates(hotPotatoDBSpreadsheetId!);
      setCustomTemplates(updatedTemplates);

      console.log('문서가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating document in Google Sheet:', error);
      console.log('문서 수정 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTemplateFavorite = async (rowIndex: number, favoriteStatus: string | undefined) => {
    if (!hotPotatoDBSpreadsheetId) {
      console.error("Spreadsheet ID is not available.");
      return;
    }
    try {
      await updateTemplateFavorite(hotPotatoDBSpreadsheetId, rowIndex, favoriteStatus);
      console.log(`Template favorite status updated in Google Sheets for row ${rowIndex}.`);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates(hotPotatoDBSpreadsheetId);
      setCustomTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error updating template favorite status in Google Sheet:', error);
    }
  };

  // 로딩 중
  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  // 로그인하지 않은 사용자
  if (!user) {
    return (
      <div className="login-page-container">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // 승인되지 않은 사용자
  if (!user.isApproved) {
    return (
      <div className="login-page-container">
        <PendingApproval user={user} onLogout={handleLogout} />
      </div>
    );
  }

  // 승인된 사용자 - develop의 레이아웃과 디자인 유지
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container" data-oid="g1w-gjq">
        <Sidebar onPageChange={handlePageChange} user={user} currentPage={currentPage} data-oid="7q1u3ax" />
        <div className="main-panel" data-oid="n9gxxwr">
          <Header
            onPageChange={handlePageChange}
            userInfo={user}
            onLogout={handleLogout}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            onSearchSubmit={handleSearchSubmit}
          />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            <PageRenderer
              currentPage={currentPage}
              user={user}
              posts={posts}
              announcements={announcements}
              isGoogleAuthenticatedForBoard={isGoogleAuthenticatedForBoard}
              isGoogleAuthenticatedForAnnouncements={isGoogleAuthenticatedForAnnouncements}
              boardSpreadsheetId={boardSpreadsheetId}
              announcementSpreadsheetId={announcementSpreadsheetId}
              isBoardLoading={isBoardLoading}
              isAnnouncementsLoading={isAnnouncementsLoading}
              customTemplates={customTemplates}
              tags={tags}
              isTemplatesLoading={isTemplatesLoading}
              googleAccessToken={googleAccessToken}
              calendarEvents={calendarEvents}
              semesterStartDate={semesterStartDate}
              finalExamsPeriod={finalExamsPeriod}
              midtermExamsPeriod={midtermExamsPeriod}
              gradeEntryPeriod={gradeEntryPeriod}
              customPeriods={customPeriods}
              hotPotatoDBSpreadsheetId={hotPotatoDBSpreadsheetId}
              studentSpreadsheetId={studentSpreadsheetId}
              searchTerm={searchTerm}
              onPageChange={handlePageChange}
              onAddPost={handleAddPost}
              onAddAnnouncement={handleAddAnnouncement}
              onAddCalendarEvent={handleAddCalendarEvent}
              onUpdateCalendarEvent={handleUpdateCalendarEvent}
              onDeleteCalendarEvent={handleDeleteCalendarEvent}
              onSetSemesterStartDate={setSemesterStartDate}
              onSetFinalExamsPeriod={setFinalExamsPeriod}
              onSetMidtermExamsPeriod={setMidtermExamsPeriod}
              onSetGradeEntryPeriod={setGradeEntryPeriod}
              onSetCustomPeriods={setCustomPeriods}
              onSaveAcademicSchedule={handleSaveAcademicSchedule}
              onDeleteTemplate={handleDeleteTemplate}
              onAddTag={handleAddTag}
              onDeleteTag={handleDeleteTag}
              onUpdateTag={handleUpdateTag}
              onAddTemplate={handleAddTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onUpdateTemplateFavorite={handleUpdateTemplateFavorite}
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
