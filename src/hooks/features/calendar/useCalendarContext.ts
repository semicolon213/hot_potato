/**
 * @file useCalendarContext.ts
 * @brief 캘린더 컨텍스트 훅
 * @details 캘린더 관련 상태와 이벤트 관리를 위한 React Context를 제공합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { createContext, useContext } from "react";
import { type User, type Student, type Staff } from "../../../types/app";

/**
 * @brief 날짜 정보 타입 정의
 * @details 년, 월, 일 정보를 담는 인터페이스입니다.
 */
interface DateInfo {
    year: string;
    month: string;
    day: string;
}

/**
 * @brief 이벤트 데이터 타입 정의
 * @details 캘린더에 표시되는 이벤트의 정보를 담는 인터페이스입니다.
 */
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
    type?: string;
    icon?: string;
    rrule?: string; // For recurrence rule
    attendees?: string; // For attendees
}

export type DateRange = { start: Date | null; end: Date | null };
export interface CustomPeriod {
  id: string;
  name: string;
  period: DateRange;
  type?: string;
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
        date: Date;
        selectDate: (date: Date) => void;
    };
    events: Event[];
    addEvent: (event: Event) => void;
    deleteEvent: (id: string) => void;
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null, position?: { top: number; left: number }) => void;
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
    eventColors: any;
    eventTypes: string[];
    eventTypeStyles: { [key: string]: { color: string; icon: string } };
    addSheetEvent: (event: Event) => void;
    updateEvent: (id: string, event: Event) => void;
    extraWeeks: number;
    setExtraWeeks: (weeks: number) => void;
    activeFilters: string[];
    setActiveFilters: (filters: string[]) => void;
    user: User | null;
    goToDate: (date: Date) => void;
    isFetchingGoogleEvents: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterLabels: { [key: string]: string };
    handleFilterChange: (filter: string) => void;
    unfilteredEvents: Event[];
    formatDate: (date: Date) => string;
    students: Student[];
    staff: Staff[];
    searchResults: Event[] | null;
    setSearchResults: (results: Event[] | null) => void;
    calendarViewMode: 'schedule' | 'calendar';
    setCalendarViewMode: (mode: 'schedule' | 'calendar') => void;
    viewMode: 'monthly' | 'weekly';
    setViewMode: (mode: 'monthly' | 'weekly') => void;
    selectedWeek: number;
    setSelectedWeek: (week: number) => void;
    searchOriginView: 'monthly' | 'weekly' | 'schedule' | null;
    setSearchOriginView: (view: 'monthly' | 'weekly' | 'schedule' | null) => void;
    isSearchVisible: boolean;
    setIsSearchVisible: (isVisible: boolean) => void;
}

export const CalendarContext = createContext<CalendarContextType | null>(null);

export default function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error("useCalendarContext must be used within CalendarProvider");
    }
    return context;
}
