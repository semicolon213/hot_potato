import React from 'react';
import './MoreEventsModal.css';
import { type Event } from '../../hooks/useCalendarContext';

interface MoreEventsModalProps {
  events: Event[];
  onClose: () => void;
  position: { top: number; left: number };
  onSelectEvent: (event: Event) => void;
}

const MoreEventsModal: React.FC<MoreEventsModalProps> = ({ events, onClose, position, onSelectEvent }) => {
  return (
    <div className="more-events-modal-overlay" onClick={onClose}>
      <div className="more-events-modal" style={{ top: position.top, left: position.left }} onClick={(e) => e.stopPropagation()}>
        <div className="more-events-modal-header">
          <h4>모든 일정</h4>
          <button onClick={onClose}>&times;</button>
        </div>
        <ul className="more-events-list">
          {events.map(event => (
            <li key={event.id} className="more-event-item" style={{ backgroundColor: event.color }} onClick={() => onSelectEvent(event)}>
              {event.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MoreEventsModal;
