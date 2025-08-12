import React, { useState, useMemo, useEffect, type ReactNode } from "react";
import { CalendarContext, type Event } from "../../hooks/useCalendarContext.ts";

interface CalendarProviderProps {
  children: ReactNode;
  accessToken: string | null; // Add accessToken prop
  selectedRole: string; // Add selectedRole prop
}

const ROLE_PREFIX_MAP: { [key: string]: string[] } = {
  'admin': ['01', '02', '03'], // Example: Admin can see all
  'professor': ['02', '03'], // Example: Professor can see 02 and 03
  'student': ['03'], // Example: Student can see 03
};

const CalendarProvider: React.FC<CalendarProviderProps> = ({ children, accessToken, selectedRole }) => { // Destructure accessToken and selectedRole
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<Event[]>([]); // Rename events to localEvents
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]); // New state for Google events
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch Google Calendar events
  useEffect(() => {
    if (!accessToken) return;

    const fetchGoogleEvents = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const timeMin = firstDayOfMonth.toISOString();
        const timeMax = lastDayOfMonth.toISOString();

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching Google Calendar events: ${response.statusText}`);
        }

        const data = await response.json();
        const transformedEvents: Event[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.summary || 'No Title',
          startDate: item.start.date || item.start.dateTime.split('T')[0], // Handle all-day vs. specific time
          endDate: item.end.date || item.end.dateTime.split('T')[0],
          description: item.description || '',
        }));
        setGoogleEvents(transformedEvents);
      } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        setGoogleEvents([]); // Clear events on error
      }
    };

    fetchGoogleEvents();
  }, [accessToken, currentDate]); // Re-fetch when token or current month changes

  // Merge local and Google events, then filter by role
  const events = useMemo(() => {
    const allEvents = [...localEvents, ...googleEvents];
    const allowedPrefixes = ROLE_PREFIX_MAP[selectedRole] || [];

    if (allowedPrefixes.length === 0) {
      return []; // If no prefixes are allowed for the role, return empty
    }

    return allEvents.filter(event => {
      const title = event.title || '';
      const prefixMatch = title.match(/^(\d{2})/); // Extract first two digits as prefix

      if (prefixMatch && prefixMatch[1]) {
        return allowedPrefixes.includes(prefixMatch[1]);
      }
      // If no prefix, or prefix not found, include if role is admin (or if no specific prefix filtering is desired for non-prefixed events)
      // For now, only include if it has an allowed prefix.
      return false; // Events without a matching prefix are excluded
    });
  }, [localEvents, googleEvents, selectedRole]); // Add selectedRole to dependencies

  const handlePrevYear = () => {
    setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const addEvent = (event: Event) => {
    setLocalEvents((prevEvents) => [...prevEvents, event]);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const deleteEvent = (id: string) => {
    setLocalEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    setSelectedEvent(null); // Close modal after deleting
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = [];

    // Days from previous month
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

    // Days of current month
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

    // Days from next month
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
    deleteEvent,
    selectedEvent,
    setSelectedEvent,
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarProvider;
