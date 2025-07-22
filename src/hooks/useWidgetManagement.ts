/**
 * @file 대시보드 위젯의 추가, 제거, 재정렬 등 위젯 관리를 위한 커스텀 훅을 제공합니다.
 * 이 훅은 위젯 상태를 관리하고 로컬 스토리지에 저장하며, 드래그 앤 드롭 기능을 포함합니다.
 */

import { useState, useEffect, useRef } from "react";
import { generateWidgetContent } from "../utils/widgetContentGenerator";

/**
 * 위젯의 데이터 구조를 정의하는 인터페이스입니다.
 * @property {string} type - 위젯의 고유 식별자 (예: 'welcome', 'notice').
 * @property {string} title - 위젯 헤더에 표시될 제목.
 * @property {string} componentType - 렌더링할 React 컴포넌트의 이름 (AllWidgetTemplates.tsx에 정의된 이름).
 * @property {Record<string, any>} props - 위젯 컴포넌트에 전달될 데이터.
 */
interface WidgetData {
  type: string;
  title: string;
  componentType: string;
  props: Record<string, any>;
}

/**
 * 대시보드 위젯 관리를 위한 커스텀 훅입니다.
 * 위젯의 추가, 제거, 재정렬(드래그 앤 드롭) 기능을 제공하며,
 * 위젯 상태를 로컬 스토리지에 저장하고 불러옵니다.
 * @returns {object} 위젯 관리와 관련된 상태, 함수 및 옵션들을 포함하는 객체.
 * @returns {boolean} return.isModalOpen - 위젯 추가 모달의 열림/닫힘 상태.
 * @returns {React.Dispatch<React.SetStateAction<boolean>>} return.setIsModalOpen - 위젯 추가 모달 상태를 설정하는 함수.
 * @returns {WidgetData[]} return.widgets - 현재 대시보드에 표시되는 위젯들의 배열.
 * @returns {React.Dispatch<React.SetStateAction<WidgetData[]>>} return.setWidgets - 위젯 배열을 설정하는 함수.
 * @returns {(type: string) => void} return.handleAddWidget - 새 위젯을 추가하는 함수.
 * @returns {(typeToRemove: string) => void} return.handleRemoveWidget - 특정 위젯을 제거하는 함수.
 * @returns {(index: number) => void} return.handleDragStart - 드래그 시작 시 호출되는 함수.
 * @returns {(index: number) => void} return.handleDragEnter - 드래그 요소가 다른 위젯 위로 진입 시 호출되는 함수.
 * @returns {() => void} return.handleDrop - 드롭 시 호출되는 함수.
 * @returns {object[]} return.widgetOptions - 위젯 추가 모달에서 선택 가능한 위젯 옵션 목록.
 */
export const useWidgetManagement = () => {
  // 위젯 추가 모달의 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 현재 대시보드에 표시되는 위젯들의 상태
  const [widgets, setWidgets] = useState<WidgetData[]>([]);

  // 드래그 중인 아이템의 인덱스를 저장하는 ref
  const dragItem = useRef<number | null>(null);
  // 드래그 오버된 아이템의 인덱스를 저장하는 ref
  const dragOverItem = useRef<number | null>(null);

  /**
   * 컴포넌트 마운트 시 로컬 스토리지에서 저장된 대시보드 상태를 불러옵니다.
   * 저장된 상태가 없으면 기본 환영 위젯을 추가합니다.
   */
  useEffect(() => {
    const savedDashboard = localStorage.getItem("dashboard");
    if (savedDashboard) {
      const dashboardState: { type: string }[] = JSON.parse(savedDashboard);
      const loadedWidgets = dashboardState.map(widget => {
        // 저장된 위젯 타입에 따라 위젯 콘텐츠를 생성하여 불러옵니다.
        const { title, componentType, props } = generateWidgetContent(widget.type);
        return { type: widget.type, title, componentType, props };
      });
      setWidgets(loadedWidgets);
    }
  }, []);

  /**
   * 새 위젯을 대시보드에 추가하는 함수입니다.
   * 이미 추가된 위젯(welcome 제외)은 중복 추가를 방지합니다.
   * @param {string} type - 추가할 위젯의 타입.
   */
  const handleAddWidget = (type: string) => {
    const existingTypes = widgets.map((w) => w.type);
    if (existingTypes.includes(type)) {
      alert("이미 추가된 위젯입니다.");
      return;
    }
    // generateWidgetContent를 사용하여 위젯의 전체 데이터를 가져옵니다.
    const newWidgetData = generateWidgetContent(type);
    setWidgets((prevWidgets) => [...prevWidgets, { type, ...newWidgetData }]);
    setIsModalOpen(false);
  };

  /**
   * 대시보드에서 특정 위젯을 제거하는 함수입니다.
   * 기본 위젯(welcome)은 삭제할 수 없습니다.
   * @param {string} typeToRemove - 제거할 위젯의 타입.
   */
  const handleRemoveWidget = (typeToRemove: string) => {
    setWidgets((prevWidgets) =>
      prevWidgets.filter((widget) => widget.type !== typeToRemove),
    );
  };

  /**
   * 드래그 시작 시 드래그 중인 아이템의 인덱스를 저장합니다.
   * @param {number} index - 드래그 시작된 위젯의 인덱스.
   */
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  /**
   * 드래그 요소가 다른 위젯 위로 진입 시 드래그 오버된 아이템의 인덱스를 저장합니다.
   * @param {number} index - 드래그 오버된 위젯의 인덱스.
   */
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  /**
   * 드롭 시 위젯들의 순서를 재정렬합니다.
   * 드래그 시작 및 드래그 오버된 아이템의 인덱스를 사용하여 위젯 배열을 업데이트합니다.
   */
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

  /**
   * 위젯 추가 모달에서 사용자에게 제공될 위젯 옵션 목록입니다.
   * 각 위젯은 타입, 아이콘, 제목, 설명을 포함합니다.
   */
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

  return {
    isModalOpen,
    setIsModalOpen,
    widgets,
    setWidgets,
    handleAddWidget,
    handleRemoveWidget,
    handleDragStart,
    handleDragEnter,
    handleDrop,
    widgetOptions,
  };
};