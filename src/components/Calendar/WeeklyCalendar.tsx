import React, { useEffect, useMemo } from 'react';
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext';
import './WeeklyCalendar.css';

interface WeeklyCalendarProps {
    selectedWeek: number;
}

// Helper function to calculate event layout
const calculateAllDayEventLayout = (events: Event[], weekDays: { date: string }[]) => {
    if (weekDays.length === 0) return { layout: [], canvasHeight: 0 };

    const weekStart = new Date(weekDays[0].date);
    const weekEnd = new Date(weekDays[6].date);

    const allDayEvents = events.filter(e => {
        if (e.startDateTime) return false; // Not an all-day event
        const eventStart = new Date(e.startDate);
        const eventEnd = new Date(e.endDate);
        // Check if event overlaps with the current week
        return eventStart < new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000) && eventEnd > weekStart;
    });

    const layout: { event: Event; left: number; width: number; top: number; }[] = [];
    const occupiedRows: (Event | null)[][] = [];

    allDayEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    allDayEvents.forEach(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        const startIndex = Math.max(0, Math.floor((eventStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
        const endIndex = Math.min(6, Math.floor((new Date(eventEnd.getTime() - 1).getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
        
        const span = endIndex - startIndex + 1;

        let rowIndex = 0;
        while (true) {
            if (!occupiedRows[rowIndex]) {
                occupiedRows[rowIndex] = new Array(7).fill(null);
            }
            let isRowAvailable = true;
            for (let i = startIndex; i <= endIndex; i++) {
                if (occupiedRows[rowIndex][i]) {
                    isRowAvailable = false;
                    break;
                }
            }
            if (isRowAvailable) {
                for (let i = startIndex; i <= endIndex; i++) {
                    occupiedRows[rowIndex][i] = event;
                }
                break;
            }
            rowIndex++;
        }

        layout.push({
            event,
            left: (startIndex / 7) * 100,
            width: (span / 7) * 100,
            top: rowIndex * 24, // 24px per row (20px height + 4px margin)
        });
    });

    const maxRows = occupiedRows.length;
    const canvasHeight = Math.max(maxRows * 24, 30); // Min height of 30px

    return { layout, canvasHeight };
};


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

    const { layout: allDayLayout, canvasHeight } = useMemo(() => calculateAllDayEventLayout(events, weekDays), [events, weekDays]);

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
                <div className="all-day-events-canvas" style={{ height: `${canvasHeight}px` }}>
                    {/* Background columns */}
                    {weekDays.map((day) => (
                        <div key={day.date} className="all-day-column"></div>
                    ))}
                    {/* Absolutely positioned events */}
                    {allDayLayout.map(({ event, left, width, top }) => (
                        <div
                            key={event.id}
                            className="all-day-event-item"
                            style={{
                                left: `${left}%`,
                                width: `calc(${width}% - 2px)`,
                                top: `${top}px`,
                                backgroundColor: event.color,
                            }}
                            onClick={() => setSelectedEvent(event)}
                        >
                            <span className="event-title">{event.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="scrollable-body">
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
                                            <span className="event-title">{event.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendar;