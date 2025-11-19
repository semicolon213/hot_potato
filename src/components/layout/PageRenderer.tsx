// 페이지 렌더링 로직을 분리한 컴포넌트

/**
 * @file PageRenderer.tsx
 * @brief 페이지 렌더링 컴포넌트
 * @details 현재 페이지 상태에 따라 적절한 페이지 컴포넌트를 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React from 'react';
import type { PageType, User, Post, Event, DateRange, CustomPeriod, Student, Staff as StaffType } from '../../types/app';
import type { Template } from '../../hooks/features/templates/useTemplateUI';
import Admin from '../../pages/Admin';
import Students from '../../pages/Students';
import Staff from '../../pages/Staff';
import MyCalendarPage from '../../pages/Calendar';
import Dashboard from '../../pages/Dashboard';
import DocumentManagement from '../../pages/DocumentManagement';
import EmptyDocument from '../../pages/EmptyDocument';
import Mypage from '../../pages/Mypage';
import NewDocument from '../../pages/NewDocument';
import Board from '../../pages/Board/Board';
import NewBoardPost from '../../pages/Board/NewBoardPost';
import AnnouncementsPage from '../../pages/Announcements/Announcements';
import AnnouncementView from '../../pages/Announcements/AnnouncementView';
import NewAnnouncementPost from '../../pages/Announcements/NewAnnouncementPost';
import Accounting from '../../pages/Accounting';
import Proceedings from '../../pages/Proceedings';
import GoogleServicePage from '../../pages/GoogleService';
import WorkflowManagement from '../../pages/WorkflowManagement';
import Timetable from '../../pages/Timetable';

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
  students: Student[];
  staff: StaffType[];
  searchTerm: string;
  onPageChange: (pageName: string) => void;
  onAddAnnouncement: (postData: { title:string; content: string; author: string; writer_id: string; attachments: File[]; }) => Promise<void>;
  onSelectAnnouncement: (post: Post) => void;
  onUpdateAnnouncement: (announcementId: string, postData: { title: string; content: string; attachments: File[]; existingAttachments: { name: string, url: string }[] }) => Promise<void>;
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
  onUnpinAnnouncement?: (announcementId: string) => Promise<void>;
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
  // DataSyncService 관련 props
  lastSyncTime?: Date | null;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
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
  students,
  staff,
  searchTerm,
  onPageChange,
  onAddAnnouncement,
  onSelectAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUnpinAnnouncement,
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
  onUpdateTemplateFavorite,
  lastSyncTime,
  onRefresh,
  isRefreshing
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
          onAddPost={(postData: { title: string; content: string; author: string; writer_id: string; }) => Promise.resolve()}
          user={user}
          isAuthenticated={isGoogleAuthenticatedForBoard} />;
      case "announcements":
        return <AnnouncementsPage
          onUnpinAnnouncement={onUnpinAnnouncement}
          onPageChange={onPageChange}
          onSelectAnnouncement={onSelectAnnouncement}
          posts={announcements}
          isAuthenticated={isGoogleAuthenticatedForAnnouncements}
          announcementSpreadsheetId={announcementSpreadsheetId}
          isLoading={isAnnouncementsLoading}
          user={user}
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
            onRefresh={async () => {
              if (user?.studentId && user?.userType) {
                try {
                  const { fetchAnnouncements } = await import('../../utils/database/papyrusManager');
                  const updated = await fetchAnnouncements(user.studentId, user.userType);
                  // 선택된 공지사항도 업데이트
                  const updatedPost = updated.find(a => a.id === selectedAnnouncement?.id);
                  if (updatedPost) {
                    onSelectAnnouncement(updatedPost);
                  }
                } catch (error) {
                  console.error('공지사항 새로고침 오류:', error);
                }
              }
            }}
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
        return (
          <DocumentManagement
            onPageChange={onPageChange}
            customTemplates={customTemplates}
            searchTerm={searchTerm}
          />
        );
      case "new_document":
        return (
          <NewDocument
            onPageChange={onPageChange}
            tags={tags}
            addTag={onAddTag}
            deleteTag={onDeleteTag}
            updateTag={onUpdateTag}
            isTemplatesLoading={isTemplatesLoading}
            data-oid="ou.h__l" />
        );
      case "workflow_management":
        return <WorkflowManagement onPageChange={onPageChange} />;
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
      case "timetable":
        return <Timetable />;
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
        return <Dashboard 
          hotPotatoDBSpreadsheetId={hotPotatoDBSpreadsheetId}
          user={user}
        />;
      case 'accounting':
        return <Accounting />;
      case 'admin':
        return <Admin />;
      case 'students':
        return <Students
          onPageChange={onPageChange}
          studentSpreadsheetId={studentSpreadsheetId}
          initialTab="list" />;
      case 'students_council':
        return <Students
          onPageChange={onPageChange}
          studentSpreadsheetId={studentSpreadsheetId}
          initialTab="council" />;
      case 'staff':
        return <Staff
          onPageChange={onPageChange}
          staffSpreadsheetId={hotPotatoDBSpreadsheetId}
          initialTab="staff" />;
      case 'staff_committee':
        return <Staff
          onPageChange={onPageChange}
          staffSpreadsheetId={hotPotatoDBSpreadsheetId}
          initialTab="committee" />;
      case 'documents':
        return <div>문서 페이지 (구현 예정)</div>;
      case 'users':
        return <div>사용자 관리 페이지 (구현 예정)</div>;
      case 'settings':
        return <div>설정 페이지 (구현 예정)</div>;
      case 'google_appscript':
        return <div className="google-service-wrapper"><GoogleServicePage service="appscript" /></div>;
      case 'google_sheets':
        return <div className="google-service-wrapper"><GoogleServicePage service="sheets" /></div>;
      case 'google_docs':
        return <div className="google-service-wrapper"><GoogleServicePage service="docs" /></div>;
      case 'google_gemini':
        return <div className="google-service-wrapper"><GoogleServicePage service="gemini" /></div>;
      case 'google_groups':
        return <div className="google-service-wrapper"><GoogleServicePage service="groups" /></div>;
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
