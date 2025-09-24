import React, { useState, useMemo, useEffect, type ReactNode } from "react";
import { CalendarContext, type Event, type DateRange, type CustomPeriod } from "../../hooks/useCalendarContext.ts";
import { type User } from "../../App.tsx";

const eventTypeStyles: { [key: string]: { color: string; icon: string } } = {
    holiday: { color: '#EA4335', icon: '🏖️' },
    exam: { color: '#4285F4', icon: '✍️' },
    assignment: { color: '#FBBC05', icon: '🔔' },
    event: { color: '#FBBC05', icon: '🎉' }, // Changed to Yellow
    makeup: { color: '#A142F4', icon: '✨' },
    meeting: { color: '#34A853', icon: '🤝' }, // Changed to Green
    default: { color: '#7986CB', icon: '' },
};

const getEventStyle = (event: Event) => {
    if (event.isHoliday) {
        return eventTypeStyles.holiday;
    }
    const type = event.type as keyof typeof eventTypeStyles;
    return eventTypeStyles[type] || eventTypeStyles.default;
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
}

const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  user,
  accessToken,
  sheetEvents,
  addSheetEvent,
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
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prevKey => prevKey + 1);
  const [eventColors, setEventColors] = useState<any>({});
  const [calendarColor, setCalendarColor] = useState<string | undefined>();
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  const eventTypes = ['holiday', 'exam', 'event', 'makeup', 'meeting'];

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
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchGoogleEvents = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1 - 7);
        const lastDayOfMonth = new Date(year, month + 1, 7);

        const timeMin = firstDayOfMonth.toISOString();
        const timeMax = lastDayOfMonth.toISOString();

        const primaryCalendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&fields=items(id,summary,start,end,description,colorId)`;
        const holidayCalendarUrl = `https://www.googleapis.com/calendar/v3/calendars/ko.south_korea%23holiday%40group.v.calendar.google.com/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&fields=items(id,summary,start,end,description,colorId)`;

        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        const [primaryResponse, holidayResponse] = await Promise.all([
          fetch(primaryCalendarUrl, { headers }),
          fetch(holidayCalendarUrl, { headers }),
        ]);

        if (!primaryResponse.ok) {
          throw new Error(`Error fetching Google Calendar events: ${primaryResponse.statusText}`);
        }
        if (!holidayResponse.ok) {
            console.warn(`Could not fetch holiday calendar: ${holidayResponse.statusText}`);
        }

        const primaryData = await primaryResponse.json();
        const holidayData = holidayResponse.ok ? await holidayResponse.json() : { items: [] };

        const transformEvent = (item: any, isHoliday: boolean = false): Event | null => {
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

        const primaryEvents = (primaryData.items || []).map((item: any) => transformEvent(item, false));
        const holidayEvents = (holidayData.items || []).map((item: any) => transformEvent(item, true));

        const transformedEvents: Event[] = [...primaryEvents, ...holidayEvents].filter(Boolean) as Event[];
        setGoogleEvents(transformedEvents);

      } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        setGoogleEvents([]);
      }
    };

    fetchGoogleEvents();
  }, [accessToken, currentDate, refreshKey]);

  const events = useMemo(() => {
    const combinedEvents = [...sheetEvents, ...googleEvents];

    const sortedEvents = combinedEvents.sort((a, b) => {
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

    const filteredEvents = activeFilters.includes('all')
        ? sortedEvents
        : sortedEvents.filter(event => {
            if (event.isHoliday && activeFilters.includes('holiday')) return true;
            // @ts-ignore
            const eventType = event.type as string;
            return activeFilters.includes(eventType);
        });

    return filteredEvents
      .map(event => {
        let color = calendarColor || '#7986CB'; // Default color
        if (event.type && eventTypeStyles[event.type]) {
            color = eventTypeStyles[event.type].color;
        } else if (event.colorId && eventColors && eventColors[event.colorId]) {
            color = eventColors[event.colorId].background;
        } else if (event.isHoliday) {
            color = '#F08080'; // Specific holiday color
        }

        return {
          ...event,
          color: color,
        };
      });
  }, [googleEvents, sheetEvents, eventColors, calendarColor, activeFilters]);

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
                  const requestBody: any = {
              summary: event.title,
              description: event.description,
              colorId: event.colorId,
            };

            if (event.startDateTime && event.endDateTime) {
              requestBody.start = { dateTime: event.startDateTime, timeZone: 'Asia/Seoul' };
              requestBody.end = { dateTime: event.endDateTime, timeZone: 'Asia/Seoul' };
            } else {
              const exclusiveEndDate = new Date(event.endDate);
              exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
              requestBody.start = { date: event.startDate };
              requestBody.end = { date: exclusiveEndDate.toISOString().split('T')[0] };
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
      const requestBody: any = {
        summary: event.title,
        description: event.description,
        colorId: event.colorId,
      };

      if (event.startDateTime && event.endDateTime) {
        requestBody.start = { dateTime: event.startDateTime, timeZone: 'Asia/Seoul' };
        requestBody.end = { dateTime: event.endDateTime, timeZone: 'Asia/Seoul' };
      } else {
        const exclusiveEndDate = new Date(event.endDate);
        exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
        requestBody.start = { date: event.startDate };
        requestBody.end = { date: exclusiveEndDate.toISOString().split('T')[0] };
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
    if (eventId.startsWith('cal-')) {
      updateSheetEvent(eventId, event);
    } else {
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
      date: formatDate(selectedDate),
      selectDate,
    },
    events,
    addEvent,
    addSheetEvent,
    updateEvent,
    deleteEvent,
    selectedEvent,
    setSelectedEvent,
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
  };

  return (
      <CalendarContext.Provider value={contextValue}>
        {children}
      </CalendarContext.Provider>
  );
};

export default CalendarProvider;