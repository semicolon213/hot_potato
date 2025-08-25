import { createContext, useContext } from "react";

interface DateInfo {
    year: string;
    month: string;
    day: string;
}

export interface Event {
    id: string;
    startDate: string;
    endDate: string;
    title: string;
    description?: string;
}

interface CalendarContextType {
    currentDate: DateInfo;
    daysInMonth: (DateInfo & { date: string; dayIndexOfWeek: number })[];
    dispatch: {
        handlePrevYear: () => void;
        handleNextYear: () => void;
        handlePrevMonth: () => void;
        handleNextMonth: () => void;
    };
    selectedDate: {
        date: string;
        selectDate: (date: Date) => void;
    };
    events: Event[];
    addEvent: (event: Event) => void;
    deleteEvent: (id: string) => void;
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null) => void;
    semesterStartDate: Date;
    setSemesterStartDate: (date: Date) => void;
}

export const CalendarContext = createContext<CalendarContextType | null>(null);

export default function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error("useCalendarContext must be used within CalendarProvider");
    }
    return context;
}
