import React, { useState } from "react"; // Remove useEffect
import CalendarProvider from "../components/Calendar/CalendarProvider.tsx";
import Calendar from "../components/Calendar/Calendar.tsx";
import useCalendarContext from "../hooks/useCalendarContext.ts";
import EventDetailModal from "../components/Calendar/EventDetailModal.tsx";
import AddEventModal from "../components/Calendar/AddEventModal.tsx";
// Remove Login and GoogleOAuthProvider imports
import "./Calendar.css";

interface CalendarPageProps {
  accessToken: string | null; // Accept accessToken as prop
}

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
