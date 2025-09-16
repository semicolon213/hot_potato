import React, { useState, useMemo, useEffect, type ReactNode } from "react";
import { CalendarContext, type Event } from "../../hooks/useCalendarContext.ts";

interface CalendarProviderProps {
  children: ReactNode;
  accessToken: string | null;
  sheetEvents: Event[];
  addSheetEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateSheetEvent: (eventId: string, event: Omit<Event, 'id'>) => Promise<void>;
  deleteSheetEvent: (eventId: string) => Promise<void>;
}

const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  accessToken,
  sheetEvents,
  addSheetEvent,
  updateSheetEvent,
  deleteSheetEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [semesterStartDate, setSemesterStartDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [eventColors, setEventColors] = useState<any>({});
  const [calendarColor, setCalendarColor] = useState<string | undefined>();

  const triggerRefresh = () => setRefreshKey(prevKey => prevKey + 1);

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

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&fields=items(id,summary,start,end,description,colorId)`,
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
        const transformedEvents: Event[] = data.items
            .filter((item: any) => item.start && item.end)
            .map((item: any) => {
              try {
                const startStr = item.start.date || item.start.dateTime;
                const endStr = item.end.date || item.end.dateTime;

                if (!startStr || !endStr) {
                  return null;
                }

                let endDate = endStr.split('T')[0];
                if (item.start.date && item.start.date === item.end.date) {
                  const date = new Date(endDate);
                  date.setDate(date.getDate() + 1);
                  endDate = date.toISOString().split('T')[0];
                }

                return {
                  id: item.id,
                  title: item.summary || 'No Title',
                  startDate: startStr.split('T')[0],
                  endDate: endDate,
                  startDateTime: item.start.dateTime,
                  endDateTime: item.end.dateTime,
                  description: item.description || '',
                  colorId: item.colorId,
                };
              } catch (e) {
                console.error("Failed to transform event item:", item, e);
                return null;
              }
            })
            .filter(Boolean) as Event[];
        setGoogleEvents(transformedEvents);
      } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        setGoogleEvents([]);
      }
    };

    fetchGoogleEvents();
  }, [accessToken, currentDate, refreshKey]);

  const events = useMemo(() => {
    const combinedEvents = [...googleEvents, ...sheetEvents];

    return combinedEvents
      .map(event => ({
        ...event,
        color: (eventColors && eventColors[event.colorId]) ? eventColors[event.colorId].background : (calendarColor || '#7986CB'),
      }));
  }, [googleEvents, sheetEvents, eventColors, calendarColor]);

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
              colorId: event.colorId,
            }),
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
    addSheetEvent(event);
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
              colorId: event.colorId,
            }),
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
    updateEvent,
    deleteEvent,
    selectedEvent,
    setSelectedEvent,
    semesterStartDate,
    setSemesterStartDate,
    triggerRefresh,
    eventColors,
  };

  return (
      <CalendarContext.Provider value={contextValue}>
        {children}
      </CalendarContext.Provider>
  );
};

export default CalendarProvider;