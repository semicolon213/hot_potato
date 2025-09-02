import React, { useEffect, useMemo } from 'react';
import useCalendarContext from '../../hooks/useCalendarContext';
import './WeeklyCalendar.css';

interface WeeklyCalendarProps {
    selectedWeek: number;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedWeek }) => {
    const { events, setSelectedEvent, dispatch, currentDate, semesterStartDate } = useCalendarContext();
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

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
                month: day.getMonth() + 1,
            });
        }
        return days;
    }, [selectedWeek, semesterStartDate]);

    useEffect(() => {
        if (weekDays.length > 0) {
            const firstDayOfWeek = new Date(weekDays[0].date);
            const targetYear = firstDayOfWeek.getFullYear();
            const targetMonth = firstDayOfWeek.getMonth();

            const currentYear = Number(currentDate.year);
            const currentMonth = Number(currentDate.month) - 1;

            if (targetYear !== currentYear || targetMonth !== currentMonth) {
                 if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
                    dispatch.handleNextMonth();
                } else {
                    dispatch.handlePrevMonth();
                }
            }
        }
    }, [weekDays, currentDate, dispatch]);

    const getEventPosition = (event: any) => {
        if (!event.startDateTime || !event.endDateTime) return {};

        const startTime = new Date(event.startDateTime);
        const endTime = new Date(event.endDateTime);

        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        const endHour = endTime.getHours() + endTime.getMinutes() / 60;

        const top = (startHour / 24) * 100;
        const height = ((endHour - startHour) / 24) * 100;

        return {
            top: `${top}%`,
            height: `${height}%`,
        };
    };

    return (
        <div className="weekly-calendar-container">
            <div className="weekly-header">
                <div className="time-column-header"></div>
                {weekDays.map((day, index) => (
                    <div key={day.date} className="day-header">
                        <span className="day-name">{daysOfWeek[index]}</span>
                        <span className="day-number">{day.day}</span>
                    </div>
                ))}
            </div>

            <div className="weekly-all-day-section">
                <div className="time-column-header all-day-label">종일</div>
                {weekDays.map((day, dayIndex) => {
                    const allDayEventsOnThisDay = events.filter(e => {
                        if (e.startDateTime) return false;
                        const currentDate = new Date(day.date);
                        const eventStart = new Date(e.startDate);
                        const eventEnd = new Date(e.endDate);
                        return currentDate >= eventStart && currentDate < eventEnd;
                    });

                    return (
                        <div key={day.date} className="all-day-column">
                            {allDayEventsOnThisDay.map(event => {
                                const eventStartDate = new Date(event.startDate);
                                const eventEndDate = new Date(event.endDate);
                                const currentDate = new Date(day.date);
                                const weekStartDate = new Date(weekDays[0].date);
                                const weekEndDate = new Date(weekDays[6].date);

                                const isFirstDayOfEventInWeek = eventStartDate.getTime() === currentDate.getTime() || (dayIndex === 0 && eventStartDate < weekStartDate);
                                const actualEventEndDate = new Date(eventEndDate.getTime() - 24 * 60 * 60 * 1000);
                                const isLastDayOfEventInWeek = actualEventEndDate.getTime() === currentDate.getTime() || (dayIndex === 6 && actualEventEndDate > weekEndDate);

                                let itemClasses = 'all-day-event-item';
                                if (!isFirstDayOfEventInWeek) {
                                    itemClasses += ' continuation-left';
                                }
                                if (!isLastDayOfEventInWeek) {
                                    itemClasses += ' continuation-right';
                                }

                                return (
                                    <div key={event.id} className={itemClasses} style={{ backgroundColor: event.color }} onClick={() => setSelectedEvent(event)}>
                                        {isFirstDayOfEventInWeek && (
                                            <span className="event-title">{event.title.replace(/^\d{2}\s*/, '')}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <div className="weekly-body">
                <div className="time-column">
                    {hours.map(hour => (
                        <div key={hour} className="time-slot-label">{hour}</div>
                    ))}
                </div>
                {weekDays.map(day => {
                    const timedEvents = events.filter(event => event.startDate === day.date && event.startDateTime);
                    return (
                        <div key={day.date} className="day-column">
                            <div className="timed-events-grid">
                                {hours.map(hour => <div key={hour} className="time-grid-line"></div>)}
                                {timedEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="timed-event-item"
                                        style={{ ...getEventPosition(event), backgroundColor: event.color }}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <span className="event-title">{event.title.replace(/^\d{2}\s*/, '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyCalendar;