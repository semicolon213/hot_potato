import React from 'react';
import useCalendarContext from '../../hooks/useCalendarContext.ts';
import './CalendarSidebar.css';
import MiniCalendar from './MiniCalendar';

interface CalendarSidebarProps {
    onSelectWeek: (week: number) => void;
    selectedWeek: number;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ onSelectWeek, selectedWeek }) => {
    const { semesterStartDate, finalExamsPeriod, gradeEntryPeriod, customPeriods } = useCalendarContext();

    const calculateTotalWeeks = () => {
        let supplementaryWeeks = 0;
        const makeupPeriods = customPeriods.filter(p => p.name === '보강기간');

        makeupPeriods.forEach(p => {
            if (p.period.start && p.period.end) {
                const diffTime = Math.abs(new Date(p.period.end).getTime() - new Date(p.period.start).getTime());
                // Add 1 to include the start day, then calculate weeks
                const diffDays = (diffTime / (1000 * 60 * 60 * 24)) + 1;
                supplementaryWeeks += Math.ceil(diffDays / 7);
            }
        });

        return 15 + supplementaryWeeks;
    };

    const totalWeeks = calculateTotalWeeks();

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
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => (
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
