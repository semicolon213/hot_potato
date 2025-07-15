import React, { useState } from "react";
import CalendarProvider from "../components/Calendar/CalendarProvider.tsx";
import Calendar from "../components/Calendar/Calendar.tsx";
import useCalendarContext from "../hooks/useCalendarContext.ts";
import EventDetailModal from "../components/Calendar/EventDetailModal.tsx";
import AddEventModal from "../components/Calendar/AddEventModal.tsx";
import "./Calendar.css";

const CalendarContent: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { selectedEvent, setSelectedEvent } = useCalendarContext();

  return (
    <div id="Calendar">
      <Calendar onAddEvent={() => setIsAddModalOpen(true)} />
      {isAddModalOpen && <AddEventModal onClose={() => setIsAddModalOpen(false)} />}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

const CalendarPage: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  );
};

export default CalendarPage;
