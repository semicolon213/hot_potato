/**
 * @file useAppState.ts
 * @brief 전역 애플리케이션 상태 관리 훅
 * @details 사용자 인증, 페이지 상태, 데이터 로딩 등을 관리하는 중앙화된 상태 관리 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, PageType, Post, Event, DateRange, CustomPeriod, Student, Staff } from '../../types/app';
import type { Template } from '../features/templates/useTemplateUI';
import { initializeGoogleAPIOnce } from '../../utils/google/googleApiInitializer';
import {
    initializeSpreadsheetIds,
    fetchAnnouncements,
    fetchTemplates,
    fetchCalendarEvents,
    fetchAttendees
} from '../../utils/database/papyrusManager';
import { fetchTags as fetchPersonalTags } from '../../utils/database/personalTagManager';
import { ENV_CONFIG } from '../../config/environment';
import { tokenManager } from '../../utils/auth/tokenManager';

/**
 * @brief 전역 애플리케이션 상태 관리 훅
 * @details 애플리케이션의 모든 상태를 중앙에서 관리하며, Google API 초기화와 데이터 로딩을 담당합니다.
 * @returns {Object} 애플리케이션 상태와 핸들러 함수들
 */
export const useAppState = () => {
    // User authentication state
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGapiReady, setIsGapiReady] = useState(false);

    // Original app state
    const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
    const [tags, setTags] = useState<string[]>([]);

    // State for Announcements
    const [announcements, setAnnouncements] = useState<Post[]>([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Post | null>(null);
    const [isGoogleAuthenticatedForAnnouncements, setIsGoogleAuthenticatedForAnnouncements] = useState(false);
    const [isGoogleAuthenticatedForBoard, setIsGoogleAuthenticatedForBoard] = useState(false);
    const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
    const [announcementSpreadsheetId, setAnnouncementSpreadsheetId] = useState<string | null>(null);
    const [hotPotatoDBSpreadsheetId, setHotPotatoDBSpreadsheetId] = useState<string | null>(null);
    const [studentSpreadsheetId, setStudentSpreadsheetId] = useState<string | null>(null);
    const [staffSpreadsheetId, setStaffSpreadsheetId] = useState<string | null>(null);
    const [calendarProfessorSpreadsheetId, setCalendarProfessorSpreadsheetId] = useState<string | null>(null);
    const [calendarCouncilSpreadsheetId, setCalendarCouncilSpreadsheetId] = useState<string | null>(null);
    const [calendarADProfessorSpreadsheetId, setCalendarADProfessorSpreadsheetId] = useState<string | null>(null);
    const [calendarSuppSpreadsheetId, setCalendarSuppSpreadsheetId] = useState<string | null>(null);
    const [calendarStudentSpreadsheetId, setCalendarStudentSpreadsheetId] = useState<string | null>(null);
    const [activeCalendarSpreadsheetId, setActiveCalendarSpreadsheetId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // State for Calendar
    const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [semesterStartDate, setSemesterStartDate] = useState(new Date());
    const [finalExamsPeriod, setFinalExamsPeriod] = useState<DateRange>({ start: null, end: null });
    const [midtermExamsPeriod, setMidtermExamsPeriod] = useState<DateRange>({ start: null, end: null });
    const [gradeEntryPeriod, setGradeEntryPeriod] = useState<DateRange>({ start: null, end: null });
    const [customPeriods, setCustomPeriods] = useState<CustomPeriod[]>([]);

    // State for Attendees
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);

    // 환경변수에서 시트 이름 가져오기
    const announcementSheetName = ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME;
    const calendarSheetName = ENV_CONFIG.CALENDAR_SHEET_NAME;

    // 로그인 상태 확인 및 초기화
    useEffect(() => {
        const initApp = async () => {
            const savedUser = localStorage.getItem('user');
            // tokenManager를 통해 토큰 가져오기 (만료 체크 포함)
            const savedToken = tokenManager.get();
            const savedSearchTerm = localStorage.getItem('searchTerm');

            // URL 파라미터에서 페이지 상태 복원 (리팩터링 전 방식)
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = urlParams.get('page');
            if (pageFromUrl) {
                // console.log('URL에서 페이지 상태 복원:', pageFromUrl);
                setCurrentPage(pageFromUrl as PageType);
            } else {
                // URL에 페이지 파라미터가 없으면 기본값 사용
                setCurrentPage("dashboard");
            }

            // 검색어 상태 복원
            if (savedSearchTerm) {
                // console.log('검색어 상태 복원:', savedSearchTerm);
                setSearchTerm(savedSearchTerm);
            }

            // 토큰이 유효하고 사용자 정보가 있으면 로그인 상태 복원
            if (savedUser && savedToken) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setGoogleAccessToken(savedToken);

                // 승인된 사용자인 경우 데이터 초기화
                if (userData.isApproved) {
                    // console.log('새로고침 후 사용자 상태 복원 - 데이터 로딩 시작');

                    try {
                        // console.log("Google API 초기화 시작");
                        await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);

                        // 스프레드시트 ID들 초기화
                        const spreadsheetIds = await initializeSpreadsheetIds();

                        // 스프레드시트 ID들 상태 업데이트
                        setAnnouncementSpreadsheetId(spreadsheetIds.announcementSpreadsheetId);
                        setCalendarProfessorSpreadsheetId(spreadsheetIds.calendarProfessorSpreadsheetId);
                        setCalendarCouncilSpreadsheetId(spreadsheetIds.calendarCouncilSpreadsheetId);
                        setCalendarADProfessorSpreadsheetId(spreadsheetIds.calendarADProfessorSpreadsheetId);
                        setCalendarSuppSpreadsheetId(spreadsheetIds.calendarSuppSpreadsheetId);
                        setCalendarStudentSpreadsheetId(spreadsheetIds.calendarStudentSpreadsheetId);
                        setHotPotatoDBSpreadsheetId(spreadsheetIds.hotPotatoDBSpreadsheetId);
                        setStudentSpreadsheetId(spreadsheetIds.studentSpreadsheetId);
                        setStaffSpreadsheetId(spreadsheetIds.staffSpreadsheetId);

                        setIsGapiReady(true);
                        setIsGoogleAuthenticatedForAnnouncements(true);
                        setIsGoogleAuthenticatedForBoard(true);

                        // console.log("✅ 새로고침 후 Papyrus DB 연결 완료");
                    } catch (error) {
                        console.error("Error during refresh initialization", error);
                        // Google API 초기화 실패해도 계속 진행
                        setIsGapiReady(true);
                        setIsGoogleAuthenticatedForAnnouncements(true);
                    }
                }
            }

            setIsLoading(false);
        };

        initApp();
    }, []);

    // 페이지 상태는 URL 파라미터로 관리되므로 localStorage 저장 불필요

    // 검색어 상태 변경 시 localStorage에 저장
    useEffect(() => {
        if (searchTerm) {
            localStorage.setItem('searchTerm', searchTerm);
        } else {
            localStorage.removeItem('searchTerm');
        }
    }, [searchTerm]);

    // 사용자 로그인 시 데이터 자동 로딩 (새로 로그인한 경우)
    useEffect(() => {
        if (user && user.isApproved && !isLoading) {
            // console.log('새로운 로그인 감지 - 데이터 로딩 시작');

            const initAndFetch = async () => {
                try {
                    // console.log("로그인 후 Google API 초기화 시작");
                    await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);

                    // 스프레드시트 ID들 초기화 및 상태 업데이트
                    const spreadsheetIds = await initializeSpreadsheetIds();

                    // 스프레드시트 ID들 상태 업데이트
                    setAnnouncementSpreadsheetId(spreadsheetIds.announcementSpreadsheetId);
                    setCalendarProfessorSpreadsheetId(spreadsheetIds.calendarProfessorSpreadsheetId);
                    setCalendarCouncilSpreadsheetId(spreadsheetIds.calendarCouncilSpreadsheetId);
                    setCalendarADProfessorSpreadsheetId(spreadsheetIds.calendarADProfessorSpreadsheetId);
                    setCalendarSuppSpreadsheetId(spreadsheetIds.calendarSuppSpreadsheetId);
                    setCalendarStudentSpreadsheetId(spreadsheetIds.calendarStudentSpreadsheetId);
                    setHotPotatoDBSpreadsheetId(spreadsheetIds.hotPotatoDBSpreadsheetId);
                    setStudentSpreadsheetId(spreadsheetIds.studentSpreadsheetId);
                    setStaffSpreadsheetId(spreadsheetIds.staffSpreadsheetId);

                    setIsGapiReady(true);
                    setIsGoogleAuthenticatedForAnnouncements(true);
                    setIsGoogleAuthenticatedForBoard(true);

                    // console.log("✅ 로그인 후 Papyrus DB 연결 완료");
                    // console.log("스프레드시트 ID들:", spreadsheetIds);
                } catch (error) {
                    console.error("Error during login initialization", error);
                    console.warn("Google API 초기화 실패했지만 앱을 계속 실행합니다.");

                    // Google API 초기화 실패해도 계속 진행
                    setIsGapiReady(false); // 실제 상태 반영
                    setIsGoogleAuthenticatedForAnnouncements(false);
                    setIsGoogleAuthenticatedForBoard(false);

                    // 사용자에게 알림
                    console.log("⚠️ 일부 Google 서비스가 제한될 수 있습니다.");
                }
            };

            initAndFetch();
        }
    }, [user, isLoading]);

    // 사용자 유형에 따라 활성 캘린더 스프레드시트 ID 설정
    useEffect(() => {
        if (user && user.userType) {
            let targetId: string | null = null;
            switch (user.userType) {
                case 'professor':
                    targetId = calendarProfessorSpreadsheetId;
                    break;
                case 'student':
                    targetId = calendarStudentSpreadsheetId;
                    break;
                case 'council':
                    targetId = calendarCouncilSpreadsheetId;
                    break;
                case 'ADprofessor':
                    targetId = calendarADProfessorSpreadsheetId;
                    break;
                case 'support':
                    targetId = calendarSuppSpreadsheetId;
                    break;
                default:
                    console.warn(`Unknown userType: ${user.userType}. Defaulting to student calendar.`);
                    targetId = calendarStudentSpreadsheetId;
                    break;
            }
            setActiveCalendarSpreadsheetId(targetId);
            console.log(`Active calendar spreadsheet set to: ${targetId} for userType: ${user.userType}`);
        } else {
            setActiveCalendarSpreadsheetId(null);
        }
    }, [user, calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId, calendarCouncilSpreadsheetId, calendarADProfessorSpreadsheetId, calendarSuppSpreadsheetId]);

    // 데이터 로드 useEffect들
    useEffect(() => {
        if (isGapiReady && announcementSpreadsheetId && user?.studentId && user?.userType) {
            const loadAnnouncements = async () => {
                setIsAnnouncementsLoading(true);
                try {
                    console.log('공지사항 데이터 로딩 시작...');
                    const announcementsData = await fetchAnnouncements(user.studentId, user.userType);
                    setAnnouncements(announcementsData);
                    console.log('공지사항 데이터 로딩 완료:', announcementsData.length, '개');
                } catch (error) {
                    console.error('Error loading announcements:', error);
                } finally {
                    setIsAnnouncementsLoading(false);
                }
            };
            loadAnnouncements();
        }
    }, [isGapiReady, announcementSpreadsheetId, user?.studentId, user?.userType]);

    useEffect(() => {
        if (isGapiReady && (calendarProfessorSpreadsheetId || calendarStudentSpreadsheetId || calendarCouncilSpreadsheetId || calendarADProfessorSpreadsheetId || calendarSuppSpreadsheetId)) {
            const loadCalendarEvents = async () => {
                setIsCalendarLoading(true);
                try {
                    console.log('캘린더 데이터 로딩 시작...');
                    const events = await fetchCalendarEvents();
                    setCalendarEvents(events);
                    console.log('캘린더 데이터 로딩 완료:', events.length, '개');
                } catch (error) {
                    console.error('Error loading calendar events:', error);
                } finally {
                    setIsCalendarLoading(false);
                }
            };
            loadCalendarEvents();
        }
    }, [isGapiReady, calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId, calendarCouncilSpreadsheetId, calendarADProfessorSpreadsheetId, calendarSuppSpreadsheetId]);

    useEffect(() => {
        if (isGapiReady) {
            const fetchTemplateData = async () => {
                try {
                    console.log('템플릿 데이터 로딩 시작...');
                    const [templates, tags] = await Promise.all([
                        fetchTemplates(),
                        fetchPersonalTags()
                    ]);

                    setCustomTemplates(templates);
                    setTags(tags);
                    console.log('템플릿 데이터 로딩 완료:', templates.length, '개');
                    console.log('태그 데이터 로딩 완료:', tags.length, '개');
                } catch (error) {
                    console.error("Error during template data fetch", error);
                } finally {
                    setIsTemplatesLoading(false);
                }
            };
            fetchTemplateData();
        }
    }, [isGapiReady]);

    useEffect(() => {
        if (isGapiReady && studentSpreadsheetId && staffSpreadsheetId) {
            const loadAttendees = async () => {
                try {
                    console.log('참석자 데이터 로딩 시작...');
                    const { students, staff } = await fetchAttendees();
                    setStudents(students);
                    setStaff(staff);
                    console.log('참석자 데이터 로딩 완료:', students.length, '명 학생,', staff.length, '명 교직원');
                } catch (error) {
                    console.error('Error loading attendees:', error);
                }
            };
            loadAttendees();
        }
    }, [isGapiReady, studentSpreadsheetId, staffSpreadsheetId]);

    /**
     * @brief 모든 상태 초기화 함수
     * @details 로그아웃 또는 계정 전환 시 모든 상태를 초기화합니다.
     */
    const resetAllState = useCallback(() => {
        console.log('🧹 useAppState 상태 초기화 시작...');

        // 사용자 상태 초기화
        setUser(null);
        setGoogleAccessToken(null);
        setCurrentPage("dashboard");
        setSearchTerm("");

        // 템플릿 상태 초기화
        setCustomTemplates([]);
        setTags([]);
        setIsTemplatesLoading(true);

        // 공지사항 상태 초기화
        setAnnouncements([]);
        setSelectedAnnouncement(null);
        setIsGoogleAuthenticatedForAnnouncements(false);
        setIsGoogleAuthenticatedForBoard(false);
        setIsAnnouncementsLoading(false);
        setAnnouncementSpreadsheetId(null);

        // 캘린더 상태 초기화
        setCalendarEvents([]);
        setIsCalendarLoading(false);
        setSemesterStartDate(null);
        setFinalExamsPeriod(null);
        setMidtermExamsPeriod(null);
        setGradeEntryPeriod(null);
        setCustomPeriods([]);
        setCalendarProfessorSpreadsheetId(null);
        setCalendarStudentSpreadsheetId(null);

        // 스프레드시트 ID 상태 초기화
        setHotPotatoDBSpreadsheetId(null);
        setStudentSpreadsheetId(null);
        setStaffSpreadsheetId(null);

        // 참석자 상태 초기화
        setStudents([]);
        setStaff([]);

        // Google API 상태 초기화
        setIsGapiReady(false);

        console.log('🧹 useAppState 상태 초기화 완료');
    }, []);

    return {
        // User state
        user,
        setUser,
        isLoading,
        isGapiReady,

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
        setIsGoogleAuthenticatedForAnnouncements,
        isGoogleAuthenticatedForBoard,
        setIsGoogleAuthenticatedForBoard,
        isAnnouncementsLoading,
        setIsAnnouncementsLoading,
        announcementSpreadsheetId,

        // Calendar state
        calendarEvents,
        setCalendarEvents,
        isCalendarLoading,
        setIsCalendarLoading,
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
        calendarCouncilSpreadsheetId,
        calendarADProfessorSpreadsheetId,
        calendarSuppSpreadsheetId,
        calendarStudentSpreadsheetId,
        activeCalendarSpreadsheetId,

        // Attendees state
        students,
        staff,

        // Other spreadsheet IDs
        hotPotatoDBSpreadsheetId,
        studentSpreadsheetId,
        staffSpreadsheetId,

        // Constants
        announcementSheetName,
        calendarSheetName,

        // State reset function
        resetAllState
    };
};
