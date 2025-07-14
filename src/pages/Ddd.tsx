// src/pages/Ddd.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Ddd.css'; // Ddd 컴포넌트의 공통 CSS (CSS 모듈 아님)

// --- 위젯 컴포넌트 임포트 ---
// src/components 폴더 내의 각 위젯 컴포넌트들을 임포트합니다.
// 예시로 WelcomeWidget만 포함했지만, 실제로는 20가지 모두 임포트합니다.
import WelcomeWidget from '../components/WelcomeWidget/WelcomeWidget';
import NoticeWidget from '../components/NoticeWidget/NoticeWidget';
import LectureNoteWidget from '../components/LectureNoteWidget/LectureNoteWidget';
import LibraryWidget from '../components/LibraryWidget/LibraryWidget';
import AdminWidget from '../components/AdminWidget/AdminWidget';
import ProfessorContactWidget from '../components/ProfessorContactWidget/ProfessorContactWidget';
import GradesWidget from '../components/GradesWidget/GradesWidget';
import CalendarWidget from '../components/CalendarWidget/CalendarWidget';
import AttendanceWidget from '../components/AttendanceWidget/AttendanceWidget';
import AssignmentsWidget from '../components/AssignmentsWidget/AssignmentsWidget';
import TimetableWidget from '../components/TimetableWidget/TimetableWidget';
import CafeteriaWidget from '../components/CafeteriaWidget/CafeteriaWidget';
import WeatherWidget from '../components/WeatherWidget/WeatherWidget';
import BusWidget from '../components/BusWidget/BusWidget';
import CampusMapWidget from '../components/CampusMapWidget/CampusMapWidget';
import ScholarshipWidget from '../components/ScholarshipWidget/ScholarshipWidget';
import TuitionWidget from '../components/TuitionWidget/TuitionWidget';
import GraduationWidget from '../components/GraduationWidget/GraduationWidget';
import CareerWidget from '../components/CareerWidget/CareerWidget';
import HealthWidget from '../components/HealthWidget/HealthWidget';
import ClubWidget from '../components/ClubWidget/ClubWidget';

// 위젯 타입과 컴포넌트를 매핑하는 객체
const WIDGET_COMPONENTS: { [key: string]: React.FC<any> } = {
  welcome: WelcomeWidget,
  notice: NoticeWidget,
  'lecture-note': LectureNoteWidget,
  library: LibraryWidget,
  admin: AdminWidget,
  'professor-contact': ProfessorContactWidget,
  grades: GradesWidget,
  calendar: CalendarWidget,
  attendance: AttendanceWidget,
  assignments: AssignmentsWidget,
  timetable: TimetableWidget,
  cafeteria: CafeteriaWidget,
  weather: WeatherWidget,
  bus: BusWidget,
  'campus-map': CampusMapWidget,
  scholarship: ScholarshipWidget,
  tuition: TuitionWidget,
  graduation: GraduationWidget,
  career: CareerWidget,
  health: HealthWidget,
  club: ClubWidget,
};

interface Widget {
  id: string; // 각 위젯 인스턴스를 위한 고유 ID
  type: string;
  title: string;
  icon: string;
  order: number; // 드래그 앤 드롭을 위한 순서 (현재는 인덱스로 사용)
}

// 모든 위젯 옵션 정의 (이 부분은 이전과 동일합니다.)
const widgetOptions = [
  { type: 'welcome', icon: 'fas fa-door-open', title: '환영합니다', description: '대학 ERP 시스템에 오신 것을 환영합니다.' },
  { type: 'notice', icon: 'fas fa-bullhorn', title: '공지사항', description: '학교 및 학과 공지사항 확인' },
  { type: 'lecture-note', icon: 'fas fa-book-open', title: '강의노트', description: '강의 자료 및 동영상 확인' },
  { type: 'library', icon: 'fas fa-book-reader', title: '도서관 좌석현황', description: '실시간 도서관 이용 정보' },
  { type: 'admin', icon: 'fas fa-cogs', title: '시스템관리자', description: '시스템 관리 및 설정' },
  { type: 'professor-contact', icon: 'fas fa-chalkboard-teacher', title: '교수한테 문의', description: '담당 교수님께 문의하기' },
  { type: 'grades', icon: 'fas fa-award', title: '성적 현황', description: '학기별 성적 확인' },
  { type: 'calendar', icon: 'fas fa-calendar-alt', title: '학사 일정', description: '다가오는 일정 확인' },
  { type: 'attendance', icon: 'fas fa-user-check', title: '출석 현황', description: '강의별 출석률 확인' },
  { type: 'assignments', icon: 'fas fa-tasks', title: '과제 현황', description: '제출해야 할 과제 확인' },
  { type: 'timetable', icon: 'fas fa-clock', title: '시간표', description: '오늘의 수업 일정' },
  { type: 'cafeteria', icon: 'fas fa-utensils', title: '학식 메뉴', description: '오늘의 학식 메뉴 확인' },
  { type: 'weather', icon: 'fas fa-cloud-sun', title: '캠퍼스 날씨', description: '오늘의 날씨 및 예보' },
  { type: 'bus', icon: 'fas fa-bus', title: '셔틀버스', description: '다음 버스 도착 시간' },
  { type: 'campus-map', icon: 'fas fa-map-marked-alt', title: '캠퍼스 맵', description: '캠퍼스 건물 위치 확인' },
  { type: 'scholarship', icon: 'fas fa-money-check-alt', title: '장학금 정보', description: '신청 가능한 장학금' },
  { type: 'tuition', icon: 'fas fa-wallet', title: '등록금 정보', description: '납부 내역 및 잔액' },
  { type: 'graduation', icon: 'fas fa-user-graduate', title: '졸업 요건', description: '졸업 요건 충족 현황' },
  { type: 'career', icon: 'fas fa-briefcase', title: '취업 정보', description: '채용 공고 및 설명회' },
  { type: 'health', icon: 'fas fa-heartbeat', title: '건강 관리', description: '건강검진 및 상담' },
  { type: 'club', icon: 'fas fa-users', title: '동아리 활동', description: '동아리 일정 및 공지' },
];


