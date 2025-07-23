import React from 'react';

/**
 * 과제 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ name: string; due: string }[]} props.items - 과제 항목 배열 (이름, 마감일 포함)
 */
export const AssignmentListComponent = ({ items }: { items: { name: string; due: string }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <div key={index} className="assignment-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span><i className="fas fa-book" style={{ marginRight: "8px" }}></i>{item.name}</span>
                <span className={`assignment-due ${item.due === '제출 완료' ? 'completed' : ''}`}>{item.due}</span>
            </div>
        ))}
    </div>
);

/**
 * 버스 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ route: string; time: string }[]} props.items - 버스 항목 배열 (노선, 시간 포함)
 */
export const BusListComponent = ({ items }: { items: { route: string; time: string }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <div key={index} className="bus-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span><i className="fas fa-bus" style={{ marginRight: "8px" }}></i>{item.route}</span>
                <span className="bus-time">{item.time}</span>
            </div>
        ))}
    </div>
);

/**
 * 캠퍼스 맵을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {string} props.message - 맵 관련 메시지
 * @param {string} props.image - 맵 이미지 (예: SVG 문자열 또는 이미지 URL)
 */
export const CampusMapWidget = ({ message, image }: { message: string, image: string }) => {
  return (
    <div className="widget-content">
      <p>{message}</p>
      <div className="map-container">
        {image}
      </div>
    </div>
  );
};

/**
 * 기본 메시지를 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {string} props.message - 표시할 메시지
 */
export const DefaultMessage = ({ message }: { message: string }) => (
    <div className="widget-content">
        <p>{message}</p>
    </div>
);

/**
 * 이벤트 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ date: string; event: string }[]} props.items - 이벤트 항목 배열 (날짜, 이벤트 내용 포함)
 */
export const EventListComponent = ({ items }: { items: { date: string; event: string }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
                <div className="calendar-day">{item.date}</div>
                <div className="calendar-event">{item.event}</div>
            </div>
        ))}
    </div>
);

/**
 * 성적 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ subject: string; grade: string; progress: number }[]} props.items - 성적 항목 배열 (과목, 성적, 진행률 포함)
 */
export const GradeListComponent = ({ items }: { items: { subject: string; grade: string; progress: number }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <React.Fragment key={index}>
                <div className="grade-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span><i className="fas fa-book" style={{ marginRight: "8px" }}></i>{item.subject}</span>
                    <span>{item.grade}</span>
                </div>
                <div className="grade-bar" style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', marginBottom: '8px' }}>
                    <div className="grade-progress" style={{ width: `${item.progress}%`, height: '100%', backgroundColor: '#4caf50', borderRadius: '3px' }}></div>
                </div>
            </React.Fragment>
        ))}
    </div>
);

/**
 * 아이콘과 텍스트 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ icon: string; text: string }[]} props.items - 아이콘 및 텍스트 항목 배열
 */
export const IconListComponent = ({ items }: { items: { icon: string; text: string }[] }) => (
  <div className="widget-content">
    {items.map((item, index) => (
      <p key={index}>
        <i className={item.icon} style={{ marginRight: "8px" }}></i> {item.text}
      </p>
    ))}
  </div>
);

/**
 * 키-값 쌍 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ icon: string; key: string; value: string; total: string }[]} props.items - 키-값 항목 배열 (아이콘, 키, 값, 총계 포함)
 */
export const KeyValueListComponent = ({ items }: { items: { icon: string; key: string; value: string; total: string }[] }) => (
  <div className="widget-content">
    {items.map((item, index) => (
      <p key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span><i className={item.icon} style={{ marginRight: "8px" }}></i> {item.key}</span>
        <span>
            <span className="seat-available" style={{ fontWeight: "bold" }}>{item.value}</span>
            <span className="seat-total">/ {item.total}</span>
        </span>
      </p>
    ))}
  </div>
);

/**
 * 일반 텍스트 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {string[]} props.items - 텍스트 항목 배열
 */
export const ListComponent = ({ items }: { items: string[] }) => (
  <div className="widget-content">
    {items.map((item, index) => (
      <p key={index}>{item}</p>
    ))}
  </div>
);

/**
 * 교수님 연락처 위젯 컴포넌트입니다.
 * 사용자가 교수님 성함을 입력하고 이메일, 상담 예약, 전화, 쪽지 보내기 등의 옵션을 제공합니다.
 */
export const ProfessorContactWidget: React.FC = () => {
  return (
    <div className="widget-content">
      <input type="text" placeholder="교수님 성함을 입력하세요" />
      <div className="contact-option">
        <i className="fas fa-envelope"></i> 이메일 보내기
      </div>
      <div className="contact-option">
        <i className="fas fa-calendar-alt"></i> 상담 예약하기
      </div>
      <div className="contact-option">
        <i className="fas fa-phone-alt"></i> 전화 연결하기
      </div>
      <div className="contact-option">
        <i className="fas fa-comments"></i> 쪽지 보내기
      </div>
    </div>
  );
};

/**
 * 상태 목록을 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ name: string; status: string; icon: string; color: string }[]} props.items - 상태 항목 배열 (이름, 상태, 아이콘, 색상 포함)
 */
export const StatusListComponent = ({ items }: { items: { name: string; status: string; icon: string; color: string }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <p key={index}>
                <i className={item.icon} style={{ color: item.color, marginRight: '8px' }}></i>
                {item.name} ({item.status})
            </p>
        ))}
    </div>
);

/**
 * 시간표를 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ time: string; course: string }[]} props.items - 시간표 항목 배열 (시간, 강좌 포함)
 */
export const TimetableComponent = ({ items }: { items: { time: string; course: string }[] }) => (
    <div className="widget-content">
        {items.map((item, index) => (
            <div key={index} className="timetable-item" style={{ display: 'flex', marginBottom: '8px' }}>
                <div className="timetable-time" style={{ marginRight: '16px', fontWeight: 'bold' }}>{item.time}</div>
                <div>{item.course}</div>
            </div>
        ))}
    </div>
);

/**
 * 날씨 정보를 표시하는 위젯 컴포넌트입니다.
 * @param {object} props - 컴포넌트 props
 * @param {{ icon: string; temp: string; description: string; humidity: string }} props.today - 오늘 날씨 정보 (아이콘, 온도, 설명, 습도 포함)
 * @param {{ day: string; icon: string; temp: string }[]} props.forecast - 주간 예보 정보 배열 (요일, 아이콘, 온도 포함)
 */
export const WeatherWidget = ({ today, forecast }: {
  today: { icon: string; temp: string; description: string; humidity: string };
  forecast: { day: string; icon: string; temp: string }[];
}) => {
  return (
    <div className="widget-content">
      <div className="weather-today">
        <div className="weather-icon"><i className={today.icon}></i></div>
        <div className="weather-temp">{today.temp}</div>
        <div>
          <div>{today.description}</div>
          <div>습도 {today.humidity}</div>
        </div>
      </div>

      <div className="weather-forecast">
        {forecast.map((item, index) => (
          <div key={index} className="forecast-day">
            <div>{item.day}</div>
            <div><i className={item.icon}></i></div>
            <div>{item.temp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};