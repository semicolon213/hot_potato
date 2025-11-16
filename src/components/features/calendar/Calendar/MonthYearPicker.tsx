import React, { useState, useRef, useEffect } from 'react';
import './MonthYearPicker.css';

interface MonthYearPickerProps {
  currentYear: number;
  currentMonth: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ 
  currentYear, 
  currentMonth, 
  onSelect, 
  onClose,
  position 
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  // 연도 범위 생성 (현재 연도 기준 ±10년)
  const generateYears = () => {
    const years = [];
    const startYear = selectedYear - 10;
    const endYear = selectedYear + 10;
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const handleMonthClick = (month: number) => {
    onSelect(selectedYear, month);
    onClose();
  };

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
    setViewMode('month');
  };

  const handlePrevYearRange = () => {
    setSelectedYear(prev => prev - 20);
  };

  const handleNextYearRange = () => {
    setSelectedYear(prev => prev + 20);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
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
      className="month-year-picker"
      style={position ? { position: 'fixed', top: `${position.top}px`, left: `${position.left}px` } : {}}
    >
      {viewMode === 'month' ? (
        <>
          <div className="picker-header">
            <button 
              type="button" 
              className="picker-nav-btn" 
              onClick={() => setViewMode('year')}
            >
              {selectedYear}년
            </button>
            <button 
              type="button" 
              className="picker-close-btn"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="picker-month-grid">
            {months.map((month, index) => (
              <button
                key={index}
                type="button"
                className={`picker-month-item ${index + 1 === currentMonth && selectedYear === currentYear ? 'selected' : ''}`}
                onClick={() => handleMonthClick(index + 1)}
              >
                {month}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="picker-header">
            <button 
              type="button" 
              className="picker-nav-btn" 
              onClick={handlePrevYearRange}
            >
              ‹‹
            </button>
            <span className="picker-year-range">
              {selectedYear - 10} - {selectedYear + 10}
            </span>
            <button 
              type="button" 
              className="picker-nav-btn" 
              onClick={handleNextYearRange}
            >
              ››
            </button>
            <button 
              type="button" 
              className="picker-close-btn"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="picker-year-grid">
            {generateYears().map((year) => (
              <button
                key={year}
                type="button"
                className={`picker-year-item ${year === currentYear ? 'selected' : ''} ${year === selectedYear ? 'active' : ''}`}
                onClick={() => handleYearClick(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthYearPicker;

