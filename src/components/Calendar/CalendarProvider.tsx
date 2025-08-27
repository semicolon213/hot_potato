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
  const [semesterStartDate, setSemesterStartDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prevKey => prevKey + 1);

  // Fetch Google Calendar events
  useEffect(() => {
    if (!accessToken) return;

    const fetchGoogleEvents = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        // Fetch a wider range to include events from adjacent weeks
        const firstDayOfMonth = new Date(year, month, 1 - 7);
        const lastDayOfMonth = new Date(year, month + 1, 7);

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
        const transformedEvents: Event[] = data.items.map((item: any) => {
          let endDate = item.end.date || item.end.dateTime.split('T')[0];
          // For all-day events, Google Calendar's endDate is exclusive.
          // If an event is on a single day, the API might return the same start and end date.
          // The rendering logic requires endDate to be the day after, so we adjust it here.
          if (item.start.date && item.start.date === item.end.date) {
            const date = new Date(endDate);
            date.setDate(date.getDate() + 1);
            endDate = date.toISOString().split('T')[0];
          }
          return {
            id: item.id,
            title: item.summary || 'No Title',
            startDate: item.start.date || item.start.dateTime.split('T')[0], // Handle all-day vs. specific time
            endDate: endDate,
            description: item.description || '',
          };
        });
        setGoogleEvents(transformedEvents);
      } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        setGoogleEvents([]); // Clear events on error
      }
    };

    fetchGoogleEvents();
  }, [accessToken, currentDate, refreshKey]); // Re-fetch when token, month, or refreshKey changes

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
      // For now, only inclupde if it has an allowed prefix.
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
      const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: event.title,
              description: event.description,
              start: {
                date: event.startDate,
              },
              end: {
                date: event.endDate,
              },
            }),
          }
      );

      if (!response.ok) {
        throw new Error(`Error creating Google Calendar event: ${response.statusText}`);
      }

      await response.json();
      triggerRefresh(); // Refresh events after adding

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
      const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: event.title,
              description: event.description,
              start: {
                date: event.startDate,
              },
              end: {
                date: event.endDate,
              },
            }),
          }
      );

      if (!response.ok) {
        throw new Error(`Error updating Google Calendar event: ${response.statusText}`);
      }

      await response.json();
      triggerRefresh(); // Refresh events after updating

    } catch (error) {
      console.error("Failed to update Google Calendar event:", error);
    }
  };

  const updateEvent = (eventId: string, event: Omit<Event, 'id'>) => {
    updateGoogleEvent(eventId, event);
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
      if (response.status !== 204) { // 204 No Content is success for DELETE
        throw new Error(`Error deleting Google Calendar event: ${response.statusText}`);
      }
      triggerRefresh(); // Refresh events after deleting
    } catch (error) {
      console.error("Failed to delete Google Calendar event:", error);
    }
  };

  const deleteEvent = (id: string) => {
    deleteGoogleEvent(id);
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
    updateEvent, // Add updateEvent to context
    deleteEvent,
    selectedEvent,
    setSelectedEvent,
    semesterStartDate,
    setSemesterStartDate,
    triggerRefresh,
  };

  return (
      <CalendarContext.Provider value={contextValue}>
        {children}
      </CalendarContext.Provider>
  );
};

export default CalendarProvider;
