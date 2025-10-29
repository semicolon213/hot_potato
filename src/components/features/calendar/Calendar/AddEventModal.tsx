import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useCalendarContext, { type Event } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import type { Student, Staff } from '../../../../types/app';
import './AddEventModal.css';
import xIcon from '../../../../assets/Icons/x.svg';
import { RRule } from 'rrule';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null;
}

type RecurrenceFreq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { user, addEvent, addSheetEvent, updateEvent, selectedDate, eventTypes, eventTypeStyles, formatDate, students, staff } = useCalendarContext();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTime, setShowTime] = useState(false);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [saveTarget, setSaveTarget] = useState<'google' | 'sheet'>('google');
  const [tag, setTag] = useState('event');
  const [isCustomTag, setIsCustomTag] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customColor, setCustomColor] = useState('#7986CB');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Attendee States
  const [isAttendeeSearchVisible, setIsAttendeeSearchVisible] = useState(false);
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState('');
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<(Student | Staff)[]>([]);

  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>('NONE');
  const [recurrenceDetails, setRecurrenceDetails] = useState({
    interval: 1,
    until: '',
  });
  const [dateError, setDateError] = useState(false);

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

  // Initial setup for Edit Mode
  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setStartDate(eventToEdit.startDate);
      setEndDate(eventToEdit.endDate);

      if (eventToEdit.id.includes('-cal-')) {
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

      if (eventToEdit.rrule) {
        try {
            const options = RRule.parseString(eventToEdit.rrule);
            options.dtstart = new Date(eventToEdit.startDate);
            const rule = new RRule(options);
            const ruleOptions = rule.options;
            let freq: RecurrenceFreq = 'NONE';
            if (ruleOptions.freq === 3) freq = 'DAILY'; // RRule.DAILY = 3
            if (ruleOptions.freq === 2) freq = 'WEEKLY'; // RRule.WEEKLY = 2
            if (ruleOptions.freq === 1) freq = 'MONTHLY'; // RRule.MONTHLY = 1
            if (ruleOptions.freq === 0) freq = 'YEARLY'; // RRule.YEARLY = 0
            setRecurrenceFreq(freq);
            setRecurrenceDetails({
                interval: ruleOptions.interval || 1,
                until: ruleOptions.until ? ruleOptions.until.toISOString().split('T')[0] : '',
            });
        } catch (e) {
            console.error("Error parsing rrule string on edit: ", e);
            setRecurrenceFreq('NONE');
        }
      } else {
        setRecurrenceFreq('NONE');
      }
    } else {
      // Add Mode: Initialize based on selectedDate
      const initialDate = selectedDate.date;
      setStartDate(formatDate(initialDate));
      setEndDate(formatDate(initialDate));

      if (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0 || initialDate.getSeconds() !== 0) {
        setShowTime(true);
        const startHours = initialDate.getHours().toString().padStart(2, '0');
        const startMinutes = initialDate.getMinutes().toString().padStart(2, '0');
        setStartTime(`${startHours}:${startMinutes}`);

        const oneHourLater = new Date(initialDate.getTime() + 60 * 60 * 1000);
        const endHours = oneHourLater.getHours().toString().padStart(2, '0');
        const endMinutes = oneHourLater.getMinutes().toString().padStart(2, '0');
        setEndTime(`${endHours}:${endMinutes}`);
      } else {
        // Reset time for all-day events from monthly view
        setShowTime(false);
        setStartTime('00:00');
        setEndTime('00:00');
      }

      setSaveTarget('google');
      setSelectedAttendees([]);
    }
  }, [eventToEdit, isEditMode, eventTypes]);

  // Pre-populate selected attendees in edit mode once data is loaded
  useEffect(() => {
    if (isEditMode && eventToEdit && (students.length > 0 || staff.length > 0)) {
        const attendeeIds = (eventToEdit as Event & { attendees?: string }).attendees?.split(',').filter(Boolean) || [];
        if (attendeeIds.length > 0) {
            const allPeople = [...students, ...staff];
            const preselected = allPeople.filter(p => attendeeIds.includes('no_student' in p ? p.no_student : p.no));
            setSelectedAttendees(preselected);
        }
    }
  }, [isEditMode, eventToEdit, students, staff]);


  useEffect(() => {
    if (showTime) {
      setEndDate(startDate);
    }
  }, [showTime, startDate]);

  useEffect(() => {
    if (!showTime && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      setDateError(start > end);
    } else {
      setDateError(false);
    }
  }, [startDate, endDate, showTime]);

  const filteredAttendees = useMemo(() => {
    const allPeople = [
        ...students.map(s => ({ ...s, type: 'student' as const })),
        ...staff.map(s => ({ ...s, type: 'staff' as const }))
    ];

    if (attendeeSearchTerm.trim() === '') {
      return allPeople;
    }

    const lowercasedTerm = attendeeSearchTerm.toLowerCase();
    return allPeople.filter(person =>
      person.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [attendeeSearchTerm, students, staff]);

  const handleSelectAttendee = (person: Student | Staff) => {
    const isSelected = selectedAttendees.some(a => ('no_student' in a ? a.no_student : a.no) === ('no_student' in person ? person.no_student : person.no));

    if (isSelected) {
      // Before removing, check if it's the logged-in user and not an admin
      if (user && user.userType !== 'admin' && ('no_student' in person ? person.no_student : person.no) === String(user.studentId)) {
        return; // Don't allow removal
      }
      handleRemoveAttendee(person);
    } else {
      setSelectedAttendees([...selectedAttendees, person]);
    }
    setAttendeeSearchTerm('');
  };

  const handleRemoveAttendee = (personToRemove: Student | Staff) => {
    if (user && user.userType !== 'admin' && ('no_student' in personToRemove ? personToRemove.no_student : personToRemove.no) === String(user.studentId)) {
      // Prevent removal of self if not an admin
      return;
    }
    setSelectedAttendees(selectedAttendees.filter(a => ('no_student' in a ? a.no_student : a.no) !== ('no_student' in personToRemove ? personToRemove.no_student : personToRemove.no)));
  };

  const handleToggleAttendeeSearch = () => {
    setIsAttendeeSearchVisible(!isAttendeeSearchVisible);
  };

  // Auto-add current user when opening attendee search for a new event
  useEffect(() => {
    if (isAttendeeSearchVisible && !isEditMode && selectedAttendees.length === 0 && (students.length > 0 || staff.length > 0)) {
        if (user) {
            const allPeople = [...students, ...staff];
            const loggedInUserObject = allPeople.find(p => ('no_student' in p ? p.no_student : p.no) === user.studentId);
            if (loggedInUserObject) {
                setSelectedAttendees([loggedInUserObject]);
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttendeeSearchVisible, students, staff]);

  useEffect(() => {
    if (isAttendeeSearchVisible) {
      setSaveTarget('sheet');
    }
  }, [isAttendeeSearchVisible]);

  const handleSave = () => {
    if (title.trim()) {
      const eventData: Partial<Event> & { rrule?: string; attendees?: string; } = {
        title: title.trim(),
        description: description.trim(),
      };

      if (saveTarget === 'sheet') {
          if (isCustomTag) {
              eventData.type = customTag;
              eventData.color = customColor;
          } else {
              eventData.type = tagLabels[tag] || tag;
          }
          eventData.attendees = selectedAttendees.map(a => 'no_student' in a ? a.no_student : a.no).join(',');
      } else {
          eventData.colorId = '9';
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

      if (saveTarget === 'sheet' && recurrenceFreq !== 'NONE') {
        const ruleOptions: {
            freq: number;
            interval: number;
            dtstart: Date;
            until?: Date;
        } = {
          freq: recurrenceFreq === 'DAILY' ? 3 : recurrenceFreq === 'WEEKLY' ? 2 : recurrenceFreq === 'MONTHLY' ? 1 : 0,
          interval: recurrenceDetails.interval,
          dtstart: new Date(startDate),
        };
        if (recurrenceDetails.until) {
          ruleOptions.until = new Date(recurrenceDetails.until);
        }
        const rule = new RRule(ruleOptions);
        eventData.rrule = rule.toString();
      }

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
    const maxHeight = 150;
    textarea.style.height = 'auto';
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
    autoResizeTextarea(descriptionRef.current);
  }, [description]);

  const modalContent = (
    <div className="add-event-modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isAttendeeSearchVisible ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <img src={xIcon} alt="Close" className="close-icon" onClick={onClose} />
        
        <div className="modal-body-two-column">
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
                  {!isAttendeeSearchVisible && (
                    <button type="button" className={`target-button ${saveTarget === 'google' ? 'active' : ''}`} onClick={() => setSaveTarget('google')}>개인</button>
                  )}
                  <button type="button" className={`target-button ${saveTarget === 'sheet' ? 'active' : ''}`} onClick={() => {
                    setSaveTarget('sheet');
                    if (user && user.userType !== 'admin' && (students.length > 0 || staff.length > 0)) {
                        const allPeople = [...students, ...staff];
                        const loggedInUserObject = allPeople.find(p => ('no_student' in p ? p.no_student : p.no) === String(user.studentId));
                        if (loggedInUserObject) {
                            setSelectedAttendees(prev => {
                                const userExists = prev.some(a => ('no_student' in a ? a.no_student : a.no) === String(user.studentId));
                                if (!userExists) {
                                    return [...prev, loggedInUserObject];
                                }
                                return prev;
                            });
                        }
                    }
                  }}>공유</button>
                </div>
            )}

            {saveTarget === 'sheet' && (
                <>
                    <div className="tag-selection-group">
                        {eventTypes
                            .filter(type => {
                                if (user?.userType === 'student') {
                                    return type === 'meeting';
                                }
                                return true;
                            })
                            .map(type => (
                            <button
                                key={type}
                                type="button"
                                className={`target-button ${!isCustomTag && tag === type ? 'active' : ''}`}
                                onClick={() => { setTag(type); setIsCustomTag(false); }}
                                style={!isCustomTag && tag === type ? { backgroundColor: eventTypeStyles[type]?.color || '#343a40', color: 'white', borderColor: eventTypeStyles[type]?.color || '#343a40' } : {}}
                            >
                                {tagLabels[type] || type}
                            </button>
                        ))}
                        {user?.userType !== 'student' && (
                            <button type="button" className={`target-button ${isCustomTag ? 'active' : ''}`} onClick={() => setIsCustomTag(true)}>+</button>
                        )}
                    </div>
                    {isCustomTag && (
                        <div className="custom-tag-container">
                            <input type="text" placeholder="태그 이름 입력" value={customTag} onChange={(e) => setCustomTag(e.target.value)} className="custom-tag-input" />
                            <div className="custom-color-picker">
                                <button type="button" className="color-display" style={{ backgroundColor: customColor }} onClick={() => setShowColorPicker(!showColorPicker)}></button>
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
                    <label>시작일: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
                    {!showTime && (<label>종료일: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ backgroundColor: dateError ? '#ffebee' : '' }} /></label>)}
                    <button type="button" className="time-add-button-inline" onClick={() => setShowTime(!showTime)}>{showTime ? '시간 제거' : '시간 추가'}</button>
                </div>
                {showTime && (
                    <div className="time-row">
                        <label>시작 시간: <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
                        <label>종료 시간: <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label>
                    </div>
                )}
            </div>

            {saveTarget === 'sheet' && (
              <div className="recurrence-section">
                <label>
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
            
            {saveTarget === 'sheet' && (
              <div className="attendees-section">
                <button type="button" className="add-attendee-btn" onClick={handleToggleAttendeeSearch}>
                  {isAttendeeSearchVisible ? '- 참석자 검색 닫기' : '+ 참석자 추가'}
                </button>
                <div className="selected-attendees-list">
                  {selectedAttendees.map(person => (
                    <div key={'no_student' in person ? person.no_student : person.no} className="attendee-tag">
                      <span>{person.name}</span>
                      <button type="button" className="remove-attendee-btn" onClick={() => handleRemoveAttendee(person)}>&times;</button>
                    </div>
                  ))}
                </div>
                <div className="selected-attendees-count">
                  선택된 참석자: {selectedAttendees.length}명
                </div>
              </div>
            )}
          </div>
          <div className={`attendee-search-panel ${isAttendeeSearchVisible ? 'visible' : ''}`}>
            <h3>참석자 검색</h3>
            <input
              type="text"
              placeholder="이름으로 검색..."
              className="attendee-search-input"
              value={attendeeSearchTerm}
              onChange={(e) => setAttendeeSearchTerm(e.target.value)}
            />
            <div className="attendee-results-list">
              {isLoadingAttendees ? (
                <p>불러오는 중...</p>
              ) : (
                filteredAttendees.length > 0 ? (
                  <ul>
                    {filteredAttendees.map(person => {
                      const isSelected = selectedAttendees.some(a => ('no_student' in a ? a.no_student : a.no) === ('no_student' in person ? person.no_student : person.no));
                      return (
                        <li key={`${person.type}-${'no_student' in person ? person.no_student : person.no}`} onClick={() => handleSelectAttendee(person as Student | Staff)}>
                          {person.name} ({person.type === 'student' ? `${(person as Student).grade}학년` : (person as Staff).pos})
                          {isSelected && <span className="checkmark-icon">✓</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>{attendeeSearchTerm.trim() !== '' ? '검색 결과가 없습니다.' : '전체 목록이 표시됩니다.'}</p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="submit-button" onClick={handleSave} disabled={dateError || title.trim() === ''}>{isEditMode ? '수정' : '일정 추가'}</button>
          <button className="cancel-button" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddEventModal;
