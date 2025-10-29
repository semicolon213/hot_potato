import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import './EventDetailModal.css';
import { type Event } from '../../../../hooks/features/calendar/useCalendarContext';
import { BiTrashAlt, BiX, BiEditAlt, BiDetail, BiGroup, BiCalendar } from 'react-icons/bi';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext';

interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEdit: (event: Event) => void;
    position?: { top: number; left: number };
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onDelete, onEdit, position }) => {
    const { students, staff } = useCalendarContext();

    const attendeeNames = useMemo(() => {
        if (!event.attendees || !students || !staff) {
            return [];
        }
        const allPeople = [...students, ...staff];
        const attendeeIds = event.attendees.split(',').map(id => id.trim());
        return attendeeIds.map(id => {
            const person = allPeople.find(p => ('no_student' in p ? p.no_student : p.no) === id);
            return person ? person.name : null;
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

    const formatEventDate = (startStr: string, endStr: string) => {
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);

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
        ? { top: position.top, left: position.left }
        : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const modalContent = (
        <div className="event-detail-modal-overlay" onClick={onClose}>
            <div className="event-detail-container" style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div className="event-detail-header">
                    <h2>{event.title}</h2>
                    <div className="header-actions">
                        <BiEditAlt onClick={() => onEdit(event)} className="header-icon" />
                        <BiTrashAlt onClick={handleDelete} className="header-icon" />
                        <BiX onClick={onClose} className="header-icon close-button" />
                    </div>
                </div>
                <div className="event-detail-body">
                    <div className="detail-item">
                        <BiCalendar className="detail-icon" />
                        <p>{formatEventDate(event.startDate, event.endDate)}</p>
                    </div>
                    {event.description && (
                        <div className="detail-item">
                            <BiDetail className="detail-icon" />
                            <p>{event.description}</p>
                        </div>
                    )}
                    {attendeeNames.length > 0 && (
                        <div className="detail-item">
                            <BiGroup className="detail-icon" />
                            <div className="attendee-list">
                                {attendeeNames.map((name, index) => (
                                    <span key={index} className="attendee-name-tag">{name}</span>
                                ))}
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
