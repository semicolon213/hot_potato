import useCalendarContext from "./useCalendarContext.ts";
import "./CalendarHeader.css";

const CalendarHeader = () => {
    const { dispatch, currentDate } = useCalendarContext();

    return (
        <div className="calendar-header-container">
            <div className="year-display">{currentDate.year}</div>
            <div className="month-navigation">
                <button className="arrow-button" onClick={dispatch.handlePrevMonth}>
                    &#8249;
                </button>
                <span className="month-display">{currentDate.month}월</span>
                <button className="arrow-button" onClick={dispatch.handleNextMonth}>
                    &#8250;
                </button>
            </div>
        </div>
    );
};

export default CalendarHeader;