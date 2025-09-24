import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext.ts';
import './AddEventModal.css';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { addEvent, addSheetEvent, updateEvent, selectedDate, eventTypes, eventTypeStyles } = useCalendarContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.date);
  const [endDate, setEndDate] = useState(selectedDate.date);
  const [showTime, setShowTime] = useState(false);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [saveTarget, setSaveTarget] = useState<'google' | 'sheet'>('google');
  const [tag, setTag] = useState('event');

  const isEditMode = !!eventToEdit;

  const tagLabels: { [key: string]: string } = {
      holiday: '휴일/휴강',
      event: '행사',
      makeup: '보강',
      exam: '시험',
      meeting: '회의',
  };

  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setStartDate(eventToEdit.startDate);
      const actualEndDate = new Date(eventToEdit.endDate);
      actualEndDate.setDate(actualEndDate.getDate() - 1);
      setEndDate(actualEndDate.toISOString().split('T')[0]);

      if (eventToEdit.id.startsWith('cal-')) {
          setSaveTarget('sheet');
          setTag(eventToEdit.type || 'event');
      } else {
          setSaveTarget('google');
      }

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

  const handleSave = () => {
    if (title.trim()) {
      const eventData: Partial<Event> = {
        title: title.trim(),
        description: description.trim(),
      };

      if (saveTarget === 'sheet') {
          eventData.type = tag;
      } else {
          eventData.colorId = '1'; // Default color for personal events
      }

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
        if (saveTarget === 'google') {
          addEvent(eventData as Event);
        } else {
          addSheetEvent(eventData as Event);
        }
      }
      onClose();
    }
  };

  const modalContent = (
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

        {!isEditMode && (
            <div className="save-target-group">
              <button
                className={`target-button ${saveTarget === 'google' ? 'active' : ''}`}
                onClick={() => setSaveTarget('google')}
              >
                개인
              </button>
              <button
                className={`target-button ${saveTarget === 'sheet' ? 'active' : ''}`}
                onClick={() => setSaveTarget('sheet')}
              >
                공유
              </button>
            </div>
        )}

        {saveTarget === 'sheet' && (
            <div className="tag-selection-group">
                {eventTypes.map(type => (
                    <button
                        key={type}
                        className={`target-button ${tag === type ? 'active' : ''}`}
                        onClick={() => setTag(type)}
                        style={tag === type ? {
                            backgroundColor: eventTypeStyles[type]?.color || '#343a40',
                            color: 'white',
                            borderColor: eventTypeStyles[type]?.color || '#343a40'
                        } : {}}
                    >
                        {tagLabels[type] || type}
                    </button>
                ))}
            </div>
        )}

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
          <button className="submit-button" onClick={handleSave}>
            {isEditMode ? '수정' : '일정 추가'}
          </button>
          <button className="cancel-button" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddEventModal;
