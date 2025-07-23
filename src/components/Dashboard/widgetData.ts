/**
 * @file 위젯 데이터를 정의하는 파일입니다.
 * 각 위젯의 타입, 제목, 렌더링에 사용될 컴포넌트 이름, 그리고 해당 컴포넌트에 전달될 props를 포함합니다.
 * 이 데이터는 `generateWidgetContent` 함수에 의해 사용되어 위젯 콘텐츠를 동적으로 생성합니다.
 */

/**
 * 대시보드에 추가될 수 있는 다양한 위젯들의 정의를 포함하는 객체입니다.
 * 각 키는 위젯의 고유한 타입(ID)을 나타내며, 값은 위젯의 메타데이터와 초기 데이터를 포함합니다.
 * @property {object} welcome - 환영 메시지 위젯
 * @property {string} welcome.title - 위젯의 제목 (HTML 포함 가능)
 * @property {string} welcome.component - 위젯을 렌더링할 React 컴포넌트의 이름 (AllWidgetTemplates.tsx에 정의된 컴포넌트 이름과 일치해야 함)
 * @property {object} welcome.props - 위젯 컴포넌트에 전달될 props 객체
 *
 * @property {object} notice - 공지사항 위젯
 * @property {string} notice.title - 위젯의 제목
 * @property {string} notice.component - 위젯을 렌더링할 React 컴포넌트의 이름
 * @property {object} notice.props - 위젯 컴포넌트에 전달될 props 객체
 *
 * (이하 다른 위젯들도 동일한 구조를 가집니다.)
 *
 * @property {object} default - 기본 위젯 (유효하지 않은 위젯 타입 요청 시 사용)
 * @property {string} default.title - 기본 위젯의 제목
 * @property {string} default.component - 기본 위젯을 렌더링할 React 컴포넌트의 이름
 * @property {object} default.props - 기본 위젯 컴포넌트에 전달될 props 객체
 */