const Ddd: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // 로컬 스토리지에서 위젯 불러오기
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // 초기 위젯 설정 (환영합니다 위젯만 기본)
      setWidgets([{ id: 'welcome-1', type: 'welcome', title: '환영합니다', icon: 'fas fa-door-open', order: 0 }]);
    }
  }, []);

  // 위젯 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleAddWidget = (widgetType: string) => {
    const option = widgetOptions.find(opt => opt.type === widgetType);
    if (option) {
      // 'welcome' 위젯은 여러 개 추가되지 않도록 방지
      // 다른 위젯들도 중복 추가 방지 (원하는 정책에 따라 수정 가능)
      if (option.type !== 'welcome' && widgets.some(w => w.type === widgetType)) {
        alert('이미 추가된 위젯입니다.'); // 사용자에게 알림
        return;
      }
      
      const newWidget: Widget = {
        id: `${widgetType}-${Date.now()}`, // 고유 ID 생성 (타입-타임스탬프)
        type: option.type,
        title: option.title,
        icon: option.icon,
        order: widgets.length, // 현재는 배열의 마지막에 추가
      };
      setWidgets(prev => [...prev, newWidget]);
      setIsModalOpen(false);
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  // --- 드래그 앤 드롭 로직 (클래스 이름은 Ddd.css에 정의된 것을 따름) ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.currentTarget.classList.add('dragging'); // Ddd.css 클래스 사용
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    e.currentTarget.classList.add('dragOver'); // Ddd.css 클래스 사용
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragOver');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragOver');
    e.currentTarget.classList.remove('dragging'); // 드롭 시 dragging 클래스도 제거

    if (dragItem.current === null || dragOverItem.current === null) return;

    const widgetsCopy = [...widgets];
    const draggedItemContent = widgetsCopy[dragItem.current];

    if (dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
    }

    widgetsCopy.splice(dragItem.current, 1);
    widgetsCopy.splice(dragOverItem.current, 0, draggedItemContent);

    setWidgets(widgetsCopy);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.dragOver').forEach(el => el.classList.remove('dragOver'));
    dragItem.current = null;
    dragOverItem.current = null;
  };
  // --- 드래그 앤 드롭 로직 끝 ---


  // 위젯 타입에 따라 해당하는 컴포넌트를 렌더링
  const renderWidgetContent = (widget: Widget) => {
    const WidgetComponent = WIDGET_COMPONENTS[widget.type];
    if (WidgetComponent) {
      // 각 위젯에 필요한 동적 데이터를 여기에 props로 전달할 수 있습니다.
      return <WidgetComponent />;
    }
    return <p>해당 위젯의 컴포넌트를 찾을 수 없습니다: {widget.type}</p>;
  };

  return (
    <div className="main-content"> {/* Ddd.css의 클래스 이름 사용 */}
      <div className="dashboard-header">
        <h1>나의 대시보드</h1>
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> 위젯 추가
        </button>
      </div>

      <div className="widget-grid">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className="widget"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            data-widget-type={widget.type} // 특정 위젯에 대한 CSS를 위해 data 속성 유지
          >
            <div className="widget-header">
              <h3>
                <i className={widget.icon}></i> {widget.title}
              </h3>
              <div className="widget-actions">
                {widget.type !== 'welcome' && (
                  <button className="widget-btn" onClick={() => handleRemoveWidget(widget.id)}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="widget-content">
              {renderWidgetContent(widget)}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>위젯 선택</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="widget-options">
              {widgetOptions.map(option => {
                const isDisabled = (option.type !== 'welcome' && widgets.some(w => w.type === option.type));
                return (
                  <div
                    key={option.type}
                    className={`widget-option ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && handleAddWidget(option.type)}
                  >
                    <i className={option.icon}></i>
                    <h3>{option.title}</h3>
                    <p>{option.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ddd;