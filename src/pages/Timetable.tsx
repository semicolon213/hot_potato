import React, { useState, useEffect } from 'react';
import './Timetable.css';
import AddTimetableEventModal, { type TimetableEvent } from '../components/features/timetable/AddTimetableEventModal';
import { getScheduleEvents, addScheduleEvent } from '../utils/database/personalConfigManager';

const Timetable: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [events, setEvents] = useState<TimetableEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const hours = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, '0')}:00`); // 9 AM to 9 PM

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            const fetchedEvents = await getScheduleEvents();
            const formattedEvents: TimetableEvent[] = fetchedEvents.map(e => ({
                no: e.no,
                title: e.title,
                day: e.date ? (e.date.charAt(0) as TimetableEvent['day']) : '월', // 'day'가 아닌 'date' 속성 사용
                startTime: e.startTime,
                endTime: e.endTime,
                description: e.description,
                color: e.color,
            })).filter(e => e.title); // 제목이 없는 빈 행은 필터링
            setEvents(formattedEvents);
            setIsLoading(false);
        };
        fetchEvents();
    }, []);

    const handleSaveEvent = async (newEvent: Omit<TimetableEvent, 'no'>) => {
        // Optimistic update
        setEvents(prevEvents => [...prevEvents, newEvent]);
        
                try {
                    await addScheduleEvent(newEvent);
                    // Optional: refetch to get the 'no' and ensure consistency
                    const fetchedEvents = await getScheduleEvents();
                    const formattedEvents: TimetableEvent[] = fetchedEvents.map(e => ({
                        no: e.no,
                        title: e.title,
                        day: e.date ? (e.date.charAt(0) as TimetableEvent['day']) : '월', // 'day'가 아닌 'date' 속성 사용
                        startTime: e.startTime,
                        endTime: e.endTime,
                        description: e.description,
                        color: e.color,
                    })).filter(e => e.title); // 제목이 없는 빈 행은 필터링
                    setEvents(formattedEvents);
                } catch (error) {            console.error("Failed to save event, reverting optimistic update", error);
            // Revert optimistic update on failure
            setEvents(prevEvents => prevEvents.filter(e => e !== newEvent));
        }
    };

    const getEventStyle = (event: TimetableEvent) => {
        const start = new Date(`1970-01-01T${event.startTime}:00`);
        const end = new Date(`1970-01-01T${event.endTime}:00`);
        
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;

        const timetableStartHour = 9;
        const totalHours = 13; // 9:00 to 22:00

        const top = ((startHour - timetableStartHour) / totalHours) * 100;
        const height = ((endHour - startHour) / totalHours) * 100;

        return {
            top: `${top}%`,
            height: `${height}%`,
            backgroundColor: event.color,
        };
    };

    return (
        <>
            {isModalOpen && <AddTimetableEventModal onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} />}
            <div className="timetable-page-container">
                <div className="timetable-controls-bar">
                    <div className="timetable-date-display">
                        시간표
                    </div>
                    <div className="timetable-view-options">
                        <button className="timetable-control-button" onClick={() => setIsModalOpen(true)}>일정 추가</button>
                    </div>
                </div>

                <div className="timetable-grid-container">
                    <div className="timetable-grid-header">
                        <div className="timetable-header-time-gutter"></div>
                        {daysOfWeek.map((day) => (
                            <div key={day} className={`timetable-header-day ${day === '일' ? 'timetable-header-day--sunday' : ''} ${day === '토' ? 'timetable-header-day--saturday' : ''}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="timetable-body-scroll-wrapper">
                        <div className="timetable-grid-body">
                            <div className="timetable-body-time-gutter">
                                {hours.map(hour => (
                                    <div key={hour} className="timetable-time-slot">{hour}</div>
                                ))}
                            </div>
                            {daysOfWeek.map((day) => {
                                const dayEvents = events.filter(event => event.day === day);
                                return (
                                    <div key={day} className={`timetable-day-column ${day === '일' ? 'timetable-day-column--sunday' : ''} ${day === '토' ? 'timetable-day-column--saturday' : ''}`}>
                                        {/* Grid lines */}
                                        {hours.map((_, index) => (
                                            <React.Fragment key={index}>
                                                <div className="timetable-day-column-grid-line"></div>
                                                <div className="timetable-day-column-grid-line"></div>
                                            </React.Fragment>
                                        ))}
                                        {/* Events */}
                                        {isLoading ? (
                                            <div>Loading...</div>
                                        ) : (
                                            dayEvents.map((event, index) => (
                                                <div
                                                    key={`${event.no}-${index}`}
                                                    className="timetable-event-item"
                                                    style={getEventStyle(event)}
                                                >
                                                    <div className="timetable-event-title">{event.title}</div>
                                                    <div className="timetable-event-details">{event.description}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Timetable;