export const widgetData = {
    
    notice: {
        title: '<i class="fas fa-bullhorn"></i> 공지사항',
        component: 'ListComponent',
        props: {
            items: [
                '[학사] 2023-2학기 수강신청 일정 변경 안내',
                '[장학] 국가장학금 2차 신청 안내 (9/1~9/7)',
                '[채용] 2023 하반기 취업박람회 개최 (9/15)',
                '[도서관] 도서관 연장개방 안내 (시험기간)',
            ]
        }
    },
    'lecture-note': {
        title: '<i class="fas fa-book-open"></i> 강의노트',
        component: 'IconListComponent',
        props: {
            items: [
                { icon: 'fas fa-file-pdf', text: '데이터베이스_강의노트_5주차.pdf' },
                { icon: 'fas fa-file-video', text: '알고리즘_6주차_강의영상.mp4' },
                { icon: 'fas fa-file-code', text: '웹프로그래밍_실습자료_4주차.zip' },
                { icon: 'fas fa-file-powerpoint', text: '인공지능_발표자료_3주차.pptx' },
            ]
        }
    },
    library: {
        title: '<i class="fas fa-book-reader"></i> 도서관 좌석현황',
        component: 'KeyValueListComponent',
        props: {
            items: [
                { icon: 'fas fa-building', key: '중앙도서관', value: '42', total: '120석' },
                { icon: 'fas fa-desktop', key: '전자정보실', value: '15', total: '50석' },
                { icon: 'fas fa-user-graduate', key: '대학원열람실', value: '8', total: '30석' },
                { icon: 'fas fa-coffee', key: '카페테리아', value: '23', total: '60석' },
            ]
        }
    },
    grades: {
        title: '<i class="fas fa-chart-bar"></i> 성적 현황',
        component: 'GradeListComponent',
        props: {
            items: [
                { subject: '데이터베이스', grade: 'A+', progress: 95 },
                { subject: '알고리즘', grade: 'A0', progress: 90 },
                { subject: '웹프로그래밍', grade: 'B+', progress: 85 },
                { subject: '인공지능', grade: 'B0', progress: 80 },
            ]
        }
    },
    assignments: {
        title: '<i class="fas fa-tasks"></i> 과제 현황',
        component: 'AssignmentListComponent',
        props: {
            items: [
                { name: '데이터베이스 프로젝트', due: 'D-3' },
                { name: '알고리즘 과제 #3', due: 'D-5' },
                { name: '웹프로그래밍 팀프로젝트', due: 'D-7' },
                { name: '인공지능 논문 리뷰', due: '제출 완료' },
            ]
        }
    },
    calendar: {
        title: '<i class="fas fa-calendar-alt"></i> 학사 일정',
        component: 'EventListComponent',
        props: {
            items: [
                { date: '9월 1일 (금)', event: '장학금 신청 마감일' },
                { date: '9월 5일 (화)', event: '중간고사 기간 시작' },
                { date: '9월 15일 (금)', event: '취업박람회' },
                { date: '9월 20일 (수)', event: '강의 평가 시작' },
            ]
        }
    },
    timetable: {
        title: '<i class="fas fa-calendar-day"></i> 시간표',
        component: 'TimetableComponent',
        props: {
            items: [
                { time: '09:00 - 10:30', course: '데이터베이스 (정보관 302)' },
                { time: '11:00 - 12:30', course: '알고리즘 (공학관 105)' },
                { time: '13:30 - 15:00', course: '웹프로그래밍 (컴퓨터관 203)' },
                { time: '15:30 - 17:00', course: '인공지능 (AI센터 401)' },
            ]
        }
    },
    bus: {
        title: '<i class="fas fa-bus"></i> 셔틀버스',
        component: 'BusListComponent',
        props: {
            items: [
                { route: '본관 → 기숙사', time: '5분 후' },
                { route: '기숙사 → 본관', time: '12분 후' },
                { route: '본관 → 역앞', time: '18분 후' },
                { route: '역앞 → 본관', time: '25분 후' },
            ]
        }
    },
    scholarship: {
        title: '<i class="fas fa-award"></i> 장학금 정보',
        component: 'StatusListComponent',
        props: {
            items: [
                { name: '국가장학금', status: '신청 완료', icon: 'fas fa-check-circle', color: '#27ae60' },
                { name: '성적우수장학금', status: '신청 가능', icon: 'fas fa-exclamation-circle', color: '#f39c12' },
                { name: '근로장학금', status: '신청 가능', icon: 'fas fa-exclamation-circle', color: '#f39c12' },
                { name: '교내장학금', status: '마감', icon: 'fas fa-times-circle', color: '#e74c3c' },
            ]
        }
    },
    admin: {
        title: '<i class="fas fa-user-cog"></i> 시스템관리자',
        component: 'StatusListComponent',
        props: {
            items: [
                { name: '시스템 상태', status: '정상 운영 중', icon: 'fas fa-server', color: '#27ae60' },
                { name: '현재 접속자', status: '1,245명', icon: 'fas fa-users', color: '' },
                { name: '저장공간', status: '65% 사용 중', icon: 'fas fa-hdd', color: '' },
                { name: '최근 알림', status: '없음', icon: 'fas fa-bell', color: '' },
            ]
        }
    },
    'professor-contact': {
        title: '<i class="fas fa-chalkboard-teacher"></i> 교수한테 문의',
        component: 'ProfessorContactWidget',
        props: {}
    },
    tuition: {
        title: '<i class="fas fa-money-bill-wave"></i> 등록금 정보',
        component: 'StatusListComponent',
        props: {
            items: [
                { name: '등록금 총액', status: '3,850,000원', icon: 'fas fa-won-sign', color: '' },
                { name: '납부 완료', status: '3,500,000원', icon: 'fas fa-check-circle', color: '#27ae60' },
                { name: '잔여 금액', status: '350,000원', icon: 'fas fa-exclamation-circle', color: '#f39c12' },
                { name: '마감일', status: '9월 10일', icon: 'fas fa-calendar-alt', color: '' },
            ]
        }
    },
    career: {
        title: '<i class="fas fa-briefcase"></i> 취업 정보',
        component: 'IconListComponent',
        props: {
            items: [
                { icon: 'fas fa-building', text: 'A기업 채용설명회 (9/5 14:00)' },
                { icon: 'fas fa-laptop', text: 'B기업 온라인 채용 (9/10 ~ 9/20)' },
                { icon: 'fas fa-users', text: '취업특강: 면접技巧 (9/15 16:00)' },
                { icon: 'fas fa-file-alt', text: '이력서 첨삭 신청 (9/1 ~ 9/30)' },
            ]
        }
    },
    health: {
        title: '<i class="fas fa-heartbeat"></i> 건강 관리',
        component: 'IconListComponent',
        props: {
            items: [
                { icon: 'fas fa-calendar-check', text: '건강검진 예약 (10/1 ~ 10/15)' },
                { icon: 'fas fa-user-md', text: '정신건강 상담 신청' },
                { icon: 'fas fa-procedures', text: '보건실 이용 시간: 09:00 ~ 17:00' },
                { icon: 'fas fa-phone-alt', text: '응급상담: 1588-9191' },
            ]
        }
    },
    'campus-map': {
        title: '<i class="fas fa-map-marked-alt"></i> 캠퍼스 맵',
        component: 'CampusMapWidget',
        props: {
            message: '캠퍼스 주요 건물 위치를 확인하세요',
            image: '[캠퍼스 지도 이미지]'
        }
    },
    attendance: {
        title: '<i class="fas fa-user-check"></i> 출석 현황',
        component: 'StatusListComponent',
        props: {
            items: [
                { name: '출석', status: '42', icon: '', color: '#27ae60' },
                { name: '지각', status: '3', icon: '', color: '#f39c12' },
                { name: '결석', status: '1', icon: '', color: '#e74c3c' },
            ]
        }
    },
    cafeteria: {
        title: '<i class="fas fa-utensils"></i> 학식 메뉴',
        component: 'ListComponent',
        props: {
            items: [
                '백미밥',
                '된장찌개',
                '제육볶음',
                '김치전',
            ]
        }
    },
    weather: {
        title: '<i class="fas fa-cloud-sun"></i> 캠퍼스 날씨',
        component: 'WeatherWidget',
        props: {
            today: {
                icon: 'fas fa-sun',
                temp: '24°C',
                description: '맑음',
                humidity: '45%'
            },
            forecast: [
                { day: '내일', icon: 'fas fa-cloud-sun', temp: '23°C' },
                { day: '모레', icon: 'fas fa-cloud-rain', temp: '20°C' },
                { day: '금', icon: 'fas fa-cloud', temp: '22°C' },
                { day: '토', icon: 'fas fa-sun', temp: '25°C' },
            ]
        }
    },
    graduation: {
        title: '<i class="fas fa-graduation-cap"></i> 졸업 요건',
        component: 'StatusListComponent',
        props: {
            items: [
                { name: '전공 필수', status: '30/30학점', icon: 'fas fa-check', color: '#27ae60' },
                { name: '교양 필수', status: '15/15학점', icon: 'fas fa-check', color: '#27ae60' },
                { name: '전공 선택', status: '42/45학점', icon: 'fas fa-spinner', color: '#f39c12' },
                { name: '총 이수 학점', status: '120/130학점', icon: 'fas fa-spinner', color: '#f39c12' },
            ]
        }
    },
    club: {
        title: '<i class="fas fa-users"></i> 동아리 활동',
        component: 'IconListComponent',
        props: {
            items: [
                { icon: 'fas fa-music', text: '밴드동아리 정기공연 (9/8 18:00)' },
                { icon: 'fas fa-robot', text: 'AI동아리 OT (9/5 19:00)' },
                { icon: 'fas fa-futbol', text: '축구동아리 경기 (9/10 15:00)' },
                { icon: 'fas fa-paint-brush', text: '미술동아리 전시회 (9/20 ~ 9/25)' },
            ]
        }
    },
    default: {
        title: '<i class="fas fa-plus"></i> 새 위젯',
        component: 'DefaultMessage',
        props: {
            message: '새 위젯 내용'
        }
    }
};