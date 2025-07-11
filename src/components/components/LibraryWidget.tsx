// src/components/LibraryWidget.tsx
import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import './LibraryWidget.css';

const LibraryWidget: React.FC = () => {
    return (
        <WidgetWrapper title="도서관 좌석현황" iconClass="fas fa-chair">
            <div className="library-widget-content library-status">
                <p>중앙도서관 열람실: <span className="seat-available">120석</span> / <span className="seat-total">200석</span></p>
                <p>전자정보실: <span className="seat-available">30석</span> / <span className="seat-total">50석</span></p>
                <p>스터디룸: <span className="seat-available">5개</span> / <span className="seat-total">10개</span></p>
            </div>
        </WidgetWrapper>
    );
};
export default LibraryWidget;