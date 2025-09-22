import React from 'react';
import { type Event } from '../../hooks/useCalendarContext';
import './DayPopover.css';

interface DayPopoverProps {
    events: Event[];
    date: string;
    position: { top: number; left: number };
}

const DayPopover: React.FC<DayPopoverProps> = ({ events, date, position }) => {
    const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    return (
        <div className="day-popover" style={{ top: position.top, left: position.left }}>
            <div className="day-popover-header">{formattedDate}</div>
            <ul className="day-popover-list">
                {events.length > 0 ? (
                    events.map(event => (
                        <li key={event.id} className="day-popover-event">
                            <span style={{width: '20px'}}>{event.icon}</span>
                            <div className="day-popover-event-dot" style={{ backgroundColor: event.color }}></div>
                            <span>{event.title}</span>
                        </li>
                    ))
                ) : (
                    <li>일정이 없습니다.</li>
                )}
            </ul>
        </div>
    );
};

export default DayPopover;
