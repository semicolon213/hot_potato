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
        <p><strong>Start Date:</strong> {event.startDate}</p>
        <p><strong>End Date:</strong> {event.endDate}</p>
        {event.description && <p><strong>Description:</strong> {event.description}</p>}
        <button className="delete-button" onClick={handleDelete}>Delete</button>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default EventDetailModal;
