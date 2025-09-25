// App.tsx의 상태 관리 로직을 분리한 커스텀 훅

import { useState, useEffect } from 'react';
import type { User, PageType, Post, Event, DateRange, CustomPeriod, Template } from '../types/app';
import { initializeGoogleAPIOnce } from '../../utils/google/googleApiInitializer';
import { 
    findSpreadsheetById, 
    fetchPosts, 
    fetchAnnouncements, 
    fetchTemplates, 
    fetchTags,
    fetchCalendarEvents 
} from '../../utils/google/spreadsheetManager';

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
    const [documentTemplateSheetId, setDocumentTemplateSheetId] = useState<number | null>(null);
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

    // SHEET_ID는 상수로 정의됨
    const boardSheetName = '시트1';
    const announcementSheetName = '시트1';
    const calendarSheetName = '시트1';

    // 로그인 상태 확인
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('googleAccessToken');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setGoogleAccessToken(savedToken);
        }
        setIsLoading(false);
    }, []);

    // 스프레드시트 ID 찾기 및 초기화
    useEffect(() => {
        const initAndFetch = async () => {
            try {
                console.log("새로고침 후 Google API 초기화 시작");
                await initializeGoogleAPIOnce(hotPotatoDBSpreadsheetId);

                // Find all spreadsheet IDs
                const [
                    announcementId,
                    calendarProfessorId,
                    calendarStudentId,
                    boardId,
                    hotPotatoDBId,
                    studentId
                ] = await Promise.all([
                    findSpreadsheetById('notice_professor'),
                    findSpreadsheetById('calendar_professor'),
                    findSpreadsheetById('calendar_student'),
                    findSpreadsheetById('board_professor'),
                    findSpreadsheetById('hot_potato_DB'),
                    findSpreadsheetById('student')
                ]);

                setAnnouncementSpreadsheetId(announcementId);
                setCalendarProfessorSpreadsheetId(calendarProfessorId);
                setCalendarStudentSpreadsheetId(calendarStudentId);
                setBoardSpreadsheetId(boardId);
                setHotPotatoDBSpreadsheetId(hotPotatoDBId);
                setStudentSpreadsheetId(studentId);

                // gapi가 초기화된 후 데이터 로드
                const fetchInitialData = async (retryCount = 0) => {
                    try {
                        const gapi = (window as any).gapi;
                        if (gapi && gapi.client && gapi.client.sheets && gapi.client.sheets.spreadsheets) {
                            console.log("Google API 초기화 완료, 데이터 로드 시작");
                            setIsGapiReady(true);

                            // Set auth states to true since we know the user is signed in
                            setIsGoogleAuthenticatedForAnnouncements(true);
                            setIsGoogleAuthenticatedForBoard(true);

                            console.log("모든 데이터 로드 완료");
                        } else {
                            console.log(`Google API가 아직 초기화되지 않았습니다. 재시도 ${retryCount + 1}/3`);
                            if (retryCount < 3) {
                                setTimeout(() => fetchInitialData(retryCount + 1), 500);
                            } else {
                                console.error("Google API 초기화 최대 재시도 횟수 초과");
                            }
                        }
                    } catch (error) {
                        console.error("Error during initial data fetch", error);
                        if (retryCount < 2) {
                            console.log(`데이터 로드 재시도 ${retryCount + 1}/2`);
                            setTimeout(() => fetchInitialData(retryCount + 1), 1000);
                        } else {
                            console.error("데이터 로드 최대 재시도 횟수 초과");
                        }
                    }
                };

                fetchInitialData();
            } catch (error) {
                console.error("Error during initial gapi load", error);
                setTimeout(() => {
                    console.log("gapi 초기화 재시도");
                    initAndFetch();
                }, 1500);
            }
        };

        // 승인된 사용자만 Google Sheets 데이터 로드
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            if (userData.isApproved) {
                initAndFetch();
            }
        }
    }, []);

    // 데이터 로드 useEffect들
    useEffect(() => {
        if (boardSpreadsheetId) {
            const loadPosts = async () => {
                setIsBoardLoading(true);
                try {
                    const postsData = await fetchPosts(boardSpreadsheetId, boardSheetName);
                    setPosts(postsData);
                } catch (error) {
                    console.error('Error loading posts:', error);
                } finally {
                    setIsBoardLoading(false);
                }
            };
            loadPosts();
        }
    }, [boardSpreadsheetId]);

    useEffect(() => {
        if (announcementSpreadsheetId) {
            const loadAnnouncements = async () => {
                setIsAnnouncementsLoading(true);
                try {
                    const announcementsData = await fetchAnnouncements(announcementSpreadsheetId, announcementSheetName);
                    setAnnouncements(announcementsData);
                } catch (error) {
                    console.error('Error loading announcements:', error);
                } finally {
                    setIsAnnouncementsLoading(false);
                }
            };
            loadAnnouncements();
        }
    }, [announcementSpreadsheetId]);

    useEffect(() => {
        const loadCalendarEvents = async () => {
            setIsCalendarLoading(true);
            try {
                const events = await fetchCalendarEvents(
                    calendarProfessorSpreadsheetId,
                    calendarStudentSpreadsheetId,
                    calendarSheetName
                );
                setCalendarEvents(events);
            } catch (error) {
                console.error('Error loading calendar events:', error);
            } finally {
                setIsCalendarLoading(false);
            }
        };

        if (calendarProfessorSpreadsheetId || calendarStudentSpreadsheetId) {
            loadCalendarEvents();
        }
    }, [calendarProfessorSpreadsheetId, calendarStudentSpreadsheetId]);

    useEffect(() => {
        if (hotPotatoDBSpreadsheetId) {
            const fetchTemplateData = async () => {
                try {
                    const gapi = (window as any).gapi;
                    if (gapi && gapi.client && gapi.client.sheets) {
                        const spreadsheet = await gapi.client.sheets.spreadsheets.get({ 
                            spreadsheetId: hotPotatoDBSpreadsheetId 
                        });
                        const docSheet = spreadsheet.result.sheets.find((s: any) => s.properties.title === 'document_template');
                        if (docSheet && docSheet.properties) {
                            setDocumentTemplateSheetId(docSheet.properties.sheetId);
                        }
                        
                        const [templates, tags] = await Promise.all([
                            fetchTemplates(hotPotatoDBSpreadsheetId),
                            fetchTags(hotPotatoDBSpreadsheetId)
                        ]);
                        
                        setCustomTemplates(templates);
                        setTags(tags);
                    }
                } catch (error) {
                    console.error("Error during template data fetch", error);
                } finally {
                    setIsTemplatesLoading(false);
                }
            };
            fetchTemplateData();
        }
    }, [hotPotatoDBSpreadsheetId]);

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
        documentTemplateSheetId,
        
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
