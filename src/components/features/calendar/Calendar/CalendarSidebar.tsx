import React from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './CalendarSidebar.css';
import MiniCalendar from './MiniCalendar';

interface CalendarSidebarProps {
    onSelectWeek: (week: number) => void;
    selectedWeek: number;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ onSelectWeek, selectedWeek }) => {
    const { semesterStartDate } = useCalendarContext();


    const getWeekDates = (weekNum: number) => {
        if (!semesterStartDate) return '';
        const week1Start = new Date(semesterStartDate);
        week1Start.setDate(week1Start.getDate() - week1Start.getDay()); // Set to Sunday

        const start = new Date(week1Start);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
    };


    return (
        <aside className="calendar-sidebar">
            <div className="sidebar-section">
                
                <MiniCalendar selectedWeek={selectedWeek} />
            </div>

            <div className="sidebar-section">
                <h3>주차별 보기</h3>
                <ul className="week-navigation-list">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => (
                        <li
                            key={weekNum}
                            className={`week-navigation-item ${selectedWeek === weekNum ? 'active' : ''}`}
                            onClick={() => onSelectWeek(weekNum)}
                        >
                            {weekNum}주차
                            <span className="week-dates">{getWeekDates(weekNum)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default CalendarSidebar;
