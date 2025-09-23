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
    startDateTime?: string; // For timed events
    endDateTime?: string;   // For timed events
    title: string;
    description?: string;
    color?: string;
    colorId?: string;
    isHoliday?: boolean;
}

export type DateRange = { start: Date | null; end: Date | null };
export type CustomPeriod = { id: string; name: string; period: DateRange };

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
    finalExamsPeriod: DateRange;
    setFinalExamsPeriod: (period: DateRange) => void;
    gradeEntryPeriod: DateRange;
    setGradeEntryPeriod: (period: DateRange) => void;
    customPeriods: CustomPeriod[];
    setCustomPeriods: (periods: CustomPeriod[]) => void;
    eventColors: any;
    eventTypes: string[];
    activeFilters: string[];
    setActiveFilters: (filters: string[]) => void;
    extraWeeks: number;
    setExtraWeeks: (weeks: number) => void;
}

export const CalendarContext = createContext<CalendarContextType | null>(null);

export default function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error("useCalendarContext must be used within CalendarProvider");
    }
    return context;
}
