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
            const firstDayOfWeek = weekDays[0];
            const currentMonth = Number(currentDate.month);
            if (firstDayOfWeek.month !== currentMonth) {
                const year = new Date(firstDayOfWeek.date).getFullYear();
                if (new Date(currentDate.year, currentMonth -1, 1).getFullYear() !== year) {
                    if(new Date(currentDate.year, currentMonth -1, 1).getFullYear() < year){
                        dispatch.handleNextYear();
                    } else {
                        dispatch.handlePrevYear();
                    }
                }
                if (firstDayOfWeek.month > currentMonth) {
                    dispatch.handleNextMonth();
                } else {
                    dispatch.handlePrevMonth();
                }
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
                            className={`day ${date.isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
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