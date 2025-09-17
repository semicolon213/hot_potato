import React, { useState, useRef, useEffect } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
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
        makeupPeriod,
        setMakeupPeriod,
        finalExamsPeriod,
        setFinalExamsPeriod,
        gradeEntryPeriod,
        setGradeEntryPeriod,
        customPeriods,
        setCustomPeriods,
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

    const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState("");

    const moreButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const semesterStartEvent = events.find(event => event.title === '개강일');
        if (semesterStartEvent) {
            setSemesterStartDate(new Date(semesterStartEvent.startDate));
        }
    }, [events, setSemesterStartDate]);


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

    const formatDateForInput = (date: Date | null) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const handleAddCustomPeriod = () => {
        if (!newPeriodName.trim()) {
            alert('추가할 항목의 이름을 입력해주세요.');
            return;
        }
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: newPeriodName,
            period: { start: null, end: null },
        };
        setCustomPeriods([...customPeriods, newPeriod]);
        setNewPeriodName("");
    };

    const handleCustomPeriodChange = (id: string, part: 'start' | 'end', value: string) => {
        const updatedPeriods = customPeriods.map(p => {
            if (p.id === id) {
                return { ...p, period: { ...p.period, [part]: new Date(value) } };
            }
            return p;
        });
        setCustomPeriods(updatedPeriods);
    };

    const handleDeleteCustomPeriod = (id: string) => {
            const updatedPeriods = customPeriods.filter(p => p.id !== id);
            setCustomPeriods(updatedPeriods);
    };

    return (
        <>
            <div className="calendar-header-container">
                <div className='calendar-header-top'>
                    <div className="year-display">{currentDate.year}</div>
                    <div className="header-right-controls">
                        <div className="view-switcher">
                            <IoSettingsSharp onClick={() => setIsSemesterPickerOpen(true)} style={{ marginRight: '8px', cursor: 'pointer', fontSize: '25px', verticalAlign: 'middle', position: 'relative', top: '2px' }} />
                            <button onClick={() => setViewMode('monthly')}
                                    className={viewMode === 'monthly' ? 'active' : ''}>월간
                            </button>
                            <button onClick={() => setViewMode('weekly')}
                                    className={viewMode === 'weekly' ? 'active' : ''}>주간
                            </button>
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
                                    onClick={() => {
                                        selectedDate.selectDate(new Date(date.date));
                                        onAddEvent();
                                    }}
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
                                                    {isFirstDayOfEvent ? event.title : <>&nbsp;</>}
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
            {isSemesterPickerOpen && (
                <div className="semester-picker-overlay" onClick={() => setIsSemesterPickerOpen(false)}>
                    <div className="semester-picker-modal" onClick={(e) => e.stopPropagation()}>
                        {/* 개강일 */}
                        <div className="date-selector-row">
                            <label htmlFor="semester-start-date">개강일</label>
                            <input
                                id="semester-start-date"
                                type="date"
                                value={formatDateForInput(semesterStartDate)}
                                onChange={(e) => setSemesterStartDate(new Date(e.target.value))}
                            />
                        </div>
                        {/* 보강기간 */}
                        <div className="date-selector-row">
                            <label>보강기간</label>
                            <input
                                type="date"
                                value={formatDateForInput(makeupPeriod.start)}
                                onChange={(e) => setMakeupPeriod({ ...makeupPeriod, start: new Date(e.target.value) })}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(makeupPeriod.end)}
                                onChange={(e) => setMakeupPeriod({ ...makeupPeriod, end: new Date(e.target.value) })}
                            />
                        </div>
                        {/* 기말고사 */}
                        <div className="date-selector-row">
                            <label>기말고사</label>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.start)}
                                onChange={(e) => setFinalExamsPeriod({ ...finalExamsPeriod, start: new Date(e.target.value) })}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.end)}
                                onChange={(e) => setFinalExamsPeriod({ ...finalExamsPeriod, end: new Date(e.target.value) })}
                            />
                        </div>
                        {/* 성적입력 및 강의평가 */}
                        <div className="date-selector-row">
                            <label>성적입력 및 강의평가</label>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.start)}
                                onChange={(e) => setGradeEntryPeriod({ ...gradeEntryPeriod, start: new Date(e.target.value) })}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.end)}
                                onChange={(e) => setGradeEntryPeriod({ ...gradeEntryPeriod, end: new Date(e.target.value) })}
                            />
                        </div>

                        {/* Custom Periods */}
                        {customPeriods.map(p => (
                            <div key={p.id} className="date-selector-row">
                                <label>{p.name}</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(p.period.start)}
                                    onChange={(e) => handleCustomPeriodChange(p.id, 'start', e.target.value)}
                                />
                                <span>~</span>
                                <input
                                    type="date"
                                    value={formatDateForInput(p.period.end)}
                                    onChange={(e) => handleCustomPeriodChange(p.id, 'end', e.target.value)}
                                />
                                <button onClick={() => handleDeleteCustomPeriod(p.id)} className="delete-period-btn">삭제</button>
                            </div>
                        ))}

                        {/* Add New Period Form */}
                        <div className="add-period-form">
                            <input
                                type="text"
                                placeholder="항목 이름"
                                value={newPeriodName}
                                onChange={(e) => setNewPeriodName(e.target.value)}
                            />
                            <button onClick={handleAddCustomPeriod}>추가</button>
                        </div>

                        <button onClick={() => setIsSemesterPickerOpen(false)}>닫기</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Calendar;
