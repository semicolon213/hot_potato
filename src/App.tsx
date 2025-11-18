/**
 * @file App.tsx
 * @brief Hot Potato 메인 애플리케이션 컴포넌트
 * @details React 애플리케이션의 진입점으로, 인증 상태에 따라 다른 화면을 렌더링합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  addAnnouncement,
  addCalendarEvent,
  addTemplate,
  deleteTemplate,
  updateTemplate,
  updateTemplateFavorite,
  saveAcademicScheduleToSheet,
    fetchAnnouncements,
    fetchTemplates,
    fetchCalendarEvents,
    updateCalendarEvent,
    incrementViewCount,
    updateAnnouncement,
    deleteAnnouncement,
    deleteCalendarEvent
  } from './utils/database/papyrusManager';
import {
  addTag as addPersonalTag,
  deleteTag as deletePersonalTag,
  updateTag as updatePersonalTag,
  fetchTags as fetchPersonalTags,
  checkTagDeletionImpact
} from './utils/database/personalTagManager';
import { clearAllUserData } from './utils/helpers/clearUserData';
import type { Post, Event, DateRange, CustomPeriod, User, PageType } from './types/app';
import { ENV_CONFIG } from './config/environment';
import { tokenManager } from './utils/auth/tokenManager';
import { lastUserManager } from './utils/auth/lastUserManager';
import { useSession } from './hooks/features/auth/useSession';
import { useNotification } from './hooks/ui/useNotification';
import { NotificationModal, ConfirmModal } from './components/ui/NotificationModal';
import LoadingProgress from './components/ui/LoadingProgress';
import { useAuthStore } from './hooks/features/auth/useAuthStore';

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

    // Announcements state
    announcements,
    setAnnouncements,
    selectedAnnouncement,
    setSelectedAnnouncement,
    isGoogleAuthenticatedForAnnouncements,
    isGoogleAuthenticatedForBoard,
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
    calendarProfessorSpreadsheetId,
    calendarStudentSpreadsheetId,
    calendarCouncilSpreadsheetId,
    calendarSuppSpreadsheetId,
    calendarADProfessorSpreadsheetId,
    activeCalendarSpreadsheetId,
    staffSpreadsheetId,

    // Attendees
    students,
    staff,

    // Widget state and handlers
    isModalOpen,
    setIsModalOpen,
    widgets,
    handleAddWidget,
    handleRemoveWidget,
    handleDragStart,
    handleDragEnter,
    handleDrop,
    widgetOptions,

    // DataSyncService 관련 상태
    isInitializingData,
    dataSyncProgress,
    lastSyncTime,
    handleRefreshAllData,

    // State reset
    resetAllState
  } = useAppState();

  // 알림 훅
  const {
    notification,
    confirm,
    hideNotification,
    hideConfirm,
    handleConfirm
  } = useNotification();

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
  const handleLogout = useCallback(() => {
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

    // Zustand auth store도 초기화
    try {
      const authStoreLogout = useAuthStore.getState().logout;
      authStoreLogout();
    } catch (error) {
      console.warn('Auth store 로그아웃 실패:', error);
    }

    console.log('🚪 로그아웃 완료');
  }, [setUser, setCurrentPage, setSearchTerm, setGoogleAccessToken]);

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
      window.google.accounts.id.revoke((response: { hint?: string }) => {
        console.log('Google 계정 정보 삭제 완료');
      });
    }
  };

  // 세션 타임아웃 관리
  useSession(!!user, () => {
    handleLogout();
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  });

  // 토큰 만료 체크 및 자동 갱신/로그아웃
  useEffect(() => {
    if (!user) {
      return; // 로그인하지 않은 경우 체크하지 않음
    }

    // 토큰 만료 체크 및 자동 갱신 간격 (30초마다 체크)
    const checkInterval = setInterval(async () => {
      // 토큰이 만료 임박 시 자동 갱신 시도
      if (tokenManager.isExpiringSoon()) {
        const refreshed = await tokenManager.autoRefresh();
        if (refreshed) {
          console.log('✅ 토큰이 자동으로 갱신되었습니다.');
          // gapi에 새 토큰 설정
          const newToken = tokenManager.get();
          if (newToken && window.gapi?.client) {
            window.gapi.client.setToken({ access_token: newToken });
          }
          return;
        } else {
          console.warn('⚠️ 토큰 자동 갱신 실패 (Refresh Token이 없을 수 있습니다)');
        }
      }

      // 토큰이 완전히 만료된 경우
      if (!tokenManager.isValid()) {
        console.log('🔒 토큰이 만료되어 자동 로그아웃합니다.');
        clearInterval(checkInterval);
        handleLogout();
        alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
      }
    }, 30 * 1000); // 30초마다 체크

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(checkInterval);
    };
  }, [user, handleLogout]);

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    const announcementId = urlParams.get('announcementId');

    if (pageFromUrl === 'announcement-view' && announcementId) {
      // announcements가 로드된 후, localStorage의 selectedAnnouncement와 비교하여 최신 정보로 업데이트
      if (announcements.length > 0) {
        const announcement = announcements.find(a => String(a.id) === String(announcementId));
        if (announcement) {
          setSelectedAnnouncement(announcement);
          localStorage.setItem('selectedAnnouncement', JSON.stringify(announcement)); // 최신 정보로 업데이트
        } else {
          console.warn('URL/localStorage의 announcementId와 일치하는 공지사항을 찾을 수 없습니다:', announcementId);
          setSelectedAnnouncement(null);
          localStorage.removeItem('selectedAnnouncement');
        }
      }
    } else if (pageFromUrl !== 'announcement-view') {
      setSelectedAnnouncement(null);
      localStorage.removeItem('selectedAnnouncement');
    }
  }, [announcements, currentPage, setSelectedAnnouncement]);

  // 페이지 전환 처리
  const handlePageChange = (pageName: string, params?: Record<string, string>) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('page', pageName);

    // 기존 announcementId 파라미터를 제거
    url.searchParams.delete('announcementId');

    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.set(key, params[key]);
      });
    }

    window.history.pushState({}, '', url.toString());
    setCurrentPage(pageName as PageType);
  };

  // 구글 서비스 페이지인지 확인
  const isGoogleServicePage = useMemo(() => {
    const googleServicePages: PageType[] = [
      'google_appscript',
      'google_sheets',
      'google_docs',
      'google_gemini',
      'google_groups',
      'google_calendar'
    ];
    return googleServicePages.includes(currentPage);
  }, [currentPage]);

  // 현재 페이지에 해당하는 섹션 제목 계산
  const pageSectionLabel = useMemo(() => {
    const PAGE_SECTIONS: Record<string, string> = {
      // 문서 섹션
      document_management: '문서',
      new_document: '문서',
      workflow_management: '문서',
      // 일정 섹션
      calendar: '일정',
      timetable: '일정',
      // 학생 및 교직원 섹션
      students: '학생 및 교직원',
      students_council: '학생 및 교직원',
      staff: '학생 및 교직원',
      staff_committee: '학생 및 교직원',
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
      admin: '관리자',
      mypage: '마이페이지',
      accounting: '회계',
    };

    const PAGE_TITLES: Record<string, string> = {
      // 문서 하위 페이지
      document_management: '문서관리',
      new_document: '새 문서',
      workflow_management: '결재 관리',
      // 일정 하위 페이지
      calendar: '캘린더',
      timetable: '시간표',
      // 학생 및 교직원 하위 페이지
      students: '학생 관리',
      students_council: '학생회',
      staff: '교직원 관리',
      staff_committee: '학과 위원회',
      // 나머지
      dashboard: '대시보드',
      announcements: '공지사항',
      'announcement-view': '공지사항 상세',
      board: '게시판',
      chat: '채팅',
      admin: '관리자',
      mypage: '마이페이지',
      accounting: '회계',
    };

    const section = PAGE_SECTIONS[currentPage] || '';
    const title = PAGE_TITLES[currentPage] || '';

    if (section && title && section !== title) {
      return `${section} | ${title}`;
    }
    return section || title || '';
  }, [currentPage]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSearchSubmit = () => {
    if (currentPage !== 'document_management') {
      handlePageChange('document_management');
    }
  };

  // 게시판 추가 핸들러
  const handleAddPost = async (postData: { title: string; content: string; author: string; writer_id: string; }) => {
    try {
      if (!announcementSpreadsheetId) {
        throw new Error("Board spreadsheet ID not found");
      }
      // TODO: 게시판 추가 로직 구현 필요
      console.warn('게시판 추가 기능은 아직 구현되지 않았습니다.');
      handlePageChange('board');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // 공지사항 추가 핸들러
  const handleAddAnnouncement = async (postData: {
    title: string;
    content: string;
    author: string;
    writer_id: string;
    attachments: File[];
    accessRights?: { individual?: string[]; groups?: string[] };
    isPinned?: boolean;
    userType?: string;
  }) => {
    if (!announcementSpreadsheetId) {
      alert("Announcement spreadsheet ID not found");
      return;
    }
    if (!user || !user.email || !user.studentId || !user.userType) {
      alert("User information is incomplete for adding announcement.");
      return;
    }

    // 1. 다음에 생성될 ID 예측
    const maxId = announcements.reduce((max, post) => {
      const currentId = parseInt(post.id, 10);
      return !isNaN(currentId) && currentId > max ? currentId : max;
    }, 0);
    const nextId = String(maxId + 1);

    // 2. 낙관적 업데이트를 위한 새 공지사항 객체 생성
    const filesForOptimisticUpdate = postData.attachments.map(file => ({
      name: file.name,
      url: '' // URL은 아직 알 수 없으므로 비워둠
    }));
    const fileNoticeForOptimisticUpdate = filesForOptimisticUpdate.length > 0
      ? JSON.stringify(filesForOptimisticUpdate)
      : '';

    // 보기 모드에서 즉시 표시하기 위해 content에 첨부파일 HTML 추가
    const attachmentHtmlString = filesForOptimisticUpdate.map(file =>
      `<p>첨부파일: <a href="${file.url}" download="${file.name}">${file.name}</a></p>`
    ).join('');
    const contentForOptimisticUpdate = postData.content + attachmentHtmlString;

    const newAnnouncement: Post = {
      id: nextId, // 예측한 ID 사용
      title: postData.title,
      author: postData.author,
      date: new Date().toISOString().split('T')[0], // 현재 날짜
      views: 0,
      likes: 0,
      content: contentForOptimisticUpdate, // 첨부파일 HTML이 포함된 내용
      writer_id: postData.writer_id,
      writer_email: user.email,
      file_notice: fileNoticeForOptimisticUpdate, // 수정 모드를 위한 데이터
      access_rights: postData.accessRights ? JSON.stringify(postData.accessRights) : '',
      fix_notice: postData.isPinned ? 'O' : '',
      isPinned: postData.isPinned,
    };

    // 현재 공지사항 목록 백업 (롤백용)
    const originalAnnouncements = announcements;

    // 3. UI를 즉시 업데이트 (새 공지사항을 목록 맨 앞에 추가)
    setAnnouncements([newAnnouncement, ...originalAnnouncements]);
    handlePageChange('announcements'); // 공지사항 목록 페이지로 이동

    try {
      // 4. 실제 서버에 공지사항 추가 요청
      await addAnnouncement(announcementSpreadsheetId, {
        ...postData,
        writerEmail: user.email
      });

      // 5. 서버 응답 성공 시, 전체 공지사항 목록을 다시 가져와서 UI 업데이트
      const updatedAnnouncements = await fetchAnnouncements(user.studentId, user.userType);
      setAnnouncements(updatedAnnouncements);

    } catch (error) {
      console.error('Error adding announcement:', error);
      alert('공지사항 작성에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      // 6. 오류 발생 시 UI를 이전 상태로 롤백
      setAnnouncements(originalAnnouncements);
    }
  };

  const handleSelectAnnouncement = (post: Post) => {
    const postId = String(post.id);

    // 1. Optimistic UI Update (즉시 UI에 반영)
    const updatedAnnouncements = announcements.map(p => {
      if (String(p.id) === postId) {
        return { ...p, views: (p.views || 0) + 1 };
      }
      return p;
    });
    setAnnouncements(updatedAnnouncements);

    // 2. Navigate Immediately (즉시 페이지 전환)
    const updatedSelectedPost = updatedAnnouncements.find(p => String(p.id) === postId);
    setSelectedAnnouncement(updatedSelectedPost || { ...post, views: (post.views || 0) + 1 });
    handlePageChange('announcement-view', { announcementId: postId });

    // 3. Backend API Call (Fire-and-forget)
    // await를 제거하여 백엔드 응답을 기다리지 않고 페이지 전환 후 백그라운드에서 처리합니다.
    incrementViewCount(post.id).catch(error => {
      console.error('조회수 증가 API 호출 실패:', error);
      // 에러가 발생해도 이미 페이지는 전환되었으므로, UI를 되돌리는 대신 로그만 남깁니다.
    });
  };

  const handleUpdateAnnouncement = async (announcementId: string, postData: {
    title: string;
    content: string;
    attachments: File[];
    existingAttachments: { name: string, url: string }[];
    accessRights?: { individual?: string[]; groups?: string[] };
    isPinned?: boolean;
  }) => {
    if (!user || !user.studentId) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    const originalAnnouncements = announcements;

    // Optimistically update the local state
    const updatedAnnouncements = announcements.map(post => {
      if (post.id === announcementId) {
        return {
          ...post,
          title: postData.title,
          content: postData.content, // This is the clean content, without attachment links
        };
      }
      return post;
    });
    setAnnouncements(updatedAnnouncements);
    handlePageChange('announcements');

    try {
      await updateAnnouncement(announcementId, user.studentId, postData);
      // Re-fetch to get the final content with attachment links
      if (user.userType) {
        const refreshedAnnouncements = await fetchAnnouncements(user.studentId, user.userType);
        setAnnouncements(refreshedAnnouncements);
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      setAnnouncements(originalAnnouncements);
      alert('공지사항 수정에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  const handleUnpinAnnouncement = async (announcementId: string) => {
    if (!user || !user.studentId) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    const originalAnnouncements = announcements;

    // Optimistically update the UI
    const updatedAnnouncements = announcements.map(post => {
      if (post.id === announcementId) {
        return {
          ...post,
          isPinned: false,
          fix_notice: ''
        };
      }
      return post;
    });
    setAnnouncements(updatedAnnouncements);

    try {
      // 고정 해제: isPinned를 false로 설정
      await updateAnnouncement(announcementId, user.studentId, {
        title: announcements.find(a => a.id === announcementId)?.title || '',
        content: announcements.find(a => a.id === announcementId)?.content || '',
        attachments: [],
        existingAttachments: [],
        isPinned: false
      });

      // 목록 새로고침
      if (user.userType) {
        const refreshedAnnouncements = await fetchAnnouncements(user.studentId, user.userType);
        setAnnouncements(refreshedAnnouncements);
      }
    } catch (error) {
      console.error('Error unpinning announcement:', error);
      setAnnouncements(originalAnnouncements);
      alert('고정 해제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user || !user.studentId) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    const originalAnnouncements = announcements;
    // Optimistically update the UI
    setAnnouncements(announcements.filter(a => a.id !== announcementId));
    handlePageChange('announcements');

    try {
      if (!announcementSpreadsheetId) {
        throw new Error("Announcement spreadsheet ID not found");
      }
      await deleteAnnouncement(announcementSpreadsheetId, announcementId, user.studentId);
      // 삭제 성공 후 목록 새로고침
      if (user.userType) {
        const refreshedAnnouncements = await fetchAnnouncements(user.studentId, user.userType);
        setAnnouncements(refreshedAnnouncements);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      // Revert the change if the delete fails
      setAnnouncements(originalAnnouncements);
      alert('공지사항 삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  const getAttendeeUserType = (attendeeId: string): string | null => {
    const student = students.find(s => s.no_student === attendeeId);
    if (student) {
      return student.council ? 'council' : 'student';
    }

    const staffMember = staff.find(s => s.no === attendeeId);
    if (staffMember) {
      if (staffMember.pos === '외부강사' || staffMember.pos === '시간강사') {
        return 'ADprofessor';
      }
      if (staffMember.pos === '조교') {
        return 'supp';
      }
      if (staffMember.pos === '교수') {
        return 'professor';
      }
    }
    return null;
  };

  const permissionHierarchy = ['student', 'council', 'supp', 'ADprofessor', 'professor'];

  // 캘린더 이벤트 추가 핸들러
  const handleAddCalendarEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      let eventOwnerType = user.userType;
      let targetSpreadsheetId = activeCalendarSpreadsheetId; // Initialize here

      if (eventData.attendees) {
        const attendeeItems = eventData.attendees.split(',');
        const groupTypes: string[] = [];
        const individualUserTypes: string[] = [];
        
        // 새로운 형식 파싱: "group:권한" 또는 "권한:참석자ID" 또는 "참석자ID" (기존 형식)
        attendeeItems.forEach(item => {
          const trimmed = item.trim();
          if (trimmed.startsWith('group:')) {
            // 그룹 선택: group:student -> student
            const groupType = trimmed.replace('group:', '');
            if (groupType && !groupTypes.includes(groupType)) {
              groupTypes.push(groupType);
            }
          } else if (trimmed.includes(':')) {
            // 개별 참석자: student:123 -> student
            const [userType] = trimmed.split(':');
            if (userType && !individualUserTypes.includes(userType)) {
              individualUserTypes.push(userType);
            }
          } else {
            // 기존 형식 (호환성): 참석자ID만 있는 경우
            const userType = getAttendeeUserType(trimmed);
            if (userType && !individualUserTypes.includes(userType)) {
              individualUserTypes.push(userType);
            }
          }
        });

        // 개별 참석자가 있으면 개별 참석자 중 가장 낮은 권한 사용
        // 개별 참석자가 없으면 그룹 선택 중 가장 낮은 권한 사용
        let lowestPermissionType: string | null = null;
        
        if (individualUserTypes.length > 0) {
          // 개별 참석자 목록에서 가장 낮은 권한 찾기
          lowestPermissionType = individualUserTypes.reduce((lowest, current) => {
            const lowestIndex = permissionHierarchy.indexOf(lowest);
            const currentIndex = permissionHierarchy.indexOf(current);
            return currentIndex < lowestIndex ? current : lowest;
          }, individualUserTypes[0]);
          console.log('📅 개별 참석자 권한 목록:', individualUserTypes);
          console.log('📅 개별 참석자 중 가장 낮은 권한:', lowestPermissionType);
        } else if (groupTypes.length > 0) {
          // 그룹 선택 중 가장 낮은 권한 찾기
          lowestPermissionType = groupTypes.reduce((lowest, current) => {
            const lowestIndex = permissionHierarchy.indexOf(lowest);
            const currentIndex = permissionHierarchy.indexOf(current);
            return currentIndex < lowestIndex ? current : lowest;
          }, groupTypes[0]);
          console.log('📅 그룹 권한 목록:', groupTypes);
          console.log('📅 그룹 중 가장 낮은 권한:', lowestPermissionType);
        }

        // 본인 권한도 고려 (개별 참석자나 그룹에 본인이 없을 경우)
        if (user?.userType) {
          const isInIndividual = individualUserTypes.includes(user.userType);
          const isInGroup = groupTypes.includes(user.userType);
          
          if (!isInIndividual && !isInGroup) {
            // 본인이 참석자 목록에 없으면 본인 권한도 비교
            if (!lowestPermissionType || permissionHierarchy.indexOf(user.userType) < permissionHierarchy.indexOf(lowestPermissionType)) {
              lowestPermissionType = user.userType;
              console.log('📅 본인 권한이 가장 낮음:', lowestPermissionType);
            }
          }
        }

        if (lowestPermissionType) {
          eventOwnerType = lowestPermissionType;

          switch (lowestPermissionType) {
            case 'student':
              targetSpreadsheetId = calendarStudentSpreadsheetId;
              break;
            case 'council':
              targetSpreadsheetId = calendarCouncilSpreadsheetId;
              break;
            case 'supp':
            case 'support': // 호환성을 위해 둘 다 지원
              targetSpreadsheetId = calendarSuppSpreadsheetId;
              break;
            case 'ADprofessor':
              targetSpreadsheetId = calendarADProfessorSpreadsheetId;
              break;
            case 'professor':
              targetSpreadsheetId = calendarProfessorSpreadsheetId;
              break;
            default:
              targetSpreadsheetId = activeCalendarSpreadsheetId;
          }
        }
      }

      // 참석자가 없거나 targetSpreadsheetId가 null인 경우, 사용자 타입에 따라 기본 스프레드시트 ID 선택
      if (!targetSpreadsheetId && user.userType) {
        switch (user.userType) {
          case 'professor':
            targetSpreadsheetId = calendarProfessorSpreadsheetId;
            break;
          case 'student':
            targetSpreadsheetId = calendarStudentSpreadsheetId;
            break;
          case 'council':
            targetSpreadsheetId = calendarCouncilSpreadsheetId;
            break;
          case 'ADprofessor':
            targetSpreadsheetId = calendarADProfessorSpreadsheetId;
            break;
          case 'supp':
          case 'support':
            targetSpreadsheetId = calendarSuppSpreadsheetId;
            break;
          default:
            // 기본값으로 student 캘린더 사용
            targetSpreadsheetId = calendarStudentSpreadsheetId;
            break;
        }
      }

      if (!targetSpreadsheetId) {
        throw new Error("Target calendar spreadsheet ID not found");
      }
      if (!eventOwnerType) {
        throw new Error("Event owner type not found");
      }
      await addCalendarEvent(targetSpreadsheetId, eventData, eventOwnerType);
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
      const allCalendarIds = [
        calendarProfessorSpreadsheetId,
        calendarStudentSpreadsheetId,
        calendarCouncilSpreadsheetId,
        calendarADProfessorSpreadsheetId,
        calendarSuppSpreadsheetId
      ].filter(Boolean);

      const spreadsheetId = allCalendarIds.find(id => eventId.startsWith(id!));

      if (!spreadsheetId) {
        throw new Error("Could not determine spreadsheet ID from event ID");
      }

      await updateCalendarEvent(spreadsheetId, eventId, eventData);
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
    try {
      const allCalendarIds = [
        calendarProfessorSpreadsheetId,
        calendarStudentSpreadsheetId,
        calendarCouncilSpreadsheetId,
        calendarADProfessorSpreadsheetId,
        calendarSuppSpreadsheetId
      ].filter(Boolean);

      const spreadsheetId = allCalendarIds.find(id => eventId.startsWith(id!));

      if (!spreadsheetId) {
        throw new Error("Could not determine spreadsheet ID from event ID");
      }

      await deleteCalendarEvent(spreadsheetId, eventId);
      // 캘린더 이벤트 목록 새로고침
      const updatedEvents = await fetchCalendarEvents();
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  };

  // 학사일정 저장 핸들러
  const handleSaveAcademicSchedule = async (scheduleData: {
    semesterStartDate: Date;
    finalExamsPeriod: DateRange;
    midtermExamsPeriod: DateRange;
    gradeEntryPeriod: DateRange;
    customPeriods: CustomPeriod[];
  }) => {
    if (!activeCalendarSpreadsheetId) {
      alert('캘린더가 설정되지 않아 저장할 수 없습니다.');
      console.error('Error saving academic schedule: No active calendar spreadsheet ID is set.');
      return;
    }
    try {
      await saveAcademicScheduleToSheet(scheduleData, activeCalendarSpreadsheetId);
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
        <div className={`main-panel ${isGoogleServicePage ? 'no-header' : ''}`} data-oid="n9gxxwr">
          {!isGoogleServicePage && (
            <Header
              onPageChange={handlePageChange}
              userInfo={user}
              onLogout={handleLogout}
              pageSectionLabel={pageSectionLabel}
              currentPage={currentPage}
              lastSyncTime={lastSyncTime}
              onRefresh={handleRefreshAllData}
              isRefreshing={isInitializingData}
            />
          )}
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            <PageRenderer
              currentPage={currentPage}
              user={user}
              posts={[]}
              announcements={announcements}
              selectedAnnouncement={selectedAnnouncement}
              isGoogleAuthenticatedForBoard={isGoogleAuthenticatedForBoard}
              isGoogleAuthenticatedForAnnouncements={isGoogleAuthenticatedForAnnouncements}
              boardSpreadsheetId={announcementSpreadsheetId}
              announcementSpreadsheetId={announcementSpreadsheetId}
              isBoardLoading={false}
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
              staffSpreadsheetId={staffSpreadsheetId}
              students={students}
              staff={staff}
              searchTerm={searchTerm}
              onPageChange={handlePageChange}
              onAddPost={handleAddPost}
              onAddAnnouncement={handleAddAnnouncement}
              onSelectAnnouncement={handleSelectAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onUnpinAnnouncement={handleUnpinAnnouncement}
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
              // Widget props
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              widgets={widgets}
              handleAddWidget={handleAddWidget}
              handleRemoveWidget={handleRemoveWidget}
              handleDragStart={handleDragStart}
              handleDragEnter={handleDragEnter}
              handleDrop={handleDrop}
              widgetOptions={widgetOptions}
              // DataSyncService 관련 props
              lastSyncTime={lastSyncTime}
              onRefresh={handleRefreshAllData}
              isRefreshing={isInitializingData}
            />
          </div>
        </div>
      </div>
      
      {/* 알림 모달 */}
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={notification.duration}
      />
      
      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        message={confirm.message}
        title={confirm.title}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        onConfirm={handleConfirm}
        onCancel={hideConfirm}
        onCancelAction={confirm.onCancelAction}
      />
      
      {/* 초기 로딩 진행률 */}
      <LoadingProgress
        isVisible={isInitializingData && dataSyncProgress.total > 0}
        progress={dataSyncProgress}
      />
    </GoogleOAuthProvider>
  );
};

export default App;
