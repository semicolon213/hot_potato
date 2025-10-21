import React from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext';
import './ScheduleView.css';

const ScheduleView: React.FC = () => {
    const { events, isFetchingGoogleEvents, setSelectedEvent } = useCalendarContext();

    const today = new Date();
    const todayUTCStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    const futureEvents = events
        .filter(event => {
            const eventDateParts = event.startDate.split('-').map(Number);
            const eventStartDateUTC = new Date(Date.UTC(eventDateParts[0], eventDateParts[1] - 1, eventDateParts[2]));
            return eventStartDateUTC.getTime() >= todayUTCStart.getTime() && !event.isHoliday;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const sheetEvents = futureEvents.filter(event => event.id.includes('-'));
    const googleCalendarEvents = futureEvents.filter(event => !event.id.includes('-'));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const renderEventList = (eventList: typeof futureEvents, title: string) => (
        <div className="schedule-column">
            <h2>{title}</h2>
            {eventList.length > 0 ? (
                <ul className="schedule-list">
                    {eventList.map(event => {
                        const eventDateParts = event.startDate.split('-').map(Number);
                        const eventStartDateUTC = new Date(Date.UTC(eventDateParts[0], eventDateParts[1] - 1, eventDateParts[2]));
                        const diffTime = eventStartDateUTC.getTime() - todayUTCStart.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                        let dDayText = '';
                        if (diffDays === 0) {
                            dDayText = 'D-day';
                        } else if (diffDays > 0) {
                            dDayText = `D-${diffDays}`;
                        } else {
                            dDayText = `D+${-diffDays}`;
                        }

                        return (
                            <li key={event.id} className="schedule-item" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const modalWidth = 480;
                                const modalHeight = 150;
                                const { innerWidth, innerHeight } = window;
                                const gap = 10;

                                let top = rect.bottom + gap;
                                let left = rect.left;

                                if (top + modalHeight > innerHeight) {
                                    top = rect.top - modalHeight - gap;
                                }
                                if (top < 0) {
                                    top = gap;
                                }
                                if (left + modalWidth > innerWidth) {
                                    left = rect.right - modalWidth;
                                }
                                if (left < 0) {
                                    left = gap;
                                }

                                setSelectedEvent(event, { top, left });
                            }}>
                                <div className="schedule-item-tag" style={{ backgroundColor: event.color }}>
                                    {event.type || '개인일정'}
                                </div>
                                <div className="schedule-item-content">
                                    <div className="schedule-item-date">{formatDate(event.startDate)}</div>
                                    <div className="schedule-item-title">{event.title}</div>
                                    <div className="schedule-item-description">{event.description}</div>
                                </div>
                                <div className="schedule-item-dday">{dDayText}</div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="no-events-message">
                    앞으로의 일정이 없습니다.
                </div>
            )}
        </div>
    );

    if (isFetchingGoogleEvents) {
        return (
            <div className="schedule-view-container">
                <div className="loading-message">일정을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="schedule-view-container">
            {renderEventList(sheetEvents, "공유 일정")}
            {renderEventList(googleCalendarEvents, "개인 일정")}
        </div>
    );
};

export default ScheduleView;