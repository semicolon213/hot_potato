import React from 'react';
import './Timetable.css';

// Placeholder data for the timetable
const placeholderEvents = [
    {
        id: 1,
        title: '소프트웨어 공학',
        day: '월', // Monday
        startTime: '10:30',
        endTime: '12:00',
        location: '공학관 101호',
        color: '#4285F4',
    },
    {
        id: 2,
        title: '자료구조',
        day: '월', // Monday
        startTime: '14:00',
        endTime: '15:30',
        location: '공학관 203호',
        color: '#DB4437',
    },
    {
        id: 3,
        title: '운영체제',
        day: '화', // Tuesday
        startTime: '09:00',
        endTime: '10:30',
        location: '정보관 302호',
        color: '#F4B400',
    },
    {
        id: 4,
        title: '컴퓨터 네트워크',
        day: '수', // Wednesday
        startTime: '13:00',
        endTime: '15:00',
        location: '정보관 404호',
        color: '#0F9D58',
    },
    {
        id: 5,
        title: '데이터베이스',
        day: '목', // Thursday
        startTime: '11:00',
        endTime: '12:30',
        location: '공학관 105호',
        color: '#4285F4',
    },
    {
        id: 6,
        title: '알고리즘',
        day: '금', // Friday
        startTime: '16:00',
        endTime: '18:00',
        location: '정보관 303호',
        color: '#DB4437',
    },
];

const Timetable: React.FC = () => {
    const daysOfWeek = ["월", "화", "수", "목", "금"];
    const hours = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, '0')}:00`); // 9 AM to 9 PM

    const getEventPosition = (event: typeof placeholderEvents[0]) => {
        const startHour = parseInt(event.startTime.split(':')[0], 10) + parseInt(event.startTime.split(':')[1], 10) / 60;
        const endHour = parseInt(event.endTime.split(':')[0], 10) + parseInt(event.endTime.split(':')[1], 10) / 60;

        // Timetable starts at 9 AM
        const offset = 9;

        const top = ((startHour - offset) / hours.length) * 100;
        const height = ((endHour - startHour) / hours.length) * 100;

        return {
            top: `${top}%`,
            height: `${height}%`,
        };
    };

    return (
        <div className="timetable-container">
            <div className="timetable-header">
                <div className="time-column-header"></div>
                {daysOfWeek.map((day) => (
                    <div key={day} className="day-header">
                        <span className="day-name">{day}</span>
                    </div>
                ))}
            </div>

            <div className="scrollable-body">
                <div className="timetable-body">
                    <div className="time-column">
                        {hours.map(hour => (
                            <div key={hour} className="time-slot-label">{hour}</div>
                        ))}
                    </div>
                    {daysOfWeek.map((day) => {
                        const dayEvents = placeholderEvents.filter(event => event.day === day);
                        return (
                            <div key={day} className="day-column">
                                <div className="timed-events-grid">
                                    {hours.map(hour => (
                                        <React.Fragment key={hour}>
                                            <div className="time-grid-line" style={{height: '50px'}}></div>
                                            <div className="time-grid-line" style={{height: '50px', borderBottom: '1px solid #e0e0e0'}}></div>
                                        </React.Fragment>
                                    ))}
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className="timed-event-item"
                                            style={{ ...getEventPosition(event), backgroundColor: event.color }}
                                        >
                                            <div className="event-title">{event.title}</div>
                                            <div className="event-time">{event.startTime} - {event.endTime}</div>
                                            <div className="event-location">{event.location}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Timetable;
