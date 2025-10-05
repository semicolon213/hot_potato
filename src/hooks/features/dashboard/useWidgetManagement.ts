/**
 * @file 대시보드 위젯의 추가, 제거, 재정렬 등 위젯 관리를 위한 커스텀 훅을 제공합니다.
 * 이 훅은 위젯 상태를 관리하고 Google Sheets에 저장하며, 드래그 앤 드롭 기능을 포함합니다.
 */

import { useState, useEffect, useRef } from "react";
import { generateWidgetContent } from "../../../utils/helpers/widgetContentGenerator";

/**
 * 위젯의 데이터 구조를 정의하는 인터페이스입니다.
 * @property {string} id - 위젯 인스턴스의 고유 식별자.
 * @property {string} type - 위젯의 고유 식별자 (예: 'welcome', 'notice').
 * @property {string} title - 위젯 헤더에 표시될 제목.
 * @property {string} componentType - 렌더링할 React 컴포넌트의 이름 (AllWidgetTemplates.tsx에 정의된 이름).
 * @property {Record<string, any>} props - 위젯 컴포넌트에 전달될 데이터.
 */
interface WidgetData {
  id: string;
  type: string;
  title: string;
  componentType: string;
  props: Record<string, any>;
}

import { ENV_CONFIG } from '../../../config/environment';

const SHEET_NAME = ENV_CONFIG.DASHBOARD_SHEET_NAME;
const RANGE = `${SHEET_NAME}!B2`;

// Google API 초기화는 App.tsx에서 중앙화되어 처리됨

// 위젯 옵션: 각 위젯 타입에 1-20 사이의 고정 ID를 할당합니다.
const widgetOptions = [
  {
    id: "1",
    type: "notice",
    icon: "fas fa-bullhorn",
    title: "공지사항",
    description: "학교 및 학과 공지사항 확인",
  },
  {
    id: "2",
    type: "lecture-note",
    icon: "fas fa-book-open",
    title: "강의노트",
    description: "강의 자료 및 동영상 확인",
  },
  {
    id: "3",
    type: "library",
    icon: "fas fa-book-reader",
    title: "도서관 좌석현황",
    description: "실시간 도서관 이용 정보",
  },
  {
    id: "4",
    type: "admin",
    icon: "fas fa-user-cog",
    title: "시스템관리자",
    description: "시스템 관리 및 설정",
  },
  {
    id: "5",
    type: "professor-contact",
    icon: "fas fa-chalkboard-teacher",
    title: "교수한테 문의",
    description: "담당 교수님께 문의하기",
  },
  {
    id: "6",
    type: "grades",
    icon: "fas fa-chart-bar",
    title: "성적 현황",
    description: "학기별 성적 확인",
  },
  {
    id: "7",
    type: "calendar",
    icon: "fas fa-calendar-alt",
    title: "학사 일정",
    description: "다가오는 일정 확인",
  },
  {
    id: "8",
    type: "attendance",
    icon: "fas fa-user-check",
    title: "출석 현황",
    description: "강의별 출석률 확인",
  },
  {
    id: "9",
    type: "assignments",
    icon: "fas fa-tasks",
    title: "과제 현황",
    description: "제출해야 할 과제 확인",
  },
  {
    id: "10",
    type: "timetable",
    icon: "fas fa-calendar-day",
    title: "시간표",
    description: "오늘의 수업 일정",
  },
  {
    id: "11",
    type: "cafeteria",
    icon: "fas fa-utensils",
    title: "학식 메뉴",
    description: "오늘의 학식 메뉴 확인",
  },
  {
    id: "12",
    type: "weather",
    icon: "fas fa-cloud-sun",
    title: "캠퍼스 날씨",
    description: "오늘의 날씨 및 예보",
  },
  {
    id: "13",
    type: "bus",
    icon: "fas fa-bus",
    title: "셔틀버스",
    description: "다음 버스 도착 시간",
  },
  {
    id: "14",
    type: "campus-map",
    icon: "fas fa-map-marked-alt",
    title: "캠퍼스 맵",
    description: "캠퍼스 건물 위치 확인",
  },
  {
    id: "15",
    type: "scholarship",
    icon: "fas fa-award",
    title: "장학금 정보",
    description: "신청 가능한 장학금",
  },
  {
    id: "16",
    type: "tuition",
    icon: "fas fa-money-bill-wave",
    title: "등록금 정보",
    description: "납부 내역 및 잔액",
  },
  {
    id: "17",
    type: "graduation",
    icon: "fas fa-graduation-cap",
    title: "졸업 요건",
    description: "졸업 요건 충족 현황",
  },
  {
    id: "18",
    type: "career",
    icon: "fas fa-briefcase",
    title: "취업 정보",
    description: "채용 공고 및 설명회",
  },
  {
    id: "19",
    type: "health",
    icon: "fas fa-heartbeat",
    title: "건강 관리",
    description: "건강검진 및 상담",
  },
  {
    id: "20",
    type: "club",
    icon: "fas fa-users",
    title: "동아리 활동",
    description: "동아리 일정 및 공지",
  },
];

/**
 * 대시보드 위젯 관리를 위한 커스텀 훅입니다.
 */
