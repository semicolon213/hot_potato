import React, { useState } from "react";
import CalendarProvider from "../components/Calendar/CalendarProvider.tsx";
import CalendarHeader from "../components/Calendar/CalendarHeader.tsx";
import CalendarBody from "../components/Calendar/CalendarBody.tsx";
import useCalendarContext from "../components/Calendar/useCalendarContext.ts";
import EventDetailModal from "../components/Calendar/EventDetailModal.tsx";
import AddEventModal from "../components/Calendar/AddEventModal.tsx";
import "./Calendar.css";

const CalendarContent: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { selectedEvent, setSelectedEvent } = useCalendarContext();

  return (
    <div id="Calendar">
      <CalendarHeader onAddEvent={() => setIsAddModalOpen(true)} />
      <CalendarBody />
      {isAddModalOpen && <AddEventModal onClose={() => setIsAddModalOpen(false)} />}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

const Calendar: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  );
};

export default Calendar;
