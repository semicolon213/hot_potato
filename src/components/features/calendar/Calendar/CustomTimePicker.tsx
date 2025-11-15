import React, { useState, useRef, useEffect } from 'react';
import './CustomTimePicker.css';

interface CustomTimePickerProps {
  value: string; // HH:MM 형식
  onChange: (value: string) => void;
  onClose?: () => void;
  position?: { top: number; left: number };
  step?: number; // 분 단위 (기본 10분)
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, onClose, position, step = 10 }) => {
  const [selectedHour, setSelectedHour] = useState(() => {
    return value ? parseInt(value.split(':')[0]) : 0;
  });
  const [selectedMinute, setSelectedMinute] = useState(() => {
    return value ? parseInt(value.split(':')[1]) : 0;
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 / step }, (_, i) => i * step);

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(formattedTime);
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(formattedTime);
    if (onClose) {
      setTimeout(onClose, 100);
    }
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

  return (
    <div 
      ref={pickerRef}
      className="custom-time-picker"
      style={position ? { position: 'fixed', top: `${position.top}px`, left: `${position.left}px` } : {}}
    >
      <div className="time-picker-header">시간 선택</div>
      <div className="time-picker-content">
        <div className="time-picker-column">
          <div className="time-picker-label">시</div>
          <div className="time-picker-scroll">
            {hours.map((hour) => (
              <div
                key={hour}
                className={`time-picker-item ${selectedHour === hour ? 'selected' : ''}`}
                onClick={() => handleHourClick(hour)}
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        <div className="time-picker-column">
          <div className="time-picker-label">분</div>
          <div className="time-picker-scroll">
            {minutes.map((minute) => (
              <div
                key={minute}
                className={`time-picker-item ${selectedMinute === minute ? 'selected' : ''}`}
                onClick={() => handleMinuteClick(minute)}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTimePicker;

