import React, { useState } from "react"; // Remove useEffect
import CalendarProvider from "../components/Calendar/CalendarProvider";
import Calendar from "../components/Calendar/Calendar";
import useCalendarContext, { type Event } from "../hooks/useCalendarContext";
import EventDetailModal from "../components/Calendar/EventDetailModal";
import AddEventModal from "../components/Calendar/AddEventModal";
// Remove Login and GoogleOAuthProvider imports
import "./Calendar.css";

interface CalendarPageProps {
  accessToken: string | null; // Accept accessToken as prop
}

const CalendarContent: React.FC = () => {
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
      <Calendar onAddEvent={() => setIsAddModalOpen(true)} onSelectEvent={handleSelectEvent} />
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

const CalendarPage: React.FC<CalendarPageProps> = ({ accessToken }) => { // Accept accessToken as prop
  const [selectedRole, setSelectedRole] = useState<string>('admin'); // Default role

  return (
    <>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setSelectedRole('admin')}
          style={{ padding: '8px 15px', border: selectedRole === 'admin' ? '2px solid blue' : '1px solid gray', borderRadius: '5px', cursor: 'pointer' }}
        >
          관리자
        </button>
        <button
          onClick={() => setSelectedRole('professor')}
          style={{ padding: '8px 15px', border: selectedRole === 'professor' ? '2px solid blue' : '1px solid gray', borderRadius: '5px', cursor: 'pointer' }}
        >
          교수
        </button>
        <button
          onClick={() => setSelectedRole('student')}
          style={{ padding: '8px 15px', border: selectedRole === 'student' ? '2px solid blue' : '1px solid gray', borderRadius: '5px', cursor: 'pointer' }}
        >
          학생
        </button>
      </div>
      <CalendarProvider accessToken={accessToken} selectedRole={selectedRole}> {/* Pass selectedRole */}
        <CalendarContent />
      </CalendarProvider>
    </>
  );
};

export default CalendarPage;
