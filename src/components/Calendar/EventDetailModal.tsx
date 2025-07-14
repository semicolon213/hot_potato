import React from "react";
import type { Event } from "./useCalendarContext.ts";
import useCalendarContext from "./useCalendarContext.ts";
import "./EventDetailModal.css";

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const { deleteEvent } = useCalendarContext();

  if (!event) {
    return null;
  }

  const handleDelete = () => {
    deleteEvent(event.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{event.title}</h2>
        <p><strong>시작일:</strong> {event.startDate}</p>
        <p><strong>종료일:</strong> {event.endDate}</p>
        {event.description && <p><strong>설명:</strong> {event.description}</p>}
        <div className="modal-actions">
          <button className="delete-button" onClick={handleDelete}>삭제</button>
          <button className="close-button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
