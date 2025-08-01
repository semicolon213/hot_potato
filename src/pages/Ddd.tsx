import React, { useState, useEffect, useRef } from "react";
import "./Ddd.css";

interface WidgetData {
  type: string;
  content: string; // This will be the HTML string for the widget's content
  title: string;
}

const Ddd: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const widgetGridRef = useRef<HTMLDivElement>(null);

  // Function to generate widget content based on type
  const generateWidgetContent = (type: string) => {
    let widgetContent = "";
    let widgetTitle = "";

    switch (type) {
      case "welcome":
        widgetTitle = '<i class="fas fa-home"></i> 환영합니다';
        widgetContent = `
          <div class="widget-content">
              <p>대학 ERP 시스템에 오신 것을 환영합니다. + 버튼을 눌러 원하는 위젯을 추가하세요.</p>
              <p>추가할 수 있는 위젯: 공지사항, 강의노트, 도서관 좌석현황 등 총 20가지</p>
              <p>각 위젯은 드래그하여 위치를 변경할 수 있습니다.</p>
          </div>
        `;
        break;
      case "notice":
        widgetTitle = '<i class="fas fa-bullhorn"></i> 공지사항';
        widgetContent = `
            <div class="widget-content">
                <p>[학사] 2023-2학기 수강신청 일정 변경 안내</p>
                <p>[장학] 국가장학금 2차 신청 안내 (9/1~9/7)</p>
                <p>[채용] 2023 하반기 취업박람회 개최 (9/15)</p>
                <p>[도서관] 도서관 연장개방 안내 (시험기간)</p>
            </div>
        `;
        break;
      case "lecture-note":
        widgetTitle = '<i class="fas fa-book-open"></i> 강의노트';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-file-pdf"></i> 데이터베이스_강의노트_5주차.pdf</p>
                <p><i class="fas fa-file-video"></i> 알고리즘_6주차_강의영상.mp4</p>
                <p><i class="fas fa-file-code"></i> 웹프로그래밍_실습자료_4주차.zip</p>
                <p><i class="fas fa-file-powerpoint"></i> 인공지능_발표자료_3주차.pptx</p>
            </div>
        `;
        break;
      case "library":
        widgetTitle = '<i class="fas fa-book-reader"></i> 도서관 좌석현황';
        widgetContent = `
            <div class="widget-content">
                <p>
                    <span><i class="fas fa-building"></i> 중앙도서관</span>
                    <span class="seat-available">42</span>
                    <span class="seat-total">/ 120석</span>
                </p>
                <p>
                    <span><i class="fas fa-desktop"></i> 전자정보실</span>
                    <span class="seat-available">15</span>
                    <span class="seat-total">/ 50석</span>
                </p>
                <p>
                    <span><i class="fas fa-user-graduate"></i> 대학원열람실</span>
                    <span class="seat-available">8</span>
                    <span class="seat-total">/ 30석</span>
                </p>
                <p>
                    <span><i class="fas fa-coffee"></i> 카페테리아</span>
                    <span class="seat-available">23</span>
                    <span class="seat-total">/ 60석</span>
                </p>
            </div>
        `;
        break;
      case "admin":
        widgetTitle = '<i class="fas fa-user-cog"></i> 시스템관리자';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-server"></i> 시스템 상태: <span style="color:#27ae60;">정상 운영 중</span></p>
                <p><i class="fas fa-users"></i> 현재 접속자: 1,245명</p>
                <p><i class="fas fa-hdd"></i> 저장공간: 65% 사용 중</p>
                <p><i class="fas fa-bell"></i> 최근 알림: 없음</p>
            </div>
        `;
        break;
      case "professor-contact":
        widgetTitle = '<i class="fas fa-chalkboard-teacher"></i> 교수한테 문의';
        widgetContent = `
            <div class="widget-content">
                <input type="text" placeholder="교수님 성함을 입력하세요">
                <div class="contact-option">
                    <i class="fas fa-envelope"></i> 이메일 보내기
                </div>
                <div class="contact-option">
                    <i class="fas fa-calendar-alt"></i> 상담 예약하기
                </div>
                <div class="contact-option">
                    <i class="fas fa-phone-alt"></i> 전화 연결하기
                </div>
                <div class="contact-option">
                    <i class="fas fa-comments"></i> 쪽지 보내기
                </div>
            </div>
        `;
        break;
      case "grades":
        widgetTitle = '<i class="fas fa-chart-bar"></i> 성적 현황';
        widgetContent = `
            <div class="widget-content">
                <div class="grade-item">
                    <span><i class="fas fa-book"></i> 데이터베이스</span>
                    <span>A+</span>
                </div>
                <div class="grade-bar">
                    <div class="grade-progress" style="width: 95%"></div>
                </div>
                
                <div class="grade-item">
                    <span><i class="fas fa-code"></i> 알고리즘</span>
                    <span>A0</span>
                </div>
                <div class="grade-bar">
                    <div class="grade-progress" style="width: 90%"></div>
                </div>
                
                <div class="grade-item">
                    <span><i class="fas fa-globe"></i> 웹프로그래밍</span>
                    <span>B+</span>
                </div>
                <div class="grade-bar">
                    <div class="grade-progress" style="width: 85%"></div>
                </div>
                
                <div class="grade-item">
                    <span><i class="fas fa-brain"></i> 인공지능</span>
                    <span>B0</span>
                </div>
                <div class="grade-bar">
                    <div class="grade-progress" style="width: 80%"></div>
                </div>
            </div>
        `;
        break;
      case "calendar":
        widgetTitle = '<i class="fas fa-calendar-alt"></i> 학사 일정';
        widgetContent = `
            <div class="widget-content">
                <div class="calendar-day">9월 1일 (금)</div>
                <div class="calendar-event">장학금 신청 마감일</div>
                
                <div class="calendar-day">9월 5일 (화)</div>
                <div class="calendar-event">중간고사 기간 시작</div>
                
                <div class="calendar-day">9월 15일 (금)</div>
                <div class="calendar-event">취업박람회</div>
                
                <div class="calendar-day">9월 20일 (수)</div>
                <div class="calendar-event">강의 평가 시작</div>
            </div>
        `;
        break;
      case "attendance":
        widgetTitle = '<i class="fas fa-user-check"></i> 출석 현황';
        widgetContent = `
            <div class="widget-content">
                <div class="attendance-stats">
                    <div class="attendance-box">
                        <div>출석</div>
                        <div class="attendance-value" style="color:#27ae60;">42</div>
                    </div>
                    <div class="attendance-box">
                        <div>지각</div>
                        <div class="attendance-value" style="color:#f39c12;">3</div>
                    </div>
                    <div class="attendance-box">
                        <div>결석</div>
                        <div class="attendance-value" style="color:#e74c3c;">1</div>
                    </div>
                </div>
                
                <p><i class="fas fa-book"></i> 데이터베이스: 95% (출석 19/지각 1)</p>
                <p><i class="fas fa-code"></i> 알고리즘: 90% (출석 18/지각 2)</p>
                <p><i class="fas fa-globe"></i> 웹프로그래밍: 100% (출석 20)</p>
                <p><i class="fas fa-brain"></i> 인공지능: 85% (출석 17/결석 1)</p>
            </div>
        `;
        break;
      case "assignments":
        widgetTitle = '<i class="fas fa-tasks"></i> 과제 현황';
        widgetContent = `
            <div class="widget-content">
                <div class="assignment-item">
                    <span><i class="fas fa-book"></i> 데이터베이스 프로젝트</span>
                    <span class="assignment-due">D-3</span>
                </div>
                <div class="assignment-item">
                    <span><i class="fas fa-code"></i> 알고리즘 과제 #3</span>
                    <span class="assignment-due">D-5</span>
                </div>
                <div class="assignment-item">
                    <span><i class="fas fa-globe"></i> 웹프로그래밍 팀프로젝트</span>
                    <span class="assignment-due">D-7</span>
                </div>
                <div class="assignment-item">
                    <span><i class="fas fa-brain"></i> 인공지능 논문 리뷰</span>
                    <span class="assignment-due">제출 완료</span>
                </div>
            </div>
        `;
        break;
      case "timetable":
        widgetTitle = '<i class="fas fa-calendar-day"></i> 시간표';
        widgetContent = `
            <div class="widget-content">
                <div class="timetable-item">
                    <div class="timetable-time">09:00 - 10:30</div>
                    <div>데이터베이스 (정보관 302)</div>
                </div>
                <div class="timetable-item">
                    <div class="timetable-time">11:00 - 12:30</div>
                    <div>알고리즘 (공학관 105)</div>
                </div>
                <div class="timetable-item">
                    <div class="timetable-time">13:30 - 15:00</div>
                    <div>웹프로그래밍 (컴퓨터관 203)</div>
                </div>
                <div class="timetable-item">
                    <div class="timetable-time">15:30 - 17:00</div>
                    <div>인공지능 (AI센터 401)</div>
                </div>
            </div>
        `;
        break;
      case "cafeteria":
        widgetTitle = '<i class="fas fa-utensils"></i> 학식 메뉴';
        widgetContent = `
            <div class="widget-content">
                <div class="menu-item">
                    <span>백미밥</span>
                    <span class="menu-price">3,500원</span>
                </div>
                <div class="menu-item">
                    <span>된장찌개</span>
                    <span class="menu-price"></span>
                </div>
                <div class="menu-item">
                    <span>제육볶음</span>
                    <span class="menu-price"></span>
                </div>
                <div class="menu-item">
                    <span>김치전</span>
                    <span class="menu-price">+1,000원</span>
                </div>
            </div>
        `;
        break;
      case "weather":
        widgetTitle = '<i class="fas fa-cloud-sun"></i> 캠퍼스 날씨';
        widgetContent = `
            <div class="widget-content">
                <div class="weather-today">
                    <div class="weather-icon"><i class="fas fa-sun"></i></div>
                    <div class="weather-temp">24°C</div>
                    <div>
                        <div>맑음</div>
                        <div>습도 45%</div>
                    </div>
                </div>
                
                <div class="weather-forecast">
                    <div class="forecast-day">
                        <div>내일</div>
                        <div><i class="fas fa-cloud-sun"></i></div>
                        <div>23°C</div>
                    </div>
                    <div class="forecast-day">
                        <div>모레</div>
                        <div><i class="fas fa-cloud-rain"></i></div>
                        <div>20°C</div>
                    </div>
                    <div class="forecast-day">
                        <div>금</div>
                        <div><i class="fas fa-cloud"></i></div>
                        <div>22°C</div>
                    </div>
                    <div class="forecast-day">
                        <div>토</div>
                        <div><i class="fas fa-sun"></i></div>
                        <div>25°C</div>
                    </div>
                </div>
            </div>
        `;
        break;
      case "bus":
        widgetTitle = '<i class="fas fa-bus"></i> 셔틀버스';
        widgetContent = `
            <div class="widget-content">
                <div class="bus-item">
                    <span><i class="fas fa-bus"></i> 본관 → 기숙사</span>
                    <span class="bus-time">5분 후</span>
                </div>
                <div class="bus-item">
                    <span><i class="fas fa-bus"></i> 기숙사 → 본관</span>
                    <span class="bus-time">12분 후</span>
                </div>
                <div class="bus-item">
                    <span><i class="fas fa-bus"></i> 본관 → 역앞</span>
                    <span class="bus-time">18분 후</span>
                </div>
                <div class="bus-item">
                    <span><i class="fas fa-bus"></i> 역앞 → 본관</span>
                    <span class="bus-time">25분 후</span>
                </div>
            </div>
        `;
        break;
      case "campus-map":
        widgetTitle = '<i class="fas fa-map-marked-alt"></i> 캠퍼스 맵';
        widgetContent = `
            <div class="widget-content">
                <p>캠퍼스 주요 건물 위치를 확인하세요</p>
                <div class="map-container">
                    [캠퍼스 지도 이미지]
                </div>
            </div>
        `;
        break;
      case "scholarship":
        widgetTitle = '<i class="fas fa-award"></i> 장학금 정보';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-check-circle" style="color:#27ae60;"></i> 국가장학금 (신청 완료)</p>
                <p><i class="fas fa-exclamation-circle" style="color:#f39c12;"></i> 성적우수장학금 (신청 가능)</p>
                <p><i class="fas fa-exclamation-circle" style="color:#f39c12;"></i> 근로장학금 (신청 가능)</p>
                <p><i class="fas fa-times-circle" style="color:#e74c3c;"></i> 교내장학금 (마감)</p>
            </div>
        `;
        break;
      case "tuition":
        widgetTitle = '<i class="fas fa-money-bill-wave"></i> 등록금 정보';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-won-sign"></i> 등록금 총액: 3,850,000원</p>
                <p><i class="fas fa-check-circle" style="color:#27ae60;"></i> 납부 완료: 3,500,000원</p>
                <p><i class="fas fa-exclamation-circle" style="color:#f39c12;"></i> 잔여 금액: 350,000원</p>
                <p><i class="fas fa-calendar-alt"></i> 마감일: 9월 10일</p>
            </div>
        `;
        break;
      case "graduation":
        widgetTitle = '<i class="fas fa-graduation-cap"></i> 졸업 요건';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-check" style="color:#27ae60;"></i> 전공 필수 (30/30학점)</p>
                <p><i class="fas fa-check" style="color:#27ae60;"></i> 교양 필수 (15/15학점)</p>
                <p><i class="fas fa-spinner" style="color:#f39c12;"></i> 전공 선택 (42/45학점)</p>
                <p><i class="fas fa-spinner" style="color:#f39c12;"></i> 총 이수 학점 (120/130학점)</p>
            </div>
        `;
        break;
      case "career":
        widgetTitle = '<i class="fas fa-briefcase"></i> 취업 정보';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-building"></i> A기업 채용설명회 (9/5 14:00)</p>
                <p><i class="fas fa-laptop"></i> B기업 온라인 채용 (9/10 ~ 9/20)</p>
                <p><i class="fas fa-users"></i> 취업특강: 면접技巧 (9/15 16:00)</p>
                <p><i class="fas fa-file-alt"></i> 이력서 첨삭 신청 (9/1 ~ 9/30)</p>
            </div>
        `;
        break;
      case "health":
        widgetTitle = '<i class="fas fa-heartbeat"></i> 건강 관리';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-calendar-check"></i> 건강검진 예약 (10/1 ~ 10/15)</p>
                <p><i class="fas fa-user-md"></i> 정신건강 상담 신청</p>
                <p><i class="fas fa-procedures"></i> 보건실 이용 시간: 09:00 ~ 17:00</p>
                <p><i class="fas fa-phone-alt"></i> 응급상담: 1588-9191</p>
            </div>
        `;
        break;
      case "club":
        widgetTitle = '<i class="fas fa-users"></i> 동아리 활동';
        widgetContent = `
            <div class="widget-content">
                <p><i class="fas fa-music"></i> 밴드동아리 정기공연 (9/8 18:00)</p>
                <p><i class="fas fa-robot"></i> AI동아리 OT (9/5 19:00)</p>
                <p><i class="fas fa-futbol"></i> 축구동아리 경기 (9/10 15:00)</p>
                <p><i class="fas fa-paint-brush"></i> 미술동아리 전시회 (9/20 ~ 9/25)</p>
            </div>
        `;
        break;
      default:
        widgetTitle = '<i class="fas fa-plus"></i> 새 위젯';
        widgetContent = '<div class="widget-content"><p>새 위젯 내용</p></div>';
    }
    return { title: widgetTitle, content: widgetContent };
  };

  useEffect(() => {
    // Load widgets from local storage on mount
    const savedDashboard = localStorage.getItem("dashboard");
    if (savedDashboard) {
      const dashboardState: WidgetData[] = JSON.parse(savedDashboard);
      setWidgets(dashboardState);
    } else {
      // Add default welcome widget if no saved state
      const welcomeWidget = generateWidgetContent("welcome");
      setWidgets([{ type: "welcome", ...welcomeWidget }]);
    }
  }, []);

  useEffect(() => {
    // Save widgets to local storage whenever they change
    localStorage.setItem("dashboard", JSON.stringify(widgets));
  }, [widgets]);

  const handleAddWidget = (type: string) => {
    const existingTypes = widgets.map((w) => w.type);
    if (existingTypes.includes(type) && type !== "welcome") {
      alert("이미 추가된 위젯입니다.");
      return;
    }
    const newWidgetData = generateWidgetContent(type);
    setWidgets((prevWidgets) => [...prevWidgets, { type, ...newWidgetData }]);
    setIsModalOpen(false);
  };

  const handleRemoveWidget = (typeToRemove: string) => {
    if (typeToRemove === "welcome") {
      alert("기본 위젯은 삭제할 수 없습니다.");
      return;
    }
    setWidgets((prevWidgets) =>
      prevWidgets.filter((widget) => widget.type !== typeToRemove),
    );
  };

  // Drag and drop logic (simplified for now, might need a library for full functionality)
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[dragItem.current];
    newWidgets.splice(dragItem.current, 1);
    newWidgets.splice(dragOverItem.current, 0, draggedWidget);

    dragItem.current = null;
    dragOverItem.current = null;
    setWidgets(newWidgets);
  };

  const widgetOptions = [
    {
      type: "notice",
      icon: "fas fa-bullhorn",
      title: "공지사항",
      description: "학교 및 학과 공지사항 확인",
    },
    {
      type: "lecture-note",
      icon: "fas fa-book-open",
      title: "강의노트",
      description: "강의 자료 및 동영상 확인",
    },
    {
      type: "library",
      icon: "fas fa-book-reader",
      title: "도서관 좌석현황",
      description: "실시간 도서관 이용 정보",
    },
    {
      type: "admin",
      icon: "fas fa-user-cog",
      title: "시스템관리자",
      description: "시스템 관리 및 설정",
    },
    {
      type: "professor-contact",
      icon: "fas fa-chalkboard-teacher",
      title: "교수한테 문의",
      description: "담당 교수님께 문의하기",
    },
    {
      type: "grades",
      icon: "fas fa-chart-bar",
      title: "성적 현황",
      description: "학기별 성적 확인",
    },
    {
      type: "calendar",
      icon: "fas fa-calendar-alt",
      title: "학사 일정",
      description: "다가오는 일정 확인",
    },
    {
      type: "attendance",
      icon: "fas fa-user-check",
      title: "출석 현황",
      description: "강의별 출석률 확인",
    },
    {
      type: "assignments",
      icon: "fas fa-tasks",
      title: "과제 현황",
      description: "제출해야 할 과제 확인",
    },
    {
      type: "timetable",
      icon: "fas fa-calendar-day",
      title: "시간표",
      description: "오늘의 수업 일정",
    },
    {
      type: "cafeteria",
      icon: "fas fa-utensils",
      title: "학식 메뉴",
      description: "오늘의 학식 메뉴 확인",
    },
    {
      type: "weather",
      icon: "fas fa-cloud-sun",
      title: "캠퍼스 날씨",
      description: "오늘의 날씨 및 예보",
    },
    {
      type: "bus",
      icon: "fas fa-bus",
      title: "셔틀버스",
      description: "다음 버스 도착 시간",
    },
    {
      type: "campus-map",
      icon: "fas fa-map-marked-alt",
      title: "캠퍼스 맵",
      description: "캠퍼스 건물 위치 확인",
    },
    {
      type: "scholarship",
      icon: "fas fa-award",
      title: "장학금 정보",
      description: "신청 가능한 장학금",
    },
    {
      type: "tuition",
      icon: "fas fa-money-bill-wave",
      title: "등록금 정보",
      description: "납부 내역 및 잔액",
    },
    {
      type: "graduation",
      icon: "fas fa-graduation-cap",
      title: "졸업 요건",
      description: "졸업 요건 충족 현황",
    },
    {
      type: "career",
      icon: "fas fa-briefcase",
      title: "취업 정보",
      description: "채용 공고 및 설명회",
    },
    {
      type: "health",
      icon: "fas fa-heartbeat",
      title: "건강 관리",
      description: "건강검진 및 상담",
    },
    {
      type: "club",
      icon: "fas fa-users",
      title: "동아리 활동",
      description: "동아리 일정 및 공지",
    },
  ];

  return (
    <div className="main-content ml-[10px]">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i>
          위젯 추가
        </button>
      </div>

      <div className="widget-grid" ref={widgetGridRef}>
        {widgets.map((widget, index) => (
          <div
            key={widget.type} // Using type as key, assuming unique widgets. If multiple of same type are allowed, use a unique ID.
            className="widget"
            data-widget-type={widget.type}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()} // Necessary to allow dropping
          >
            <div className="widget-header">
              <h3 dangerouslySetInnerHTML={{ __html: widget.title }}></h3>
              <div className="widget-actions">
                <button
                  className="widget-btn"
                  onClick={() => handleRemoveWidget(widget.type)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: widget.content }}></div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>위젯 추가 (20가지)</h2>
              <button
                className="close-modal"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="widget-options">
              {widgetOptions.map((option) => (
                <div
                  key={option.type}
                  className={`widget-option ${widgets.some((w) => w.type === option.type) && option.type !== "welcome" ? "disabled" : ""}`}
                  onClick={() => handleAddWidget(option.type)}
                >
                  <i className={option.icon}></i>
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ddd;
