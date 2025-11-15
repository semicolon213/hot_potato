import React, { useState, useRef, useEffect } from 'react';
import './CustomDatePicker.css';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD 형식
  onChange: (value: string) => void;
  onClose?: () => void;
  position?: { top: number; left: number };
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, onClose, position }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    return value ? new Date(value) : null;
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const weeks = ['일', '월', '화', '수', '목', '금', '토'];
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    if (onClose) {
      setTimeout(onClose, 100);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div 
      ref={pickerRef}
      className="custom-date-picker"
      style={position ? { position: 'fixed', top: `${position.top}px`, left: `${position.left}px` } : {}}
    >
      <div className="date-picker-header">
        <button type="button" className="date-picker-nav-btn" onClick={handlePrevMonth}>
          ‹
        </button>
        <div className="date-picker-month-year">
          {year}년 {months[month]}
        </div>
        <button type="button" className="date-picker-nav-btn" onClick={handleNextMonth}>
          ›
        </button>
      </div>
      <div className="date-picker-weekdays">
        {weeks.map((day) => (
          <div key={day} className="date-picker-weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="date-picker-days">
        {days.map((day, index) => (
          <div
            key={index}
            className={`date-picker-day ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
            onClick={() => day && handleDateClick(day)}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomDatePicker;

