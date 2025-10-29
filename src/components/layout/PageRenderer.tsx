// 페이지 렌더링 로직을 분리한 컴포넌트

/**
 * @file PageRenderer.tsx
 * @brief 페이지 렌더링 컴포넌트
 * @details 현재 페이지 상태에 따라 적절한 페이지 컴포넌트를 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import type { PageType, User, Post, Event, DateRange, CustomPeriod, Student, Staff } from '../../types/app';
import type { Template } from '../../hooks/features/templates/useTemplateUI';
import Admin from '../../pages/Admin';
import Students from '../../pages/Students';
import Staff from '../../pages/Staff';
import MyCalendarPage from '../../pages/Calendar';
import Dashboard from '../../pages/Dashboard';
import Docbox from '../../pages/Docbox';
import DocumentManagement from '../../pages/DocumentManagement';
import EmptyDocument from '../../pages/EmptyDocument';
import Mypage from '../../pages/Mypage';
import NewDocument from '../../pages/NewDocument';
import Board from '../../pages/Board/Board';
import NewBoardPost from '../../pages/Board/NewBoardPost';
import AnnouncementsPage from '../../pages/Announcements/Announcements';
import AnnouncementView from '../../pages/Announcements/AnnouncementView';
import NewAnnouncementPost from '../../pages/Announcements/NewAnnouncementPost';
import Proceedings from '../../pages/Proceedings';
import GoogleServicePage from '../../pages/GoogleService';

interface PageRendererProps {
  currentPage: PageType;
  user: User | null;
  posts: Post[];
  announcements: Post[];
  selectedAnnouncement: Post | null;
  isGoogleAuthenticatedForBoard: boolean;
  isGoogleAuthenticatedForAnnouncements: boolean;
  boardSpreadsheetId: string | null;
  announcementSpreadsheetId: string | null;
  isBoardLoading: boolean;
  isAnnouncementsLoading: boolean;
  customTemplates: Template[];
  tags: string[];
  isTemplatesLoading: boolean;
  googleAccessToken: string | null;
  calendarEvents: Event[];
  semesterStartDate: Date;
  finalExamsPeriod: DateRange;
  midtermExamsPeriod: DateRange;
  gradeEntryPeriod: DateRange;
  customPeriods: CustomPeriod[];
  hotPotatoDBSpreadsheetId: string | null;
  studentSpreadsheetId: string | null;
  staffSpreadsheetId: string | null;
  students: Student[];
  staff: Staff[];
  searchTerm: string;
  onPageChange: (pageName: string) => void;
  onAddPost: (postData: { title: string; content: string; author: string; writer_id: string; }) => Promise<void>;
  onAddAnnouncement: (postData: { title:string; content: string; author: string; writer_id: string; attachment: File | null; }) => Promise<void>;
  onSelectAnnouncement: (post: Post) => void;
  onUpdateAnnouncement: (announcementId: string, postData: { title: string; content: string; attachment?: File | null; }) => Promise<void>;
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
  onAddCalendarEvent: (eventData: Omit<Event, 'id'>) => Promise<void>;
  onUpdateCalendarEvent: (eventId: string, eventData: Omit<Event, 'id'>) => Promise<void>;
  onDeleteCalendarEvent: (eventId: string) => Promise<void>;
  onSetSemesterStartDate: (date: Date) => void;
  onSetFinalExamsPeriod: (period: DateRange) => void;
  onSetMidtermExamsPeriod: (period: DateRange) => void;
  onSetGradeEntryPeriod: (period: DateRange) => void;
  onSetCustomPeriods: (periods: CustomPeriod[]) => void;
  onSaveAcademicSchedule: (scheduleData: {
    semesterStartDate: Date;
    finalExamsPeriod: DateRange;
    midtermExamsPeriod: DateRange;
    gradeEntryPeriod: DateRange;
    customPeriods: CustomPeriod[];
  }) => Promise<void>;
  onDeleteTemplate: (rowIndex: number) => Promise<void>;
  onAddTag: (newTag: string) => Promise<void>;
  onDeleteTag: (tagToDelete: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => void;
  onAddTemplate: (newDocData: { title: string; description: string; tag: string; }) => Promise<void>;
  onUpdateTemplate: (rowIndex: number, newDocData: { title: string; description: string; tag: string; }, oldTitle: string) => Promise<void>;
  onUpdateTemplateFavorite: (rowIndex: number, favoriteStatus: string | undefined) => Promise<void>;
}

const PageRenderer: React.FC<PageRendererProps> = ({
  currentPage,
  user,
  posts,
  announcements,
  selectedAnnouncement,
  isGoogleAuthenticatedForBoard,
  isGoogleAuthenticatedForAnnouncements,
  boardSpreadsheetId,
  announcementSpreadsheetId,
  isBoardLoading,
  isAnnouncementsLoading,
  customTemplates,
  tags,
  isTemplatesLoading,
  googleAccessToken,
  calendarEvents,
  semesterStartDate,
  finalExamsPeriod,
  midtermExamsPeriod,
  gradeEntryPeriod,
  customPeriods,
  hotPotatoDBSpreadsheetId,
  studentSpreadsheetId,
  staffSpreadsheetId,
  students,
  staff,
  searchTerm,
  onPageChange,
  onAddPost,
  onAddAnnouncement,
  onSelectAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onAddCalendarEvent,
  onUpdateCalendarEvent,
  onDeleteCalendarEvent,
  onSetSemesterStartDate,
  onSetFinalExamsPeriod,
  onSetMidtermExamsPeriod,
  onSetGradeEntryPeriod,
  onSetCustomPeriods,
  onSaveAcademicSchedule,
  onDeleteTemplate,
  onAddTag,
  onDeleteTag,
  onUpdateTag,
  onAddTemplate,
  onUpdateTemplate,
  onUpdateTemplateFavorite
}) => {
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "board":
        return <Board
          onPageChange={onPageChange}
          posts={posts}
          isAuthenticated={isGoogleAuthenticatedForBoard}
          boardSpreadsheetId={boardSpreadsheetId}
          isLoading={isBoardLoading}
          data-oid="d01oi2r" />;
      case "new-board-post":
        return <NewBoardPost 
          onPageChange={onPageChange} 
          onAddPost={onAddPost} 
          user={user} 
          isAuthenticated={isGoogleAuthenticatedForBoard} />;
      case "announcements":
        return <AnnouncementsPage
          onPageChange={onPageChange}
          onSelectAnnouncement={onSelectAnnouncement}
          posts={announcements}
          isAuthenticated={isGoogleAuthenticatedForAnnouncements}
          user={user}
          announcementSpreadsheetId={announcementSpreadsheetId}
          isLoading={isAnnouncementsLoading}
          data-oid="d01oi2r" />;
      case "new-announcement-post":
        return <NewAnnouncementPost 
          onPageChange={onPageChange} 
          onAddPost={onAddAnnouncement} 
          user={user} 
          isAuthenticated={isGoogleAuthenticatedForAnnouncements} />;
      case "announcement-view":
        return selectedAnnouncement ? (
          <AnnouncementView
            post={selectedAnnouncement}
            user={user}
            onBack={() => onPageChange('announcements')}
            onUpdate={onUpdateAnnouncement}
            onDelete={onDeleteAnnouncement}
          />
        ) : (
          // A fallback in case the page is accessed directly without a selected announcement
          <div>공지사항을 선택해주세요.</div>
        );
      case "document_management":
        return (
          <DocumentManagement
            onPageChange={onPageChange}
            customTemplates={customTemplates}
            data-oid="i8mtyop"
          />
        );
      case "docbox":
        return <Docbox data-oid="t94yibd" searchTerm={searchTerm} />;
      case "new_document":
        return (
          <NewDocument 
            onPageChange={onPageChange} 
            customTemplates={customTemplates} 
            deleteTemplate={onDeleteTemplate} 
            tags={tags} 
            addTag={onAddTag} 
            deleteTag={onDeleteTag} 
            updateTag={onUpdateTag} 
            addTemplate={onAddTemplate} 
            updateTemplate={onUpdateTemplate} 
            updateTemplateFavorite={onUpdateTemplateFavorite} 
            isTemplatesLoading={isTemplatesLoading} 
            data-oid="ou.h__l" />
        );
      case "calendar":
        return <MyCalendarPage
          data-oid="uz.ewbm"
          user={user}
          accessToken={googleAccessToken}
          calendarEvents={calendarEvents}
          addCalendarEvent={onAddCalendarEvent}
          updateCalendarEvent={onUpdateCalendarEvent}
          deleteCalendarEvent={onDeleteCalendarEvent}
          semesterStartDate={semesterStartDate}
          setSemesterStartDate={onSetSemesterStartDate}
          finalExamsPeriod={finalExamsPeriod}
          setFinalExamsPeriod={onSetFinalExamsPeriod}
          midtermExamsPeriod={midtermExamsPeriod}
          setMidtermExamsPeriod={onSetMidtermExamsPeriod}
          gradeEntryPeriod={gradeEntryPeriod}
          setGradeEntryPeriod={onSetGradeEntryPeriod}
          customPeriods={customPeriods}
          setCustomPeriods={onSetCustomPeriods}
          onSaveAcademicSchedule={onSaveAcademicSchedule}
          students={students}
          staff={staff}
        />;
      case "preferences":
        return (
          <div>환경설정 페이지 (구현 예정)</div>
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
        return <Students 
          onPageChange={onPageChange} 
          studentSpreadsheetId={studentSpreadsheetId} />;
      case 'staff':
        return <Staff 
          onPageChange={onPageChange} 
          staffSpreadsheetId={staffSpreadsheetId} />;
      case 'documents':
        return <div>문서 페이지 (구현 예정)</div>;
      case 'users':
        return <div>사용자 관리 페이지 (구현 예정)</div>;
      case 'settings':
        return <div>설정 페이지 (구현 예정)</div>;
      case 'google_appscript':
        return <GoogleServicePage service="appscript" />;
      case 'google_sheets':
        return <GoogleServicePage service="sheets" />;
      case 'google_docs':
        return <GoogleServicePage service="docs" />;
      case 'google_gemini':
        return <GoogleServicePage service="gemini" />;
      case 'google_groups':
        return <GoogleServicePage service="groups" />;
      case 'google_calendar':
        return <div>해당 서비스는 더 이상 지원되지 않습니다.</div>;
      case 'google_chat':
        return <div>해당 서비스는 더 이상 지원되지 않습니다.</div>;
      default:
        return <Dashboard hotPotatoDBSpreadsheetId={hotPotatoDBSpreadsheetId} />;
    }
  };

  return renderCurrentPage();
};

export default PageRenderer;
