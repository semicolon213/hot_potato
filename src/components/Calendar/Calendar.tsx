import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import useCalendarContext, { type Event, type DateRange, type CustomPeriod } from '../../hooks/useCalendarContext';
import './Calendar.css';
import WeeklyCalendar from "./WeeklyCalendar";
import MoreEventsModal from './MoreEventsModal';
import ScheduleView from './ScheduleView';

interface CalendarProps {
    onAddEvent: () => void;
    onSelectEvent: (event: Event, rect: DOMRect) => void;
    viewMode: 'monthly' | 'weekly';
    setViewMode: (mode: 'monthly' | 'weekly') => void;
    selectedWeek: number;
    setSelectedWeek: (week: number) => void;
    onSave: (scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }) => Promise<void>;
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
        midtermExamsPeriod,
        setMidtermExamsPeriod,
        gradeEntryPeriod,
        eventTypes,
        setGradeEntryPeriod,
        customPeriods,
        setCustomPeriods,
        selectedEvent,
        activeFilters,
        setActiveFilters,
        user,
    } = useCalendarContext();

    const weeks = ["일", "월", "화", "수", "목", "금", "토"];

    const [moreEventsModal, setMoreEventsModal] = useState<{
        isOpen: boolean;
        events: Event[];
        date: string;
        position: { top: number; left: number };
    }>({ isOpen: false, events: [], date: '', position: { top: 0, left: 0 } });

    const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState("");
    const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
    const [calendarViewMode, setCalendarViewMode] = useState<'schedule' | 'calendar'>('calendar');
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const filterLabels: { [key: string]: string } = {
        all: '전체',
        holiday: '휴일/휴강',
        exam: '시험',
        midterm_exam: '중간고사',
        final_exam: '기말고사',
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

    const handleMoreClick = (dayEvents: Event[], date: string, e: React.MouseEvent) => {
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
            date: date,
            position: { top, left },
        });
    };

    const handleEventClick = (event: Event, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectEvent(event, e.currentTarget.getBoundingClientRect());
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

    const handleAddMakeupPeriod = () => {
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: "보강기간",
            period: { start: null, end: null },
        };
        setCustomPeriods([...customPeriods, newPeriod]);
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

        setFinalExamsPeriod({ ...finalExamsPeriod, [part]: newDate });
    };

    const handleMidtermExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setMidtermExamsPeriod({ ...midtermExamsPeriod, [part]: newDate });
    };

    const handleGradeEntryPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setGradeEntryPeriod({ ...gradeEntryPeriod, [part]: newDate });
    };

    const handleDeleteCustomPeriod = (id: string) => {
        if (window.confirm('이 항목을 정말로 삭제하시겠습니까?')) {
            const updatedPeriods = customPeriods.filter(p => p.id !== id);
            setCustomPeriods(updatedPeriods);
        }
    };

    const handleSave = async () => {
        // Validate custom periods before saving
        for (const p of customPeriods) {
            if (!p.period.start || !p.period.end) {
                alert(`'${p.name}' 기간의 시작일과 종료일을 모두 설정해주세요.`);
                return;
            }
        }

        // Validate all periods before saving
        const allPeriods = [
            { name: '기말고사', period: finalExamsPeriod },
            { name: '성적입력 및 강의평가', period: gradeEntryPeriod },
            ...customPeriods.map(p => ({ name: p.name, period: p.period }))
        ];

        for (const item of allPeriods) {
            const { start, end } = item.period;
            if (start && end && start > end) {
                alert(`'${item.name}' 기간의 종료일은 시작일보다 빠를 수 없습니다.`);
                return; // Stop saving
            }
        }

        await onSave({
            semesterStartDate,
            finalExamsPeriod,
            midtermExamsPeriod,
            gradeEntryPeriod,
            customPeriods
        });
        setIsSemesterPickerOpen(false);
    };

    const handleCloseWithoutSaving = () => {
        if (window.confirm('저장 되지 않습니다. 그래도 닫겠습니까?')) {
            setIsSemesterPickerOpen(false);
        }
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
                // 월간 뷰에서는 시간 지정 이벤트를 제외합니다 (종일 이벤트만 표시).
                return !e.startDateTime && eventStart <= weekEnd && eventEnd >= weekStart;
            });

            const lanes: (Date | null)[] = [];
            for (const event of weekEvents) {
                const eventStart = new Date(event.startDate);
                let laneIndex = lanes.findIndex(laneEndDate => laneEndDate && laneEndDate < eventStart);
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
                    <div className="calendar-title" style={{display: 'flex', alignItems: 'center', gap: '15px', visibility: calendarViewMode === 'calendar' ? 'visible' : 'hidden'}}>
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
                        {user && user.isAdmin && (
                            <IoSettingsSharp onClick={() => setIsSemesterPickerOpen(true)} style={{ marginRight: '-7px', cursor: 'pointer', fontSize: '25px', verticalAlign: 'middle', position: 'relative', top: '0px' }} />
                        )}
                        <div className="view-switcher">
                            <button onClick={() => setCalendarViewMode('schedule')} className={calendarViewMode === 'schedule' ? 'active' : ''}>일정</button>
                            <button onClick={() => setCalendarViewMode('calendar')} className={calendarViewMode === 'calendar' ? 'active' : ''}>달력</button>
                        </div>
                        <div className="view-switcher">
                            <button onClick={() => setViewMode('monthly')} className={viewMode === 'monthly' ? 'active' : ''}>월간</button>
                            <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>주간</button>
                        </div>
                        <div className="filter-tags-container">
                            {['all', ...eventTypes.filter(f => f !== 'exam')].map(filter => (
                                <button
                                    key={filter}
                                    className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(filter)}
                                >
                                    {filterLabels[filter] || filter}
                                </button>
                            ))}
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                    className={`filter-tag ${activeFilters.includes('midterm_exam') || activeFilters.includes('final_exam') ? 'active' : ''}`}
                                    onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                                >
                                    시험
                                </button>
                                {isExamDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        backgroundColor: '#f9f9f9',
                                        minWidth: '120px',
                                        boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                                        zIndex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}>
                                        <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeFilters.includes('midterm_exam')}
                                                onChange={() => handleFilterChange('midterm_exam')}
                                                style={{ marginRight: '8px' }}
                                            />
                                            중간고사
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeFilters.includes('final_exam')}
                                                onChange={() => handleFilterChange('final_exam')}
                                                style={{ marginRight: '8px' }}
                                            />
                                            기말고사
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {calendarViewMode === 'calendar' ? (
                viewMode === 'monthly' ? (
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
                                        onClick={() => {
                                            selectedDate.selectDate(new Date(date.date));
                                            onAddEvent();
                                        }}
                                        className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${isHoliday ? 'holiday' : ''}`}
                                        key={date.date}>
                                        <span className="day-number">{date.day}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <ul className="event-list">
                                            {dayLayout.slice(0, 3).map((event, index) => {
                                                if (!event) {
                                                    return <li key={index} className="event-item" style={{ visibility: 'hidden' }}>&nbsp;</li>;
                                                }
                                                const eventStartDate = new Date(event.startDate);
                                                const eventEndDate = new Date(event.endDate);
                                                const currentDate = new Date(date.date);
                                                const isFirstDayOfEvent = eventStartDate.toDateString() === currentDate.toDateString();
                                                const isLastDayOfEvent = eventEndDate.toDateString() === currentDate.toDateString();
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
                                        </ul>
                                        <div className="overflow-event-lines" onClick={(e) => {
                                            const moreCount = dayLayout.slice(3).filter(Boolean).length;
                                            if (moreCount > 0) {
                                                e.stopPropagation();
                                                handleMoreClick(dayEvents, date.date, e);
                                            }
                                        }}>
                                            {(() => {
                                                const moreCount = dayLayout.slice(3).filter(Boolean).length;
                                                if (moreCount > 0) {
                                                    return <span className="more-events-text">{moreCount}개 더보기</span>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <WeeklyCalendar selectedWeek={selectedWeek} />
                )
            ) : (
                <ScheduleView />
            )}
            {moreEventsModal.isOpen && (
                <MoreEventsModal
                    events={moreEventsModal.events}
                    date={moreEventsModal.date}
                    onClose={() => setMoreEventsModal({ ...moreEventsModal, isOpen: false })}
                    position={moreEventsModal.position}
                    onSelectEvent={(event, e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onSelectEvent(event, rect); // Call the parent's onSelectEvent
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
                            <label>중간고사</label>
                            <input
                                type="date"
                                value={formatDateForInput(midtermExamsPeriod.start)}
                                onChange={(e) => handleMidtermExamsPeriodChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                value={formatDateForInput(midtermExamsPeriod.end)}
                                onChange={(e) => handleMidtermExamsPeriodChange('end', e.target.value)}
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

                        <div className="add-period-form" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="항목 이름"
                                    value={newPeriodName}
                                    onChange={(e) => setNewPeriodName(e.target.value)}
                                />
                                <button onClick={handleAddCustomPeriod}>추가</button>
                            </div>
                            <div style={{ position: 'absolute', right: 0 }}>
                                <button onClick={handleAddMakeupPeriod}>보강</button>
                            </div>
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
