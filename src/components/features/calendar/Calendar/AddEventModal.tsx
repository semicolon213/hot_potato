import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useCalendarContext, { type Event } from '../../../../hooks/features/calendar/useCalendarContext.ts';
import type { Student, Staff } from '../../../../types/app';
import './AddEventModal.css';
import xIcon from '../../../../assets/Icons/x.svg';
import { RRule } from 'rrule';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';
import { apiClient } from '../../../../utils/api/apiClient';
import type { UsersListResponse } from '../../../../types/api/apiResponses';

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
  const [allMembers, setAllMembers] = useState<Array<{no_member: string; name: string; userType: string; email: string}>>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]); // 선택된 권한 그룹

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
        setShowTime(true);
      } else {
        setStartTime('00:00');
        setEndTime('00:00');
        setShowTime(false);
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

      // Default time values (시간은 기본적으로 비활성화)
      setStartTime('00:00');
      setEndTime('00:00');
      setShowTime(false);

      setSaveTarget('google');
      setSelectedAttendees([]);
      setSelectedTags([]);
      setSelectedGroups([]);
    }
  }, [eventToEdit, isEditMode, eventTypes]);

  // Pre-populate selected attendees and groups in edit mode once data is loaded
  useEffect(() => {
    if (isEditMode && eventToEdit && allMembers.length > 0) {
        const attendeeItems = (eventToEdit as Event & { attendees?: string }).attendees?.split(',').filter(Boolean) || [];
        if (attendeeItems.length > 0) {
            const preselectedAttendees: (Student | Staff)[] = [];
            const preselectedGroups: string[] = [];
            
            attendeeItems.forEach(item => {
              const trimmed = item.trim();
              if (trimmed.startsWith('group:')) {
                // 그룹 선택
                const groupType = trimmed.replace('group:', '');
                if (groupType && !preselectedGroups.includes(groupType)) {
                  preselectedGroups.push(groupType);
                }
              } else if (trimmed.includes(':')) {
                // 개별 참석자: 권한:참석자ID
                const [, attendeeId] = trimmed.split(':');
                const member = allMembers.find(m => m.no_member === attendeeId);
                if (member) {
                  const person: Student | Staff = member.userType === 'student' 
                    ? { no_student: member.no_member, name: member.name, grade: 0, type: 'student' as const }
                    : { no: member.no_member, name: member.name, pos: '', type: 'staff' as const };
                  preselectedAttendees.push(person);
                }
              } else {
                // 기존 형식 (호환성): 참석자ID만
                const member = allMembers.find(m => m.no_member === trimmed);
                if (member) {
                  const person: Student | Staff = member.userType === 'student' 
                    ? { no_student: member.no_member, name: member.name, grade: 0, type: 'student' as const }
                    : { no: member.no_member, name: member.name, pos: '', type: 'staff' as const };
                  preselectedAttendees.push(person);
                }
              }
            });
            
            setSelectedAttendees(preselectedAttendees);
            setSelectedGroups(preselectedGroups);
        }
    }
  }, [isEditMode, eventToEdit, allMembers]);


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

  // 회원 목록 로드
  useEffect(() => {
    const loadMembers = async () => {
      if (isAttendeeSearchVisible && allMembers.length === 0) {
        setIsLoadingAttendees(true);
        try {
          const response = await apiClient.getAllUsers() as UsersListResponse;
          if (response.success && response.users && Array.isArray(response.users)) {
            const members = response.users
              .filter(u => u.isApproved || u.Approval === 'O')
              .map(u => ({
                no_member: u.no_member || u.studentId || '',
                name: u.name || u.name_member || '',
                userType: u.userType || u.user_type || 'student',
                email: u.email || ''
              }))
              .filter(m => m.no_member && m.name);
            setAllMembers(members);
          }
        } catch (error) {
          console.error('회원 목록 로드 오류:', error);
        } finally {
          setIsLoadingAttendees(false);
        }
      }
    };
    loadMembers();
  }, [isAttendeeSearchVisible, allMembers.length]);

  const filteredAttendees = useMemo(() => {
    // 선택된 그룹에 속한 회원은 개별 참석자 목록에서 제외
    let filtered = allMembers;
    
    // 선택된 그룹에 속한 회원 필터링 (개별 참석자 목록에서 제외)
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(m => !selectedGroups.includes(m.userType));
    }

    // 이미 선택된 개별 참석자는 제외
    const selectedMemberIds = selectedAttendees.map(a => {
      return 'no_student' in a ? a.no_student : a.no;
    });
    filtered = filtered.filter(m => !selectedMemberIds.includes(m.no_member));

    if (attendeeSearchTerm.trim() === '') {
      return filtered;
    }

    const lowercasedTerm = attendeeSearchTerm.toLowerCase();
    return filtered.filter(member =>
      member.name.toLowerCase().includes(lowercasedTerm) ||
      member.email.toLowerCase().includes(lowercasedTerm)
    );
  }, [attendeeSearchTerm, allMembers, selectedGroups, selectedAttendees]);

  const handleSelectAttendee = (member: {no_member: string; name: string; userType: string; email: string}) => {
    // 회원을 Student/Staff 형식으로 변환
    const person: Student | Staff = member.userType === 'student' 
      ? { no_student: member.no_member, name: member.name, grade: 0, type: 'student' as const }
      : { no: member.no_member, name: member.name, pos: '', type: 'staff' as const };
    
    const isSelected = selectedAttendees.some(a => ('no_student' in a ? a.no_student : a.no) === member.no_member);

    if (isSelected) {
      // Before removing, check if it's the logged-in user and not an admin
      if (user && !user.isAdmin && member.no_member === String(user.studentId)) {
        return; // Don't allow removal
      }
      handleRemoveAttendee(person);
    } else {
      setSelectedAttendees([...selectedAttendees, person]);
    }
    setAttendeeSearchTerm('');
  };

  const handleToggleGroup = (groupType: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupType)) {
        return prev.filter(g => g !== groupType);
      } else {
        return [...prev, groupType];
      }
    });
  };

  const handleRemoveAttendee = (personToRemove: Student | Staff) => {
    if (user && !user.isAdmin && ('no_student' in personToRemove ? personToRemove.no_student : personToRemove.no) === String(user.studentId)) {
      // Prevent removal of self if not an admin
      return;
    }
    setSelectedAttendees(selectedAttendees.filter(a => ('no_student' in a ? a.no_student : a.no) !== ('no_student' in personToRemove ? personToRemove.no_student : personToRemove.no)));
  };

  const handleToggleAttendeeSearch = () => {
    setIsAttendeeSearchVisible(!isAttendeeSearchVisible);
  };


  const handleSelectTag = (selectedTag: string, isCustom: boolean = false, tagColor?: string) => {
    const tagExists = selectedTags.some(t => t.type === selectedTag && t.isCustom === isCustom);
    if (tagExists) {
      // 이미 선택된 태그면 제거 (단일 선택이므로 빈 배열로)
      setSelectedTags([]);
    } else {
      // 선택되지 않은 태그면 기존 선택을 모두 제거하고 새 태그만 선택 (단일 선택)
      if (isCustom) {
        // 커스텀 태그인 경우 색상 정보도 함께 가져오기
        // tagColor가 전달되면 사용하고, 없으면 selectedTags에서 찾기
        const color = tagColor || selectedTags.find(t => t.type === selectedTag && t.isCustom)?.color || customColor;
        setSelectedTags([{ type: selectedTag, isCustom: true, color }]);
      } else {
        // 기본 태그는 단일 선택
        setSelectedTags([{ type: selectedTag, isCustom: false }]);
      }
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      if (editingTag) {
        // 편집 모드: 기존 태그 업데이트 (단일 선택이므로 배열에 1개만)
        setSelectedTags([{ type: customTag.trim(), isCustom: true, color: customColor }]);
        setEditingTag(null);
      } else {
        // 추가 모드: 새 태그 단일 선택 (기존 선택 제거)
        setSelectedTags([{ type: customTag.trim(), isCustom: true, color: customColor }]);
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


  // 참석자 수에 따라 자동으로 개인/공유 결정
  useEffect(() => {
    // 그룹이 선택되었거나 참석자가 있고 본인 외 다른 참석자가 있으면 공유 일정
    const hasOtherAttendees = selectedAttendees.some(a => {
      if (user && !user.isAdmin) {
        return ('no_student' in a ? a.no_student : a.no) !== String(user.studentId);
      }
      return true; // admin인 경우 참석자가 있으면 공유
    });
    
    const hasGroups = selectedGroups.length > 0;
    const hasOtherGroups = selectedGroups.some(g => g !== user?.userType);
    
    if ((selectedAttendees.length === 0 && !hasGroups) || (!hasOtherAttendees && !hasOtherGroups)) {
      setSaveTarget('google');
    } else {
      setSaveTarget('sheet');
    }
  }, [selectedAttendees, selectedGroups, user]);


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
          // 참석자 저장 형식: "group:권한" 또는 "권한:참석자ID" 또는 "참석자ID" (기존 형식)
          const attendeeList: string[] = [];
          
          // 선택된 그룹 추가
          selectedGroups.forEach(group => {
            attendeeList.push(`group:${group}`);
          });
          
          // 개별 참석자 추가
          const currentUserMemberId = user ? String(user.studentId) : null;
          selectedAttendees.forEach(a => {
            const memberId = 'no_student' in a ? a.no_student : a.no;
            const member = allMembers.find(m => m.no_member === memberId);
            if (member) {
              attendeeList.push(`${member.userType}:${memberId}`);
            } else {
              // 기존 형식 호환성 (회원 목록에 없는 경우)
              attendeeList.push(memberId);
            }
          });
          
          // 본인이 그룹에도 개별 참석자에도 없으면 자동으로 추가
          if (user && currentUserMemberId) {
            const isInGroup = selectedGroups.includes(user.userType);
            const isInAttendees = selectedAttendees.some(a => {
              const memberId = 'no_student' in a ? a.no_student : a.no;
              return memberId === currentUserMemberId;
            });
            
            if (!isInGroup && !isInAttendees) {
              const currentUserMember = allMembers.find(m => m.no_member === currentUserMemberId);
              if (currentUserMember) {
                attendeeList.push(`${currentUserMember.userType}:${currentUserMemberId}`);
              } else {
                // 회원 목록에 없으면 기본 형식으로 추가
                attendeeList.push(currentUserMemberId);
              }
            }
          }
          
          eventData.attendees = attendeeList.join(',');
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

      // 시간이 활성화된 경우에만 startDateTime과 endDateTime 설정
      if (showTime) {
        eventData.startDateTime = `${startDate}T${startTime}:00`;
        eventData.endDateTime = `${endDate}T${endTime}:00`;
      } else {
        // 시간이 없으면 전체 일정(all-day event)으로 처리
        // startDateTime과 endDateTime을 설정하지 않음
        delete eventData.startDateTime;
        delete eventData.endDateTime;
      }
      eventData.startDate = startDate;
      eventData.endDate = endDate;

      // 반복 일정 설정 (sheet와 google 모두 지원)
      if (recurrenceFreq !== 'NONE') {
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
                          <div className="schedule-section-header-right">
                              <label className="schedule-time-toggle-label">
                                  <input
                                      type="checkbox"
                                      checked={showTime}
                                      onChange={(e) => {
                                          setShowTime(e.target.checked);
                                          if (!e.target.checked) {
                                              // 체크 해제 시 시간을 00:00으로 초기화
                                              setStartTime('00:00');
                                              setEndTime('00:00');
                                          }
                                      }}
                                      className="schedule-time-checkbox"
                                  />
                                  <span>시간 설정</span>
                              </label>
                              {dateDifferenceInDays > 0 && (
                                  <span className="schedule-duration-badge">
                                      {dateDifferenceInDays}일
                                  </span>
                              )}
                          </div>
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
                                  {showTime && (
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
                                  )}
                                  {showTime && showStartTimePicker && startTimeButtonRef.current && createPortal(
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
                                  {showTime && (
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
                                  )}
                                  {showTime && showEndTimePicker && endTimeButtonRef.current && createPortal(
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
                            // 커스텀 태그 클릭 시 선택/해제 토글 (색상 정보 전달)
                            handleSelectTag(tag.type, true, tag.color);
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
                {(selectedAttendees.length > 0 || selectedGroups.length > 0) ? (
                  <div className="selected-attendees-list">
                    {/* 선택된 그룹 표시 */}
                    {selectedGroups.map(groupType => {
                      const groupLabels: {[key: string]: string} = {
                        student: '학생',
                        council: '집행부',
                        supp: '조교',
                        ADprofessor: '겸임교원',
                        professor: '교수'
                      };
                      const isCurrentUserGroup = user?.userType === groupType;
                      return (
                        <div key={`group-${groupType}`} className="attendee-tag group-tag">
                          <span className="attendee-name">
                            {groupLabels[groupType] || groupType} 그룹{isCurrentUserGroup ? ' (본인)' : ''}
                          </span>
                          <button type="button" className="remove-attendee-btn" onClick={() => handleToggleGroup(groupType)}>&times;</button>
                        </div>
                      );
                    })}
                    {/* 개별 참석자 표시 */}
                    {selectedAttendees.map(person => {
                      const isCurrentUser = user && !user.isAdmin && ('no_student' in person ? person.no_student : person.no) === String(user.studentId);
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
            
            {/* 그룹 선택 버튼 */}
            <div className="group-selection-section">
              <label>권한 그룹 선택:</label>
              <div className="group-buttons">
                {['student', 'council', 'supp', 'ADprofessor', 'professor'].map(groupType => {
                  const groupLabels: {[key: string]: string} = {
                    student: '학생',
                    council: '집행부',
                    supp: '조교',
                    ADprofessor: '겸임교원',
                    professor: '교수'
                  };
                  const isSelected = selectedGroups.includes(groupType);
                  const isCurrentUserGroup = user?.userType === groupType;
                  return (
                    <button
                      key={groupType}
                      type="button"
                      className={`group-button ${isSelected ? 'active' : ''}`}
                      onClick={() => handleToggleGroup(groupType)}
                      title={isCurrentUserGroup ? '본인 권한 그룹' : ''}
                    >
                      {groupLabels[groupType] || groupType}
                      {isCurrentUserGroup && ' (본인)'}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
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
                    {filteredAttendees.map(member => {
                      const isSelected = selectedAttendees.some(a => {
                        const memberId = 'no_student' in a ? a.no_student : a.no;
                        return memberId === member.no_member;
                      });
                      const isCurrentUser = user && !user.isAdmin && member.no_member === String(user.studentId);
                      const userTypeLabels: {[key: string]: string} = {
                        student: '학생',
                        council: '집행부',
                        supp: '조교',
                        ADprofessor: '겸임교원',
                        professor: '교수'
                      };
                      return (
                        <li key={member.no_member} onClick={() => handleSelectAttendee(member)}>
                          <div className="attendee-list-item">
                            <div className="attendee-name-section">
                              <span className="attendee-name">{member.name}{isCurrentUser ? '(본인)' : ''}</span>
                              <span className="attendee-info">
                                ({userTypeLabels[member.userType] || member.userType} | {member.no_member})
                              </span>
                            </div>
                            {member.email && (
                              <div className="attendee-email">{member.email}</div>
                            )}
                          </div>
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
