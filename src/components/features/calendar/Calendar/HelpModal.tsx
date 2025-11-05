import React from 'react';
import { IoMdClose } from 'react-icons/io';
import './HelpModal.css';
import useCalendarContext from '../../../../hooks/features/calendar/useCalendarContext.ts';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const { user } = useCalendarContext();

    return (
        <div className="help-modal-overlay">
            <div className="help-modal-content">
                <IoMdClose className="close-icon" onClick={onClose} />
                <h2>캘린더 사용법</h2><br/><br/>
                <ul>
                    <li><strong>일정 추가 :</strong> 날짜를 클릭하여 새 일정을 추가할 수 있습니다.</li>
                    <li><strong>일정 검색 :</strong> 상단의 돋보기 아이콘을 클릭하여 일정을 검색할 수 있습니다.</li>
                    {user && user.userType === 'admin' && (
                        <li><strong>관리자 :</strong> 상단의 톱니바퀴 아이콘을 클릭하여 공유 일정을 추가할 수 있습니다.</li>
                    )}
                    <li><strong>보기 모드 :</strong> 상단의 일정, 달력, 월간, 주간 탭을 이용하여 여러 화면으로 볼
                        수 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;있습니다.
                    <li><strong>태그 :</strong> 좌측 사이드바의 필터를 사용하여 특정 종류의 일정을 볼 수 있습니다.</li>

                    </li>


                </ul>
            </div>
        </div>
    );
};

export default HelpModal;
