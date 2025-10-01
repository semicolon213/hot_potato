import React, { useState, useEffect, useMemo } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import useCalendarContext, { type Event, type DateRange, type CustomPeriod } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';
import ScheduleView from './ScheduleView';
import { RRule } from 'rrule';
import { findSpreadsheetById, fetchCalendarEvents } from '../../../../utils/google/spreadsheetManager';
import { initializeGoogleAPIOnce } from '../../../../utils/google/googleApiInitializer';

interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, rect: DOMRect) => void;
    viewMode: 'monthly' | 'weekly';
    setViewMode: (mode: 'monthly' | 'weekly') => void;
    selectedWeek: number;
    setSelectedWeek: (week: number) => void;
    onSave: (scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        midtermExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }) => Promise<void>;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent, onSelectEvent, viewMode, setViewMode, selectedWeek, setSelectedWeek, onSave}) => {

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
        filterLabels,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        date: string;
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });

    const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState("");
    const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
    const [calendarViewMode, setCalendarViewMode] = useState<'schedule' | 'calendar'>('calendar');
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<{ title: string; tag: string }[]>([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

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

    useEffect(() => {
        const terms = searchTerm.split(' ').filter(Boolean);
        const latestTerm = terms[terms.length - 1];
        if (latestTerm) {
            addRecentSearch(latestTerm);
        }
    }, [searchTerm]);

    const [suggestionSource, setSuggestionSource] = useState<{ title: string; tag: string }[]>([]);

    useEffect(() => {
        const loadSuggestions = async () => {
            await initializeGoogleAPIOnce(null);
            
            const year = currentDate.year;
            const timeMin = new Date(year, 0, 1).toISOString();
            const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();

            const sheetPromise = (async () => {
                const sheetId = await findSpreadsheetById('calendar_student');
                if (sheetId) {
                    const events = await fetchCalendarEvents(null, sheetId, '시트1');
                    return events
                        ? events
                            .filter(e => {
                                if (typeof e.startDate === 'string' && e.startDate.includes('-')) {
                                    const eventYear = parseInt(e.startDate.split('-')[0], 10);
                                    if (!isNaN(eventYear)) {
                                        return eventYear === year;
                                    }
                                }
                                return false;
                            })
                            .map(e => ({ 
                                title: e.title, 
                                tag: e.type, 
                                startDate: e.startDate, 
                                endDate: e.endDate 
                            }))
                            .filter(e => e.title)
                        : [];
                }
                return [];
            })();

            const calendarPromise = (async () => {
                try {
                    const response = await (window as any).gapi.client.calendar.events.list({
                        'calendarId': 'primary',
                        'maxResults': 250,
                        'singleEvents': true,
                        'orderBy': 'startTime',
                        timeMin,
                        timeMax
                    });
                    const items = response.result.items || [];
                    return items
                        .map((item: any) => {
                            const startDate = item.start?.date || item.start?.dateTime?.split('T')[0] || '';
                            const endDate = item.end?.date || item.end?.dateTime?.split('T')[0] || '';
                            return {
                                title: item.summary,
                                tag: '개인 일정',
                                startDate: startDate,
                                endDate: endDate || startDate
                            };
                        })
                        .filter(item => item.title);
                } catch (error) {
                    console.error("Error fetching Google Calendar events:", error);
                    return [];
                }
            })();

            const holidayPromise = (async () => {
                try {
                    const holidayCalendarId = 'ko.south_korea#holiday@group.v.calendar.google.com';
                    const response = await (window as any).gapi.client.calendar.events.list({
                        'calendarId': holidayCalendarId,
                        'maxResults': 50,
                        'singleEvents': true,
                        'orderBy': 'startTime',
                        timeMin,
                        timeMax
                    });
                    const items = response.result.items || [];
                    return items.map((item: any) => {
                        const startDate = item.start?.date || item.start?.dateTime?.split('T')[0] || '';
                        const endDate = item.end?.date || item.end?.dateTime?.split('T')[0] || '';
                        return {
                            title: item.summary,
                            tag: '공휴일',
                            startDate: startDate,
                            endDate: endDate || startDate
                        };
                    }).filter(item => item.title);
                } catch (error) {
                    console.error("Error fetching holiday calendar events:", error);
                    return [];
                }
            })();

            const [sheetSuggestions, calendarSuggestions, holidaySuggestions] = await Promise.all([sheetPromise, calendarPromise, holidayPromise]);

            const combinedSource = [...sheetSuggestions, ...calendarSuggestions, ...holidaySuggestions];

            combinedSource.sort((a, b) => {
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

            setSuggestionSource(combinedSource);
        };

        loadSuggestions();
    }, [currentDate.year]);

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

    const handleFilterChange = (filter: string) => {
        if (filter === 'all') {
            setActiveFilters(['all']);
            goToDate(new Date()); // Navigate home
            return;
        }

        const newFilters = activeFilters.includes('all')
            ? [filter] // If 'all' is selected, start a new selection
            : activeFilters.includes(filter)
                ? activeFilters.filter(f => f !== filter) // Deselect if already selected
                : [...activeFilters, filter]; // Add to selection

        // If all filters are deselected, select 'all' again and navigate home
        if (newFilters.length === 0) {
            setActiveFilters(['all']);
            goToDate(new Date());
        } else {
            setActiveFilters(newFilters);
        }
    };

    useEffect(() => {
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
    }, [events, midtermExamsPeriod, finalExamsPeriod]);

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

    const handleMoreClick = (dayEvents: Event[], date: string, e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const modalWidth = 250;
        const modalHeight = 200;
        const { innerWidth, innerHeight } = window;
        let { top, left } = rect;
        if (left + modalWidth > innerWidth) {
            left = innerWidth - modalWidth - 20;
        }
        if (top + modalHeight > innerHeight) {
            top = innerHeight - modalHeight - 60;
        }
        setMoreEventsModal({
            isOpen: true,
            events: dayEvents,
            date: date,
            position: { top, left },
        });
    };

    const handleEventClick = (event: Event, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectEvent(event, e.currentTarget.getBoundingClientRect());
    };

    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleAddCustomPeriod = () => {
        if (!newPeriodName.trim()) {
            alert('추가할 항목의 이름을 입력해주세요.');
            return;
        }
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: newPeriodName,
            period: { start: null, end: null },
        };
        setCustomPeriods([...customPeriods, newPeriod]);
        setNewPeriodName("");
    };

    const handleAddMakeupPeriod = () => {
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: "보강기간",
            period: { start: null, end: null },
        };
        setCustomPeriods([...customPeriods, newPeriod]);
    };

    const handleDateChange = (setter: (date: Date) => void, value: string) => {
        if (value) {
            const newDate = new Date(value);
            if (!isNaN(newDate.getTime())) {
                setter(newDate);
            }
        }
    };


    const handleCustomPeriodChange = (id: string, part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        const periodToUpdate = customPeriods.find(p => p.id === id);
        if (!periodToUpdate) return;

        const updatedPeriods = customPeriods.map(p => {
            if (p.id === id) {
                return { ...p, period: { ...p.period, [part]: newDate } };
            }
            return p;
        });
        setCustomPeriods(updatedPeriods);
    };

    const handleFinalExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setFinalExamsPeriod({ ...finalExamsPeriod, [part]: newDate });
    };

    const handleMidtermExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setMidtermExamsPeriod({ ...midtermExamsPeriod, [part]: newDate });
    };

    const handleGradeEntryPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setGradeEntryPeriod({ ...gradeEntryPeriod, [part]: newDate });
    };

    const handleDeleteCustomPeriod = (id: string) => {
        if (window.confirm('이 항목을 정말로 삭제하시겠습니까?')) {
            const updatedPeriods = customPeriods.filter(p => p.id !== id);
            setCustomPeriods(updatedPeriods);
        }
    };

    const handleSave = async () => {
        // Validate custom periods before saving
        for (const p of customPeriods) {
            if (!p.period.start || !p.period.end) {
                alert(`'${p.name}' 기간의 시작일과 종료일을 모두 설정해주세요.`);
                return;
            }
        }

        // Validate all periods before saving
        const allPeriods = [
            { name: '기말고사', period: finalExamsPeriod },
            { name: '성적입력 및 강의평가', period: gradeEntryPeriod },
            ...customPeriods.map(p => ({ name: p.name, period: p.period }))
        ];

        for (const item of allPeriods) {
            const { start, end } = item.period;
            if (start && end && start > end) {
                alert(`'${item.name}' 기간의 종료일은 시작일보다 빠를 수 없습니다.`);
                return; // Stop saving
            }
        }

        await onSave({
            semesterStartDate,
            finalExamsPeriod,
            midtermExamsPeriod,
            gradeEntryPeriod,
            customPeriods
        });
        setIsSemesterPickerOpen(false);
    };

    const handleCloseWithoutSaving = () => {
        if (window.confirm('저장 되지 않습니다. 그래도 닫겠습니까?')) {
            setIsSemesterPickerOpen(false);
        }
    };

    const weeksInMonth = useMemo(() => {
        const weeksArr: any[][] = [];
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

            const lanes: (Date | null)[] = [];
            for (const event of weekEvents) {
                const eventStart = new Date(event.startDate);
                let laneIndex = lanes.findIndex(laneEndDate => laneEndDate && laneEndDate < eventStart);
                if (laneIndex === -1) {
                    laneIndex = lanes.length;
                }
                const eventEnd = new Date(event.endDate);
                lanes[laneIndex] = eventEnd;

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

                    eventElements.push(
                        <div
                            key={`${event.id}-${day.date}`}
                            className={`monthly-event-item ${isContinuationLeft ? 'continuation-left' : ''} ${isContinuationRight ? 'continuation-right' : ''}`}
                            style={{
                                top: `${(weekIndex * (dayHeight + 10)) + dateHeaderHeight + (laneIndex * eventHeight)}px`,
                                left: `${(dayOfWeek / 7) * 100}%`,
                                width: `calc(${(span / 7) * 100}% - 4px)`,
                                backgroundColor: event.color,
                                marginLeft: '2px',
                                marginRight: '2px',
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
                                handleMoreClick(dayEvents, day.date, e);
                            }}
                        >
                            {moreCount}개 더보기
                        </div>
                    );
                }
            });
        });

        return { eventElements, moreButtonElements };
    }, [eventLayouts, weeksInMonth, handleEventClick, handleMoreClick, selectedEvent]);

    const getWeekDatesText = (weekNum: number) => {
        if (!semesterStartDate || isNaN(semesterStartDate.getTime())) return '';
        const start = new Date(semesterStartDate);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`;
    };

    const handleRemoveTerm = (termToRemove: string) => {
        const newSearchTerm = searchTerm
            .split(' ')
            .filter(t => t !== termToRemove)
            .join(' ');
        setSearchTerm(newSearchTerm);
    };

    const formatSuggestionDate = (startDateStr: string, endDateStr: string) => {
        if (!startDateStr) return '';
        const format = (dateStr: string) => {
            try {
                const date = new Date(dateStr);
                date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            } catch (e) {
                return '';
            }
        };
        const start = format(startDateStr);
        const end = format(endDateStr || startDateStr);
        if (start === end) return start;
        return `${start} ~ ${end}`;
    };

    return (
        <>
            <div className="calendar-header-container">
                <div className='calendar-header-top' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="calendar-title" style={{display: 'flex', alignItems: 'center', gap: '15px', visibility: calendarViewMode === 'calendar' ? 'visible' : 'hidden'}}>
                        <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handlePrevMonth() : setSelectedWeek(selectedWeek > 1 ? selectedWeek - 1 : 1)}>&#8249;</button>
                        <h2>
                            {viewMode === 'monthly' ? (
                                `${currentDate.year}년 ${currentDate.month}월`
                            ) : (
                                `${selectedWeek}주차`
                            )}
                        </h2>
                        <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handleNextMonth() : setSelectedWeek(selectedWeek < 15 ? selectedWeek + 1 : 15)}>&#8250;</button>
                        <div className="search-wrapper">
                            <div className="search-container" style={{ height: '36px', maxWidth: '250px' }}>
                                <i>&#x1F50D;</i>
                                <input
                                    type="text"
                                    placeholder="일정 검색..."
                                    className={`search-input ${inputValue.includes('#') ? 'has-hashtags' : ''}`}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onFocus={() => setIsSuggestionsVisible(true)}
                                    onBlur={() => {
                                        setTimeout(() => setIsSuggestionsVisible(false), 150);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing && inputValue.trim() !== '') {
                                            e.preventDefault();
                                            const newTerm = `#${inputValue.trim()}`;
                                            const existingTerms = searchTerm.split(' ').filter(Boolean);
                                            if (!existingTerms.includes(newTerm)) {
                                                setSearchTerm([...existingTerms, newTerm].join(' '));
                                            }
                                            setInputValue('');
                                        }
                                    }}
                                />
                                {isSuggestionsVisible && suggestions.length > 0 && (
                                    <ul className="search-suggestions">
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                onMouseDown={() => {
                                                    const formattedTerm = `#${suggestion.title}`;
                                                    const existingTerms = searchTerm.split(' ').filter(Boolean);
                                                    if (!existingTerms.includes(formattedTerm)) {
                                                        setSearchTerm([...existingTerms, formattedTerm].join(' '));
                                                    }

                                                    if (suggestion.startDate) {
                                                        try {
                                                            const targetDate = new Date(suggestion.startDate);
                                                            if (!isNaN(targetDate.getTime())) {
                                                                goToDate(targetDate);
                                                            }
                                                        } catch (e) {
                                                            console.error("Failed to parse date from suggestion:", suggestion.startDate, e);
                                                        }
                                                    }

                                                    setInputValue('');
                                                    setSuggestions([]);
                                                }}
                                            >
                                                <span className="suggestion-title">{suggestion.title}</span>
                                                <span className="suggestion-date">{formatSuggestionDate(suggestion.startDate, suggestion.endDate)}</span>
                                                <span className="suggestion-tag">{suggestion.tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="search-tags-container">
                                {searchTerm.split(' ').filter(Boolean).map(term => (
                                    <div key={term} className="search-tag">
                                        {term}
                                        <button onClick={() => handleRemoveTerm(term)}>x</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {viewMode === 'weekly' && <span style={{fontSize: '14px', color: 'var(--text-medium)'}}>{getWeekDatesText(selectedWeek)}</span>}
                    </div>
                    <div className="header-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {user && user.isAdmin && (
                            <IoSettingsSharp onClick={() => setIsSemesterPickerOpen(true)} style={{ cursor: 'pointer', fontSize: '25px' }} />
                        )}
                        <div className="view-switcher">
                            <button onClick={() => setCalendarViewMode('schedule')} className={calendarViewMode === 'schedule' ? 'active' : ''}>일정</button>
                            <button onClick={() => setCalendarViewMode('calendar')} className={calendarViewMode === 'calendar' ? 'active' : ''}>달력</button>
                        </div>
                        <div className="view-switcher">
                            <button onClick={() => setViewMode('monthly')} className={viewMode === 'monthly' ? 'active' : ''}>월간</button>
                            <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>주간</button>
                        </div>
                        <div className="filter-tags-container">
                            {['all', ...eventTypes.filter(f => f !== 'exam')].map(filter => (
                                <button
                                    key={filter}
                                    className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(filter)}
                                >
                                    {filterLabels[filter] || filter}
                                </button>
                            ))}
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                    className={`filter-tag ${activeFilters.includes('midterm_exam') || activeFilters.includes('final_exam') ? 'active' : ''}`}
                                    onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                                >
                                    시험
                                </button>
                                {isExamDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        backgroundColor: '#f9f9f9',
                                        minWidth: '120px',
                                        boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                                        zIndex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}>
                                        <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeFilters.includes('midterm_exam')}
                                                onChange={() => handleFilterChange('midterm_exam')}
                                                style={{ marginRight: '8px' }}
                                            />
                                            중간고사
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeFilters.includes('final_exam')}
                                                onChange={() => handleFilterChange('final_exam')}
                                                style={{ marginRight: '8px' }}
                                            />
                                            기말고사
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
                                const isSelected = selectedDate.date === date.date;
                                const isSunday = date.dayIndexOfWeek === 0;
                                const isSaturday = date.dayIndexOfWeek === 6;
                                const isCurrentMonth = currentDate.month === date.month;
                                const isHoliday = dayEvents.some(e => e.isHoliday);

                                return (
                                    <div
                                        onClick={() => {
                                            selectedDate.selectDate(new Date(date.date));
                                            onAddEvent();
                                        }}
                                        className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${isHoliday ? 'holiday' : ''}`}
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
                    <WeeklyCalendar selectedWeek={selectedWeek} />
                )
            ) : (
                <ScheduleView />
            )}
            {moreEventsModal.isOpen && (
                <MoreEventsModal
                    events={moreEventsModal.events}
                    date={moreEventsModal.date}
                    onClose={() => setMoreEventsModal({ ...moreEventsModal, isOpen: false })}
                    position={moreEventsModal.position}
                    onSelectEvent={(event, e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onSelectEvent(event, rect); // Call the parent's onSelectEvent
                        setMoreEventsModal({ ...moreEventsModal, isOpen: false });
                    }}
                />
            )}
            {isSemesterPickerOpen && (
                <div className="semester-picker-overlay" onClick={handleCloseWithoutSaving}>
                    <div className="semester-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="date-selector-row">
                            <label htmlFor="semester-start-date">개강일</label>
                            <input
                                id="semester-start-date"
                                type="date"
                                value={formatDateForInput(semesterStartDate)}
                                onChange={(e) => handleDateChange(setSemesterStartDate, e.target.value)}
                            />
                        </div>
                        <div className="date-selector-row">
                            <label>중간고사</label>
                            <input
                                type="date"
                                value={formatDateForInput(midtermExamsPeriod.start)}
                                onChange={(e) => handleMidtermExamsPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(midtermExamsPeriod.end)}
                                onChange={(e) => handleMidtermExamsPeriodChange('end', e.target.value)}
                            />
                        </div>
                        <div className="date-selector-row">
                            <label>기말고사</label>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.start)}
                                onChange={(e) => handleFinalExamsPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.end)}
                                onChange={(e) => handleFinalExamsPeriodChange('end', e.target.value)}
                            />
                        </div>
                        <div className="date-selector-row">
                            <label>성적입력 및 강의평가</label>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.start)}
                                onChange={(e) => handleGradeEntryPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.end)}
                                onChange={(e) => handleGradeEntryPeriodChange('end', e.target.value)}
                            />
                        </div>

                        {customPeriods.map(p => (
                            <div key={p.id} className="date-selector-row">
                                <label>{p.name}</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(p.period.start)}
                                    onChange={(e) => handleCustomPeriodChange(p.id, 'start', e.target.value)}
                                />
                                <span>~</span>
                                <input
                                    type="date"
                                    value={formatDateForInput(p.period.end)}
                                    onChange={(e) => handleCustomPeriodChange(p.id, 'end', e.target.value)}
                                />
                                <button onClick={() => handleDeleteCustomPeriod(p.id)} className="delete-period-btn">삭제</button>
                            </div>
                        ))}

                        <div className="add-period-form" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="항목 이름"
                                    value={newPeriodName}
                                    onChange={(e) => setNewPeriodName(e.target.value)}
                                />
                                <button onClick={handleAddCustomPeriod}>추가</button>
                            </div>
                            <div style={{ position: 'absolute', right: 0 }}>
                                <button onClick={handleAddMakeupPeriod}>보강</button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={handleSave} className="done-btn">완료</button>
                            <button onClick={handleCloseWithoutSaving} className="close-btn">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Calendar;