import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import { BiSearchAlt2, BiHelpCircle, BiPlus } from "react-icons/bi";
import useCalendarContext, { type Event, type DateRange, type CustomPeriod } from '../../../../hooks/features/calendar/useCalendarContext.ts';

// DateInfo 타입 정의
interface DateInfo {
    date: string;
    dayIndexOfWeek: number;
}
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';
import ScheduleView from './ScheduleView';
import HelpModal from './HelpModal';
import SemesterPickerModal from './SemesterPickerModal';

import { RRule } from 'rrule';
import { findSpreadsheetById, fetchCalendarEvents } from '../../../../utils/google/spreadsheetManager';
import { initializeGoogleAPIOnce } from '../../../../utils/google/googleApiInitializer';

// Google Calendar API 타입 정의
interface GoogleCalendarEvent {
    id: string;
    summary: string;
    start?: {
        date?: string;
        dateTime?: string;
    };
    end?: {
        date?: string;
        dateTime?: string;
    };
    description?: string;
    location?: string;
}

interface GoogleCalendarResponse {
    result: {
        items: GoogleCalendarEvent[];
    };
}

// GAPI 타입 정의
interface GapiClient {
    calendar: {
        events: {
            list: (params: {
                calendarId: string;
                maxResults: number;
                singleEvents: boolean;
                orderBy: string;
                timeMin: string;
                timeMax: string;
            }) => Promise<GoogleCalendarResponse>;
        };
    };
}

declare global {
    interface Window {
        gapi: {
            client: GapiClient;
        };
    }
}

interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, rect: DOMRect) => void;
    onMoreClick: (events: Event[], date: string, e: React.MouseEvent) => void;
    onSave: (scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        midtermExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }) => Promise<void>;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent, onSelectEvent, onMoreClick, onSave}) => {

    const {
        dispatch,
        currentDate,
        daysInMonth,
        selectedDate,
        events,
        semesterStartDate,
        setSemesterStartDate,
        finalExamsPeriod,
        setFinalExamsPeriod,
        midtermExamsPeriod,
        setMidtermExamsPeriod,
        gradeEntryPeriod,
        eventTypes,
        setGradeEntryPeriod,
        customPeriods,
        setCustomPeriods,
        selectedEvent,
        activeFilters,
        setActiveFilters,
        user,
        goToDate,
        searchTerm,
        setSearchTerm,
        setSearchResults,
        viewMode,
        setViewMode,
        selectedWeek,
        setSelectedWeek,
        calendarViewMode,
        setCalendarViewMode,
        isSearchVisible,
        setIsSearchVisible,
        setSearchOriginView,
        filterLabels,
        unfilteredEvents,
        formatDate,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        date: string;
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });

    const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);


    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<{ title: string; tag: string }[]>([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const datePickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchVisible) {
            searchInputRef.current?.focus();
        }
    }, [isSearchVisible]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSuggestionsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchContainerRef]);



    const getRecentSearches = (): string[] => {
        const searches = localStorage.getItem('recentSearchTerms');
        return searches ? JSON.parse(searches) : [];
    };

    const addRecentSearch = (term: string) => {
        let searches = getRecentSearches();
        searches = searches.filter(s => s !== term);
        searches.unshift(term);
        localStorage.setItem('recentSearchTerms', JSON.stringify(searches.slice(0, 10)));
    };



    const [suggestionSource, setSuggestionSource] = useState<{ title: string; tag: string; startDate: string; endDate: string }[]>([]);

    useEffect(() => {
        const suggestionItems = unfilteredEvents.map(event => ({
            title: event.title,
            tag: event.type || (event.isHoliday ? '공휴일' : '개인 일정'),
            startDate: event.startDate,
            endDate: event.endDate,
        }));

        suggestionItems.sort((a, b) => {
            try {
                const dateA = new Date(a.startDate).getTime();
                const dateB = new Date(b.startDate).getTime();
                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;
                return dateA - dateB;
            } catch (e) {
                return 0;
            }
        });

        setSuggestionSource(suggestionItems);
    }, [events, filterLabels]);

    useEffect(() => {
        if (!isSuggestionsVisible) {
            setSuggestions([]);
            return;
        }

        if (inputValue) {
            // User is typing, so filter based on input
            const handler = setTimeout(() => {
                const lowerInputValue = inputValue.toLowerCase();
                const filtered = suggestionSource.filter(item =>
                    item.title.toLowerCase().includes(lowerInputValue) ||
                    (item.tag && item.tag.toLowerCase().includes(lowerInputValue))
                );
                setSuggestions(filtered);
            }, 300);
            return () => clearTimeout(handler);
        } else {
            // Input is empty, and suggestions are visible, so show recent searches
            const recentSearches = getRecentSearches().slice(0, 3);
            if (recentSearches.length > 0) {
                const historySuggestions = recentSearches.map(term => ({
                    title: term,
                    tag: '최근 검색어',
                    startDate: '',
                    endDate: ''
                }));
                setSuggestions(historySuggestions);
            } else {
                setSuggestions([]); // No recent searches, show empty
            }
        }
    }, [inputValue, isSuggestionsVisible, suggestionSource]);

    useEffect(() => {
        if (isSemesterPickerOpen) return;

        const semesterStartEvent = events.find(event => event.title === '개강일');

        if (semesterStartEvent && semesterStartEvent.startDate) {
            const newStartDate = new Date(semesterStartEvent.startDate);
            if (!isNaN(newStartDate.getTime())) {
                setSemesterStartDate(newStartDate);
            }
        }

        const midtermEvent = events.find(event => event.title === '중간고사');
        if (midtermEvent && midtermEvent.startDate && midtermEvent.endDate) {
            const newMidtermStart = new Date(midtermEvent.startDate);
            const newMidtermEnd = new Date(midtermEvent.endDate);
            if (
                !isNaN(newMidtermStart.getTime()) &&
                !isNaN(newMidtermEnd.getTime()) &&
                (midtermExamsPeriod.start?.getTime() !== newMidtermStart.getTime() || midtermExamsPeriod.end?.getTime() !== newMidtermEnd.getTime())
            ) {
                setMidtermExamsPeriod({ start: newMidtermStart, end: newMidtermEnd });
            }
        }

        const finalEvent = events.find(event => event.title === '기말고사');
        if (finalEvent && finalEvent.startDate && finalEvent.endDate) {
            const newFinalStart = new Date(finalEvent.startDate);
            const newFinalEnd = new Date(finalEvent.endDate);
            if (
                !isNaN(newFinalStart.getTime()) &&
                !isNaN(newFinalEnd.getTime()) &&
                (finalExamsPeriod.start?.getTime() !== newFinalStart.getTime() || finalExamsPeriod.end?.getTime() !== newFinalEnd.getTime())
            ) {
                setFinalExamsPeriod({ start: newFinalStart, end: newFinalEnd });
            }
        }
    }, [events, midtermExamsPeriod, finalExamsPeriod, isSemesterPickerOpen]);

    useEffect(() => {
        const isMidtermChecked = activeFilters.includes('midterm_exam');
        const isFinalChecked = activeFilters.includes('final_exam');

        const midtermDate = midtermExamsPeriod?.start;
        const finalDate = finalExamsPeriod?.start;

        if (isMidtermChecked && !isFinalChecked && midtermDate) {
            goToDate(midtermDate);
        } else if (!isMidtermChecked && isFinalChecked && finalDate) {
            goToDate(finalDate);
        } else if (isMidtermChecked && isFinalChecked && midtermDate && finalDate) {
            const today = new Date();
            const midtermDiff = Math.abs(midtermDate.getTime() - today.getTime());
            const finalDiff = Math.abs(finalDate.getTime() - today.getTime());

            if (midtermDiff <= finalDiff) {
                goToDate(midtermDate);
            } else {
                goToDate(finalDate);
            }
        }
    }, [activeFilters, midtermExamsPeriod, finalExamsPeriod]);

    const handleEventClick = (event: Event, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectEvent(event, e.currentTarget.getBoundingClientRect());
    };



    const weeksInMonth = useMemo(() => {
        const weeksArr: DateInfo[][] = [];
        if (!daysInMonth) return [];
        for (let i = 0; i < daysInMonth.length; i += 7) {
            weeksArr.push(daysInMonth.slice(i, i + 7));
        }
        return weeksArr;
    }, [daysInMonth]);

    const expandedEvents = useMemo(() => {
        const viewStart = new Date(weeksInMonth[0]?.[0]?.date);
        const viewEnd = new Date(weeksInMonth[weeksInMonth.length - 1]?.[6]?.date);
        viewEnd.setHours(23, 59, 59, 999); // Ensure it covers the entire last day

        if (isNaN(viewStart.getTime()) || isNaN(viewEnd.getTime())) {
            return events; // Return raw events if date range is invalid
        }

        const allEvents: Event[] = [];

        events.forEach(event => {
            if (event.rrule) {
                try {
                    const rule = RRule.fromString(event.rrule);
                    const occurrences = rule.between(viewStart, viewEnd);

                    occurrences.forEach(occurrenceDate => {
                        // Adjust for timezone offset before creating new event
                        const adjustedDate = new Date(occurrenceDate.getTime() - (occurrenceDate.getTimezoneOffset() * 60000));
                        const dateStr = adjustedDate.toISOString().split('T')[0];

                        allEvents.push({
                            ...event,
                            // Create a new unique ID for each occurrence to avoid key conflicts
                            id: `${event.id}-occurrence-${dateStr}`,
                            startDate: dateStr,
                            endDate: dateStr, // Each occurrence is a single-day event in this context
                        });
                    });
                } catch (e) {
                    console.error("Error parsing RRULE string:", event.rrule, e);
                    allEvents.push(event); // Push original event if rule parsing fails
                }
            } else {
                allEvents.push(event);
            }
        });

        return allEvents;
    }, [events, weeksInMonth]);

    const eventLayouts = useMemo(() => {
        const layouts = new Map<string, (Event | null)[]>();
        weeksInMonth.forEach(week => {
            if (week.length === 0) return;
            const weekStart = new Date(week[0].date);
            const weekEnd = new Date(week[week.length - 1].date);
            weekEnd.setHours(23, 59, 59, 999);

            const weekEvents = expandedEvents.filter(e => {
                const eventStart = new Date(e.startDate);
                const eventEnd = new Date(e.endDate);
                // 월간 뷰에서는 시간 지정 이벤트를 제외합니다 (종일 이벤트만 표시).
                return !e.startDateTime && eventStart <= weekEnd && eventEnd >= weekStart;
            });

            // Sort events for optimal packing within the week
            weekEvents.sort((a, b) => {
                const startA = new Date(a.startDate);
                const startB = new Date(b.startDate);

                // Use the week's start date as the effective start for events that began before this week
                const effectiveStartA = startA < weekStart ? weekStart : startA;
                const effectiveStartB = startB < weekStart ? weekStart : startB;

                if (effectiveStartA.getTime() !== effectiveStartB.getTime()) {
                    return effectiveStartA.getTime() - effectiveStartB.getTime();
                }

                // If effective start dates are the same, prioritize longer events
                const durationA = new Date(a.endDate).getTime() - startA.getTime();
                const durationB = new Date(b.endDate).getTime() - startB.getTime();
                return durationB - durationA;
            });

            const lanes: (Date | null)[] = [];
            for (const event of weekEvents) {
                const eventStart = new Date(event.startDate);
                let laneIndex = lanes.findIndex(laneEndDate => laneEndDate && laneEndDate.getTime() <= eventStart.getTime());
                if (laneIndex === -1) {
                    laneIndex = lanes.length;
                }
                const exclusiveEnd = new Date(event.endDate);
                exclusiveEnd.setDate(exclusiveEnd.getDate() + 1); // Make it exclusive
                lanes[laneIndex] = exclusiveEnd;

                const eventEnd = new Date(event.endDate); // Use original inclusive end date

                for (let i = 0; i < 7; i++) {
                    const day = week[i];
                    if (!day) continue;
                    const dayStart = new Date(day.date);
                    const dayEnd = new Date(day.date);
                    dayEnd.setDate(dayEnd.getDate() + 1);

                    if (eventStart < dayEnd && eventEnd >= dayStart) {
                        if (!layouts.has(day.date)) {
                            layouts.set(day.date, []);
                        }
                        const dayLayout = layouts.get(day.date)!;
                        while (dayLayout.length < laneIndex) {
                            dayLayout.push(null);
                        }
                        dayLayout[laneIndex] = event;
                    }
                }
            }
        });
        return layouts;
    }, [weeksInMonth, expandedEvents]);

    const { eventElements, moreButtonElements } = useMemo(() => {
        const eventElements: React.ReactNode[] = [];
        const moreButtonElements: React.ReactNode[] = [];
        const processedEvents = new Set<string>();
        const MAX_EVENTS = 3;

        const dayHeight = 130;
        const eventHeight = 22;
        const dateHeaderHeight = 30;

        weeksInMonth.forEach((week, weekIndex) => {
            if (!week || week.length === 0) return;
            week.forEach((day, dayOfWeek) => {
                if (!day) return;
                const dayLayout = eventLayouts.get(day.date) || [];

                // Render events
                dayLayout.slice(0, MAX_EVENTS).forEach((event, laneIndex) => {
                    if (!event || processedEvents.has(`${event.id}-${day.date}`)) {
                        return;
                    }

                    let span = 1;
                    for (let i = dayOfWeek + 1; i < 7; i++) {
                        const nextDayLayout = eventLayouts.get(week[i]?.date) || [];
                        if (nextDayLayout[laneIndex]?.id === event.id) {
                            span++;
                        } else {
                            break;
                        }
                    }

                    for (let i = 0; i < span; i++) {
                        if (week[dayOfWeek + i]) {
                            processedEvents.add(`${event.id}-${week[dayOfWeek + i].date}`);
                        }
                    }

                    const eventStartDate = new Date(event.startDate);
                    const currentDayDate = new Date(day.date);
                    const isContinuationLeft = eventStartDate < currentDayDate;

                    const eventEndDate = new Date(event.endDate);
                    const endOfWeekDate = new Date(week[dayOfWeek + span - 1].date);
                    const isContinuationRight = eventEndDate > endOfWeekDate;

                    const title = (dayOfWeek === 0 || eventStartDate.toDateString() === currentDayDate.toDateString()) ? event.title : '';

                    const dayWidthPercent = 100 / 7;
                    const eventWidthPercent = (span / 7) * 100;
                    const marginPercent = 1.5; // 각 칸의 좌우 마진 (약 1.5%)
                    const adjustedLeft = (dayOfWeek / 7) * 100 + marginPercent;
                    const adjustedWidth = eventWidthPercent - (marginPercent * 2);
                    
                    eventElements.push(
                        <div
                            key={`${event.id}-${day.date}`}
                            className={`monthly-event-item ${isContinuationLeft ? 'continuation-left' : ''} ${isContinuationRight ? 'continuation-right' : ''}`}
                            style={{
                                top: `${(weekIndex * (dayHeight + 10)) + dateHeaderHeight + (laneIndex * eventHeight)}px`,
                                left: `${adjustedLeft}%`,
                                width: `${adjustedWidth}%`,
                                backgroundColor: event.color,
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                        >
                            <span style={{marginRight: '4px'}}>{event.icon}</span>
                            {title}
                        </div>
                    );
                });

                // Render "more" button
                const moreCount = dayLayout.slice(MAX_EVENTS).filter(Boolean).length;
                if (moreCount > 0) {
                    const dayEvents = dayLayout.filter((e): e is Event => e !== null);
                    moreButtonElements.push(
                        <div
                            key={`more-${day.date}`}
                            className="more-events-text"
                            style={{
                                position: 'absolute',
                                top: `${(weekIndex * (dayHeight + 10)) + dateHeaderHeight + (MAX_EVENTS * eventHeight)}px`,
                                left: `${(dayOfWeek / 7) * 100}%`,
                                width: `calc(${(1 / 7) * 100}% - 4px)`,
                                marginLeft: '4px',
                                cursor: 'pointer',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoreClick(dayEvents, day.date, e);
                            }}
                        >
                            {moreCount}개 더보기
                        </div>
                    );
                }
            });
        });

        return { eventElements, moreButtonElements };
    }, [eventLayouts, weeksInMonth, handleEventClick, onMoreClick, selectedEvent]);

    const getWeekDatesText = (weekNum: number) => {
        if (!semesterStartDate || isNaN(semesterStartDate.getTime())) return '';
        const week1Start = new Date(semesterStartDate);
        week1Start.setDate(week1Start.getDate() - week1Start.getDay()); // Set to Sunday

        const start = new Date(week1Start);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
    };


    const handleTodayClick = () => {
        const today = new Date();
        goToDate(today);

        if (viewMode === 'weekly' && semesterStartDate) {
            const semesterStart = new Date(semesterStartDate);
            const todayDate = new Date();

            semesterStart.setHours(0, 0, 0, 0);
            todayDate.setHours(0, 0, 0, 0);

            const semesterWeekStart = new Date(semesterStart);
            semesterWeekStart.setDate(semesterStart.getDate() - semesterStart.getDay());

            const diffTime = todayDate.getTime() - semesterWeekStart.getTime();
            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

            setSelectedWeek(diffWeeks + 1);
        }
    };


    return (
        <div className="calendar-wrapper">


            <div className="calendar-header-container">
                <div className='calendar-header-top' style={{ display: 'flex', alignItems: 'center' }}>
                    {isSearchVisible ? (
                        <div className="calendar-search-bar-wrapper" ref={searchContainerRef}>
                            <BiSearchAlt2 color="black" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="일정 검색..."
                                className={"calendar-search-input-active"}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsSuggestionsVisible(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && inputValue.trim() !== '') {
                                        e.preventDefault();
                                        addRecentSearch(inputValue.trim());

                                        const lowerInputValue = inputValue.toLowerCase();
                                        const results = events.filter(event => 
                                            event.title.toLowerCase().includes(lowerInputValue) ||
                                            (event.type && event.type.toLowerCase().includes(lowerInputValue))
                                        );

                                        setSearchOriginView(calendarViewMode === 'calendar' ? viewMode : 'schedule');
                                        setSearchResults(results);
                                        setCalendarViewMode('schedule');

                                        setInputValue('');
                                        setSuggestions([]);
                                        setIsSuggestionsVisible(false);
                                    }
                                }}
                            />
                            <button className="close-search-button" onClick={() => { setIsSearchVisible(false); setInputValue(''); }}>×</button>

                            {isSuggestionsVisible && suggestions.length > 0 && (
                                <ul className="search-suggestions">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            onMouseDown={() => {
                                                const lowerSuggestionTitle = suggestion.title.toLowerCase();
                                                const results = events.filter(event => 
                                                    event.title.toLowerCase().includes(lowerSuggestionTitle) ||
                                                    (event.type && event.type.toLowerCase().includes(lowerSuggestionTitle))
                                                );

                                                setSearchOriginView(calendarViewMode === 'calendar' ? viewMode : 'schedule');
                                                setSearchResults(results);
                                                setCalendarViewMode('schedule');

                                                setInputValue('');
                                                setSuggestions([]);
                                                setIsSuggestionsVisible(false);
                                            }}
                                        >
                                            <span className="suggestion-title">{suggestion.title}</span>
                                                                                        <span className="suggestion-date">{suggestion.startDate ? `${suggestion.startDate.substring(5).replace('-', '/')} ~ ${suggestion.endDate.substring(5).replace('-', '/')}` : ''}</span>                                            <span className="suggestion-tag">{suggestion.tag}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className={`calendar-title ${calendarViewMode === 'calendar' ? 'visible' : 'hidden'}`}>
                                <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handlePrevMonth() : setSelectedWeek(selectedWeek > 1 ? selectedWeek - 1 : 1)}>&#8249;</button>
                                <h2 
                                    className="calendar-month-year"
                                    onClick={() => {
                                        if (viewMode === 'monthly' && datePickerRef.current) {
                                            datePickerRef.current.showPicker?.() || datePickerRef.current.focus();
                                        }
                                    }}
                                >
                                    {viewMode === 'monthly' ? (
                                        <>
                                            {`${currentDate.year}년 ${currentDate.month}월`}
                                            <input
                                                ref={datePickerRef}
                                                type="date"
                                                value={`${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-01`}
                                                onChange={(e) => {
                                                    const selectedDate = new Date(e.target.value);
                                                    if (goToDate) {
                                                        goToDate(selectedDate);
                                                    }
                                                }}
                                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {`${selectedWeek}주차`}
                                            <span className="week-dates-text">
                                                {getWeekDatesText(selectedWeek)}
                                            </span>
                                        </>
                                    )}
                                </h2>
                                <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handleNextMonth() : setSelectedWeek(selectedWeek < 16 ? selectedWeek + 1 : 16)}>&#8250;</button>
                            </div>

                            <div className="header-right-controls">
                                <button className="today-button" onClick={handleTodayClick}>오늘</button>
                                <button className="header-icon-button add-event" onClick={onAddEvent}><BiPlus /></button>
                                <button className="header-icon-button" onClick={() => setIsHelpModalOpen(true)}><BiHelpCircle /></button>
                                {user && user.userType === 'admin' && (
                                    <button className="header-icon-button" onClick={() => setIsSemesterPickerOpen(true)}>
                                        <IoSettingsSharp />
                                    </button>
                                )}
                                <div className="view-switcher">
                                    <button onClick={() => { setCalendarViewMode('schedule'); setSearchResults(null); }} className={calendarViewMode === 'schedule' ? 'active' : ''}>일정</button>
                                    <button onClick={() => { setCalendarViewMode('calendar'); setSearchResults(null); }} className={calendarViewMode === 'calendar' ? 'active' : ''}>달력</button>
                                </div>
                                <div className="view-switcher">
                                    <button onClick={() => setViewMode('monthly')} className={viewMode === 'monthly' ? 'active' : ''}>월간</button>
                                    <button onClick={() => {
                                        setViewMode('weekly');
                                        const today = new Date();
                                        goToDate(today);
                                        
                                        if (semesterStartDate) {
                                            const semesterStart = new Date(semesterStartDate);
                                            const todayDate = new Date();

                                            semesterStart.setHours(0, 0, 0, 0);
                                            todayDate.setHours(0, 0, 0, 0);

                                            const semesterWeekStart = new Date(semesterStart);
                                            semesterWeekStart.setDate(semesterStart.getDate() - semesterStart.getDay());

                                            const diffTime = todayDate.getTime() - semesterWeekStart.getTime();
                                            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

                                            setSelectedWeek(diffWeeks + 1);
                                        }
                                    }} className={viewMode === 'weekly' ? 'active' : ''}>주간</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
            {calendarViewMode === 'calendar' ? (
                viewMode === 'monthly' ? (
                    <div className="calendar-body-container">
                        <div className="day-wrapper">
                            {weeks.map((week, index) => (
                                <div className={`calendar-item ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`} key={week}>{week}</div>
                            ))}
                        </div>
                        <div className="day-wrapper">
                            {daysInMonth.map((date) => {
                                const dayEvents = (eventLayouts.get(date.date) || []).filter((e): e is Event => e !== null);
                                const isSelected = formatDate(selectedDate.date) === date.date;
                                const isToday = new Date().toISOString().split('T')[0] === date.date;
                                const isSunday = date.dayIndexOfWeek === 0;
                                const isSaturday = date.dayIndexOfWeek === 6;
                                const isCurrentMonth = currentDate.month === date.month;
                                const isHoliday = dayEvents.some(e => e.isHoliday);

                                return (
                                    <div
                                        onClick={() => {
                                            const parts = date.date.split('-').map(Number);
                                            const clickedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                                            selectedDate.selectDate(clickedDate);
                                            onAddEvent();
                                        }}
                                        className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${isHoliday ? 'holiday' : ''}`}
                                        key={date.date}>
                                        <span className="day-number">{date.day}</span>
                                    </div>
                                );
                            })}
                            {eventElements}
                            {moreButtonElements}
                        </div>
                    </div>
                ) : (
                    <WeeklyCalendar selectedWeek={selectedWeek} onAddEvent={onAddEvent} onSelectEvent={onSelectEvent} />
                )
            ) : (
                <ScheduleView />
            )}

            <SemesterPickerModal
                isOpen={isSemesterPickerOpen}
                onClose={() => setIsSemesterPickerOpen(false)}
                onSave={onSave}
            />

            {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
        </div>
    );
};

export default Calendar;
