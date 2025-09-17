import React, { useState, useRef, useEffect, useMemo } from 'react';
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';

interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, position: { top: number; left: number }) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent, onSelectEvent }) => {
    const {
        dispatch,
        currentDate,
        daysInMonth,
        selectedDate,
        events,
        semesterStartDate,
        setSemesterStartDate,
        selectedEvent,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];
    const [viewMode, setViewMode] = useState('monthly');
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], position: { top: 0, left: 0 } });

    const moreButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const semesterStartEvent = events.find(event => event.title === '개강일');
        if (semesterStartEvent) {
            setSemesterStartDate(new Date(semesterStartEvent.startDate));
        }
    }, [events, setSemesterStartDate]);

    const handleMoreClick = (dayEvents: Event[], e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const modalWidth = 250;
        const modalHeight = 200;
        const { innerWidth, innerHeight } = window;
        let { top, left } = rect;
        if (left + modalWidth > innerWidth) {
            left = innerWidth - modalWidth - 20;
        }
        if (top + modalHeight > innerHeight) {
            top = innerHeight - modalHeight - 60;
        }
        setMoreEventsModal({
            isOpen: true,
            events: dayEvents,
            position: { top, left },
        });
    };

    const handleEventClick = (event: Event, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        onSelectEvent(event, { top: rect.top, left: rect.left });
    };

    const weeksInMonth = useMemo(() => {
        const weeksArr: any[][] = [];
        if (!daysInMonth) return [];
        for (let i = 0; i < daysInMonth.length; i += 7) {
            weeksArr.push(daysInMonth.slice(i, i + 7));
        }
        return weeksArr;
    }, [daysInMonth]);

    const eventLayouts = useMemo(() => {
        const layouts = new Map<string, (Event | null)[]>();
        weeksInMonth.forEach(week => {
            const weekStart = new Date(week[0].date);
            const weekEnd = new Date(week[6].date);
            weekEnd.setHours(23, 59, 59, 999);

            const weekEvents = events.filter(e => {
                const eventStart = new Date(e.startDate);
                const eventEnd = new Date(e.endDate);
                return eventStart <= weekEnd && eventEnd > weekStart;
            });

            const lanes: (Date | null)[] = [];
            for (const event of weekEvents) {
                const eventStart = new Date(event.startDate);
                let laneIndex = lanes.findIndex(laneEndDate => laneEndDate && laneEndDate <= eventStart);
                if (laneIndex === -1) {
                    laneIndex = lanes.length;
                }
                const eventEnd = new Date(event.endDate);
                lanes[laneIndex] = eventEnd;

                for (let i = 0; i < 7; i++) {
                    const day = week[i];
                    const dayStart = new Date(day.date);
                    const dayEnd = new Date(day.date);
                    dayEnd.setDate(dayEnd.getDate() + 1);

                    if (eventStart < dayEnd && eventEnd > dayStart) {
                        if (!layouts.has(day.date)) {
                            layouts.set(day.date, []);
                        }
                        const dayLayout = layouts.get(day.date)!;
                        while (dayLayout.length < laneIndex) {
                            dayLayout.push(null);
                        }
                        dayLayout[laneIndex] = event;
                    }
                }
            }
        });
        return layouts;
    }, [weeksInMonth, events]);

    return (
        <>
            <div className="calendar-header-container">
                <div className='calendar-header-top'>
                    <div className="year-display">{currentDate.year}</div>
                    <div className="header-right-controls">
                        <div className="view-switcher">
                            <button onClick={() => setViewMode('monthly')} className={viewMode === 'monthly' ? 'active' : ''}>월간</button>
                            <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>주간</button>
                        </div>
                    </div>
                </div>
                <div className="month-navigation">
                    <div className="month-controls">
                        {viewMode === 'monthly' && <button className="arrow-button" onClick={dispatch.handlePrevMonth}>&#8249;</button>}
                        <span className="month-display">{currentDate.month}월</span>
                        {viewMode === 'monthly' && <button className="arrow-button" onClick={dispatch.handleNextMonth}>&#8250;</button>}
                    </div>
                    <button onClick={onAddEvent} className="add-event-button" style={{ marginLeft: 'auto' }}>+일정추가</button>
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
                            <div className={`calendar-item ${index === 0 ? 'sunday' : ''}`} key={week}>{week}</div>
                        ))}
                    </div>
                    {weeksInMonth.map((week, i) => (
                        <div className="day-wrapper" key={i}>
                            {week.map((date) => {
                                const dayLayout = eventLayouts.get(date.date) || [];
                                const dayEvents = dayLayout.filter(e => e !== null) as Event[];
                                const isSelected = selectedDate.date === date.date;
                                const isSunday = date.dayIndexOfWeek === 0;
                                const isCurrentMonth = currentDate.month === date.month;

                                return (
                                    <div
                                        onClick={() => {
                                            selectedDate.selectDate(new Date(date.date));
                                            onAddEvent();
                                        }}
                                        className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
                                        key={date.date}>
                                        <span className="day-number">{date.day}</span>
                                        <ul className="event-list">
                                            {dayLayout.slice(0, 2).map((event, index) => {
                                                if (!event) {
                                                    return <li key={index} className="event-item" style={{ visibility: 'hidden' }}>&nbsp;</li>;
                                                }
                                                const eventStartDate = new Date(event.startDate);
                                                const eventEndDate = new Date(event.endDate);
                                                const currentDate = new Date(date.date);
                                                const isFirstDayOfEvent = eventStartDate.toDateString() === currentDate.toDateString();
                                                const actualEventEndDate = new Date(eventEndDate.getTime() - 24 * 60 * 60 * 1000);
                                                const isLastDayOfEvent = actualEventEndDate.toDateString() === currentDate.toDateString();
                                                let itemClasses = 'event-item';
                                                if (!isFirstDayOfEvent) itemClasses += ' continuation-left';
                                                if (!isLastDayOfEvent) itemClasses += ' continuation-right';
                                                if (selectedEvent && selectedEvent.id === event.id) itemClasses += ' selected';

                                                return (
                                                    <li key={event.id + date.date} className={itemClasses} style={{ backgroundColor: event.color }} onClick={(e) => handleEventClick(event, e)}>
                                                        {(isFirstDayOfEvent || date.dayIndexOfWeek === 0) ? event.title : <>&nbsp;</>}
                                                    </li>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <button ref={moreButtonRef} className="more-button" onClick={(e) => handleMoreClick(dayEvents, e)}>
                                                    {dayEvents.length - 2}개 더보기
                                                </button>
                                            )}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            ) : (
                <WeeklyCalendar selectedWeek={selectedWeek} />
            )}
            {moreEventsModal.isOpen && (
                <MoreEventsModal
                    events={moreEventsModal.events}
                    onClose={() => setMoreEventsModal({ ...moreEventsModal, isOpen: false })}
                    position={moreEventsModal.position}
                    onSelectEvent={(event) => {
                        onSelectEvent(event, moreEventsModal.position);
                        setMoreEventsModal({ ...moreEventsModal, isOpen: false });
                    }}
                />
            )}
        </>
    );
};

export default Calendar;