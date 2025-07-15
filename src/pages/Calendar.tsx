import React from "react";
import "./Calendar.css";

interface CalendarProps {
  onPageChange: (pageName: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onPageChange }) => {
  return (
    <div id="Calendar">
      <button onClick={() => onPageChange('ddd')}>Go to Dashboard</button>
    </div>
  );
};

export default Calendar;
