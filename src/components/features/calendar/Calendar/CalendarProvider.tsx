import React, {useState, useMemo, useEffect, type ReactNode} from "react";
import {
    CalendarContext,
    type Event,
    type DateRange,
    type CustomPeriod
} from "../../../../hooks/features/calendar/useCalendarContext.ts";
import {type User, type Student, type Staff} from "../../../../types/app";

// Google Calendar API 타입 정의
interface GoogleApiColor {
  background: string;
  foreground: string;
}

interface GoogleApiEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  colorId?: string;
}

interface GoogleApiRequestBody {
  summary?: string;
  description?: string;
  colorId?: string;
  start: { date?: string; dateTime?: string; timeZone: string };
  end: { date?: string; dateTime?: string; timeZone: string };
}

const eventTypeStyles: { [key: string]: { color: string; icon: string } } = {
    holiday: {color: '#EA4335', icon: '🏖️'},
    exam: {color: '#4285F4', icon: '✍️'},
    assignment: {color: '#FBBC05', icon: '🔔'},
    event: {color: '#FBBC05', icon: '🎉'}, // Changed to Yellow
    makeup: {color: '#A142F4', icon: '✨'},
    meeting: {color: '#34A853', icon: '🤝'}, // Changed to Green
    '공용일정': {color: '#A5D6A7', icon: '🗓️'},
    default: {color: '#7986CB', icon: ''},
};


interface CalendarProviderProps {
    children: ReactNode;
    user: User | null;
    accessToken: string | null;
    sheetEvents: Event[];
    addSheetEvent: (event: Omit<Event, 'id'>) => Promise<void>;
    updateSheetEvent: (eventId: string, event: Omit<Event, 'id'>) => Promise<void>;
    deleteSheetEvent: (eventId: string) => Promise<void>;
    semesterStartDate: Date;
    setSemesterStartDate: (date: Date) => void;
    finalExamsPeriod: DateRange;
    setFinalExamsPeriod: (period: DateRange) => void;
    midtermExamsPeriod: DateRange;
    setMidtermExamsPeriod: (period: DateRange) => void;
    gradeEntryPeriod: DateRange;
    setGradeEntryPeriod: (period: DateRange) => void;
    customPeriods: CustomPeriod[];
    setCustomPeriods: (periods: CustomPeriod[]) => void;
    students: Student[];
    staff: Staff[];
}

