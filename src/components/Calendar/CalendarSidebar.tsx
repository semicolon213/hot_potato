import React from 'react';
import useCalendarContext from '../../hooks/useCalendarContext.ts';
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
        const start = new Date(semesterStartDate);
        // Adjust for week start day if necessary, assuming semesterStartDate is the first day of week 1
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
    };

    const eventFilters = [
        { id: 'all', label: '전체' },
        { id: 'holiday', label: '휴강일' },
        { id: 'exam', label: '시험' },
        { id: 'assignment', label: '과제 마감' },
        { id: 'event', label: '학교 행사' },
    ];

    return (
        <aside className="calendar-sidebar">
            <div className="sidebar-section">
                
                <MiniCalendar />
            </div>

            <div className="sidebar-section">
                <h3>주차별 보기</h3>
                <ul className="week-navigation-list">
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(weekNum => (
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