export const useWidgetManagement = (hotPotatoDBSpreadsheetId: string | null) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Google Sheets에서 위젯 데이터를 동기화하는 함수
  const syncWidgetsWithGoogleSheets = async () => {
    if (!hotPotatoDBSpreadsheetId) return;
    try {
      console.log("Google Sheets와 위젯 데이터 동기화 시작");
      
      const gapi = (window as any).gapi;
      if (!gapi || !gapi.client || !gapi.client.sheets) {
        throw new Error("Google API가 초기화되지 않았습니다. 먼저 로그인해주세요.");
      }
      
      // Google API Key 설정 (공개 시트 접근용)
      if (ENV_CONFIG.PAPYRUS_DB_API_KEY) {
        gapi.client.setApiKey(ENV_CONFIG.PAPYRUS_DB_API_KEY);
        console.log("Google API Key 설정 완료");
      }
      
      // Google Sheets에서 위젯 데이터 로드
      console.log("Google Sheets에서 위젯 데이터 로드 시도...");
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: hotPotatoDBSpreadsheetId,
        range: RANGE,
        majorDimension: 'ROWS'
      });

      const cellContent = response.result.values?.[0]?.[0];
      if (cellContent) {
        try {
          const savedIds: string[] = JSON.parse(cellContent);
          
          const loadedWidgets = savedIds.map(id => {
            const option = widgetOptions.find(opt => opt.id === id);
            if (!option) return null;

            const { type } = option;
            const { title, componentType, props } = generateWidgetContent(type);
            return { id, type, title, componentType, props };
          }).filter((w): w is WidgetData => w !== null);
          
          setWidgets(loadedWidgets);
          console.log("Google Sheets에서 위젯 데이터 동기화 성공:", loadedWidgets.length, "개");
        } catch (parseError) {
          console.error("위젯 데이터 파싱 오류:", parseError);
          setWidgets([]);
        }
      } else {
        console.log("저장된 위젯 데이터가 없습니다.");
        setWidgets([]);
      }
      
    } catch (error) {
      console.error("Google Sheets 동기화 실패:", error);
      alert("Google Sheets 동기화에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.");
    } finally {
      setInitialLoadComplete(true); // 데이터 로드 또는 실패 후 초기 로드 완료로 설정
    }
  };

  // hotPotatoDBSpreadsheetId가 설정되면 자동으로 동기화 실행
  useEffect(() => {
    if (hotPotatoDBSpreadsheetId) {
      console.log("hotPotatoDBSpreadsheetId가 설정되어 자동 동기화를 시작합니다.");
      syncWidgetsWithGoogleSheets();
    }
  }, [hotPotatoDBSpreadsheetId]);

  // 위젯 상태가 변경되면 Google Sheets에 저장합니다.
  useEffect(() => {
    if (!initialLoadComplete) return; // 초기 로드가 완료되기 전에는 저장하지 않음

    const saveWidgetsToGoogleSheets = async () => {
      if (!hotPotatoDBSpreadsheetId) return;
      
      // Google Sheets에 저장 (gapi가 사용 가능한 경우에만)
      try {
        const gapi = (window as any).gapi;
        if (gapi && gapi.client && gapi.client.sheets) {
          const dataToSave = widgets.map(({ id }) => id);
          console.log("Google Sheets에 위젯 데이터 저장 시도:", dataToSave);
          
          await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: RANGE,
            valueInputOption: 'RAW',
            resource: {
              values: [[JSON.stringify(dataToSave)]],
            },
          });
          console.log("위젯 데이터 Google Sheets 저장 성공:", dataToSave);
        } else {
          console.log("Google API가 초기화되지 않았습니다. 위젯 데이터는 메모리에만 저장됩니다.");
        }
      } catch (error) {
        console.error("Error saving widget data to Google Sheets:", error);
        console.log("위젯 데이터 저장 실패. Google 로그인 후 동기화 버튼을 클릭해주세요.");
        // Google Sheets 저장 실패는 백그라운드 작업이므로 사용자에게 알리지 않음
      }
    };

    saveWidgetsToGoogleSheets();
  }, [widgets, hotPotatoDBSpreadsheetId, initialLoadComplete]);

  /**
   * 새 위젯을 대시보드에 추가하는 함수입니다.
   * @param {string} type - 추가할 위젯의 타입.
   */
  const handleAddWidget = (type: string) => {
    const option = widgetOptions.find(opt => opt.type === type);
    if (!option) {
      console.error(`Widget type "${type}" not found.`);
      return;
    }

    if (widgets.some(w => w.id === option.id)) {
      alert("이미 추가된 위젯입니다.");
      return;
    }

    const newWidgetData = generateWidgetContent(type);
    const newWidget: WidgetData = {
      id: option.id,
      type,
      ...newWidgetData,
    };
    setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
    setIsModalOpen(false);
  };

  /**
   * 대시보드에서 특정 위젯을 제거하는 함수입니다.
   * @param {string} idToRemove - 제거할 위젯의 ID.
   */
  const handleRemoveWidget = (idToRemove: string) => {
    setWidgets((prevWidgets) =>
      prevWidgets.filter((widget) => widget.id !== idToRemove),
    );
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      return;
    }
    const newWidgets = [...widgets];
    const draggedWidget = newWidgets.splice(dragItem.current, 1)[0];
    newWidgets.splice(dragOverItem.current, 0, draggedWidget);
    dragItem.current = null;
    dragOverItem.current = null;
    setWidgets(newWidgets);
  };

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
    syncWidgetsWithGoogleSheets,
  };
};