const CalendarProvider: React.FC<CalendarProviderProps> = ({
                                                               children,
                                                               user,
                                                               accessToken,
                                                               sheetEvents,
                                                               addSheetEvent, // Add missing prop
                                                               updateSheetEvent,
                                                               deleteSheetEvent,
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
                                                               students,
                                                               staff,
                                                           }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedEventPosition, setSelectedEventPosition] = useState<{
        top: number;
        left: number
    } | undefined>(undefined);
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = () => setRefreshKey(prevKey => prevKey + 1);
    const [eventColors, setEventColors] = useState<Record<string, GoogleApiColor>>({});
    const [calendarColor, setCalendarColor] = useState<string | undefined>();
    const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
    const [isFetchingGoogleEvents, setIsFetchingGoogleEvents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterChange = (filter: string) => {
        if (filter === 'all') {
            setActiveFilters(['all']);
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
        } else {
            setActiveFilters(newFilters);
        }
    };

    const eventTypes = ['holiday', 'exam', 'event', 'makeup', 'meeting', 'personal'];
    const filterLabels: { [key: string]: string } = {
        all: '전체',
        holiday: '휴일/휴강',
        exam: '시험',
        midterm_exam: '중간고사',
        final_exam: '기말고사',
        event: '행사',
        makeup: '보강',
        meeting: '회의',
        personal: '개인일정',
    };

    useEffect(() => {
        if (!accessToken) return;

        const fetchCalendarData = async () => {
            try {
                const colorsResponse = await fetch(
                    `https://www.googleapis.com/calendar/v3/colors`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (!colorsResponse.ok) {
                    throw new Error(`Error fetching colors: ${colorsResponse.statusText}`);
                }
                const colorsData = await colorsResponse.json();
                setEventColors(colorsData.event);

                const calendarResponse = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (!calendarResponse.ok) {
                    throw new Error(`Error fetching calendar info: ${calendarResponse.statusText}`);
                }
                const calendarData = await calendarResponse.json();
                setCalendarColor(calendarData.backgroundColor);

            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            }
        };

        fetchCalendarData();
    }, [accessToken]); // accessToken이 실제로 변경될 때만 실행

    useEffect(() => {
        if (!accessToken) return;

        const fetchGoogleEvents = async () => {
            setIsFetchingGoogleEvents(true);
            try {
                const year = currentDate.getFullYear();
                const timeMin = new Date(year, 0, 1).toISOString();
                const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();

                const primaryCalendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&fields=items(id,summary,start,end,description,colorId)`;
                const holidayCalendarUrl = `https://www.googleapis.com/calendar/v3/calendars/ko.south_korea%23holiday%40group.v.calendar.google.com/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&fields=items(id,summary,start,end,description,colorId)`;

                const headers = {
                    Authorization: `Bearer ${accessToken}`,
                };

                const [primaryResponse, holidayResponse] = await Promise.all([
                    fetch(primaryCalendarUrl, {headers}),
                    fetch(holidayCalendarUrl, {headers}),
                ]);

                if (!primaryResponse.ok) {
                    throw new Error(`Error fetching Google Calendar events: ${primaryResponse.statusText}`);
                }
                if (!holidayResponse.ok) {
                    console.warn(`Could not fetch holiday calendar: ${holidayResponse.statusText}`);
                }

                const primaryData = await primaryResponse.json();
                const holidayData = holidayResponse.ok ? await holidayResponse.json() : {items: []};

                const transformEvent = (item: GoogleApiEventItem, isHoliday: boolean = false): Event | null => {
                    try {
                        const startStr = item.start.date || item.start.dateTime;
                        const endStr = item.end.date || item.end.dateTime;

                        if (!startStr || !endStr) {
                            return null;
                        }

                        let endDate = endStr.split('T')[0];
                        const startDate = startStr.split('T')[0];

                        // If it's an all-day event, the end date from Google is exclusive.
                        // We need to make it inclusive for our rendering logic (<=).
                        // Only do this if the end date is after the start date, to handle malformed events.
                        if (item.start.date && endDate > startDate) { // Check if it's an all-day event
                            const date = new Date(endDate);
                            date.setDate(date.getDate() - 1); // Subtract one day
                            endDate = date.toISOString().split('T')[0];
                        }

                        return {
                            id: item.id,
                            title: item.summary || 'No Title',
                            startDate: startDate,
                            endDate: endDate,
                            startDateTime: item.start.dateTime,
                            endDateTime: item.end.dateTime,
                            description: item.description || '',
                            colorId: item.colorId,
                            isHoliday: isHoliday,
                        };
                    } catch (e) {
                        console.error("Failed to transform event item:", item, e);
                        return null;
                    }
                };

                const primaryEvents = (primaryData.items || []).map((item: GoogleApiEventItem) => transformEvent(item, false));
                const holidayEvents = (holidayData.items || []).map((item: GoogleApiEventItem) => transformEvent(item, true));

                const transformedEvents: Event[] = [...primaryEvents, ...holidayEvents].filter(Boolean) as Event[];
                setGoogleEvents(transformedEvents);

            } catch (error) {
                console.error("Failed to fetch Google Calendar events:", error);
                setGoogleEvents([]);
            } finally {
                setIsFetchingGoogleEvents(false);
            }
        };

        fetchGoogleEvents();
    }, [accessToken, currentDate.getFullYear(), refreshKey]);

  const unfilteredEvents = useMemo(() => {
    const visibleSheetEvents = sheetEvents.filter(event => {
      const attendees = (event as Event).attendees;
      if (!attendees || attendees.trim() === '') {
        return true; // Public event, visible to all
      }

            // Private event, visible only to attendees
            const attendeeIds = attendees.split(',').map((id: string) => id.trim());
            // Assuming user.studentId holds the unique ID for both students and staff
            return user ? attendeeIds.includes(user.studentId) : false;
        });

        const combinedEvents = [...visibleSheetEvents, ...googleEvents];

        const uniqueEvents = combinedEvents.filter(
            (event, index, self) =>
                index ===
                self.findIndex(
                    (e) =>
                        e.title === event.title &&
                        e.startDate === event.startDate &&
                        e.endDate === event.endDate
                )
        );

        return uniqueEvents.sort((a, b) => {
            const startDateA = new Date(a.startDate).getTime();
            const startDateB = new Date(b.startDate).getTime();

            if (startDateA !== startDateB) {
                return startDateA - startDateB;
            }

            // If start dates are the same, sort by duration descending
            const durationA = new Date(a.endDate).getTime() - startDateA;
            const durationB = new Date(b.endDate).getTime() - startDateB;

            return durationB - durationA;
        });
    }, [googleEvents, sheetEvents, user]);

    const filteredEvents = useMemo(() => {
        const tagKeyMap: { [key: string]: string } = {
          '휴일/휴강': 'holiday',
          '행사': 'event',
          '보강': 'makeup',
          '시험': 'exam',
          '회의': 'meeting',
        };

        // If a search term is provided, filter all events by search.
        // Otherwise, filter events by the active tags.
        const eventsToDisplay = searchTerm
            ? unfilteredEvents.filter(event => {
                // For debugging: Log the data being processed
                // console.log(`[Search Debug] Event: "${event.title}", Type: "${event.type}", SearchTerm: "${searchTerm}"`);

                const queries = searchTerm.toLowerCase().split(' ').filter(q => q.startsWith('#'));

                if (queries.length === 0) {
                    const lowercasedSearchTerm = searchTerm.toLowerCase();
                    const titleMatch = event.title.toLowerCase().includes(lowercasedSearchTerm);
                    const typeMatch = event.type && event.type.toLowerCase().includes(lowercasedSearchTerm);
                    const isGooglePersonalEvent = !event.isHoliday && !event.type;
                    const personalMatch = isGooglePersonalEvent && ('개인일정'.includes(lowercasedSearchTerm) || '개인'.includes(lowercasedSearchTerm));
                    return titleMatch || typeMatch || personalMatch;
                }

                return queries.every(query => {
                    const cleanQuery = query.substring(1);
                    if (cleanQuery === '') return true;

                    const titleMatch = event.title.toLowerCase().includes(cleanQuery);
                    const typeMatch = event.type && event.type.toLowerCase().includes(cleanQuery);
                    const isGooglePersonalEvent = !event.isHoliday && !event.type;
                    const personalMatch = isGooglePersonalEvent && ('개인일정'.includes(cleanQuery) || '개인'.includes(cleanQuery));

                    // For debugging: Log matching results for each query
                    // console.log(`  - Query: "${cleanQuery}", TitleMatch: ${titleMatch}, TypeMatch: ${typeMatch}, PersonalMatch: ${personalMatch}`);

                    return titleMatch || typeMatch || personalMatch;
                });
            })
            : activeFilters.includes('all')
                ? unfilteredEvents
                : unfilteredEvents.filter(event => {
                    if (event.type === '공용일정') {
                        return true;
                    }
                    const eventType = event.type || '';
                    const eventTitle = event.title || '';
                    let isVisible = false;
                    for (const filter of activeFilters) {
                        switch (filter) {
                            case 'holiday':
                                if (event.isHoliday) isVisible = true;
                                break;
                            case 'exam':
                                if (eventType === '시험') isVisible = true;
                                break;
                            case 'midterm_exam':
                                if (eventType === 'exam' && eventTitle === '중간고사') isVisible = true;
                                break;
                            case 'final_exam':
                                if (eventType === 'exam' && eventTitle === '기말고사') isVisible = true;
                                break;
                            case 'personal':
                                if (!event.isHoliday && !event.type) isVisible = true;
                                break;
                            default:
                                if (eventType === filter) isVisible = true;
                                break;
                        }
                        if (isVisible) break;
                    }
                    return isVisible;
                });

    return eventsToDisplay
      .map(event => {
        let color;
        const eventTypeKey = tagKeyMap[event.type || ''] || event.type;

        if (event.color) { // Custom color from sheet
            color = event.color;
        } else if (eventTypeKey && eventTypeStyles[eventTypeKey]) { // Sheet events by type
            color = eventTypeStyles[eventTypeKey].color;
        } else if (event.isHoliday) { // Holiday events
            color = '#F08080';
        } else { // Personal Google Calendar events
            color = '#7986CB';
        }

                return {
                    ...event,
                    color: color,
                };
            });
    }, [unfilteredEvents, activeFilters, searchTerm]);

    const handlePrevYear = () => {
        setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)));
    };

    const handleNextYear = () => {
        setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)));
    };

    const handlePrevMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const selectDate = (date: Date) => {
        setSelectedDate(date);
    };

    const addGoogleEvent = async (event: Omit<Event, 'id'>) => {
        if (!accessToken) {
            console.error("No access token provided.");
            return;
        }

        try {
            const requestBody: Partial<GoogleApiRequestBody> = {
                summary: event.title,
                description: event.description,
                colorId: event.colorId,
            };

            if (event.startDateTime && event.endDateTime) {
                requestBody.start = {dateTime: event.startDateTime, timeZone: 'Asia/Seoul'};
                requestBody.end = {dateTime: event.endDateTime, timeZone: 'Asia/Seoul'};
            } else {
                const exclusiveEndDate = new Date(event.endDate);
                exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
                requestBody.start = {date: event.startDate};
                requestBody.end = {date: exclusiveEndDate.toISOString().split('T')[0]};
            }

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                throw new Error(`Error creating Google Calendar event: ${response.statusText}`);
            }

            await response.json();
            triggerRefresh();

        } catch (error) {
            console.error("Failed to create Google Calendar event:", error);
        }
    };

    const addEvent = (event: Omit<Event, 'id'>) => {
        addGoogleEvent(event);
    };

    const updateGoogleEvent = async (eventId: string, event: Omit<Event, 'id'>) => {
        if (!accessToken) {
            console.error("No access token provided.");
            return;
        }

        try {
            const requestBody: Partial<GoogleApiRequestBody> = {
                summary: event.title,
                description: event.description,
                colorId: event.colorId,
            };

            if (event.startDateTime && event.endDateTime) {
                requestBody.start = {dateTime: event.startDateTime, timeZone: 'Asia/Seoul'};
                requestBody.end = {dateTime: event.endDateTime, timeZone: 'Asia/Seoul'};
            } else {
                const exclusiveEndDate = new Date(event.endDate);
                exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
                requestBody.start = {date: event.startDate};
                requestBody.end = {date: exclusiveEndDate.toISOString().split('T')[0]};
            }

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                throw new Error(`Error updating Google Calendar event: ${response.statusText}`);
            }

            await response.json();
            triggerRefresh();

        } catch (error) {
            console.error("Failed to update Google Calendar event:", error);
        }
    };

    const updateEvent = (eventId: string, event: Omit<Event, 'id'>) => {
        if (eventId.includes('-cal-')) { // ID format check updated for consistency
            updateSheetEvent(eventId, event);
        }
        else {
            updateGoogleEvent(eventId, event);
        }
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const deleteGoogleEvent = async (eventId: string) => {
        if (!accessToken) {
            console.error("No access token provided.");
            return;
        }
        try {
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (response.status !== 204) {
                throw new Error(`Error deleting Google Calendar event: ${response.statusText}`);
            }
            triggerRefresh();
        } catch (error) {
            console.error("Failed to delete Google Calendar event:", error);
        }
    };

    const deleteEvent = (id: string) => {
        if (id.startsWith('cal-')) {
            deleteSheetEvent(id);
        } else {
            deleteGoogleEvent(id);
        }
        setSelectedEvent(null);
    };

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const days = [];

        const firstDayOfWeek = firstDayOfMonth.getDay();
        for (let i = firstDayOfWeek; i > 0; i--) {
            const date = new Date(year, month, 1 - i);
            days.push({
                year: String(date.getFullYear()),
                month: String(date.getMonth() + 1),
                day: String(date.getDate()),
                date: formatDate(date),
                dayIndexOfWeek: date.getDay(),
            });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({
                year: String(date.getFullYear()),
                month: String(date.getMonth() + 1),
                day: String(date.getDate()),
                date: formatDate(date),
                dayIndexOfWeek: date.getDay(),
            });
        }

        const lastDayOfWeek = lastDayOfMonth.getDay();
        for (let i = 1; i < 7 - lastDayOfWeek; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                year: String(date.getFullYear()),
                month: String(date.getMonth() + 1),
                day: String(date.getDate()),
                date: formatDate(date),
                dayIndexOfWeek: date.getDay(),
            });
        }

        return days;
    }, [currentDate]);

    const contextValue = {
        currentDate: {
            year: String(currentDate.getFullYear()),
            month: String(currentDate.getMonth() + 1),
            day: String(currentDate.getDate()),
        },
        daysInMonth,
        dispatch: {
            handlePrevYear,
            handleNextYear,
            handlePrevMonth,
            handleNextMonth,
        },
            selectedDate: {
              date: selectedDate, // Pass the full Date object
              selectDate,
            },
            events: filteredEvents,
            unfilteredEvents,
            addEvent,        updateEvent,
        deleteEvent,
        selectedEvent,
        setSelectedEvent: (event: Event | null, position?: { top: number; left: number }) => {
            setSelectedEvent(event);
            setSelectedEventPosition(position);
        },
        selectedEventPosition,
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
        triggerRefresh,
        eventColors,
        eventTypes,
        eventTypeStyles,
        activeFilters,
        setActiveFilters,
        user,
        goToDate: setCurrentDate,
        isFetchingGoogleEvents,
        searchTerm,
        setSearchTerm,
        filterLabels,
        formatDate, // Add this line
        handleFilterChange,
        addSheetEvent, // Correctly pass the prop function
        students,
        staff,
        extraWeeks: 0,
        setExtraWeeks: (weeks: number) => {
            console.log('Set extra weeks:', weeks);
        },
    };

    return (
        <CalendarContext.Provider value={contextValue}>
            {children}
        </CalendarContext.Provider>
    );
};

export default CalendarProvider;
