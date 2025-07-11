// src/components/BusWidget.tsx
import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import './BusWidget.css';

const BusWidget: React.FC = () => {
    return (
        <WidgetWrapper title="셔틀버스" iconClass="fas fa-bus">
            <div className="bus-widget-content">
                <div className="bus-item">
                    <span>정문 ↔ 후문 (A노선)</span>
                    <span className="bus-time">5분 후</span>
                </div>
                <div className="bus-item">
                    <span>역 ↔ 학교 (B노선)</span>
                    <span className="bus-time">12분 후</span>
                </div>
                <div className="bus-item">
                    <span>기숙사 ↔ 학교 (C노선)</span>
                    <span className="bus-time status-closed">운행 종료</span>
                </div>
            </div>
        </WidgetWrapper>
    );
};
export default BusWidget;