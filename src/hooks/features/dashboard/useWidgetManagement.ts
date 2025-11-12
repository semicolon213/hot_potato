/**
 * @file 대시보드 위젯의 추가, 제거, 재정렬 등 위젯 관리를 위한 커스텀 훅을 제공합니다.
 * 이 훅은 위젯 상태를 관리하고 Google Sheets에 저장하며, 드래그 앤 드롭 기능을 포함합니다.
 */

import React, { useState, useEffect, useRef } from "react";
import { generateWidgetContent } from "../../../utils/helpers/widgetContentGenerator";
import { fetchAnnouncements, fetchCalendarEvents } from "../../../utils/database/papyrusManager";
import type { User } from '../../../types/app';
import { getAccountingData } from "../../../utils/google/googleSheetUtils";
import { getFolderIdByName, getSheetsInFolder } from "../../../utils/google/driveUtils";
import { ENV_CONFIG } from '../../../config/environment';

/**
 * 위젯의 데이터 구조를 정의하는 인터페이스입니다.
 * @property {string} id - 위젯 인스턴스의 고유 식별자.
 * @property {string} type - 위젯의 고유 식별자 (예: 'welcome', 'notice').
 * @property {string} title - 위젯 헤더에 표시될 제목.
 * @property {string} componentType - 렌더링할 React 컴포넌트의 이름 (AllWidgetTemplates.tsx에 정의된 이름).
 * @property {Record<string, unknown>} props - 위젯 컴포넌트에 전달될 데이터.
 */
interface WidgetData {
  id: string;
  type: string;
  title: string;
  componentType: string;
  props: Record<string, any>; // props can have any shape
}

const SHEET_NAME = ENV_CONFIG.DASHBOARD_SHEET_NAME;
const RANGE = `${SHEET_NAME}!B2`;

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
    id: "7",
    type: "calendar",
    icon: "fas fa-calendar-alt",
    title: "학사 일정",
    description: "다가오는 일정 확인",
  },
  {
    id: "10",
    type: "timetable",
    icon: "fas fa-calendar-day",
    title: "시간표",
    description: "오늘의 수업 일정",
  },
  {
    id: "16",
    type: "tuition",
    icon: "fas fa-money-bill-wave",
    title: "회계 장부",
    description: "납부 내역 및 잔액",
  },
  {
    id: "17",
    type: "budget-plan",
    icon: "fas fa-money-bill-alt",
    title: "예산 계획",
    description: "예산 카테고리별 상세 내역",
  },
];

/**
 * 대시보드 위젯 관리를 위한 커스텀 훅입니다.
 */
