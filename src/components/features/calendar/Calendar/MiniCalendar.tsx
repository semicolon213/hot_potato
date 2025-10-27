
import React, { useState, useEffect, useMemo } from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext';
import './MiniCalendar.css';

interface MiniCalendarProps {
  selectedWeek: number;
  viewMode: 'monthly' | 'weekly';
  onDateSelect: (date: Date) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedWeek, viewMode, onDateSelect }) => {
  const { currentDate, semesterStartDate } = useCalendarContext();
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  useEffect(() => {
    setMiniCalendarDate(new Date(`${currentDate.year}-${currentDate.month}-01`));
  }, [currentDate]);

  const handleMiniPrevMonth = () => {
    setMiniCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleMiniNextMonth = () => {
    setMiniCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const daysInMiniMonth = useMemo(() => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const days = [];

    const firstDayOfWeek = firstDayOfMonth.getDay();
    for (let i = firstDayOfWeek; i > 0; i--) {
        const date = new Date(year, month, 1 - i);
        days.push({
            year: String(date.getFullYear()),
            month: String(date.getMonth() + 1),
            day: String(date.getDate()),
            date: formatDate(date),
            dayIndexOfWeek: date.getDay(),
        });
    }

    const lastDayOfMonth = new Date(year, month + 1, 0);
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({
            year: String(date.getFullYear()),
            month: String(date.getMonth() + 1),
            day: String(date.getDate()),
            date: formatDate(date),
            dayIndexOfWeek: date.getDay(),
        });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
            year: String(date.getFullYear()),
            month: String(date.getMonth() + 1),
            day: String(date.getDate()),
            date: formatDate(date),
            dayIndexOfWeek: date.getDay(),
        });
    }

    return days;
  }, [miniCalendarDate]);

  const weeksInMonth = useMemo(() => {
      const weeksArr: any[][] = [];
      if (!daysInMiniMonth) return [];
      for (let i = 0; i < daysInMiniMonth.length; i += 7) {
          weeksArr.push(daysInMiniMonth.slice(i, i + 7));
      }
      return weeksArr;
  }, [daysInMiniMonth]);

  const weeks = ["일", "월", "화", "수", "목", "금", "토"];

  const today = new Date();
  const todayDateString = formatDate(today);

  const selectedWeekDateRange = useMemo(() => {
    if (!semesterStartDate || !selectedWeek) return null;

    const baseDate = new Date(semesterStartDate);
    baseDate.setDate(baseDate.getDate() - baseDate.getDay());

    const start = new Date(baseDate);
    start.setDate(start.getDate() + (selectedWeek - 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [semesterStartDate, selectedWeek]);

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button onClick={handleMiniPrevMonth}>‹</button>
        <h4>{miniCalendarDate.getFullYear()}년 {miniCalendarDate.getMonth() + 1}월</h4>
        <button onClick={handleMiniNextMonth}>›</button>
      </div>
      <div className="mini-calendar-grid">
        {weeks.map(week => (
          <div key={week} className="mini-calendar-day-name">{week}</div>
        ))}
        {weeksInMonth.flat().map(day => {
          if (!day) return <div key={Math.random()} className="mini-calendar-day empty"></div>;

          const isToday = day.date === todayDateString;
          const isCurrentMonth = miniCalendarDate.getMonth() + 1 === parseInt(day.month);
          const dayDate = new Date(parseInt(day.year), parseInt(day.month) - 1, parseInt(day.day));
          const isInSelectedWeek = viewMode === 'weekly' && selectedWeekDateRange && dayDate >= selectedWeekDateRange.start && dayDate <= selectedWeekDateRange.end;

          const dayStyle: React.CSSProperties = {};
          let dayClasses = 'mini-calendar-day';

          if (!isCurrentMonth) {
              dayClasses += ' not-current-month';
          }

          if (isInSelectedWeek) {
              dayClasses += ' in-selected-week';
              dayStyle.backgroundColor = '#C2E7FF';
              dayStyle.color = 'var(--primary)';
              dayStyle.fontWeight = 600;
              dayStyle.height = '80%';

              const isRangeStart = dayDate.getTime() === selectedWeekDateRange.start.getTime();
              const endDayOfRange = new Date(selectedWeekDateRange.end);
              endDayOfRange.setHours(0, 0, 0, 0);
              const isRangeEnd = dayDate.getTime() === endDayOfRange.getTime();

              if (isRangeStart) {
                  dayClasses += ' week-start';
                  dayStyle.borderRadius = '50% 0 0 50%';
              } else if (isRangeEnd) {
                  dayClasses += ' week-end';
                  dayStyle.borderRadius = '0 50% 50% 0';
              } else {
                  dayStyle.borderRadius = 0;
              }
          }

          if (isToday) {
              dayClasses += ' today';
              if (isInSelectedWeek) {
                  dayStyle.color = 'rgba(255, 0, 0, 0.8)';
                  dayStyle.fontWeight = 'bold';
              } else {
                  dayStyle.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                  dayStyle.color = 'white';
                  dayStyle.borderRadius = '50%';
                  dayStyle.width = '80%';
                  dayStyle.height = '80%';
              }
          }

          return (
            <div
              key={day.date}
              className={dayClasses}
              style={dayStyle}
              onClick={() => {
                const clickedDate = new Date(day.date);
                onDateSelect(clickedDate);
                if (clickedDate.getMonth() > miniCalendarDate.getMonth() || clickedDate.getFullYear() > miniCalendarDate.getFullYear()) {
                    handleMiniNextMonth();
                } else if (clickedDate.getMonth() < miniCalendarDate.getMonth() || clickedDate.getFullYear() < miniCalendarDate.getFullYear()) {
                    handleMiniPrevMonth();
                }
              }}
            >
              {day.day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { MiniCalendar };
