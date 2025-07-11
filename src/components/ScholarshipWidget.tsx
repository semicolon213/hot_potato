// src/components/ScholarshipWidget.tsx
import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import './ScholarshipWidget.css';

const ScholarshipWidget: React.FC = () => {
    return (
        <WidgetWrapper title="장학금 정보" iconClass="fas fa-award">
            <div className="scholarship-widget-content">
                <p><i className="fas fa-check-circle"></i> 국가장학금 <span className="scholarship-status completed">(신청 완료)</span></p>
                <p><i className="fas fa-exclamation-circle"></i> 성적우수장학금 <span className="scholarship-status available">(신청 가능)</span></p>
                <p><i className="fas fa-exclamation-circle"></i> 근로장학금 <span className="scholarship-status available">(신청 가능)</span></p>
                <p className="last-p"><i className="fas fa-times-circle"></i> 교내장학금 <span className="scholarship-status closed">(마감)</span></p>
            </div>
        </WidgetWrapper>
    );
};
export default ScholarshipWidget;