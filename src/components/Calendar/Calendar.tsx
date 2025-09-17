import React, { useState, useRef, useEffect } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';


interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, position: { top: number; left: number }) => void;
    onSave: () => Promise<void>;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent, onSelectEvent, onSave }) => {
    const {
        dispatch,
        currentDate,
        daysInMonth,
        selectedDate,
        events,
        semesterStartDate,
        setSemesterStartDate,
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
        const newDate = new Date(value);
        const periodToUpdate = customPeriods.find(p => p.id === id);
        if (!periodToUpdate) return;

        if (part === 'start' && periodToUpdate.period.end && newDate > periodToUpdate.period.end) {
            alert('시작일은 종료일보다 늦을 수 없습니다.');
            return;
        }
        if (part === 'end' && periodToUpdate.period.start && newDate < periodToUpdate.period.start) {
            alert('종료일은 시작일보다 빠를 수 없습니다.');
            return;
        }

        const updatedPeriods = customPeriods.map(p => {
            if (p.id === id) {
                return { ...p, period: { ...p.period, [part]: newDate } };
            }
            return p;
        });
        setCustomPeriods(updatedPeriods);
    };

    const handleFinalExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        const newDate = new Date(value);
        if (part === 'start' && finalExamsPeriod.end && newDate > finalExamsPeriod.end) {
            alert('시작일은 종료일보다 늦을 수 없습니다.');
            return;
        }
        if (part === 'end' && finalExamsPeriod.start && newDate < finalExamsPeriod.start) {
            alert('종료일은 시작일보다 빠를 수 없습니다.');
            return;
        }
        setFinalExamsPeriod({ ...finalExamsPeriod, [part]: newDate });
    };

    const handleGradeEntryPeriodChange = (part: 'start' | 'end', value: string) => {
        const newDate = new Date(value);
        if (part === 'start' && gradeEntryPeriod.end && newDate > gradeEntryPeriod.end) {
            alert('시작일은 종료일보다 늦을 수 없습니다.');
            return;
        }
        if (part === 'end' && gradeEntryPeriod.start && newDate < gradeEntryPeriod.start) {
            alert('종료일은 시작일보다 빠를 수 없습니다.');
            return;
        }
        setGradeEntryPeriod({ ...gradeEntryPeriod, [part]: newDate });
    };

    const handleDeleteCustomPeriod = (id: string) => {
        if (window.confirm('이 항목을 정말로 삭제하시겠습니까?')) {
            const updatedPeriods = customPeriods.filter(p => p.id !== id);
            setCustomPeriods(updatedPeriods);
        }
    };

    const handleSave = async () => {
        await onSave();
        setIsSemesterPickerOpen(false);
    };

    const handleCloseWithoutSaving = () => {
        if (window.confirm('저장 되지 않습니다. 그래도 닫겠습니까?')) {
            setIsSemesterPickerOpen(false);
        }
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
                <div className="semester-picker-overlay" onClick={handleCloseWithoutSaving}>
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
                        {/* 기말고사 */}
                        <div className="date-selector-row">
                            <label>기말고사</label>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.start)}
                                onChange={(e) => handleFinalExamsPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(finalExamsPeriod.end)}
                                onChange={(e) => handleFinalExamsPeriodChange('end', e.target.value)}
                            />
                        </div>
                        {/* 성적입력 및 강의평가 */}
                        <div className="date-selector-row">
                            <label>성적입력 및 강의평가</label>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.start)}
                                onChange={(e) => handleGradeEntryPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(gradeEntryPeriod.end)}
                                onChange={(e) => handleGradeEntryPeriodChange('end', e.target.value)}
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

                        <div className="modal-actions">
                            <button onClick={handleSave}>완료</button>
                            <button onClick={handleCloseWithoutSaving} className="close-btn">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Calendar;
