import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './AddTimetableEventModal.css';
import xIcon from '../../../assets/Icons/x.svg';

export interface TimetableEvent {
    no?: string; // 'no' is managed by the backend/sheet
    title: string;
    day: '월' | '화' | '수' | '목' | '금' | '토' | '일';
    startTime: string;
    endTime: string;
    description: string;
    color: string;
}

interface AddTimetableEventModalProps {
  onClose: () => void;
  onSave: (event: TimetableEvent) => void;
  eventToEdit?: TimetableEvent | null;
}

const AddTimetableEventModal: React.FC<AddTimetableEventModalProps> = ({ onClose, onSave, eventToEdit }) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<'월' | '화' | '수' | '목' | '금' | '토' | '일'>('월');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#7986CB');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isEditMode = !!eventToEdit;
  const tenColors = ['#7986CB', '#33B679', '#8E24AA', '#E67C73', '#F6BF26', '#F4511E', '#039BE5', '#616161', '#3F51B5', '#0B8043'];

  useEffect(() => {
    titleInputRef.current?.focus();
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDay(eventToEdit.day);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setDescription(eventToEdit.description);
      setColor(eventToEdit.color);
    }
  }, [isEditMode, eventToEdit]);

  // 시작 시간이 종료 시간보다 늦어지면, 종료 시간을 시작 시간으로 설정
  useEffect(() => {
    if (startTime > endTime) {
      setEndTime(startTime);
    }
  }, [startTime, endTime]);

  // 종료 시간이 시작 시간보다 빨라지면, 시작 시간을 종료 시간으로 설정
  useEffect(() => {
    if (endTime < startTime) {
      setStartTime(endTime);
    }
  }, [endTime, startTime]);

  const handleSave = () => {
    if (title.trim()) {
      const eventToSave: TimetableEvent = {
        title: title.trim(),
        day,
        startTime,
        endTime,
        description: description.trim(),
        color,
      };
      if (isEditMode && eventToEdit?.no) {
        eventToSave.no = eventToEdit.no;
      }
      onSave(eventToSave);
      onClose();
    }
  };

  // 시간을 AM/PM 형식으로 변환
  const formatTimeForDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${ampm} ${displayHour.toString().padStart(2, '0')}:${minutes}`;
  };

  const modalContent = (
    <div className="add-event-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">일정 {isEditMode ? '수정' : '추가'}</h2>
          <button className="close-icon-button" onClick={onClose} aria-label="닫기">
            <img src={xIcon} alt="Close" className="close-icon" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="일정 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
            />
          </div>
          
          <div className="timetable-modal-grid">
            <div className="modal-grid-item">
              <label>요일</label>
              <select value={day} onChange={(e) => setDay(e.target.value as any)} className="day-select">
                <option value="월">월요일</option>
                <option value="화">화요일</option>
                <option value="수">수요일</option>
                <option value="목">목요일</option>
                <option value="금">금요일</option>
                <option value="토">토요일</option>
                <option value="일">일요일</option>
              </select>
            </div>

            <div className="modal-grid-item">
              <label>색상</label>
              <div className="custom-color-picker">
                <button 
                  type="button" 
                  className="color-display" 
                  style={{ backgroundColor: color }} 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  aria-label="색상 선택"
                ></button>
                {showColorPicker && (
                  <>
                    <div className="color-picker-backdrop" onClick={() => setShowColorPicker(false)}></div>
                    <div className="color-palette-popup">
                      {tenColors.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch-popup ${color === c ? 'selected' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => { setColor(c); setShowColorPicker(false); }}
                          aria-label={`색상 ${c}`}
                        ></button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-grid-item">
              <label>시작 시간</label>
              <div className="time-input-wrapper">
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="time-input"
                />
                <span className="time-display">{formatTimeForDisplay(startTime)}</span>
              </div>
            </div>
            
            <div className="modal-grid-item">
              <label>종료 시간</label>
              <div className="time-input-wrapper">
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className="time-input"
                />
                <span className="time-display">{formatTimeForDisplay(endTime)}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <textarea
              placeholder="예) 홍길동 7206"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="add-event-description"
              rows={3}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>취소</button>
          <button className="submit-button" onClick={handleSave} disabled={title.trim() === ''}>
            {isEditMode ? '수정' : '일정 추가'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddTimetableEventModal;