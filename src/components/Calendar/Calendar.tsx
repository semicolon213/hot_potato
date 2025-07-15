import React from 'react';
import useCalendarContext from '../../hooks/useCalendarContext.ts';
import './Calendar.css';

interface CalendarProps {
    onAddEvent: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent }) => {
    const { dispatch, currentDate, daysInMonth, selectedDate, events, setSelectedEvent } = useCalendarContext();
    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    return (
        <>
            <div className="calendar-header-container">
                <div className="year-display">{currentDate.year}</div>
                <div className="month-navigation">
                    <div className="month-controls">
                        <button className="arrow-button" onClick={dispatch.handlePrevMonth}>
                            &#8249;
                        </button>
                        <span className="month-display">{currentDate.month}월</span>
                        <button className="arrow-button" onClick={dispatch.handleNextMonth}>
                            &#8250;
                        </button>
                    </div>
                    <button onClick={onAddEvent} className="add-event-button" style={{ marginLeft: 'auto' }}>일정추가</button>
                </div>
            </div>
            <div className="calendar-body-container">
                <div className="day-wrapper">
                    {weeks.map((week, index) => (
                        <div className={`calendar-item ${index === 0 ? 'sunday' : ''}`} key={week}>
                            {week}
                        </div>
                    ))}
                </div>
                <div className="day-wrapper">
                    {daysInMonth.map((date) => {
                        const dayEvents = events.filter(event => {
                            const startDate = new Date(event.startDate);
                            const endDate = new Date(event.endDate);
                            const currentDate = new Date(date.date);
                            return currentDate >= startDate && currentDate <= endDate;
                        });
                        const isSelected = selectedDate.date === date.date;
                        const isSunday = date.dayIndexOfWeek === 0;
                        const isCurrentMonth = currentDate.month === date.month;

                        return (
                            <div
                                onClick={() => selectedDate.selectDate(new Date(date.date))}
                                className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
                                key={date.date}>
                                <span className="day-number">{date.day}</span>
                                <ul className="event-list">
                                    {dayEvents.map(event => (
                                        <li key={event.id} className="event-item" onClick={() => setSelectedEvent(event)}>
                                            {event.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Calendar;