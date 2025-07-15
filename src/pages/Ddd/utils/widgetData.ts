// src/pages/Ddd/utils/widgetData.ts
// 실제 애플리케이션에서는 API 호출 등을 통해 데이터를 가져옵니다.
export const getWidgetData = (widgetType: string) => {
    switch (widgetType) {
        case 'welcome':
            return { content: '대학 ERP 시스템에 오신 것을 환영합니다.' };
        case 'notice':
            return {
                items: [
                    { id: 'notice-1', text: '[공지] 2025-2학기 등록금 납부 안내' },
                    { id: 'notice-2', text: '[공지] 하계방학 교내 시설 이용 안내' },
                    { id: 'notice-3', text: '[행사] 2025년 2학기 동아리 박람회' },
                ]
            };
        case 'lecture-note':
            return {
                items: [
                    { id: 'note-1', text: '[자료] 소프트웨어 공학 1주차 강의자료' },
                    { id: 'note-2', text: '[자료] 데이터베이스 2주차 강의자료' },
                ]
            };
        case 'assignments':
            return {
                items: [
                    { id: 'assign-1', text: '소프트웨어 공학 과제 #1 (마감: 8/1)' },
                    { id: 'assign-2', text: '컴퓨터 구조 중간 레포트 (마감: 8/5)' },
                ]
            };
        // 다른 리스트 기반 위젯들도 여기에 추가할 수 있습니다.
        case 'scholarship':
            return {
                items: [
                    { id: 'scholar-1', text: '2025-2학기 국가장학금 신청 (~8/10)' },
                    { id: 'scholar-2', text: '성적우수 장학금 신청 (~8/15)' },
                ]
            };
        // 간단한 텍스트를 표시하는 위젯들
        case 'library':
            return { content: '중앙도서관: 342/500석' };
        case 'cafeteria':
            return { content: '오늘의 메뉴: 돈까스, 샐러드' };
        // 복잡한 컴포넌트가 필요한 경우 (아직 구현되지 않음)
        // case 'calendar':
        //     return { component: 'CalendarWidget' };
        default:
            return { content: `'${widgetType}' 위젯은 아직 지원되지 않습니다.` };
    }
}
