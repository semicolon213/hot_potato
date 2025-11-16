import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useCalendarContext, { type Event } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import type { Student, Staff } from '../../../../types/app';
import './AddEventModal.css';
import xIcon from '../../../../assets/Icons/x.svg';
import { RRule } from 'rrule';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';

interface AddEventModalProps {
  onClose: () => void;
  eventToEdit?: Event | null;
}

type RecurrenceFreq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, eventToEdit }) => {
  const { user, addEvent, addSheetEvent, updateEvent, selectedDate, eventTypes, eventTypeStyles, formatDate, students, staff } = useCalendarContext();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const startDateButtonRef = useRef<HTMLDivElement>(null);
  const endDateButtonRef = useRef<HTMLDivElement>(null);
  const startTimeButtonRef = useRef<HTMLDivElement>(null);
  const endTimeButtonRef = useRef<HTMLDivElement>(null);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '날짜 선택';
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };
  const [showTime, setShowTime] = useState(false);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [saveTarget, setSaveTarget] = useState<'google' | 'sheet'>('google');
  const [selectedTags, setSelectedTags] = useState<Array<{ type: string; isCustom: boolean; color?: string }>>([]);
  const [customTag, setCustomTag] = useState('');
  const [customColor, setCustomColor] = useState('#7986CB');
  const [editingTag, setEditingTag] = useState<{ type: string; isCustom: boolean; color?: string } | null>(null);
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  
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
          const eventType = eventToEdit.type || 'event';
          const isPredefined = eventTypes.includes(eventType);
          if (isPredefined) {
              setSelectedTags([{ type: eventType, isCustom: false }]);
          } else {
              setSelectedTags([{ type: eventType, isCustom: true, color: eventToEdit.color || '#7986CB' }]);
          }
      } else {
          setSaveTarget('google');
          setSelectedTags([]);
      }

      if (eventToEdit.startDateTime && eventToEdit.endDateTime) {
        setStartTime(eventToEdit.startDateTime.split('T')[1].substring(0, 5));
        setEndTime(eventToEdit.endDateTime.split('T')[1].substring(0, 5));
      } else {
        setStartTime('00:00');
        setEndTime('00:00');
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

      // Default time values
      setStartTime('00:00');
      setEndTime('00:00');

      setSaveTarget('google');
      setSelectedAttendees([]);
      setSelectedTags([]);
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
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setEndDate(startDate);
      }
      setDateError(start > end);
    } else {
      setDateError(false);
    }
  }, [startDate, endDate]);

  // 시작일과 종료일의 차이를 계산하여 반복 옵션 제한
  const dateDifferenceInDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 포함일 계산
    return diffDays;
  }, [startDate, endDate]);

  // 하루 일정인지 확인 (시작일과 종료일이 같은 날)
  const isSingleDayEvent = useMemo(() => {
    if (!startDate || !endDate) return true;
    return startDate === endDate;
  }, [startDate, endDate]);

  // 사용 가능한 반복 옵션 필터링
  const availableRecurrenceOptions = useMemo(() => {
    const options: { value: RecurrenceFreq; label: string; disabled: boolean }[] = [
      { value: 'NONE', label: '반복 안 함', disabled: false },
      // 하루 일정만 매일 반복 가능 (물리적으로 겹치지 않음)
      { value: 'DAILY', label: '매일', disabled: !isSingleDayEvent },
      // 일주일 이하 일정만 매주 반복 가능
      { value: 'WEEKLY', label: '매주', disabled: dateDifferenceInDays > 7 },
      // 모든 일정에 매월 반복 가능
      { value: 'MONTHLY', label: '매월', disabled: false },
    ];
    return options;
  }, [dateDifferenceInDays, isSingleDayEvent]);

  // 현재 선택된 반복 옵션이 유효하지 않으면 NONE으로 리셋
  useEffect(() => {
    if ((recurrenceFreq === 'DAILY' && !isSingleDayEvent) || 
        (recurrenceFreq === 'WEEKLY' && dateDifferenceInDays > 7)) {
      setRecurrenceFreq('NONE');
    }
  }, [dateDifferenceInDays, isSingleDayEvent, recurrenceFreq]);

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


  const handleSelectTag = (selectedTag: string, isCustom: boolean = false) => {
    const tagExists = selectedTags.some(t => t.type === selectedTag && t.isCustom === isCustom);
    if (tagExists) {
      // 이미 선택된 태그면 제거
      setSelectedTags(selectedTags.filter(t => !(t.type === selectedTag && t.isCustom === isCustom)));
    } else {
      // 선택되지 않은 태그면 추가
      if (isCustom) {
        // 커스텀 태그인 경우 색상 정보도 함께 가져오기
        // selectedTags에서 찾거나, 모든 커스텀 태그 목록에서 찾기
        const existingCustomTag = selectedTags.find(t => t.type === selectedTag && t.isCustom);
        if (existingCustomTag) {
          // 이미 존재하는 커스텀 태그면 색상 정보와 함께 추가
          setSelectedTags([...selectedTags, { type: selectedTag, isCustom: true, color: existingCustomTag.color }]);
        } else {
          // 새로 추가된 커스텀 태그는 이미 selectedTags에 있으므로 추가하지 않음
          // 이 경우는 발생하지 않아야 함
        }
      } else {
      setSelectedTags([...selectedTags, { type: selectedTag, isCustom: false }]);
      }
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      if (editingTag) {
        // 편집 모드: 기존 태그 업데이트
        setSelectedTags(selectedTags.map(t => 
          t.type === editingTag.type && t.isCustom === editingTag.isCustom
            ? { type: customTag.trim(), isCustom: true, color: customColor }
            : t
        ));
        setEditingTag(null);
      } else {
        // 추가 모드: 새 태그 추가
        const tagExists = selectedTags.some(t => t.type === customTag.trim() && t.isCustom);
        if (!tagExists) {
          setSelectedTags([...selectedTags, { type: customTag.trim(), isCustom: true, color: customColor }]);
        }
      }
      setCustomTag('');
      setCustomColor('#7986CB');
      setShowCustomTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: { type: string; isCustom: boolean }) => {
    setSelectedTags(selectedTags.filter(t => !(t.type === tagToRemove.type && t.isCustom === tagToRemove.isCustom)));
  };

  const handleEditTag = (tag: { type: string; isCustom: boolean; color?: string }) => {
    if (tag.isCustom) {
      setEditingTag(tag);
      setCustomTag(tag.type);
      setCustomColor(tag.color || '#7986CB');
      setShowCustomTagInput(true);
    }
  };

  const handleCancelCustomTag = () => {
    setCustomTag('');
    setCustomColor('#7986CB');
    setEditingTag(null);
    setShowCustomTagInput(false);
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

  // 참석자 수에 따라 자동으로 개인/공유 결정
  useEffect(() => {
    // 참석자가 없거나 본인만 있으면 개인 일정, 그 외에는 공유 일정
    const hasOtherAttendees = selectedAttendees.some(a => {
      if (user && user.userType !== 'admin') {
        return ('no_student' in a ? a.no_student : a.no) !== String(user.studentId);
      }
      return true; // admin인 경우 참석자가 있으면 공유
    });
    
    if (selectedAttendees.length === 0 || !hasOtherAttendees) {
      setSaveTarget('google');
    } else {
      setSaveTarget('sheet');
    }
  }, [selectedAttendees, user]);


  const handleSave = () => {
    if (title.trim()) {
      const eventData: Partial<Event> & { rrule?: string; attendees?: string; } = {
        title: title.trim(),
        description: description.trim(),
      };

      if (saveTarget === 'sheet') {
          // 첫 번째 태그를 사용 (기존 Event 타입이 하나의 type만 지원)
          if (selectedTags.length > 0) {
              const firstTag = selectedTags[0];
              if (firstTag.isCustom) {
                  eventData.type = firstTag.type;
                  eventData.color = firstTag.color;
              } else {
                  eventData.type = tagLabels[firstTag.type] || firstTag.type;
              }
          } else {
              eventData.type = tagLabels['event'] || 'event';
          }
          eventData.attendees = selectedAttendees.map(a => 'no_student' in a ? a.no_student : a.no).join(',');
      } else {
          // 개인 일정: 태그 정보를 description에 추가하거나 colorId 설정
          if (selectedTags.length > 0) {
              const firstTag = selectedTags[0];
              if (firstTag.isCustom) {
                  // 커스텀 태그의 경우 색상 정보를 저장할 방법이 제한적이므로 description에 추가
                  const tagLabel = firstTag.type;
                  eventData.description = (eventData.description || '') + (eventData.description ? '\n' : '') + `[태그: ${tagLabel}]`;
              } else {
                  // 사전 정의 태그는 colorId로 매핑 가능하면 매핑
                  const tagType = firstTag.type;
                  // Google Calendar colorId 매핑 (기본값 9는 파란색)
                  eventData.colorId = '9';
              }
          } else {
              eventData.colorId = '9';
          }
      }

      eventData.startDateTime = `${startDate}T${startTime}:00`;
      eventData.endDateTime = `${endDate}T${endTime}:00`;
      eventData.startDate = startDate;
      eventData.endDate = endDate;

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
        <div className="modal-header">
          <div className="header-left">
            <h2>{isEditMode ? '일정 수정' : '일정 추가'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <img src={xIcon} alt="Close" />
          </button>
        </div>
        
        <div className="modal-body-two-column">
          <div className="modal-form-content">
            <div className="modal-form-section">
              <input
                ref={titleInputRef}
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
            </div>

            <div className="modal-form-section">
              <textarea
                  ref={descriptionRef}
                  placeholder="설명"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="add-event-description"
                  rows={1}
              />
            </div>

            <div className="modal-form-section">
              <div className="schedule-settings-container">
                  <div className="schedule-section">
                      <div className="schedule-section-header">
                          <span className="schedule-section-title">일정 기간</span>
                          {dateDifferenceInDays > 0 && (
                              <span className="schedule-duration-badge">
                                  {dateDifferenceInDays}일
                              </span>
                          )}
                      </div>
                      <div className="schedule-time-grid">
                          <div className="schedule-time-item">
                              <label className="schedule-time-label">시작:</label>
                              <div className="schedule-input-group">
                                  <div className="schedule-input-with-buttons">
                                  <div 
                                      ref={startDateButtonRef}
                                      className="schedule-date-input"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setShowStartDatePicker(!showStartDatePicker);
                                          setShowStartTimePicker(false);
                                          setShowEndDatePicker(false);
                                          setShowEndTimePicker(false);
                                      }}
                                  >
                                      {formatDateDisplay(startDate)}
                                      </div>
                                      <div className="schedule-input-buttons">
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-up"
                                              aria-label="날짜 하루 증가"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (startDate) {
                                                      const date = new Date(startDate);
                                                      date.setDate(date.getDate() + 1);
                                                      setStartDate(date.toISOString().split('T')[0]);
                                                  }
                                              }}
                                          >
                                              ▲
                                          </button>
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-down"
                                              aria-label="날짜 하루 감소"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (startDate) {
                                                      const date = new Date(startDate);
                                                      date.setDate(date.getDate() - 1);
                                                      setStartDate(date.toISOString().split('T')[0]);
                                                  }
                                              }}
                                          >
                                              ▼
                                          </button>
                                      </div>
                                  </div>
                                  {showStartDatePicker && startDateButtonRef.current && createPortal(
                                      <CustomDatePicker
                                          value={startDate}
                                          onChange={(value) => {
                                              setStartDate(value);
                                              setShowStartDatePicker(false);
                                          }}
                                          onClose={() => setShowStartDatePicker(false)}
                                          position={{
                                              top: startDateButtonRef.current.getBoundingClientRect().bottom + 4,
                                              left: startDateButtonRef.current.getBoundingClientRect().left
                                          }}
                                      />,
                                      document.body
                                  )}
                                  <div className="schedule-input-with-buttons">
                                  <div 
                                      ref={startTimeButtonRef}
                                      className="schedule-time-input"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setShowStartTimePicker(!showStartTimePicker);
                                          setShowStartDatePicker(false);
                                          setShowEndDatePicker(false);
                                          setShowEndTimePicker(false);
                                      }}
                                  >
                                      {startTime || '00:00'}
                                      </div>
                                      <div className="schedule-input-buttons">
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-up"
                                              aria-label="시간 10분 증가"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  const [hours, minutes] = (startTime || '00:00').split(':').map(Number);
                                                  let newMinutes = minutes + 10;
                                                  let newHours = hours;
                                                  if (newMinutes >= 60) {
                                                      newMinutes = 0;
                                                      newHours = (newHours + 1) % 24;
                                                  }
                                                  setStartTime(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
                                              }}
                                          >
                                              ▲
                                          </button>
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-down"
                                              aria-label="시간 10분 감소"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  const [hours, minutes] = (startTime || '00:00').split(':').map(Number);
                                                  let newMinutes = minutes - 10;
                                                  let newHours = hours;
                                                  if (newMinutes < 0) {
                                                      newMinutes = 50;
                                                      newHours = (newHours - 1 + 24) % 24;
                                                  }
                                                  setStartTime(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
                                              }}
                                          >
                                              ▼
                                          </button>
                                      </div>
                                  </div>
                                  {showStartTimePicker && startTimeButtonRef.current && createPortal(
                                      <CustomTimePicker
                                          value={startTime}
                                          onChange={(value) => {
                                              setStartTime(value);
                                              setShowStartTimePicker(false);
                                          }}
                                          onClose={() => setShowStartTimePicker(false)}
                                          step={10}
                                          position={{
                                              top: startTimeButtonRef.current.getBoundingClientRect().bottom + 4,
                                              left: startTimeButtonRef.current.getBoundingClientRect().left
                                          }}
                                      />,
                                      document.body
                                  )}
                              </div>
                          </div>
                          <div className="schedule-time-item">
                              <label className="schedule-time-label">종료:</label>
                              <div className="schedule-input-group">
                                  <div className="schedule-input-with-buttons">
                                  <div 
                                      ref={endDateButtonRef}
                                      className="schedule-date-input"
                                      style={{ backgroundColor: dateError ? '#ffebee' : '' }}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setShowEndDatePicker(!showEndDatePicker);
                                          setShowStartDatePicker(false);
                                          setShowStartTimePicker(false);
                                          setShowEndTimePicker(false);
                                      }}
                                  >
                                      {formatDateDisplay(endDate)}
                                      </div>
                                      <div className="schedule-input-buttons">
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-up"
                                              aria-label="날짜 하루 증가"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (endDate) {
                                                      const date = new Date(endDate);
                                                      date.setDate(date.getDate() + 1);
                                                      setEndDate(date.toISOString().split('T')[0]);
                                                  }
                                              }}
                                          >
                                              ▲
                                          </button>
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-down"
                                              aria-label="날짜 하루 감소"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (endDate) {
                                                      const date = new Date(endDate);
                                                      date.setDate(date.getDate() - 1);
                                                      setEndDate(date.toISOString().split('T')[0]);
                                                  }
                                              }}
                                          >
                                              ▼
                                          </button>
                                      </div>
                                  </div>
                                  {showEndDatePicker && endDateButtonRef.current && createPortal(
                                      <CustomDatePicker
                                          value={endDate}
                                          onChange={(value) => {
                                              setEndDate(value);
                                              setShowEndDatePicker(false);
                                          }}
                                          onClose={() => setShowEndDatePicker(false)}
                                          position={{
                                              top: endDateButtonRef.current.getBoundingClientRect().bottom + 4,
                                              left: endDateButtonRef.current.getBoundingClientRect().left
                                          }}
                                      />,
                                      document.body
                                  )}
                                  <div className="schedule-input-with-buttons">
                                  <div 
                                      ref={endTimeButtonRef}
                                      className="schedule-time-input"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setShowEndTimePicker(!showEndTimePicker);
                                          setShowStartDatePicker(false);
                                          setShowStartTimePicker(false);
                                          setShowEndDatePicker(false);
                                      }}
                                  >
                                      {endTime || '00:00'}
                                      </div>
                                      <div className="schedule-input-buttons">
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-up"
                                              aria-label="시간 10분 증가"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  const [hours, minutes] = (endTime || '00:00').split(':').map(Number);
                                                  let newMinutes = minutes + 10;
                                                  let newHours = hours;
                                                  if (newMinutes >= 60) {
                                                      newMinutes = 0;
                                                      newHours = (newHours + 1) % 24;
                                                  }
                                                  setEndTime(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
                                              }}
                                          >
                                              ▲
                                          </button>
                                          <button
                                              type="button"
                                              className="schedule-input-btn schedule-input-btn-down"
                                              aria-label="시간 10분 감소"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  const [hours, minutes] = (endTime || '00:00').split(':').map(Number);
                                                  let newMinutes = minutes - 10;
                                                  let newHours = hours;
                                                  if (newMinutes < 0) {
                                                      newMinutes = 50;
                                                      newHours = (newHours - 1 + 24) % 24;
                                                  }
                                                  setEndTime(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
                                              }}
                                          >
                                              ▼
                                          </button>
                                      </div>
                                  </div>
                                  {showEndTimePicker && endTimeButtonRef.current && createPortal(
                                      <CustomTimePicker
                                          value={endTime}
                                          onChange={(value) => {
                                              setEndTime(value);
                                              setShowEndTimePicker(false);
                                          }}
                                          onClose={() => setShowEndTimePicker(false)}
                                          step={10}
                                          position={{
                                              top: endTimeButtonRef.current.getBoundingClientRect().bottom + 4,
                                              left: endTimeButtonRef.current.getBoundingClientRect().left
                                          }}
                                      />,
                                      document.body
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {saveTarget === 'sheet' && (
                      <div className="schedule-section">
                          <div className="schedule-section-header">
                              <span className="schedule-section-title">반복 설정</span>
                              {dateDifferenceInDays > 7 && (
                                  <span className="schedule-warning-badge">
                                      장기 일정
                                  </span>
                              )}
                          </div>
                          <div className="schedule-recurrence-group">
                              <select
                                  id="recurrence"
                                  value={recurrenceFreq}
                                  onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFreq)}
                                  className="schedule-recurrence-select"
                              >
                                  {availableRecurrenceOptions.map(option => (
                                      <option 
                                          key={option.value} 
                                          value={option.value}
                                          disabled={option.disabled}
                                      >
                                          {option.label}
                                      </option>
                                  ))}
                              </select>
                              {recurrenceFreq !== 'NONE' && (
                                  <div className="schedule-recurrence-details">
                                      <div className="schedule-recurrence-interval">
                                          <input
                                              type="number"
                                              min="1"
                                              value={recurrenceDetails.interval}
                                              onChange={(e) => setRecurrenceDetails({ ...recurrenceDetails, interval: parseInt(e.target.value, 10) || 1 })}
                                              className="schedule-interval-input"
                                          />
                                          <span className="schedule-interval-label">
                                              {recurrenceFreq === 'DAILY' ? '일마다' : recurrenceFreq === 'WEEKLY' ? '주마다' : '개월마다'}
                                          </span>
                                      </div>
                                      <div className="schedule-recurrence-until">
                                          <label className="schedule-until-label">반복 종료일</label>
                                          <input
                                              type="date"
                                              value={recurrenceDetails.until}
                                              onChange={(e) => setRecurrenceDetails({ ...recurrenceDetails, until: e.target.value })}
                                              min={startDate}
                                              className="schedule-until-input"
                                          />
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
            </div>

            <div className="modal-form-section">
              <div className="attendees-section">
                <div className="attendees-header">
                  <label className="attendees-label">태그</label>
                </div>
                <div className="tag-selection-panel-content">
                  <div className="tag-selection-panel-section">
                    <div className="custom-tag-input-group">
                      <input 
                        type="text" 
                        placeholder="태그 이름 입력" 
                        value={customTag} 
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomTag();
                          } else if (e.key === 'Escape') {
                            handleCancelCustomTag();
                          }
                        }}
                        className="custom-tag-name-input" 
                      />
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="custom-tag-color-picker"
                        title="색상 선택"
                        aria-label="태그 색상 선택"
                      />
                      <button 
                        type="button" 
                        className="custom-tag-confirm-btn"
                        onClick={handleAddCustomTag}
                        disabled={!customTag.trim()}
                        aria-label="태그 저장"
                      >
                        +
                  </button>
                </div>
                    <div className="tag-selection-panel-grid">
                      {eventTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          className={`tag-panel-button ${selectedTags.some(t => t.type === type && !t.isCustom) ? 'active' : ''}`}
                          onClick={() => handleSelectTag(type)}
                          style={{ 
                            backgroundColor: selectedTags.some(t => t.type === type && !t.isCustom) 
                              ? (eventTypeStyles[type]?.color || '#343a40')
                              : '#ffffff',
                            color: selectedTags.some(t => t.type === type && !t.isCustom) ? 'var(--text-dark)' : 'var(--text-medium)',
                            borderColor: selectedTags.some(t => t.type === type && !t.isCustom) ? 'transparent' : (eventTypeStyles[type]?.color || '#e2e8f0')
                          }}
                        >
                          {tagLabels[type] || type}
                        </button>
                      ))}
                      {selectedTags.filter(t => t.isCustom).map((tag, index) => (
                          <button 
                          key={`custom-${tag.type}-${index}`}
                            type="button" 
                          className={`tag-panel-button active`}
                          onClick={() => {
                            // 커스텀 태그 클릭 시 선택/해제 토글
                            handleSelectTag(tag.type, true);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (editingTag && editingTag.type === tag.type && editingTag.isCustom === tag.isCustom) {
                              // 편집 중인 태그를 다시 더블클릭하면 편집 취소
                              handleCancelCustomTag();
                            } else {
                              // 더블클릭 시 편집
                              handleEditTag(tag);
                            }
                          }}
                          style={{ 
                            backgroundColor: tag.color || '#7986CB',
                            color: 'var(--text-dark)',
                            borderColor: 'transparent'
                          }}
                          title="클릭: 선택 해제, 더블클릭: 편집"
                        >
                          {tag.type}
                          </button>
                      ))}
                        </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-form-section">
              <div className="attendees-section">
                <div className="attendees-header">
                  <label className="attendees-label">참석자</label>
                  <button type="button" className="add-attendee-btn" onClick={handleToggleAttendeeSearch}>
                    {isAttendeeSearchVisible ? '닫기' : '추가'}
                  </button>
                </div>
                {selectedAttendees.length > 0 ? (
                  <div className="selected-attendees-list">
                    {selectedAttendees.map(person => {
                      const isCurrentUser = user && user.userType !== 'admin' && ('no_student' in person ? person.no_student : person.no) === String(user.studentId);
                      return (
                        <div key={'no_student' in person ? person.no_student : person.no} className="attendee-tag">
                          <span className="attendee-name">{person.name}{isCurrentUser ? '(본인)' : ''}</span>
                          <button type="button" className="remove-attendee-btn" onClick={() => handleRemoveAttendee(person)}>&times;</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-attendees-message">참석자가 없습니다</div>
                )}
              </div>
            </div>
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
                      const isCurrentUser = user && user.userType !== 'admin' && ('no_student' in person ? person.no_student : person.no) === String(user.studentId);
                      return (
                        <li key={`${person.type}-${'no_student' in person ? person.no_student : person.no}`} onClick={() => handleSelectAttendee(person as Student | Staff)}>
                          {person.name}{isCurrentUser ? '(본인)' : ''} ({person.type === 'student' ? `${(person as Student).grade}학년` : (person as Staff).pos})
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
          <button className="cancel-button" onClick={onClose}>취소</button>
          <button className="submit-button" onClick={handleSave} disabled={dateError || title.trim() === ''}>{isEditMode ? '수정' : '일정 추가'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddEventModal;
