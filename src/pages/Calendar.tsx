import React, { useState } from "react";
import CalendarProvider from "../components/Calendar/CalendarProvider";
import Calendar from "../components/Calendar/Calendar";
import useCalendarContext, { type Event } from "../hooks/useCalendarContext.ts";
import EventDetailModal from "../components/Calendar/EventDetailModal";
import AddEventModal from "../components/Calendar/AddEventModal";
import CalendarSidebar from "../components/Calendar/CalendarSidebar";
import "./Calendar.css";

interface CalendarPageProps {
  accessToken: string | null;
  calendarEvents: Event[];
  addCalendarEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateCalendarEvent: (eventId: string, event: Omit<Event, 'id'>) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
}

const CalendarContent: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const { selectedEvent, setSelectedEvent, deleteEvent } = useCalendarContext();
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);

  const handleSelectWeek = (week: number) => {
    setSelectedWeek(week);
    setViewMode('weekly');
  };

  const handleSelectEvent = (event: Event, position: { top: number; left: number }) => {
    const modalWidth = 480;
    const modalHeight = 250;
    const { innerWidth, innerHeight } = window;
    let { top, left } = position;
    if (left + modalWidth > innerWidth) {
      left = innerWidth - modalWidth - 20;
    }
    if (top + modalHeight > innerHeight) {
      top = innerHeight - modalHeight - 20;
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
    setEventToEdit(null);
  };

  return (
    <>
      <CalendarSidebar onSelectWeek={handleSelectWeek} selectedWeek={selectedWeek} />
      <main className="calendar-main-content">
        <Calendar
          onAddEvent={() => setIsAddModalOpen(true)}
          onSelectEvent={handleSelectEvent}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
        />
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
      </main>
    </>
  );
};

const CalendarPage: React.FC<CalendarPageProps> = ({ accessToken, calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent }) => {
  return (
    <div id="Calendar">
      <CalendarProvider
        accessToken={accessToken}
        sheetEvents={calendarEvents}
        addSheetEvent={addCalendarEvent}
        updateSheetEvent={updateCalendarEvent}
        deleteSheetEvent={deleteCalendarEvent}
      >
        <CalendarContent />
      </CalendarProvider>
    </div>
  );
};

export default CalendarPage;
