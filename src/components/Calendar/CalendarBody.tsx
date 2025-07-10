import useCalendarContext from "./useCalendarContext.ts";
import "./CalendarBody.css";

const CalendarBody = () => {
    const weeks = ["일", "월", "화", "수", "목", "금", "토"];
    const { daysInMonth, selectedDate, currentDate, events, setSelectedEvent } = useCalendarContext();

    return (
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
                        return currentDate >= startDate && currentDate <= endDate;
                    });
                    const isSelected = selectedDate.date === date.date;
                    const isSunday = date.dayIndexOfWeek === 0;
                    const isCurrentMonth = currentDate.month === date.month;

                    return (
                        <div
                            onClick={() => selectedDate.selectDate(new Date(date.date))}
                            className={`day ${isCurrentMonth ? '' : 'not-current-month'} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
                            key={date.date}>
                            <span className="day-number">{date.day}</span>
                            <ul className="event-list">
                                {dayEvents.map(event => (
                                    <li key={event.id} className="event-item" onClick={() => setSelectedEvent(event)}>
                                        {event.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarBody;