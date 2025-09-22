import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';
import DayPopover from './DayPopover';

interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, position: { top: number; left: number }) => void;
    viewMode: 'monthly' | 'weekly';
    setViewMode: (mode: 'monthly' | 'weekly') => void;
    selectedWeek: number;
    setSelectedWeek: (week: number) => void;
    onSave: () => Promise<void>;
}

const Calendar: React.FC<CalendarProps> = ({ onAddEvent, onSelectEvent, viewMode, setViewMode, selectedWeek, setSelectedWeek, onSave}) => {

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
        eventTypes,
        setGradeEntryPeriod,
        customPeriods,
        setCustomPeriods,
        selectedEvent,
        activeFilters,
        setActiveFilters,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], position: { top: 0, left: 0 } });

    const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState("");
    const [popover, setPopover] = useState<{ visible: boolean; events: Event[]; date: string; top: number; left: number; }>({ visible: false, events: [], date: '', top: 0, left: 0 });
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const filterLabels: { [key: string]: string } = {
        all: '전체',
        holiday: '휴일/휴강',
        exam: '시험',
        assignment: '과제',
        event: '행사',
        makeup: '보강',
    };

    const handleFilterChange = (filter: string) => {
        if (filter === 'all') {
            setActiveFilters(['all']);
            return;
        }

        const newFilters = activeFilters.includes('all')
            ? [filter] // If 'all' is selected, start a new selection
            : activeFilters.includes(filter)
                ? activeFilters.filter(f => f !== filter) // Deselect if already selected
                : [...activeFilters, filter]; // Add to selection

        // If all filters are deselected, select 'all' again
        if (newFilters.length === 0) {
            setActiveFilters(['all']);
        } else {
            setActiveFilters(newFilters);
        }
    };

    useEffect(() => {
        console.log("Checking for '개강일' event in updated events array:", events);
        const semesterStartEvent = events.find(event => event.title === '개강일');
        console.log("Found '개강일' event:", semesterStartEvent);

        if (semesterStartEvent && semesterStartEvent.startDate) {
            console.log("Attempting to set semesterStartDate with:", semesterStartEvent.startDate);
            const newStartDate = new Date(semesterStartEvent.startDate);
            if (!isNaN(newStartDate.getTime())) {
                setSemesterStartDate(newStartDate);
                console.log("Successfully set semesterStartDate to:", newStartDate);
            } else {
                console.error("'개강일' event's startDate resulted in an Invalid Date:", semesterStartEvent.startDate);
            }
        } else {
            console.log("No valid '개강일' event found to update semesterStartDate.");
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

    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return '';
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

    const handleDateChange = (setter: (date: Date) => void, value: string) => {
        if (value) {
            const newDate = new Date(value);
            if (!isNaN(newDate.getTime())) {
                setter(newDate);
            }
        }
    };

    const handlePeriodChange = (updater: (period: any) => void, part: 'start' | 'end', value: string) => {
        if (value) {
            const newDate = new Date(value);
            if (!isNaN(newDate.getTime())) {
                updater((prev: any) => ({ ...prev, [part]: newDate }));
            }
        }
    };
    
    const handleCustomPeriodChange = (id: string, part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

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
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

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
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

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

    const handleDayMouseEnter = (e: React.MouseEvent<HTMLDivElement>, dayEvents: Event[], date: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPopover({
            visible: true,
            events: dayEvents,
            date: date,
            top: rect.bottom + 5,
            left: rect.left,
        });
    };

    const handleDayMouseLeave = () => {
        setPopover(p => ({ ...p, visible: false }));
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
            if (week.length === 0) return;
            const weekStart = new Date(week[0].date);
            const weekEnd = new Date(week[week.length - 1].date);
            weekEnd.setHours(23, 59, 59, 999);

            const weekEvents = events.filter(e => {
                const eventStart = new Date(e.startDate);
                const eventEnd = new Date(e.endDate);
                return eventStart <= weekEnd && eventEnd >= weekStart;
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
                    if (!day) continue;
                    const dayStart = new Date(day.date);
                    const dayEnd = new Date(day.date);
                    dayEnd.setDate(dayEnd.getDate() + 1);

                    if (eventStart < dayEnd && eventEnd >= dayStart) {
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

    const getWeekDatesText = (weekNum: number) => {
        if (!semesterStartDate || isNaN(semesterStartDate.getTime())) return '';
        const start = new Date(semesterStartDate);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`;
    };

    return (
        <>
            <div className="calendar-header-container">
                <div className='calendar-header-top'>
                    <div className="calendar-title" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handlePrevMonth() : setSelectedWeek(selectedWeek > 1 ? selectedWeek - 1 : 1)}>&#8249;</button>
                        <h2>
                            {viewMode === 'monthly' ? (
                                `${currentDate.year}년 ${currentDate.month}월`
                            ) : (
                                `${selectedWeek}주차`
                            )}
                        </h2>
                        <button className="arrow-button" onClick={() => viewMode === 'monthly' ? dispatch.handleNextMonth() : setSelectedWeek(selectedWeek < 15 ? selectedWeek + 1 : 15)}>&#8250;</button>
                        {viewMode === 'weekly' && <span style={{fontSize: '14px', color: 'var(--text-medium)'}}>{getWeekDatesText(selectedWeek)}</span>}
                    </div>
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
                        <div className="filter-tags-container">
                            {['all', ...eventTypes].map(filter => (
                                <button
                                    key={filter}
                                    className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(filter)}
                                >
                                    {filterLabels[filter] || filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {viewMode === 'monthly' ? (
                <div className="calendar-body-container">
                    <div className="day-wrapper">
                        {weeks.map((week, index) => (
                            <div className={`calendar-item ${index === 0 ? 'sunday' : ''}`} key={week}>{week}</div>
                        ))}
                    </div>
                    <div className="day-wrapper">
                        {daysInMonth.map((date) => {
                            const dayLayout = eventLayouts.get(date.date) || [];
                            const dayEvents = dayLayout.filter((e): e is Event => e !== null);

                            const isSelected = selectedDate.date === date.date;
                            const isSunday = date.dayIndexOfWeek === 0;
                            const isSaturday = date.dayIndexOfWeek === 6;
                            const isCurrentMonth = currentDate.month === date.month;
                            const isHoliday = dayEvents.some(e => e.isHoliday);

                            return (
                                <div
                                    onMouseEnter={(e) => handleDayMouseEnter(e, dayEvents, date.date)}
                                    onMouseLeave={handleDayMouseLeave}
                                    onClick={() => {
                                        selectedDate.selectDate(new Date(date.date));
                                        onAddEvent();
                                    }}
                                    className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${isHoliday ? 'holiday' : ''}`}
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
                                                    <span style={{marginRight: '4px'}}>{event.icon}</span>
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
            {isSemesterPickerOpen && (
                <div className="semester-picker-overlay" onClick={handleCloseWithoutSaving}>
                    <div className="semester-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="date-selector-row">
                            <label htmlFor="semester-start-date">개강일</label>
                            <input
                                id="semester-start-date"
                                type="date"
                                value={formatDateForInput(semesterStartDate)}
                                onChange={(e) => handleDateChange(setSemesterStartDate, e.target.value)}
                            />
                        </div>
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
            {popover.visible && (
                <DayPopover
                    events={popover.events}
                    date={popover.date}
                    position={{ top: popover.top, left: popover.left }}
                />
            )}
        </>
    );
};

export default Calendar;