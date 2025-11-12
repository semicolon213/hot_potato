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
            items: []
        }
    },
    calendar: {
        title: '<i class="fas fa-calendar-alt"></i> 학사 일정',
        component: 'EventListComponent',
        props: {
            items: []
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
    tuition: {
        title: '<i class="fas fa-money-bill-wave"></i> 장부 잔액',
        component: 'ListComponent',
        props: {
            items: []
        }
    },
    'budget-plan': {
        title: '<i class="fas fa-money-bill-alt"></i> 예산 계획',
        component: 'BudgetPlanComponent',
        props: {
            items: []
        }
    },
    'workflow-status': {
        title: '<i class="fas fa-tasks"></i> 워크플로우 현황',
        component: 'WorkflowStatusComponent',
        props: {
            items: []
        }
    },
    'student-summary': {
        title: '<i class="fas fa-user-graduate"></i> 학생 관리',
        component: 'StudentSummaryComponent',
        props: {
            items: []
        }
    },
    'staff-summary': {
        title: '<i class="fas fa-user-tie"></i> 교직원 관리',
        component: 'StaffSummaryComponent',
        props: {
            items: []
        }
    },
    'user-approval': {
        title: '<i class="fas fa-user-clock"></i> 사용자 승인 대기',
        component: 'UserApprovalComponent',
        props: {
            items: []
        }
    },
    'system-stats': {
        title: '<i class="fas fa-chart-line"></i> 시스템 통계',
        component: 'SystemStatsComponent',
        props: {
            items: []
        }
    },
    'document-management': {
        title: '<i class="fas fa-file-alt"></i> 문서 관리',
        component: 'DocumentManagementComponent',
        props: {
            items: []
        }
    },
    'budget-execution': {
        title: '<i class="fas fa-chart-pie"></i> 예산 집행 현황',
        component: 'BudgetExecutionComponent',
        props: {
            items: []
        }
    },
    'accounting-stats': {
        title: '<i class="fas fa-chart-bar"></i> 회계 통계',
        component: 'AccountingStatsComponent',
        props: {
            items: []
        }
    },
    default: {
        title: '<i class="fas fa-plus"></i> 기본 위젯',
        component: 'DefaultMessage',
        props: {
            message: ''
        }
    }
};