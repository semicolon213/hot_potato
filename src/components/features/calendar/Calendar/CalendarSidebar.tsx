import React, {useState} from 'react';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './CalendarSidebar.css';
import MiniCalendar from './MiniCalendar';

interface CalendarSidebarProps {
    onSelectWeek: (week: number) => void;
    selectedWeek: number;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ onSelectWeek, selectedWeek }) => {
    const { semesterStartDate, eventTypes, activeFilters, handleFilterChange, filterLabels } = useCalendarContext();
    const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);


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

            <div className="sidebar-section">
                <h3>필터</h3>
                <div className="filter-tags-container">
                    {['all', ...eventTypes.filter(f => f !== 'exam')].map(filter => (
                        <button
                            key={filter}
                            className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''}`}
                            onClick={() => handleFilterChange(filter)}
                        >
                            {filterLabels[filter] || filter}
                        </button>
                    ))}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                            className={`filter-tag ${activeFilters.includes('midterm_exam') || activeFilters.includes('final_exam') ? 'active' : ''}`}
                            onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                        >
                            시험
                        </button>
                        {isExamDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                backgroundColor: '#f9f9f9',
                                minWidth: '120px',
                                boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                                zIndex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.includes('midterm_exam')}
                                        onChange={() => handleFilterChange('midterm_exam')}
                                        style={{ marginRight: '8px' }}
                                    />
                                    중간고사
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.includes('final_exam')}
                                        onChange={() => handleFilterChange('final_exam')}
                                        style={{ marginRight: '8px' }}
                                    />
                                    기말고사
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default CalendarSidebar;
