
import React from 'react';
import useCalendarContext, { type Event } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './SearchResultList.css';

interface SearchResultListProps {
    results: Event[];
    onClose: () => void;
}

const SearchResultList: React.FC<SearchResultListProps> = ({ results, onClose }) => {
    const { goToDate } = useCalendarContext();

    const handleResultClick = (event: Event) => {
        if (event.startDate) {
            goToDate(new Date(event.startDate));
        }
        onClose();
    };

    if (results.length === 0) {
        return null;
    }

    return (
        <div className="search-results-overlay" onClick={onClose}>
            <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
                <div className="search-results-header">
                    <h3>검색 결과</h3>
                    <button onClick={onClose}>×</button>
                </div>
                <ul className="search-results-list">
                    {results.map((event) => (
                        <li key={event.id} onClick={() => handleResultClick(event)}>
                            <div className="event-icon" style={{ backgroundColor: event.color }}>{event.icon}</div>
                            <div className="event-details">
                                <span className="event-title">{event.title}</span>
                                <span className="event-date">{event.startDate}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchResultList;
