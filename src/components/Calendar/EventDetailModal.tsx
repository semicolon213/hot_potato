import React from 'react';
import './EventDetailModal.css';
import { type Event } from '../../hooks/useCalendarContext';
import trashIcon from '../../assets/Icons/trash.svg';
import editIcon from '../../assets/Icons/edit.svg';
import xIcon from '../../assets/Icons/x.svg';

interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEdit: (event: Event) => void;
    position: { top: number; left: number };
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onDelete, onEdit, position }) => {
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
        const realEndDate = new Date(endDate);
        realEndDate.setDate(realEndDate.getDate() - 1);

        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const startDay = startDate.getDate();

        if (startDate.toISOString().split('T')[0] === realEndDate.toISOString().split('T')[0]) {
             return `${startYear}년 ${startMonth}월 ${startDay}일`;
        }

        const endMonth = realEndDate.getMonth() + 1;
        const endDay = realEndDate.getDate();

        if (startMonth === endMonth) {
            return `${startMonth}월 ${startDay}일-${endDay}일`;
        } else {
            return `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;
        }
    };

    return (
        <div className="event-detail-overlay" onClick={onClose}>
            <div className="event-detail-container" style={{ top: position.top, left: position.left }} onClick={(e) => e.stopPropagation()}>
                <div className="event-detail-header">
                    <h2>{event.title}</h2>
                    <div className="header-actions">
                        <img src={editIcon} alt="Edit" onClick={() => onEdit(event)} className="header-icon" />
                        <img src={trashIcon} alt="Delete" onClick={handleDelete} className="header-icon" />
                        <img src={xIcon} alt="Close" onClick={onClose} className="header-icon close-button" />
                    </div>
                </div>
                <div className="event-detail-body">
                    <div className="detail-item">
                        <span className="icon">🕒</span>
                        <p>{formatEventDate(event.startDate, event.endDate)}</p>
                    </div>
                    {event.description && (
                        <div className="detail-item">
                            <span className="icon">📄</span>
                            <p>{event.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;
