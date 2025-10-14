import { type User } from "../types/app";
import React, {useState} from "react"; // Remove useEffect
import CalendarProvider from "../components/features/calendar/Calendar/CalendarProvider";
import Calendar from "../components/features/calendar/Calendar/Calendar";
import useCalendarContext, { type Event, type DateRange, type CustomPeriod } from "../hooks/features/calendar/useCalendarContext.ts";
import EventDetailModal from "../components/features/calendar/Calendar/EventDetailModal";
import AddEventModal from "../components/features/calendar/Calendar/AddEventModal";
import MoreEventsModal from "../components/features/calendar/Calendar/MoreEventsModal.tsx";
import CalendarSidebar from "../components/features/calendar/Calendar/CalendarSidebar";
// Remove Login and GoogleOAuthProvider imports
import "../styles/pages/Calendar.css";

interface CalendarPageProps {
    user: User | null;
    accessToken: string | null; // Accept accessToken as prop
    calendarEvents: Event[];
    addCalendarEvent: (event: Omit<Event, 'id'>) => Promise<void>;
    updateCalendarEvent: (eventId: string, event: Omit<Event, 'id'>) => Promise<void>;
    deleteCalendarEvent: (eventId: string) => Promise<void>;
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
    onSaveAcademicSchedule: (scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        midtermExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }) => Promise<void>;
}

const CalendarContent: React.FC<{ onSaveAcademicSchedule: (scheduleData: {
    semesterStartDate: Date;
    finalExamsPeriod: DateRange;
    midtermExamsPeriod: DateRange;
    gradeEntryPeriod: DateRange;
    customPeriods: CustomPeriod[];
}) => Promise<void> }> = ({onSaveAcademicSchedule}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const {selectedEvent, setSelectedEvent, deleteEvent, selectedEventPosition} = useCalendarContext();
    const [modalPosition, setModalPosition] = useState({top: 0, left: 0});
    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        date: string;
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });

    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
    const [selectedWeek, setSelectedWeek] = useState(1);

    const handleSelectWeek = (week: number) => {
        setSelectedWeek(week);
        setViewMode('weekly');
    };

    const handleMoreClick = (events: Event[], date: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setMoreEventsModal({
            isOpen: true,
            events,
            date,
            position: { top: rect.top, left: rect.left },
        });
        setSelectedEvent(null);
        setIsAddModalOpen(false);
    };

    const handleSelectEvent = (event: Event, rect: DOMRect) => {
        const modalWidth = 480; // As defined in EventDetailModal.css
        const modalHeight = 150; // Approximate height
        const { innerWidth, innerHeight } = window;
        const gap = 10; // Gap from the event item

        let top = rect.bottom + gap;
        let left = rect.left;

        // If it overflows bottom, try to place it above
        if (top + modalHeight > innerHeight) {
            top = rect.top - modalHeight - gap;
        }
        // If it still overflows top (small screen or tall modal), place it at the top of the viewport
        if (top < 0) {
            top = gap;
        }

        // If it overflows right, place it aligned to the right of the event
        if (left + modalWidth > innerWidth) {
            left = rect.right - modalWidth;
        }
        // If it still overflows left, place it at the left of the viewport
        if (left < 0) {
            left = gap;
        }

        setSelectedEvent(event);
        setModalPosition({ top, left });
        setIsAddModalOpen(false);
        setMoreEventsModal({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });
    };

    const handleEdit = (event: Event) => {
        setEventToEdit(event);
        setSelectedEvent(null);
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setEventToEdit(null); // 모달이 닫힐 때 수정 상태 초기화
    };

    return (
        <>
            <CalendarSidebar onSelectWeek={handleSelectWeek} selectedWeek={selectedWeek}/>
            <main className="calendar-main-content">
                <Calendar
                    onAddEvent={() => {
                        setIsAddModalOpen(true);
                        setSelectedEvent(null);
                        setMoreEventsModal({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });
                    }}
                    onSelectEvent={handleSelectEvent}
                    onMoreClick={handleMoreClick}
                    onSave={onSaveAcademicSchedule}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                />
            </main>
            {isAddModalOpen && (
                <AddEventModal
                    eventToEdit={eventToEdit}
                    onClose={handleCloseAddModal}
                />
            )}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => { 
                        setSelectedEvent(null); 
                        setModalPosition({ top: 0, left: 0 }); 
                        setIsAddModalOpen(false); 
                        setMoreEventsModal({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } }); 
                    }}
                    onDelete={deleteEvent}
                    onEdit={handleEdit}
                    position={selectedEventPosition || modalPosition}
                />
            )}
            {moreEventsModal.isOpen && (
                <MoreEventsModal
                    date={moreEventsModal.date}
                    events={moreEventsModal.events}
                    onClose={() => setMoreEventsModal({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } })}
                    onSelectEvent={(event, rect) => {
                        handleSelectEvent(event, rect);
                        setMoreEventsModal({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });
                    }}
                    position={moreEventsModal.position}
                />
            )}
        </>
    );
};
const CalendarPage: React.FC<CalendarPageProps> = ({
                                                       user,
                                                       accessToken,
                                                       calendarEvents,
                                                       addCalendarEvent,
                                                       updateCalendarEvent,
                                                       deleteCalendarEvent,
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
                                                       onSaveAcademicSchedule,
                                                   }) => {
    return (
        <div id="Calendar">
            <CalendarProvider
                user={user}
                accessToken={accessToken}
                sheetEvents={calendarEvents}
                addSheetEvent={addCalendarEvent}
                updateSheetEvent={updateCalendarEvent}
                deleteSheetEvent={deleteCalendarEvent}
                semesterStartDate={semesterStartDate}
                setSemesterStartDate={setSemesterStartDate}
                finalExamsPeriod={finalExamsPeriod}
                setFinalExamsPeriod={setFinalExamsPeriod}
                midtermExamsPeriod={midtermExamsPeriod}
                setMidtermExamsPeriod={setMidtermExamsPeriod}
                gradeEntryPeriod={gradeEntryPeriod}
                setGradeEntryPeriod={setGradeEntryPeriod}
                customPeriods={customPeriods}
                setCustomPeriods={setCustomPeriods}
            >
                <CalendarContent onSaveAcademicSchedule={onSaveAcademicSchedule}/>
            </CalendarProvider>
        </div>
    );
};

export default CalendarPage;

