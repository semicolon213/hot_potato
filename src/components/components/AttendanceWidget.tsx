// src/components/AttendanceWidget.tsx
import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import './AttendanceWidget.css';

const AttendanceWidget: React.FC = () => {
    return (
        <WidgetWrapper title="출석 현황" iconClass="fas fa-user-check">
            <div className="attendance-widget-content">
                <div className="attendance-stats">
                    <div className="attendance-box">
                        <div>출석</div>
                        <div className="attendance-value" style={{ color: '#27ae60' }}>42</div>
                    </div>
                    <div className="attendance-box">
                        <div>지각</div>
                        <div className="attendance-value" style={{ color: '#f39c12' }}>3</div>
                    </div>
                    <div className="attendance-box">
                        <div>결석</div>
                        <div className="attendance-value" style={{ color: '#e74c3c' }}>1</div>
                    </div>
                </div>

                <p><i className="fas fa-book"></i> 데이터베이스: 95% (출석 19/지각 1)</p>
                <p><i className="fas fa-code"></i> 알고리즘: 90% (출석 18/지각 2)</p>
                <p><i className="fas fa-globe"></i> 웹프로그래밍: 100% (출석 20)</p>
                <p className="last-p"><i className="fas fa-brain"></i> 인공지능: 85% (출석 17/결석 1)</p>
            </div>
        </WidgetWrapper>
    );
};
export default AttendanceWidget;