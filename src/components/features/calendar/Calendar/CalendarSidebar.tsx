import React, {useState} from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './CalendarSidebar.css';
import { MiniCalendar } from './MiniCalendar';

interface CalendarSidebarProps {
    onSelectWeek: (week: number) => void;
    selectedWeek: number;
    viewMode: 'monthly' | 'weekly';
    onDateSelect: (date: Date) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ onSelectWeek, selectedWeek, viewMode, onDateSelect }) => {
    const { semesterStartDate, eventTypes, activeFilters, handleFilterChange, filterLabels } = useCalendarContext();


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
                <MiniCalendar selectedWeek={selectedWeek} viewMode={viewMode} onDateSelect={onDateSelect} />
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

            <div className="sidebar-section">
                <h3>태그</h3>
                <div className="filter-tags-container" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    {['all', ...eventTypes].map(filter => (
                        <label key={filter} className="filter-checkbox-label">
                            <input
                                type="checkbox"
                                checked={activeFilters.includes(filter)}
                                onChange={() => handleFilterChange(filter)}
                            />
                            <span>{filterLabels[filter] || filter}</span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default CalendarSidebar;
