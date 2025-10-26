/**
 * @file App.tsx
 * @brief Hot Potato 메인 애플리케이션 컴포넌트
 * @details React 애플리케이션의 진입점으로, 인증 상태에 따라 다른 화면을 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import PageRenderer from "./components/layout/PageRenderer";
import "./index.css"; // Global styles and theme variables
import "./components/features/auth/PendingApproval.css"; // 승인 대기 화면 스타일
import "./components/features/auth/Login.css"; // 인증 관련 스타일
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/features/auth/Login';
import PendingApproval from './components/features/auth/PendingApproval';
import Chat from './pages/Chat';
import { useAppState } from './hooks/core/useAppState';
import {
  addPost,
  addAnnouncement,
  addCalendarEvent,
  addTemplate,
  deleteTemplate,
  updateTemplate,
  updateTemplateFavorite,
  saveAcademicScheduleToSheet,
    fetchPosts,
    fetchAnnouncements,
    fetchTemplates,
    fetchCalendarEvents,
    updateCalendarEvent
  } from './utils/database/papyrusManager';
import { 
  addTag as addPersonalTag,
  deleteTag as deletePersonalTag,
  updateTag as updatePersonalTag,
  fetchTags as fetchPersonalTags,
  checkTagDeletionImpact
} from './utils/database/personalTagManager';
import type { Post, Event, DateRange, CustomPeriod, User, PageType } from './types/app';
import { ENV_CONFIG } from './config/environment';

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
    setGoogleAccessToken,
    searchTerm,
    setSearchTerm,

    // Template state
    customTemplates,
    setCustomTemplates,
    isTemplatesLoading,
    tags,
    setTags,

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

    // Other spreadsheet IDs
    hotPotatoDBSpreadsheetId,
    studentSpreadsheetId,
    calendarStudentSpreadsheetId,
    calendarProfessorSpreadsheetId,

    // Attendees
    students,
    staff
  } = useAppState();

  // 로그인 처리
  const handleLogin = (userData: User) => {
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
    setCurrentPage("dashboard");
    setSearchTerm("");
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('searchTerm');
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // Electron 이벤트 처리 (자동 로그아웃)
  useEffect(() => {
    // Electron 환경에서만 실행
    if (window.electronAPI) {
      const handleAppBeforeQuit = () => {
        console.log('앱 종료 감지 - 자동 로그아웃 실행');
        handleLogout();
      };

      // Electron 이벤트 리스너 등록
      window.electronAPI.onAppBeforeQuit(handleAppBeforeQuit);

      // 컴포넌트 언마운트 시 리스너 제거
      return () => {
        if (window.electronAPI && window.electronAPI.removeAppBeforeQuitListener) {
          window.electronAPI.removeAppBeforeQuitListener(handleAppBeforeQuit);
        }
      };
    }
  }, []);

  // 페이지 전환 처리
  const handlePageChange = (pageName: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('page', pageName);
    window.history.pushState({}, '', url.toString());
    setCurrentPage(pageName as PageType);
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
    try {
      await addPost(postData);
      // 게시글 목록 새로고침
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
      handlePageChange('board');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // 공지사항 추가 핸들러
  const handleAddAnnouncement = async (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => {
    try {
      await addAnnouncement(postData);
      // 공지사항 목록 새로고침
      const updatedAnnouncements = await fetchAnnouncements();
      setAnnouncements(updatedAnnouncements);
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error adding announcement:', error);
    }
  };

  // 캘린더 이벤트 추가 핸들러
  const handleAddCalendarEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      await addCalendarEvent(eventData);
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents();
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error adding calendar event:', error);
    }
  };

  // 캘린더 이벤트 업데이트 핸들러
  const handleUpdateCalendarEvent = async (eventId: string, eventData: Omit<Event, 'id'>) => {
    try {
      await updateCalendarEvent(eventId, eventData);
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents();
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
    const spreadsheetIds = [calendarStudentSpreadsheetId, calendarProfessorSpreadsheetId].filter(Boolean);

    if (spreadsheetIds.length === 0) {
      alert('캘린더가 설정되지 않아 저장할 수 없습니다.');
      console.error('Error saving academic schedule: No calendar spreadsheet IDs are set.');
      return;
    }
    try {
      for (const id of spreadsheetIds) {
        await saveAcademicScheduleToSheet(scheduleData, id as string);
      }
      alert('학사일정이 성공적으로 저장되었습니다.');
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents();
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

    try {
      await deleteTemplate(rowIndex);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates();
      setCustomTemplates(updatedTemplates);
      console.log('템플릿이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting template:', error);
      console.log('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddTag = async (newTag: string) => {
    if (newTag && !tags.includes(newTag)) {
      try {
        const success = await addPersonalTag(newTag);
        if (success) {
          // 태그 목록을 다시 로드
          const updatedTags = await fetchPersonalTags();
          setTags(updatedTags);
          console.log('새로운 태그가 추가되었습니다.');
        } else {
          console.log('태그 추가에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error saving tag:', error);
        console.log('태그 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    // Optimistic UI update를 위한 백업
    const oldTemplates = customTemplates;
    const oldTags = tags;

    try {
      // 태그 삭제 시 영향받는 개인 양식들 확인
      const impact = await checkTagDeletionImpact(tagToDelete);
      
      if (impact.affectedFiles.length > 0) {
        // 영향받는 파일들이 있는 경우 상세한 확인 메시지 표시
        const affectedFilesList = impact.affectedFiles.map(file => `• ${file}`).join('\n');
        const confirmMessage = `'${tagToDelete}' 태그를 삭제하면 다음 개인 양식들도 함께 삭제됩니다:\n\n${affectedFilesList}\n\n정말로 삭제하시겠습니까?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      } else {
        // 영향받는 파일이 없는 경우 간단한 확인
        if (!window.confirm(`'${tagToDelete}' 태그를 삭제하시겠습니까?`)) {
          return;
        }
      }

      setTags(tags.filter(tag => tag !== tagToDelete));
      setCustomTemplates(customTemplates.filter(t => t.tag !== tagToDelete));
      console.log(`'${tagToDelete}' 태그 및 관련 템플릿이 삭제되었습니다.`);

      // Background database update
      const success = await deletePersonalTag(tagToDelete);
      if (success) {
        // 태그 목록을 다시 로드
        const updatedTags = await fetchPersonalTags();
        setTags(updatedTags);
      } else {
        console.log('태그 삭제에 실패했습니다.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    } catch (error) {
      console.error('Error deleting tag from personal config:', error);
      console.log('백그라운드 저장 실패: 태그 삭제가 데이터베이스에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
      setCustomTemplates(oldTemplates);
      setTags(oldTags);
    }
  };

  const handleUpdateTag = async (oldTag: string, newTag: string) => {
    try {
      // 태그 수정 시 영향받는 개인 양식들 확인
      const { checkTagUpdateImpact, updatePersonalTemplateFileNames } = await import('./utils/database/personalTagManager');
      const impact = await checkTagUpdateImpact(oldTag, newTag);
      
      if (impact.affectedFiles.length > 0) {
        // 영향받는 파일들이 있는 경우 상세한 확인 메시지 표시
        const affectedFilesList = impact.affectedFiles.map(file => `• ${file}`).join('\n');
        const confirmMessage = `'${oldTag}' 태그를 '${newTag}'로 수정하면 다음 개인 양식들의 파일명도 함께 변경됩니다:\n\n${affectedFilesList}\n\n정말로 수정하시겠습니까?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      } else {
        // 영향받는 파일이 없는 경우 간단한 확인
        if (!window.confirm(`'${oldTag}' 태그를 '${newTag}'로 수정하시겠습니까?`)) {
          return;
        }
      }

      // Optimistic UI update
      const oldTemplates = customTemplates;
      const oldTags = tags;

      setTags(tags.map(t => t === oldTag ? newTag : t));
      setCustomTemplates(customTemplates.map(t => t.tag === oldTag ? { ...t, tag: newTag } : t));
      console.log(`'${oldTag}' 태그가 '${newTag}'(으)로 수정되었습니다.`);

      // Background database update
      const [tagUpdateSuccess, fileUpdateSuccess] = await Promise.all([
        updatePersonalTag(oldTag, newTag),
        updatePersonalTemplateFileNames(oldTag, newTag)
      ]);
      
      if (tagUpdateSuccess && fileUpdateSuccess) {
        // 태그 목록을 다시 로드
        const updatedTags = await fetchPersonalTags();
        setTags(updatedTags);
        console.log('✅ 태그 수정 및 파일명 업데이트 완료');
      } else {
        console.log('태그 수정 또는 파일명 업데이트에 실패했습니다.');
        setCustomTemplates(oldTemplates);
        setTags(oldTags);
      }
    } catch (error) {
      console.error('Error updating tag in personal config:', error);
      console.log('백그라운드 저장 실패: 태그 수정이 데이터베이스에 반영되지 않았을 수 있습니다. 페이지를 새로고침 해주세요.');
    }
  };

  const handleAddTemplate = async (newDocData: { title: string; description: string; tag: string; }) => {
    try {
      await addTemplate(newDocData);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates();
      setCustomTemplates(updatedTemplates);
      console.log('문서가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error creating document or saving to database:', error);
      console.log('문서 생성 또는 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTemplate = async (rowIndex: number, newDocData: { title: string; description: string; tag: string; }, oldTitle: string) => {
    try {
      const originalTemplate = customTemplates.find(t => t.rowIndex === rowIndex);
      const documentId = originalTemplate ? originalTemplate.documentId : '';

      await updateTemplate(rowIndex, newDocData, documentId || '');

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
      const updatedTemplates = await fetchTemplates();
      setCustomTemplates(updatedTemplates);

      console.log('문서가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating document in database:', error);
      console.log('문서 수정 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTemplateFavorite = async (rowIndex: number, favoriteStatus: string | undefined) => {
    try {
      await updateTemplateFavorite(rowIndex, favoriteStatus);
      console.log(`Template favorite status updated in database for row ${rowIndex}.`);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates();
      setCustomTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error updating template favorite status in database:', error);
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
    <GoogleOAuthProvider clientId={ENV_CONFIG.GOOGLE_CLIENT_ID}>
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
              students={students}
              staff={staff}
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
          <Chat />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
