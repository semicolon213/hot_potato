import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './AddTimetableEventModal.css';

interface AddTimetableEventModalProps {
  onClose: () => void;
  onSave: (event: any) => void;
}

const AddTimetableEventModal: React.FC<AddTimetableEventModalProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('월');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSave = () => {
    if (!title || !day || !startTime || !endTime || !location) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    onSave({
      title,
      day,
      startTime,
      endTime,
      location,
    });
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">새 일정 추가</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="location">장소</label>
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="day">요일</label>
            <select id="day" value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="월">월요일</option>
              <option value="화">화요일</option>
              <option value="수">수요일</option>
              <option value="목">목요일</option>
              <option value="금">금요일</option>
            </select>
          </div>
          <div className="time-inputs">
            <div className="form-group">
              <label htmlFor="startTime">시작 시간</label>
              <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">종료 시간</label>
              <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-button cancel" onClick={onClose}>취소</button>
          <button className="modal-button save" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddTimetableEventModal;
