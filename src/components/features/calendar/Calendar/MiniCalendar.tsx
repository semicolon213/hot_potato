
import React, { useMemo } from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext';
import './MiniCalendar.css';

interface MiniCalendarProps {
  selectedWeek: number;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedWeek }) => {
  const { currentDate, daysInMonth, dispatch, selectedDate, semesterStartDate } = useCalendarContext();

  const weeks = ["일", "월", "화", "수", "목", "금", "토"];

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedWeekDateRange = useMemo(() => {
    if (!semesterStartDate || !selectedWeek) return null;

    const baseDate = new Date(semesterStartDate);
    const dayOfWeek = baseDate.getDay();
    const dateOffset = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    baseDate.setDate(baseDate.getDate() + dateOffset);

    const start = new Date(baseDate);
    start.setDate(start.getDate() + (selectedWeek - 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [semesterStartDate, selectedWeek]);

  const weeksInMonth = useMemo(() => {
      const weeksArr: any[][] = [];
      if (!daysInMonth) return [];
      for (let i = 0; i < daysInMonth.length; i += 7) {
          weeksArr.push(daysInMonth.slice(i, i + 7));
      }
      return weeksArr;
  }, [daysInMonth]);

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button onClick={dispatch.handlePrevMonth}>‹</button>
        <h4>{currentDate.year}년 {currentDate.month}월</h4>
        <button onClick={dispatch.handleNextMonth}>›</button>
      </div>
      <div className="mini-calendar-grid">
        {weeks.map(week => (
          <div key={week} className="mini-calendar-day-name">{week}</div>
        ))}
        {weeksInMonth.flat().map(day => {
          if (!day) return <div key={Math.random()} className="mini-calendar-day empty"></div>;

          const isToday = day.date === todayDateString;
          const isCurrentMonth = currentDate.month === day.month;
          
          const dayDate = new Date(parseInt(day.year), parseInt(day.month) - 1, parseInt(day.day));
          const isInSelectedWeek = selectedWeekDateRange && dayDate >= selectedWeekDateRange.start && dayDate <= selectedWeekDateRange.end;

          let dayClasses = 'mini-calendar-day';
          if (!isCurrentMonth) dayClasses += ' not-current-month';
          if (isToday) dayClasses += ' today';

          if (isInSelectedWeek) {
            dayClasses += ' in-selected-week';
            const isRangeStart = dayDate.getTime() === selectedWeekDateRange.start.getTime();

            const endDayOfRange = new Date(selectedWeekDateRange.end);
            endDayOfRange.setHours(0, 0, 0, 0);
            const isRangeEnd = dayDate.getTime() === endDayOfRange.getTime();

            if (isRangeStart) {
                dayClasses += ' week-start';
            }
            if (isRangeEnd) {
                dayClasses += ' week-end';
            }
          }

          return (
            <div
              key={day.date}
              className={dayClasses}
              onClick={() => selectedDate.selectDate(new Date(day.date))}
            >
              {day.day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
