import React, { useState } from "react"; // Remove useEffect
import CalendarProvider from "../components/Calendar/CalendarProvider";
import Calendar from "../components/Calendar/Calendar";
import useCalendarContext, { type Event, type DateRange, type CustomPeriod } from "../hooks/useCalendarContext.ts";
import EventDetailModal from "../components/Calendar/EventDetailModal";
import AddEventModal from "../components/Calendar/AddEventModal";
// Remove Login and GoogleOAuthProvider imports
import "./Calendar.css";

interface CalendarPageProps {
  accessToken: string | null; // Accept accessToken as prop
  calendarEvents: Event[];
  addCalendarEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateCalendarEvent: (eventId: string, event: Omit<Event, 'id'>) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  semesterStartDate: Date;
  setSemesterStartDate: (date: Date) => void;
  finalExamsPeriod: DateRange;
  setFinalExamsPeriod: (period: DateRange) => void;
  gradeEntryPeriod: DateRange;
  setGradeEntryPeriod: (period: DateRange) => void;
  customPeriods: CustomPeriod[];
  setCustomPeriods: (periods: CustomPeriod[]) => void;
  onSaveAcademicSchedule: () => Promise<void>;
}

const CalendarContent: React.FC<{ onSaveAcademicSchedule: () => Promise<void> }> = ({ onSaveAcademicSchedule }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const { selectedEvent, setSelectedEvent, deleteEvent } = useCalendarContext();
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const handleSelectEvent = (event: Event, position: { top: number; left: number }) => {
    const modalWidth = 480; // As defined in EventDetailModal.css
    const modalHeight = 250; // Approximate height

    const { innerWidth, innerHeight } = window;

    let { top, left } = position;

    if (left + modalWidth > innerWidth) {
      left = innerWidth - modalWidth - 20; // Adjust with some padding
    }

    if (top + modalHeight > innerHeight) {
      top = innerHeight - modalHeight - 20; // Adjust with some padding
    }

    setSelectedEvent(event);
    setModalPosition({ top, left });
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
    <div id="Calendar">
      <Calendar onAddEvent={() => setIsAddModalOpen(true)} onSelectEvent={handleSelectEvent} onSave={onSaveAcademicSchedule} />
      {isAddModalOpen && (
        <AddEventModal
          eventToEdit={eventToEdit}
          onClose={handleCloseAddModal}
        />
      )}
      {selectedEvent && (
          <EventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onDelete={deleteEvent}
              onEdit={handleEdit}
              position={modalPosition}
          />
      )}
    </div>
  );
};

const CalendarPage: React.FC<CalendarPageProps> = (props) => { // Accept accessToken as prop

  return (
    <>
      <CalendarProvider
        accessToken={props.accessToken}
        sheetEvents={props.calendarEvents}
        addSheetEvent={props.addCalendarEvent}
        updateSheetEvent={props.updateCalendarEvent}
        deleteSheetEvent={props.deleteCalendarEvent}
        semesterStartDate={props.semesterStartDate}
        setSemesterStartDate={props.setSemesterStartDate}
        finalExamsPeriod={props.finalExamsPeriod}
        setFinalExamsPeriod={props.setFinalExamsPeriod}
        gradeEntryPeriod={props.gradeEntryPeriod}
        setGradeEntryPeriod={props.setGradeEntryPeriod}
        customPeriods={props.customPeriods}
        setCustomPeriods={props.setCustomPeriods}
      >
        <CalendarContent onSaveAcademicSchedule={props.onSaveAcademicSchedule} />
      </CalendarProvider>
    </>
  );
};

export default CalendarPage;
