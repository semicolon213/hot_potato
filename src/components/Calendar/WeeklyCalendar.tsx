import React, { useEffect, useMemo } from 'react';
import useCalendarContext from '../../hooks/useCalendarContext';
import './Calendar.css';

interface WeeklyCalendarProps {
    selectedWeek: number;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedWeek }) => {
    const { events, setSelectedEvent, selectedDate, dispatch, currentDate, semesterStartDate } = useCalendarContext();
    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    const weekDays = useMemo(() => {
        const baseDate = new Date(semesterStartDate);
        baseDate.setDate(baseDate.getDate() - baseDate.getDay());

        const startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() + (selectedWeek - 1) * 7);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(day.getDate() + i);
            days.push({
                date: day.toISOString().split('T')[0],
                day: day.getDate(),
                dayIndexOfWeek: day.getDay(),
                month: day.getMonth() + 1,
                isCurrentMonth: day.getMonth() === new Date(currentDate.year, Number(currentDate.month) - 1, 1).getMonth(),
            });
        }
        return days;
    }, [selectedWeek, semesterStartDate, currentDate]);

    useEffect(() => {
        if (weekDays.length > 0) {
            let targetDate = new Date(weekDays[0].date); // Default to first day of week

            for (const day of weekDays) {
                if (day.day === 1) {
                    targetDate = new Date(day.date);
                    break; // Found the 1st, so we use this month.
                }
            }

            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth(); // 0-11

            const currentYear = Number(currentDate.year);
            const currentMonth = Number(currentDate.month) - 1; // 0-11

            if (targetYear === currentYear && targetMonth === currentMonth) {
                return;
            }

            const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

            if (monthDiff > 0) {
                dispatch.handleNextMonth();
            } else if (monthDiff < 0) {
                dispatch.handlePrevMonth();
            }
        }
    }, [weekDays, currentDate, dispatch]);

    return (
        <div className="calendar-body-container">
            <div className="day-wrapper">
                {weeks.map((week, index) => (
                    <div className={`calendar-item ${index === 0 ? 'sunday' : ''}`} key={week}>
                        {week}
                    </div>
                ))}
            </div>
            <div className="day-wrapper">
                {weekDays.map((date) => {
                    const dayEvents = events.filter(event => {
                        const eventStartDate = new Date(event.startDate);
                        const eventEndDate = new Date(event.endDate);
                        const currentDate = new Date(date.date);
                        return currentDate >= eventStartDate && currentDate < eventEndDate;
                    });
                    const isSelected = selectedDate.date === date.date;
                    const isSunday = date.dayIndexOfWeek === 0;

                    return (
                        <div
                            onClick={() => selectedDate.selectDate(new Date(date.date))}
                            className={`day ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
                            key={date.date}>
                            <span className="day-number">{date.day}</span>
                            <ul className="event-list">
                                {dayEvents.map(event => (
                                    <li key={event.id} className="event-item" onClick={() => setSelectedEvent(event)}>
                                        {event.title.replace(/^\d{2}\s*/, '')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyCalendar;
