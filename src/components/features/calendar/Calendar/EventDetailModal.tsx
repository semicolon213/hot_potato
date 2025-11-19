import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './EventDetailModal.css';
import { type Event } from '../../../../hooks/features/calendar/useCalendarContext';
import { BiTrashAlt, BiX, BiEditAlt, BiDetail, BiGroup, BiCalendar, BiChevronUp } from 'react-icons/bi';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext';

interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEdit: (event: Event) => void;
    position?: { top: number; left: number };
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onDelete, onEdit, position: positionFromProp }) => {
    const { students, staff, user } = useCalendarContext();
    const [isAttendeesExpanded, setIsAttendeesExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(positionFromProp || { top: window.innerHeight / 2, left: window.innerWidth / 2 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.left, y: e.clientY - position.top });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                top: e.clientY - dragStart.y,
                left: e.clientX - dragStart.x,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const attendees = useMemo(() => {
        if (!event.attendees || !students || !staff) {
            return [];
        }
        
        const allPeople = [...students, ...staff];
        // Use regex to extract all numeric IDs from the string, making parsing more robust.
        const attendeeIds = event.attendees.match(/\d+/g) || [];
        
        return attendeeIds.map(id => {
            return allPeople.find(p => String('no_student' in p ? p.no_student : p.no) === id);
        }).filter(Boolean);
    }, [event.attendees, students, staff]);

    if (!event) {
        return null;
    }

    const handleDelete = () => {
        if (window.confirm(`'${event.title}' 일정을 삭제하시겠습니까?`)) {
            onDelete(event.id);
        }
    };

    const formatEventDate = (event: Event) => {
        if (event.startDateTime && event.endDateTime) {
            const startTime = new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(event.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const startDate = new Date(event.startDate).toLocaleDateString();
            return `${startDate} ${startTime} - ${endTime}`;
        }

        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        // For single-day events
        if (endDate.getTime() - startDate.getTime() === 0) {
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth() + 1;
            const startDay = startDate.getDate();
            return `${startYear}년 ${startMonth}월 ${startDay}일`;
        }

        // For multi-day events
        const startMonth = startDate.getMonth() + 1;
        const startDay = startDate.getDate();
        const endMonth = endDate.getMonth() + 1;
        const endDay = endDate.getDate();

        if (startMonth === endMonth) {
            return `${startMonth}월 ${startDay}일-${endDay}일`;
        } else {
            return `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;
        }
    };

    const modalStyle = (position && position.top !== 0 && position.left !== 0)
        ? { top: position.top, left: position.left, transform: 'none' }
        : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const canModifyEvent = () => {
        if (!user) return false;

        if (user.isAdmin) {
            return true;
        }

        if (!event.attendees || event.attendees.trim() === '') {
            return false;
        }

        // Use regex to extract all numeric IDs, ensuring consistency with the attendees list logic.
        const attendeeIds = event.attendees.match(/\d+/g) || [];
        
        if (attendeeIds.length === 0) {
            return false;
        }

        const authorId = attendeeIds[attendeeIds.length - 1];

        // Check for student or staff ID on the user object to ensure correct user identification.
        const currentUserId = ('no_student' in user)
            ? user.no_student
            : ('no' in user)
                ? user.no
                : null;

        if (!currentUserId) {
            return false;
        }
        
        return String(currentUserId).trim() === authorId;
    };

    const modalContent = (
        <div className="event-detail-modal-overlay" onClick={onClose}>
            <div className={`event-detail-container ${isAttendeesExpanded ? 'expanded' : ''}`} style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div className="event-detail-header" onMouseDown={handleMouseDown}>
                    <h2>{event.title}</h2>
                    <div className="header-actions">
                        {canModifyEvent() && (
                            <>
                                <BiEditAlt onClick={() => onEdit(event)} className="header-icon" />
                                <BiTrashAlt onClick={handleDelete} className="header-icon" />
                            </>
                        )}
                        <BiX onClick={onClose} className="header-icon close-button" />
                    </div>
                </div>
                <div className="event-detail-body">
                    <div className="detail-item">
                        <BiCalendar className="detail-icon" />
                        <p>{formatEventDate(event)}</p>
                    </div>
                    {event.description && (
                        <div className="detail-item">
                            <BiDetail className="detail-icon" />
                            <p>{event.description}</p>
                        </div>
                    )}
                    {attendees.length > 0 && (
                        <div className="detail-item">
                            <BiGroup className="detail-icon" />
                            <div className={`attendee-list ${isAttendeesExpanded ? 'expanded' : ''}`}>
                                {(isAttendeesExpanded ? attendees : attendees.slice(0, 3)).map((attendee, index) => (
                                    isAttendeesExpanded ? (
                                        <div key={index} className="attendee-detail-item">
                                            <span className="attendee-name">{attendee.name}</span>
                                            <span className="attendee-details">
                                                {('no_student' in attendee) ? `(학번: ${attendee.no_student}, ${attendee.grade}학년)` : `(직책: ${attendee.pos}, 사번: ${attendee.no})`}
                                            </span>
                                        </div>
                                    ) : (
                                        <span key={index} className="attendee-name-tag">{attendee.name}</span>
                                    )
                                ))}
                                {attendees.length > 3 && !isAttendeesExpanded && (
                                    <button className="more-attendees-btn attendee-name-tag" onClick={() => setIsAttendeesExpanded(true)}>
                                        ... {attendees.length - 3} more
                                    </button>
                                )}
                                {isAttendeesExpanded && (
                                    <button className="collapse-attendees-btn" onClick={() => setIsAttendeesExpanded(false)}>
                                        <BiChevronUp />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EventDetailModal;
