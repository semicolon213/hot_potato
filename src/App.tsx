/**
 * @file App.tsx
 * @brief Hot Potato 메인 애플리케이션 컴포넌트
 * @details React 애플리케이션의 진입점으로, 인증 상태에 따라 다른 화면을 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useEffect, useMemo, useState } from "react";
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
  saveAcademicScheduleToSheet,
    fetchPosts,
    fetchAnnouncements,
    fetchTemplates,
    fetchCalendarEvents,
    updateCalendarEvent,
    incrementViewCount
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
import { tokenManager } from './utils/auth/tokenManager';
import { lastUserManager } from './utils/auth/lastUserManager';
import { useSession } from './hooks/features/auth/useSession';

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
    selectedAnnouncement,
    setSelectedAnnouncement,
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
    // console.log('로그인 처리 시작:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // 토큰은 useAuth에서 tokenManager를 통해 이미 저장됨
    // 여기서는 상태만 업데이트
    if (userData.accessToken) {
      const token = tokenManager.get();
      if (token) {
        setGoogleAccessToken(token);
      } else {
        // tokenManager에 토큰이 없으면 직접 설정 (하위 호환성)
        setGoogleAccessToken(userData.accessToken);
      }
    }
    // console.log('✅ 로그인 완료 - 데이터 로딩은 useAppState에서 자동 처리됩니다');
  };

  // 일반 로그아웃 처리 (기본 동작)
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
    setSearchTerm("");
    localStorage.removeItem('user');
    localStorage.removeItem('searchTerm');
    // tokenManager를 통한 토큰 삭제
    tokenManager.clear();
    setGoogleAccessToken(null);
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // 완전 로그아웃 처리 (현재 로그인한 계정만 제거)
  const handleFullLogout = () => {
    // 현재 로그인한 사용자의 이메일 가져오기
    const currentUserEmail = user?.email;
    
    setUser(null);
    setCurrentPage("dashboard");
    setSearchTerm("");
    // 모든 localStorage 항목 삭제
    localStorage.removeItem('user');
    localStorage.removeItem('searchTerm');
    // tokenManager를 통한 토큰 삭제
    tokenManager.clear();
    // 현재 로그인한 사용자 계정만 제거 (모든 계정 제거가 아님)
    if (currentUserEmail) {
      lastUserManager.remove(currentUserEmail);
    }
    setGoogleAccessToken(null);
    // Google 로그인 정보 완전 삭제
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
      // Google 계정 자동 선택 취소
      window.google.accounts.id.revoke((response: any) => {
        console.log('Google 계정 정보 삭제 완료');
      });
    }
  };

  // 세션 타임아웃 관리
  useSession(!!user, () => {
    handleLogout();
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  });

  // Electron 이벤트 처리 (자동 로그아웃)
  useEffect(() => {
    // Electron 환경에서만 실행
    if (window.electronAPI) {
      const handleAppBeforeQuit = () => {
        // console.log('앱 종료 감지 - 자동 로그아웃 실행');
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

  // 브라우저 종료 시 자동 로그아웃 (선택적)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 브라우저 종료 시 로그아웃
      // 주의: beforeunload는 신뢰할 수 없으므로 보조 수단으로만 사용
      // Electron 환경에서는 Electron 이벤트가 우선 처리됨
      if (!window.electronAPI) {
        handleLogout();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 페이지 전환 처리
  const handlePageChange = (pageName: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('page', pageName);
    window.history.pushState({}, '', url.toString());
    setCurrentPage(pageName as PageType);
  };

  // 현재 페이지에 해당하는 섹션 제목 계산
  const pageSectionLabel = useMemo(() => {
    const PAGE_SECTIONS: Record<string, string> = {
      // 문서 섹션
      document_management: '문서',
      docbox: '문서',
      new_document: '문서',
      // 일정 섹션
      calendar: '일정',
      timetable: '일정',
      // 학생 및 교직원 섹션
      students: '학생 및 교직원',
      staff: '학생 및 교직원',
      // 구글서비스 섹션
      google_appscript: '구글서비스',
      google_sheets: '구글서비스',
      google_docs: '구글서비스',
      google_gemini: '구글서비스',
      google_groups: '구글서비스',
      // 단일 페이지들
      dashboard: '대시보드',
      announcements: '공지사항',
      'announcement-view': '공지사항',
      board: '게시판',
      chat: '채팅',
      admin: '관리자 패널',
      mypage: '마이페이지',
    };
    return PAGE_SECTIONS[currentPage] || '';
  }, [currentPage]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSearchSubmit = () => {
    if (currentPage !== 'docbox') {
      handlePageChange('docbox');
    }
  };

  // 게시글 추가 핸들러
  const handleAddPost = async (postData: { title: string; content: string; author: string; writer_id: string; }) => {
    try {
      if (!boardSpreadsheetId) {
        throw new Error("Board spreadsheet ID not found");
      }
      await addPost(boardSpreadsheetId, postData);
      // 게시글 목록 새로고침
      const updatedPosts = await fetchPosts();
      setPosts(updatedPosts);
      handlePageChange('board');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // 공지사항 추가 핸들러
  const handleAddAnnouncement = async (postData: { title: string; content: string; author: string; writer_id: string; }) => {
    try {
      if (!announcementSpreadsheetId) {
        throw new Error("Announcement spreadsheet ID not found");
      }
      await addAnnouncement(announcementSpreadsheetId, postData);
      // 공지사항 목록 새로고침
      const updatedAnnouncements = await fetchAnnouncements();
      setAnnouncements(updatedAnnouncements);
      handlePageChange('announcements');
    } catch (error) {
      console.error('Error adding announcement:', error);
    }
  };

  const handleSelectAnnouncement = async (post: Post) => {
    // Optimistically update the UI
    const updatedAnnouncements = announcements.map(a =>
      a.id === post.id ? { ...a, views: a.views + 1 } : a
    );
    setAnnouncements(updatedAnnouncements);
    setSelectedAnnouncement({ ...post, views: post.views + 1 });

    handlePageChange('announcement-view');

    try {
      await incrementViewCount(post.id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      // Optionally, revert the optimistic update here
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
    // console.log("Deleting event", eventId);
    // console.log("일정 삭제 기능은 아직 구현되지 않았습니다.");
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
      // console.log('템플릿이 성공적으로 삭제되었습니다.');
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
          // console.log('새로운 태그가 추가되었습니다.');
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
      // console.log(`'${tagToDelete}' 태그 및 관련 템플릿이 삭제되었습니다.`);

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
      const { checkTagUpdateImpact, updatePersonalTemplateMetadata } = await import('./utils/database/personalTagManager');
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
      // console.log(`'${oldTag}' 태그가 '${newTag}'(으)로 수정되었습니다.`);

      // Background database update
      const [tagUpdateSuccess, fileUpdateSuccess] = await Promise.all([
        updatePersonalTag(oldTag, newTag),
        updatePersonalTemplateMetadata(oldTag, newTag)
      ]);
      
      if (tagUpdateSuccess && fileUpdateSuccess) {
        // 태그 목록을 다시 로드
        const updatedTags = await fetchPersonalTags();
        setTags(updatedTags);
        // console.log('✅ 태그 수정 및 파일명 업데이트 완료');
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
      // console.log('문서가 성공적으로 저장되었습니다.');
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

      // console.log('문서가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating document in database:', error);
      console.log('문서 수정 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTemplateFavorite = async (rowIndex: number, favoriteStatus: string | undefined) => {
    try {
      await updateTemplateFavorite(rowIndex, favoriteStatus);
      // console.log(`Template favorite status updated in database for row ${rowIndex}.`);
      // 템플릿 목록 새로고침
      const updatedTemplates = await fetchTemplates();
      setCustomTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error updating template favorite status in database:', error);
    }
  };

  // 로딩 중
  if (isLoading) {
      return (
        <div className="login-page-container">
          <div className="login-container">
            <div className="login-card">
              <div className="login-card-left">
                <div className="login-header-left">
                  <img src="/logo.svg" alt="Hot Potato Logo" className="login-logo" />
                  <h1 className="hp-erp-title">HP ERP</h1>
                </div>
              </div>
              <div className="login-card-right">
                <div className="loading-section">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">로딩 중...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
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
        <Sidebar onPageChange={handlePageChange} onLogout={handleLogout} onFullLogout={handleFullLogout} user={user} currentPage={currentPage} data-oid="7q1u3ax" />
        <div className="main-panel" data-oid="n9gxxwr">
          <Header
            onPageChange={handlePageChange}
            userInfo={user}
            onLogout={handleLogout}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            onSearchSubmit={handleSearchSubmit}
            pageSectionLabel={pageSectionLabel}
          />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            <PageRenderer
              currentPage={currentPage}
              user={user}
              posts={posts}
              announcements={announcements}
              selectedAnnouncement={selectedAnnouncement}
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
              onSelectAnnouncement={handleSelectAnnouncement}
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
