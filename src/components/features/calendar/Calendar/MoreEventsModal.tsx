import React from 'react';
import { createPortal } from 'react-dom';
import './MoreEventsModal.css';
import { type Event } from '../../../../hooks/features/calendar/useCalendarContext';

interface MoreEventsModalProps {
  events: Event[];
  date: string;
  onClose: () => void;
  position: { top: number; left: number };
  onSelectEvent: (event: Event, e: React.MouseEvent) => void;
}

const MoreEventsModal: React.FC<MoreEventsModalProps> = ({ events, date, onClose, position, onSelectEvent }) => {
  const formattedDate = date
    ? new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', {
        weekday: 'long',
        day: 'numeric'
      })
    : '';

  const modalContent = (
    <div className="more-events-modal-overlay" onClick={onClose}>
      <div className="more-events-modal" style={{ top: position.top, left: position.left }} onClick={(e) => e.stopPropagation()}>
        <div className="more-events-modal-header">
          <h4>{formattedDate}</h4>
          <button onClick={onClose}>&times;</button>
        </div>
        <ul className="more-events-list">
          {events.map(event => (
            <li key={event.id} className="more-event-item" style={{ backgroundColor: event.color }} onClick={(e) => onSelectEvent(event, e)}>
              {event.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MoreEventsModal;
