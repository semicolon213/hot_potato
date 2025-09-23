import React from 'react';
import useCalendarContext from '../../hooks/useCalendarContext';
import './ScheduleView.css';

const filterLabels: { [key: string]: string } = {
    all: '전체',
    holiday: '휴일/휴강',
    exam: '시험',
    midterm_exam: '중간고사',
    final_exam: '기말고사',
    event: '행사',
    makeup: '보강',
};

const ScheduleView: React.FC = () => {
    const { events } = useCalendarContext();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of the day for comparison

    const futureEvents = events
        .filter(event => {
            const eventStartDate = new Date(event.startDate);
            return eventStartDate >= today && !event.isHoliday;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    return (
        <div className="schedule-view-container">
            {futureEvents.length > 0 ? (
                <ul className="schedule-list">
                    {futureEvents.map(event => (
                        <li key={event.id} className="schedule-item">
                            <div className="schedule-item-tag" style={{ backgroundColor: event.color }}>
                                {filterLabels[event.type || ''] || '일반'}
                            </div>
                            <div className="schedule-item-content">
                                <div className="schedule-item-date">{formatDate(event.startDate)}</div>
                                <div className="schedule-item-title">{event.title}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="no-events-message">
                    앞으로의 일정이 없습니다.
                </div>
            )}
        </div>
    );
};

export default ScheduleView;
