import React, { useState, useEffect } from 'react';
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext.ts';
import './AddEventModal.css';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { addEvent, updateEvent, selectedDate, eventColors } = useCalendarContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.date);
  const [endDate, setEndDate] = useState(selectedDate.date);
  const [showTime, setShowTime] = useState(false);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [colorId, setColorId] = useState('1');

  const isEditMode = !!eventToEdit;

  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setStartDate(eventToEdit.startDate);
      const actualEndDate = new Date(eventToEdit.endDate);
      actualEndDate.setDate(actualEndDate.getDate() - 1);
      setEndDate(actualEndDate.toISOString().split('T')[0]);
      setColorId(eventToEdit.colorId || '1');

      if (eventToEdit.startDateTime && eventToEdit.endDateTime) {
        setShowTime(true);
        setStartTime(eventToEdit.startDateTime.split('T')[1].substring(0, 5));
        setEndTime(eventToEdit.endDateTime.split('T')[1].substring(0, 5));
      }
    }
  }, [eventToEdit, isEditMode]);

  useEffect(() => {
    if (showTime) {
      setEndDate(startDate);
    }
  }, [showTime, startDate]);

  const handleSubmit = () => {
    if (title.trim()) {
      const eventData: Partial<Event> = {
        title: title.trim(),
        description: description.trim(),
        colorId: colorId,
      };

      if (showTime) {
        eventData.startDateTime = `${startDate}T${startTime}:00`;
        eventData.endDateTime = `${startDate}T${endTime}:00`;
        eventData.startDate = startDate;
        eventData.endDate = startDate;
      } else {
        eventData.startDate = startDate;
        eventData.endDate = endDate;
      }

      if (isEditMode && eventToEdit) {
        updateEvent(eventToEdit.id, eventData);
      } else {
        addEvent(eventData as Event);
      }
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? '일정 수정' : '일정 추가'}</h2>
        <label>
          제목:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          설명:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="color-palette">
          {Object.entries(eventColors).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([id, colorInfo]) => (
            <div
              key={id}
              className={`color-swatch ${colorId === id ? 'selected' : ''}`}
              style={{ backgroundColor: (colorInfo as any).background }}
              onClick={() => setColorId(id)}
            />
          ))}
        </div>
        <label>
          시작일:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        {showTime && (
          <label>
            시작 시간:
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
        )}
        {!showTime && (
          <label>
            종료일:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        )}
        {showTime && (
          <label>
            종료 시간:
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        )}
        <div className="modal-actions">
          <button className="time-add-button" onClick={() => setShowTime(!showTime)}>
            {showTime ? '시간 제거' : '시간 추가'}
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            {isEditMode ? '수정' : '일정 추가'}
          </button>
          <button className="cancel-button" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;