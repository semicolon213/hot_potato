import React, { useState } from 'react';
import useCalendarContext from './useCalendarContext.ts';
import './AddEventModal.css';

interface AddEventModalProps {
  onClose: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose }) => {
  const { addEvent, selectedDate } = useCalendarContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.date);
  const [endDate, setEndDate] = useState(selectedDate.date);

  const handleSubmit = () => {
    if (title.trim()) {
      addEvent({
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Event</h2>
        <label>
          Title:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button onClick={handleSubmit}>Add Event</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
