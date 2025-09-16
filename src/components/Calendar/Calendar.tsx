import React, { useState, useRef, useEffect } from 'react';
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
        addEvent,
        selectedEvent,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];
    const [viewMode, setViewMode] = useState('monthly'); // 기본 뷰를 '월간'으로 변경
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], position: { top: 0, left: 0 } });

    const moreButtonRef = useRef<HTMLButtonElement>(null);

    // input에서만 관리할 임시 날짜 상태
    const [tempStartDate, setTempStartDate] = useState(
        semesterStartDate.toISOString().split('T')[0]
    );

    useEffect(() => {
        const semesterStartEvent = events.find(event => event.title === '03개강일');
        if (semesterStartEvent) {
            setTempStartDate(semesterStartEvent.startDate.split('T')[0]);
            setSemesterStartDate(new Date(semesterStartEvent.startDate));
        }
    }, [events, setSemesterStartDate]);

    // input에서 날짜 변경 → 임시 저장
    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempStartDate(e.target.value);
    };

    // 버튼 눌렀을 때 학기 시작일 확정
    const handleConfirmStartDate = () => {
        if (tempStartDate) {
            setSemesterStartDate(new Date(tempStartDate));
            addEvent({
                title: '03개강일',
                description: '학기 시작일',
                startDate: tempStartDate,
                endDate: tempStartDate, // Provider가 종료일을 자동으로 하루 뒤로 조정해줍니다.
            });
            setViewMode('weekly'); // 주간 뷰로 전환
        }
    };

    const handleMoreClick = (dayEvents: Event[], e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();

        const modalWidth = 250; // As defined in MoreEventsModal.css
        const modalHeight = 200; // Approximate height

        const { innerWidth, innerHeight } = window;

        let { top, left } = rect;

        if (left + modalWidth > innerWidth) {
            left = innerWidth - modalWidth - 20; // Adjust with some padding
        }

        if (top + modalHeight > innerHeight) {
            top = innerHeight - modalHeight - 60; // Adjust with some padding
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
                            <input
                                type="date"
                                id="semester-start"
                                value={tempStartDate}
                                onChange={handleDateInput}
                            />
                            <button onClick={handleConfirmStartDate}>변경</button>
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
                                <button key={weekNum} onClick={() => {
                                    setSelectedWeek(weekNum);
                                }} className={selectedWeek === weekNum ? 'active' : ''}>
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
                                        {dayEvents.slice(0, 2).map(event => {
                                            const eventStartDate = new Date(event.startDate);
                                            const eventEndDate = new Date(event.endDate); // Exclusive
                                            const currentDate = new Date(date.date);

                                            const isFirstDayOfEvent = eventStartDate.getTime() === currentDate.getTime();
                                            const actualEventEndDate = new Date(eventEndDate.getTime() - 24 * 60 * 60 * 1000); // Inclusive
                                            const isLastDayOfEvent = actualEventEndDate.getTime() === currentDate.getTime();

                                            let itemClasses = 'event-item';
                                            if (!isFirstDayOfEvent) {
                                                itemClasses += ' continuation-left';
                                            }
                                            if (!isLastDayOfEvent) {
                                                itemClasses += ' continuation-right';
                                            }

                                            const isEventSelected = selectedEvent && selectedEvent.id === event.id;
                                            if (isEventSelected) {
                                                itemClasses += ' selected';
                                            }


                                            return (
                                                <li key={event.id} className={itemClasses} style={{ backgroundColor: event.color }} onClick={(e) => handleEventClick(event, e)}>
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