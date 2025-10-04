/**
 * @file useAppState.ts
 * @brief 전역 애플리케이션 상태 관리 훅
 * @details 사용자 인증, 페이지 상태, 데이터 로딩 등을 관리하는 중앙화된 상태 관리 훅입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { useState, useEffect } from 'react';
import type { User, PageType, Post, Event, DateRange, CustomPeriod } from '../../types/app';
import type { Template } from '../features/templates/useTemplateUI';
import { initializeGoogleAPIOnce } from '../../utils/google/googleApiInitializer';
import { 
    initializeSpreadsheetIds,
    fetchPosts, 
    fetchAnnouncements, 
    fetchTemplates, 
    fetchTags,
    fetchCalendarEvents 
} from '../../utils/database/papyrusManager';
import { ENV_CONFIG } from '../../config/environment';

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

    // State for Board
    const [posts, setPosts] = useState<Post[]>([]);
    const [isGoogleAuthenticatedForBoard, setIsGoogleAuthenticatedForBoard] = useState(false);
    const [isBoardLoading, setIsBoardLoading] = useState(false);

    // State for Announcements
    const [announcements, setAnnouncements] = useState<Post[]>([]);
    const [isGoogleAuthenticatedForAnnouncements, setIsGoogleAuthenticatedForAnnouncements] = useState(false);
    const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
    const [announcementSpreadsheetId, setAnnouncementSpreadsheetId] = useState<string | null>(null);
    const [boardSpreadsheetId, setBoardSpreadsheetId] = useState<string | null>(null);
    const [hotPotatoDBSpreadsheetId, setHotPotatoDBSpreadsheetId] = useState<string | null>(null);
    const [studentSpreadsheetId, setStudentSpreadsheetId] = useState<string | null>(null);
    const [calendarProfessorSpreadsheetId, setCalendarProfessorSpreadsheetId] = useState<string | null>(null);
    const [calendarStudentSpreadsheetId, setCalendarStudentSpreadsheetId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // State for Calendar
    const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [semesterStartDate, setSemesterStartDate] = useState(new Date());
    const [finalExamsPeriod, setFinalExamsPeriod] = useState<DateRange>({ start: null, end: null });
    const [midtermExamsPeriod, setMidtermExamsPeriod] = useState<DateRange>({ start: null, end: null });
    const [gradeEntryPeriod, setGradeEntryPeriod] = useState<DateRange>({ start: null, end: null });
    const [customPeriods, setCustomPeriods] = useState<CustomPeriod[]>([]);

    // 환경변수에서 시트 이름 가져오기
    const boardSheetName = ENV_CONFIG.BOARD_SHEET_NAME;
    const announcementSheetName = ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME;
    const calendarSheetName = ENV_CONFIG.CALENDAR_SHEET_NAME;

    // 로그인 상태 확인 및 초기화
    useEffect(() => {
        const initApp = async () => {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('googleAccessToken');
            const savedSearchTerm = localStorage.getItem('searchTerm');
            
            // URL 파라미터에서 페이지 상태 복원 (리팩터링 전 방식)
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = urlParams.get('page');
            if (pageFromUrl) {
                console.log('URL에서 페이지 상태 복원:', pageFromUrl);
                setCurrentPage(pageFromUrl as PageType);
            } else {
                // URL에 페이지 파라미터가 없으면 기본값 사용
                setCurrentPage("dashboard");
            }
            
            // 검색어 상태 복원
            if (savedSearchTerm) {
                console.log('검색어 상태 복원:', savedSearchTerm);
                setSearchTerm(savedSearchTerm);
            }
            
            if (savedUser && savedToken) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setGoogleAccessToken(savedToken);
                
                // 승인된 사용자인 경우 데이터 초기화
                if (userData.isApproved) {
                    console.log('새로고침 후 사용자 상태 복원 - 데이터 로딩 시작');
                    
                    try {
                        console.log("Google API 초기화 시작");
                        await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);
                        
                        // 스프레드시트 ID들 초기화
                        const spreadsheetIds = await initializeSpreadsheetIds();
                        
                        // 스프레드시트 ID들 상태 업데이트
                        setAnnouncementSpreadsheetId(spreadsheetIds.announcementSpreadsheetId);
                        setCalendarProfessorSpreadsheetId(spreadsheetIds.calendarProfessorSpreadsheetId);
                        setCalendarStudentSpreadsheetId(spreadsheetIds.calendarStudentSpreadsheetId);
                        setBoardSpreadsheetId(spreadsheetIds.boardSpreadsheetId);
                        setHotPotatoDBSpreadsheetId(spreadsheetIds.hotPotatoDBSpreadsheetId);
                        setStudentSpreadsheetId(spreadsheetIds.studentSpreadsheetId);
                        
                        setIsGapiReady(true);
                        setIsGoogleAuthenticatedForAnnouncements(true);
                        setIsGoogleAuthenticatedForBoard(true);
                        
                        console.log("✅ 새로고침 후 Papyrus DB 연결 완료");
                    } catch (error) {
                        console.error("Error during refresh initialization", error);
                        // Google API 초기화 실패해도 계속 진행
                        setIsGapiReady(true);
                        setIsGoogleAuthenticatedForAnnouncements(true);
                        setIsGoogleAuthenticatedForBoard(true);
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
            console.log('새로운 로그인 감지 - 데이터 로딩 시작');
            
            const initAndFetch = async () => {
                try {
                    console.log("로그인 후 Google API 초기화 시작");
                    await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);
                    
                    // 스프레드시트 ID들 초기화
                    await initializeSpreadsheetIds();
                    
                    setIsGapiReady(true);
                    setIsGoogleAuthenticatedForAnnouncements(true);
                    setIsGoogleAuthenticatedForBoard(true);
                    
                    console.log("✅ 로그인 후 Papyrus DB 연결 완료");
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

    // 데이터 로드 useEffect들
    useEffect(() => {
        if (isGapiReady) {
            const loadPosts = async () => {
                setIsBoardLoading(true);
                try {
                    const postsData = await fetchPosts();
                    setPosts(postsData);
                } catch (error) {
                    console.error('Error loading posts:', error);
                } finally {
                    setIsBoardLoading(false);
                }
            };
            loadPosts();
        }
    }, [isGapiReady]);

    useEffect(() => {
        if (isGapiReady) {
            const loadAnnouncements = async () => {
                setIsAnnouncementsLoading(true);
                try {
                    const announcementsData = await fetchAnnouncements();
                    setAnnouncements(announcementsData);
                } catch (error) {
                    console.error('Error loading announcements:', error);
                } finally {
                    setIsAnnouncementsLoading(false);
                }
            };
            loadAnnouncements();
        }
    }, [isGapiReady]);

    useEffect(() => {
        if (isGapiReady) {
            const loadCalendarEvents = async () => {
                setIsCalendarLoading(true);
                try {
                    const events = await fetchCalendarEvents();
                    setCalendarEvents(events);
                } catch (error) {
                    console.error('Error loading calendar events:', error);
                } finally {
                    setIsCalendarLoading(false);
                }
            };
            loadCalendarEvents();
        }
    }, [isGapiReady]);

    useEffect(() => {
        if (isGapiReady) {
            const fetchTemplateData = async () => {
                try {
                    const [templates, tags] = await Promise.all([
                        fetchTemplates(),
                        fetchTags()
                    ]);
                    
                    setCustomTemplates(templates);
                    setTags(tags);
                } catch (error) {
                    console.error("Error during template data fetch", error);
                } finally {
                    setIsTemplatesLoading(false);
                }
            };
            fetchTemplateData();
        }
    }, [isGapiReady]);

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
        
        // Board state
        posts,
        setPosts,
        isGoogleAuthenticatedForBoard,
        setIsGoogleAuthenticatedForBoard,
        isBoardLoading,
        setIsBoardLoading,
        boardSpreadsheetId,
        
        // Announcements state
        announcements,
        setAnnouncements,
        isGoogleAuthenticatedForAnnouncements,
        setIsGoogleAuthenticatedForAnnouncements,
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
        calendarStudentSpreadsheetId,
        
        // Other spreadsheet IDs
        hotPotatoDBSpreadsheetId,
        studentSpreadsheetId,
        
        // Constants
        boardSheetName,
        announcementSheetName,
        calendarSheetName
    };
};
