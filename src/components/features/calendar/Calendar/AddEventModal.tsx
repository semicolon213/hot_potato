import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useCalendarContext, { type Event } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import './AddEventModal.css';
import xIcon from '../../../../assets/Icons/x.svg';
import { RRule } from 'rrule';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null;
}

type RecurrenceFreq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { addEvent, addSheetEvent, updateEvent, selectedDate, eventTypes, eventTypeStyles } = useCalendarContext();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.date);
  const [endDate, setEndDate] = useState(selectedDate.date);
  const [showTime, setShowTime] = useState(false);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [saveTarget, setSaveTarget] = useState<'google' | 'sheet'>('google');
  const [tag, setTag] = useState('event');
  const [isCustomTag, setIsCustomTag] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customColor, setCustomColor] = useState('#7986CB');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // --- 반복 일정 관련 state 수정 ---
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>('NONE');
  const [recurrenceDetails, setRecurrenceDetails] = useState({
    interval: 1,
    until: '',
  });
  // ---------------------------------

  const isEditMode = !!eventToEdit;

  const tenColors = ['#7986CB', '#33B679', '#8E24AA', '#E67C73', '#F6BF26', '#F4511E', '#039BE5', '#616161', '#3F51B5', '#0B8043'];

  const tagLabels: { [key: string]: string } = {
      holiday: '휴일/휴강',
      event: '행사',
      makeup: '보강',
      exam: '시험',
      meeting: '회의',
  };

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

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
          const isPredefined = eventTypes.includes(eventToEdit.type || '');
          if (isPredefined) {
              setTag(eventToEdit.type || 'event');
              setIsCustomTag(false);
          } else {
              setIsCustomTag(true);
              setCustomTag(eventToEdit.type || '');
              setCustomColor(eventToEdit.color || '#7986CB');
          }
      } else {
          setSaveTarget('google');
      }

      if (eventToEdit.startDateTime && eventToEdit.endDateTime) {
        setShowTime(true);
        setStartTime(eventToEdit.startDateTime.split('T')[1].substring(0, 5));
        setEndTime(eventToEdit.endDateTime.split('T')[1].substring(0, 5));
      }

      // TODO: 편집 모드에서 반복 규칙 로드 로직 추가
    }
  }, [eventToEdit, isEditMode, eventTypes]);

  useEffect(() => {
    if (showTime) {
      setEndDate(startDate);
    }
  }, [showTime, startDate]);

  const handleSave = () => {
    if (title.trim()) {
      const eventData: Partial<Event> & { rrule?: string } = { // rrule 속성 추가
        title: title.trim(),
        description: description.trim(),
      };

      if (saveTarget === 'sheet') {
          if (isCustomTag) {
              eventData.type = customTag;
              eventData.color = customColor;
          } else {
              eventData.type = tag;
          }
      } else {
          eventData.colorId = '9'; // Default color for personal events
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

      // --- RRULE 생성 로직 수정 ---
      if (saveTarget === 'sheet' && recurrenceFreq !== 'NONE') {
        const ruleOptions: Partial<RRule.Options> = {
          freq: RRule[recurrenceFreq as keyof typeof RRule],
          interval: recurrenceDetails.interval,
          dtstart: new Date(startDate),
        };

        if (recurrenceDetails.until) {
          ruleOptions.until = new Date(recurrenceDetails.until);
        }

        const rule = new RRule(ruleOptions);
        eventData.rrule = rule.toString();
      }
      // --------------------------

      if (isEditMode && eventToEdit) {
        updateEvent(eventToEdit.id, eventData as Event);
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

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    const maxHeight = 150; // From CSS

    textarea.style.height = 'auto'; // Reset height to calculate new scrollHeight
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  };

  useEffect(() => {
    // Adjust textarea height whenever description changes
    autoResizeTextarea(descriptionRef.current);
  }, [description]);

  const modalContent = (
    <div className="add-event-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={xIcon} alt="Close" className="close-icon" onClick={onClose} />
        
        <div className="modal-form-content">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
          <textarea
              ref={descriptionRef}
              placeholder="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="add-event-description"
              rows={1}
          />

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
              <>
                  <div className="tag-selection-group">
                      {eventTypes.map(type => (
                          <button
                              key={type}
                              className={`target-button ${!isCustomTag && tag === type ? 'active' : ''}`}
                              onClick={() => { setTag(type); setIsCustomTag(false); }}
                              style={!isCustomTag && tag === type ? {
                                  backgroundColor: eventTypeStyles[type]?.color || '#343a40',
                                  color: 'white',
                                  borderColor: eventTypeStyles[type]?.color || '#343a40'
                              } : {}}
                          >
                              {tagLabels[type] || type}
                          </button>
                      ))}
                      <button className={`target-button ${isCustomTag ? 'active' : ''}`} onClick={() => setIsCustomTag(true)}>+</button>
                  </div>
                  {isCustomTag && (
                      <div className="custom-tag-container">
                          <input
                              type="text"
                              placeholder="태그 이름 입력"
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              className="custom-tag-input"
                          />
                          <div className="custom-color-picker">
                              <button className="color-display" style={{ backgroundColor: customColor }} onClick={() => setShowColorPicker(!showColorPicker)}></button>
                              {showColorPicker && (
                                  <div className="color-palette-popup">
                                      {tenColors.map(c => (
                                          <div key={c} className="color-swatch-popup" style={{ backgroundColor: c }} onClick={() => { setCustomColor(c); setShowColorPicker(false); }}></div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </>
          )}

          <div className="date-time-container">
              <div className="date-row">
                  <label>
                    시작일:
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </label>
                  {!showTime && (
                    <label>
                      종료일:
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                  )}
                  <button className="time-add-button-inline" onClick={() => setShowTime(!showTime)}>
                      {showTime ? '시간 제거' : '시간 추가'}
                  </button>
              </div>
              {showTime && (
                  <div className="time-row">
                      <label>
                        시작 시간:
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </label>
                      <label>
                        종료 시간:
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </label>
                  </div>
              )}
          </div>

          {/* --- 반복 설정 UI 수정 --- */}
          {saveTarget === 'sheet' && (
            <div className="recurrence-section">
              <label>
                반복:
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFreq)}
                  className="recurrence-select"
                >
                  <option value="NONE">반복 안 함</option>
                  <option value="DAILY">매일</option>
                  <option value="WEEKLY">매주</option>
                  <option value="MONTHLY">매월</option>
                </select>
              </label>

              {recurrenceFreq !== 'NONE' && (
                <div className="recurrence-details">
                  <input
                    type="number"
                    min="1"
                    value={recurrenceDetails.interval}
                    onChange={(e) => setRecurrenceDetails({ ...recurrenceDetails, interval: parseInt(e.target.value, 10) || 1 })}
                  />
                  <span>{recurrenceFreq === 'DAILY' ? '일마다' : recurrenceFreq === 'WEEKLY' ? '주마다' : '개월마다'}</span>
                  <label>
                    종료일:
                    <input
                      type="date"
                      value={recurrenceDetails.until}
                      onChange={(e) => setRecurrenceDetails({ ...recurrenceDetails, until: e.target.value })}
                      min={startDate}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
          {/* -------------------------- */}
        </div>

        <div className="modal-actions">
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
