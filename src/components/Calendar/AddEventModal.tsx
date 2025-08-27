import React, { useState, useEffect } from 'react';
import useCalendarContext, { type Event } from '../../hooks/useCalendarContext.ts';
import './AddEventModal.css';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null; // 수정할 이벤트를 prop으로 받음
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { addEvent, updateEvent, selectedDate } = useCalendarContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.date);
  const [endDate, setEndDate] = useState(selectedDate.date);

  const isEditMode = !!eventToEdit;

  useEffect(() => {
    if (isEditMode) {
      // 수정 모드일 경우, 기존 데이터를 상태에 채워넣음
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setStartDate(eventToEdit.startDate);

      // 렌더링을 위해 하루 더해졌던 종료일을 다시 하루 빼서 설정
      const actualEndDate = new Date(eventToEdit.endDate);
      actualEndDate.setDate(actualEndDate.getDate() - 1);
      setEndDate(actualEndDate.toISOString().split('T')[0]);
    }
  }, [eventToEdit, isEditMode]);

  const handleSubmit = () => {
    if (title.trim()) {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        startDate,
        // 하루짜리 일정의 경우, 구글 API는 종료일이 시작일보다 하루 뒤여야 함
        endDate: startDate > endDate ? startDate : endDate,
      };

      if (isEditMode) {
        updateEvent(eventToEdit.id, eventData);
      } else {
        addEvent(eventData);
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
        <label>
          시작일:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          종료일:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <div className="modal-actions">
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