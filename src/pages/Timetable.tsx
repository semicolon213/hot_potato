import React, { useState } from 'react';
import './Timetable.css';

// 가상 데이터
const placeholderEvents = [
    {
        id: 1,
        title: '소프트웨어 공학',
        day: '월',
        startTime: '10:30',
        endTime: '12:00',
        location: '공학관 101호',
        color: 'var(--primary)',
    },
    {
        id: 2,
        title: '자료구조',
        day: '월',
        startTime: '14:00',
        endTime: '15:30',
        location: '공학관 203호',
        color: 'var(--error)',
    },
    {
        id: 3,
        title: '운영체제',
        day: '화',
        startTime: '09:00',
        endTime: '10:30',
        location: '정보관 302호',
        color: 'var(--warning)',
    },
    {
        id: 4,
        title: '컴퓨터 네트워크',
        day: '수',
        startTime: '13:00',
        endTime: '15:00',
        location: '정보관 404호',
        color: 'var(--info)',
    },
    {
        id: 5,
        title: '데이터베이스',
        day: '목',
        startTime: '11:00',
        endTime: '12:30',
        location: '공학관 105호',
        color: 'var(--primary)',
    },
    {
        id: 6,
        title: '알고리즘',
        day: '금',
        startTime: '16:00',
        endTime: '18:00',
        location: '정보관 303호',
        color: 'var(--error)',
    },
];

const Timetable: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const hours = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, '0')}:00`); // 9 AM to 9 PM

    const getEventStyle = (event: typeof placeholderEvents[0]) => {
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
    
    const goToPreviousWeek = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    };

    const goToNextWeek = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // End of week (Saturday)
        return `${start.toLocaleDateString('ko-KR')} - ${end.toLocaleDateString('ko-KR')}`;
    };


    return (
        <div className="timetable-page-container">
            <div className="timetable-controls-bar">
                <div className="timetable-navigation">
                    <button onClick={goToPreviousWeek} className="timetable-control-button">이전 주</button>
                    <button onClick={goToNextWeek} className="timetable-control-button">다음 주</button>
                    <button onClick={goToToday} className="timetable-control-button">오늘</button>
                </div>
                <div className="timetable-date-display">
                    시간표
                </div>
                <div className="timetable-view-options">
                    <button className="timetable-control-button">일정 추가</button>
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
                            const dayEvents = placeholderEvents.filter(event => event.day === day);
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
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className="timetable-event-item"
                                            style={getEventStyle(event)}
                                        >
                                            <div className="timetable-event-title">{event.title}</div>
                                            <div className="timetable-event-details">{event.startTime} - {event.endTime}</div>
                                            <div className="timetable-event-details">{event.location}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timetable;