export const useWidgetManagement = (hotPotatoDBSpreadsheetId: string | null, user: User | null) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadedData, setLoadedData] = useState<Record<string, boolean>>({});

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [accountingSheets, setAccountingSheets] = useState<{ id: string; name: string; }[]>([]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Google Sheets에서 위젯 데이터를 동기화하는 함수
  const syncWidgetsWithGoogleSheets = async () => {
    if (!hotPotatoDBSpreadsheetId) return;
    try {
      console.log("Google Sheets와 위젯 데이터 동기화 시작");
      
      const gapi = window.gapi;
      if (!gapi || !gapi.client || !gapi.client.sheets) {
        throw new Error("Google API가 초기화되지 않았습니다. 먼저 로그인해주세요.");
      }
      
      if (ENV_CONFIG.PAPYRUS_DB_API_KEY) {
        gapi.client.setApiKey(ENV_CONFIG.PAPYRUS_DB_API_KEY);
      }
      
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
        } catch (parseError) {
          console.error("위젯 데이터 파싱 오류:", parseError);
          setWidgets([]);
        }
      } else {
        setWidgets([]);
      }
      
    } catch (error) {
      console.error("Google Sheets 동기화 실패:", error);
    } finally {
      setInitialLoadComplete(true);
    }
  };

  useEffect(() => {
    if (hotPotatoDBSpreadsheetId) {
      syncWidgetsWithGoogleSheets();
    }
  }, [hotPotatoDBSpreadsheetId]);

  useEffect(() => {
    if (!initialLoadComplete) return;

    const saveWidgetsToGoogleSheets = async () => {
      if (!hotPotatoDBSpreadsheetId) return;
      
      try {
        const gapi = window.gapi;
        if (gapi && gapi.client && gapi.client.sheets) {
          const dataToSave = widgets.map(({ id }) => id);
          
          await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: RANGE,
            valueInputOption: 'RAW',
            resource: {
              values: [[JSON.stringify(dataToSave)]],
            },
          });
        }
      } catch (error) {
        console.error("Error saving widget data to Google Sheets:", error);
      }
    };

    saveWidgetsToGoogleSheets();
  }, [widgets, hotPotatoDBSpreadsheetId, initialLoadComplete]);

  useEffect(() => {
    const noticeWidget = widgets.find(w => w.type === 'notice');
    const calendarWidget = widgets.find(w => w.type === 'calendar');

    const shouldLoadNotice = noticeWidget && user && !loadedData['notice'];
    const shouldLoadCalendar = calendarWidget && user && !loadedData['calendar'];

    if (!shouldLoadNotice && !shouldLoadCalendar) {
      return;
    }

    const loadAllWidgetData = async () => {
      let noticeItems: string[] | null = null;
      let calendarItems: { date: string, event: string }[] | null = null;

      if (shouldLoadNotice && user?.studentId && user?.userType) {
        try {
          const announcements = await fetchAnnouncements(user.studentId, user.userType);
          noticeItems = announcements.slice(0, 4).map(a => a.title);
        } catch (error) {
          console.error("Error loading notice data:", error);
        }
      }

      if (shouldLoadCalendar) {
        try {
          const events = await fetchCalendarEvents();
          calendarItems = events.slice(0, 4).map(e => ({ date: e.startDate, event: e.title }));
        } catch (error) {
          console.error("Error loading calendar data:", error);
        }
      }

      // Perform a single state update for widgets
      if (noticeItems || calendarItems) {
        setWidgets(prevWidgets =>
          prevWidgets.map(widget => {
            if (widget.type === 'notice' && noticeItems) {
              return { ...widget, props: { items: noticeItems } };
            }
            if (widget.type === 'calendar' && calendarItems) {
              return { ...widget, props: { items: calendarItems } };
            }
            return widget;
          })
        );
      }

      // Update the loaded data flags
      setLoadedData(prev => ({
        ...prev,
        ...(shouldLoadNotice && { notice: true }),
        ...(shouldLoadCalendar && { calendar: true }),
      }));
    };

    loadAllWidgetData();
  }, [widgets, user, loadedData]);

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

  const openSheetSelectionModal = async () => {
    try {
      // 1. 'hot potato' 폴더 찾기
      const hotPotatoFolderId = await getFolderIdByName(ENV_CONFIG.ROOT_FOLDER_NAME);
      if (!hotPotatoFolderId) {
        alert("'hot potato' 폴더를 찾을 수 없습니다.");
        return;
      }

      // 2. '회계' 폴더 찾기
      const accountingFolderId = await getFolderIdByName(ENV_CONFIG.ACCOUNTING_FOLDER_NAME, hotPotatoFolderId);
      if (!accountingFolderId) {
        alert("'hot potato' 폴더 내에서 '회계' 폴더를 찾을 수 없습니다.");
        return;
      }

      // 3. '컴소 장부' 폴더 찾기
      const comsoLedgerFolderId = await getFolderIdByName('컴소 장부', accountingFolderId);
      if (!comsoLedgerFolderId) {
        alert("'회계' 폴더 내에서 '컴소 장부' 폴더를 찾을 수 없습니다.");
        return;
      }

      // 4. '컴소 장부' 폴더 내 시트 목록 가져오기
      const sheets = await getSheetsInFolder(comsoLedgerFolderId);
      if (sheets && sheets.length > 0) {
        setAccountingSheets(sheets);
        setIsSheetModalOpen(true);
      } else {
        alert("'컴소 장부' 폴더에 시트 파일이 없습니다.");
      }
    } catch (error) {
      console.error("Error opening sheet selection modal:", error);
      alert("오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  const handleSheetSelect = async (sheet: { id: string; name: string; }) => {
    try {
      console.log(`Fetching data for sheet: ${sheet.name} (${sheet.id})`);
      const data = await getAccountingData(sheet.id); // 이제 data는 string[]
      console.log("Fetched accounting data (categories):", data);

      if (data) {
        setWidgets(prevWidgets => {
          const newWidgets = prevWidgets.map(widget => {
            if (widget.type === 'tuition') {
              return {
                ...widget,
                title: sheet.name, // 위젯 제목을 시트 이름으로 변경
                // componentType을 ListComponent로 변경
                componentType: 'ListComponent',
                props: {
                  ...widget.props,
                  items: data, // data 대신 items로 전달
                },
              };
            }
            return widget;
          });
          console.log("New widgets state after update:", newWidgets);
          return newWidgets;
        });
      }
      setIsSheetModalOpen(false);
    } catch (error) {
      console.error("Error fetching accounting data:", error);
      alert("장부 데이터를 가져오는 중 오류가 발생했습니다.");
    }
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
    isSheetModalOpen,
    setIsSheetModalOpen,
    accountingSheets,
    openSheetSelectionModal,
    handleSheetSelect,
  };
};
