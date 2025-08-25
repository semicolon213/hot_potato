import React, { useState } from 'react';
import useCalendarContext from '../../hooks/useCalendarContext.ts';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar.tsx";

interface CalendarProps {
    onAddEvent: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent }) => {
    const { dispatch, currentDate, daysInMonth, selectedDate, events, setSelectedEvent, semesterStartDate, setSemesterStartDate } = useCalendarContext();
    const weeks = ["일", "월", "화", "수", "목", "금", "토"];
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
    const [selectedWeek, setSelectedWeek] = useState(1);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSemesterStartDate(new Date(e.target.value));
    };

    return (
        <>
            <div className="calendar-header-container">
                <div className='calendar-header-top'>
                    <div className="year-display">{currentDate.year}</div>
                    <div className="header-right-controls">
                        <div className="view-switcher">
                            <button onClick={() => setViewMode('monthly')}
                                    className={viewMode === 'monthly' ? 'active' : ''}>월간
                            </button>
                            <button onClick={() => setViewMode('weekly')}
                                    className={viewMode === 'weekly' ? 'active' : ''}>주간
                            </button>
                        </div>
                        <div className="semester-start-date">
                            <label htmlFor="semester-start">학기 시작일: </label>
                            <input type="date" id="semester-start" value={semesterStartDate.toISOString().split('T')[0]}
                                   onChange={handleStartDateChange}/>
                        </div>

                    </div>
                </div>
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
                {viewMode === 'weekly' && (
                    <div className="week-navigation">
                        <div className='week-navigation-buttons'>
                            {Array.from({ length: 15 }, (_, i) => i + 1).map(weekNum => (
                                <button key={weekNum} onClick={() => setSelectedWeek(weekNum)} className={selectedWeek === weekNum ? 'active' : ''}>
                                    {weekNum}주차
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {viewMode === 'monthly' ? (
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
                                return currentDate >= startDate && currentDate < endDate;
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
                                                {event.title.replace(/^\d{2}\s*/, '')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <WeeklyCalendar selectedWeek={selectedWeek} />
            )}
        </>
    );
};

export default Calendar;
