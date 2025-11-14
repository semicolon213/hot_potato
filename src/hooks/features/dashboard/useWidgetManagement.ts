/**
 * @file 대시보드 위젯의 추가, 제거, 재정렬 등 위젯 관리를 위한 커스텀 훅을 제공합니다.
 * 이 훅은 위젯 상태를 관리하고 Google Sheets에 저장하며, 드래그 앤 드롭 기능을 포함합니다.
 */

import React, { useState, useEffect, useRef } from "react";
import { generateWidgetContent } from "../../../utils/helpers/widgetContentGenerator";
import { fetchAnnouncements, fetchCalendarEvents, fetchStudents, fetchStaffFromPapyrus } from "../../../utils/database/papyrusManager";
import type { User } from '../../../types/app';
import { getAccountingData } from "../../../utils/google/googleSheetUtils";
import { getFolderIdByName, getSheetsInFolder } from "../../../utils/google/driveUtils";
import { ENV_CONFIG } from '../../../config/environment';
import { apiClient } from "../../../utils/api/apiClient";

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
  order?: number; // 위젯 순서 (드래그 앤 드롭 순서)
}

const SHEET_NAME = ENV_CONFIG.DASHBOARD_SHEET_NAME;
const DATA_RANGE = `${SHEET_NAME}!A2:D`;

// 위젯 옵션: 각 위젯 타입에 1-20 사이의 고정 ID를 할당합니다.
const allWidgetOptions = [
  {
    id: "1",
    type: "notice",
    icon: "fas fa-bullhorn",
    title: "공지사항",
    description: "학교 및 학과 공지사항 확인",
    allowedRoles: ['student', 'std_council', 'supp', 'professor', 'ad_professor', 'admin'],
  },
  {
    id: "7",
    type: "calendar",
    icon: "fas fa-calendar-alt",
    title: "학사 일정",
    description: "다가오는 일정 확인",
    allowedRoles: ['student', 'std_council', 'supp', 'professor', 'ad_professor', 'admin'],
  },
  {
    id: "10",
    type: "timetable",
    icon: "fas fa-calendar-day",
    title: "시간표",
    description: "오늘의 수업 일정",
    allowedRoles: ['student', 'std_council', 'supp', 'professor', 'ad_professor', 'admin'],
  },
  {
    id: "16",
    type: "tuition",
    icon: "fas fa-money-bill-wave",
    title: "장부 잔액",
    description: "납부 내역 및 잔액",
    allowedRoles: ['std_council', 'professor', 'supp'], // 집행부, 교수, 조교만
    requiresAccountingAccess: true, // 장부 접근 권한 필요
  },
  {
    id: "17",
    type: "budget-plan",
    icon: "fas fa-money-bill-alt",
    title: "예산 계획",
    description: "예산 카테고리별 상세 내역",
    allowedRoles: ['std_council', 'professor', 'supp'], // 집행부, 교수, 조교만
    requiresAccountingAccess: true, // 장부 접근 권한 필요
  },
  {
    id: "18",
    type: "workflow-status",
    icon: "fas fa-tasks",
    title: "워크플로우 현황",
    description: "결재 대기 문서 목록",
    allowedRoles: ['std_council', 'supp', 'professor'], // 집행부, 조교, 교수
  },
  {
    id: "19",
    type: "student-summary",
    icon: "fas fa-user-graduate",
    title: "학생 관리",
    description: "학생 목록 요약",
    allowedRoles: ['supp', 'professor'], // 조교, 교수
  },
  {
    id: "20",
    type: "staff-summary",
    icon: "fas fa-user-tie",
    title: "교직원 관리",
    description: "교직원 목록 요약",
    allowedRoles: ['supp'], // 조교만
  },
  {
    id: "21",
    type: "user-approval",
    icon: "fas fa-user-clock",
    title: "사용자 승인 대기",
    description: "승인 대기 사용자 목록",
    allowedRoles: ['admin'], // 관리자만
  },
  {
    id: "22",
    type: "system-stats",
    icon: "fas fa-chart-line",
    title: "시스템 통계",
    description: "전체 사용자 수, 승인 대기 수 등",
    allowedRoles: ['admin'], // 관리자만
  },
  {
    id: "23",
    type: "document-management",
    icon: "fas fa-file-alt",
    title: "문서 관리",
    description: "최근 문서 및 템플릿",
    allowedRoles: ['std_council', 'supp', 'professor', 'ad_professor', 'admin'], // 집행부, 조교, 교수, 겸임교원, 관리자
  },
  {
    id: "24",
    type: "budget-execution",
    icon: "fas fa-chart-pie",
    title: "예산 집행 현황",
    description: "예산 집행률 및 현황",
    allowedRoles: ['std_council', 'professor', 'supp'], // 집행부, 교수, 조교만
    requiresAccountingAccess: true, // 장부 접근 권한 필요
  },
  {
    id: "25",
    type: "accounting-stats",
    icon: "fas fa-chart-bar",
    title: "회계 통계",
    description: "수입/지출 통계 그래프",
    allowedRoles: ['std_council', 'professor', 'supp'], // 집행부, 교수, 조교만
    requiresAccountingAccess: true, // 장부 접근 권한 필요
  },
];

// 사용자 역할에 따라 위젯 옵션 필터링
const getWidgetOptions = (userType?: string, isAdmin?: boolean): typeof allWidgetOptions => {
  if (!userType) {
    // userType이 없으면 student 기본 위젯만
    return allWidgetOptions.filter(w => w.allowedRoles.includes('student'));
  }
  
  // 기본적으로 사용자 역할에 해당하는 위젯 필터링
  const userRoleWidgets = allWidgetOptions.filter(w => w.allowedRoles.includes(userType));
  
  console.log(`🔍 getWidgetOptions: userType=${userType}, isAdmin=${isAdmin}`);
  console.log(`📊 사용자 역할 위젯: ${userRoleWidgets.length}개`, userRoleWidgets.map(w => w.type));
  
  // 관리자인 경우 admin 역할 위젯도 추가
  if (isAdmin) {
    const adminWidgets = allWidgetOptions.filter(w => w.allowedRoles.includes('admin'));
    console.log(`👑 관리자 위젯: ${adminWidgets.length}개`, adminWidgets.map(w => w.type));
    
    // 중복 제거 (같은 위젯이 여러 역할에 포함될 수 있음)
    const allWidgets = [...userRoleWidgets];
    adminWidgets.forEach(adminWidget => {
      if (!allWidgets.find(w => w.id === adminWidget.id)) {
        allWidgets.push(adminWidget);
        console.log(`➕ 관리자 위젯 추가: ${adminWidget.type}`);
      }
    });
    
    console.log(`✅ 최종 위젯: ${allWidgets.length}개`, allWidgets.map(w => w.type));
    return allWidgets;
  }
  
  return userRoleWidgets;
};

/**
 * 대시보드 위젯 관리를 위한 커스텀 훅입니다.
 */
export const useWidgetManagement = (hotPotatoDBSpreadsheetId: string | null, user: User | null) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadedData, setLoadedData] = useState<Record<string, boolean>>({});

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [accountingSheets, setAccountingSheets] = useState<{ id: string; name: string; ledgerName?: string }[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const prevWidgetConfigRef = useRef<string>(''); // 이전 위젯 설정 저장
  const loadingWidgetsRef = useRef<Set<string>>(new Set()); // 현재 로딩 중인 위젯 추적
  const errorWidgetsRef = useRef<Record<string, number>>({}); // 에러 발생한 위젯과 시간 추적 (재시도 방지용)

  // 장부 접근 권한 확인
  const [hasAccountingAccess, setHasAccountingAccess] = useState<boolean | null>(null);

  // 사용자 역할에 따라 위젯 옵션 필터링
  const userType = user?.userType || user?.user_type;
  // isAdmin 체크: isAdmin 또는 is_admin이 'O'이거나 true인 경우
  const isAdmin = user?.isAdmin || 
                  (user as any)?.is_admin === 'O' || 
                  (user as any)?.is_admin === true ||
                  (user as any)?.is_admin === 'true';
  
  // 디버깅: 사용자 정보 로그
  if (user) {
    console.log('🔍 위젯 옵션 필터링:', {
      userType,
      isAdmin,
      userIsAdmin: user.isAdmin,
      userIs_admin: (user as any)?.is_admin,
      email: user.email
    });
  }
  
  const baseWidgetOptions = getWidgetOptions(userType, isAdmin);
  
  // 디버깅: 필터링된 위젯 옵션 로그
  console.log('📋 필터링된 위젯 옵션:', {
    total: baseWidgetOptions.length,
    widgetTypes: baseWidgetOptions.map(w => w.type)
  });
  
  // 장부 접근 권한이 필요한 위젯 필터링
  const widgetOptions = baseWidgetOptions.filter(widget => {
    // requiresAccountingAccess가 true인 경우, 장부 접근 권한이 있어야 함
    if ((widget as any).requiresAccountingAccess) {
      // 아직 확인 중이면 일단 표시하지 않음 (null인 경우)
      if (hasAccountingAccess === null) {
        return false;
      }
      return hasAccountingAccess;
    }
    return true;
  });

  // Google Sheets에서 위젯 데이터를 동기화하는 함수
  const syncWidgetsWithGoogleSheets = async () => {
    if (!hotPotatoDBSpreadsheetId) {
      setInitialLoadComplete(true);
      return;
    }
    
    try {
      console.log("Google Sheets와 위젯 데이터 동기화 시작");
      
      const gapi = window.gapi;
      if (!gapi || !gapi.client || !gapi.client.sheets) {
        console.warn("Google API가 초기화되지 않았습니다.");
        setInitialLoadComplete(true);
        return;
      }
      
      if (ENV_CONFIG.PAPYRUS_DB_API_KEY) {
        gapi.client.setApiKey(ENV_CONFIG.PAPYRUS_DB_API_KEY);
      }
      
      // 토큰 확인 및 재설정
      const token = localStorage.getItem('googleAccessToken');
      if (token) {
        try {
          // tokenManager를 사용하여 토큰 가져오기 (만료 체크 포함)
          const { tokenManager } = await import('../../../utils/auth/tokenManager');
          const validToken = tokenManager.get();
          if (validToken) {
            gapi.client.setToken({ access_token: validToken });
          } else {
            console.warn("토큰이 만료되었습니다. 재로그인이 필요할 수 있습니다.");
            // 만료된 토큰이어도 시도 (일부 경우 작동할 수 있음)
            try {
              const tokenData = JSON.parse(token);
              if (tokenData.accessToken) {
                gapi.client.setToken({ access_token: tokenData.accessToken });
              }
            } catch (e) {
              // 토큰이 문자열인 경우
              gapi.client.setToken({ access_token: token });
            }
          }
        } catch (tokenError) {
          console.warn("토큰 설정 실패:", tokenError);
        }
      }
      
      // 시트 존재 여부 확인
      let sheetExists = false;
      try {
        const spreadsheet = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: hotPotatoDBSpreadsheetId
        });
        
        const allSheetNames = spreadsheet.result.sheets?.map((sheet: any) => sheet.properties.title) || [];
        console.log(`📄 스프레드시트의 모든 시트:`, allSheetNames);
        console.log(`🔍 찾는 시트 이름: "${SHEET_NAME}"`);
        
        sheetExists = spreadsheet.result.sheets?.some(
          (sheet: any) => sheet.properties.title === SHEET_NAME
        ) || false;
        
        console.log(`✅ 시트 존재 여부: ${sheetExists}`);
      } catch (checkError: any) {
        // 401 오류인 경우 특별 처리
        if (checkError?.status === 401 || checkError?.result?.error?.code === 401) {
          console.warn("인증 오류가 발생했습니다. 토큰이 만료되었을 수 있습니다. 기존 위젯을 유지합니다.");
        } else {
          console.warn("시트 확인 중 오류:", checkError);
        }
        // 시트 확인 실패 시 기존 위젯 유지 (빈 배열로 초기화하지 않음)
        setInitialLoadComplete(true);
        return;
      }
      
      if (!sheetExists) {
        console.log(`시트 "${SHEET_NAME}"가 존재하지 않습니다. 기존 위젯을 유지합니다.`);
        setInitialLoadComplete(true);
        return;
      }
      
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: hotPotatoDBSpreadsheetId,
        range: DATA_RANGE,
        majorDimension: 'ROWS'
      });

      const rows = response.result.values || [];
      console.log(`📊 대시보드 시트에서 읽은 데이터: ${rows.length}개 행`);
      console.log('📊 읽은 데이터 샘플:', rows.slice(0, 3));
      
      if (rows.length > 0) {
        try {
          const loadedWidgets: WidgetData[] = [];
          
          for (const row of rows) {
            if (!row || row.length < 3) {
              console.warn('⚠️ 행 데이터가 부족합니다:', row);
              continue;
            }
            
            const widgetId = row[0]?.toString() || '';
            const widgetType = row[1]?.toString() || '';
            const widgetOrder = parseInt(row[2]?.toString() || '0', 10);
            const widgetConfigStr = row[3]?.toString() || '{}';
            
            console.log(`🔍 위젯 처리 중: ID=${widgetId}, Type=${widgetType}, Order=${widgetOrder}`);
            
            if (!widgetId) {
              console.warn('⚠️ 위젯 ID가 없습니다:', row);
              continue;
            }
            
            // 위젯 ID에서 기본 ID 추출 (예: "17-1" -> "17", "25-1" -> "25")
            const baseWidgetId = widgetId.split('-')[0];
            console.log(`🔍 기본 위젯 ID: ${baseWidgetId} (원본: ${widgetId})`);
            
            const option = allWidgetOptions.find(opt => opt.id === baseWidgetId);
            if (!option) {
              console.warn(`❌ 위젯 ID ${widgetId} (기본 ID: ${baseWidgetId})를 찾을 수 없습니다.`);
              console.log('📋 사용 가능한 위젯 옵션 ID:', allWidgetOptions.map(opt => opt.id));
              continue;
            }
            
            console.log(`✅ 위젯 옵션 찾음: ${option.type}, 허용된 역할:`, option.allowedRoles);
            
            // 권한 체크: 사용자가 해당 위젯을 볼 수 있는지 확인
            if (userType && !option.allowedRoles.includes(userType)) {
              console.warn(`❌ 사용자 ${userType}는 위젯 ${widgetId}에 접근할 수 없습니다. (허용된 역할: ${option.allowedRoles.join(', ')})`);
              continue;
            }
            
            console.log(`✅ 권한 체크 통과: ${widgetId}`);

            let widgetConfig = {};
            try {
              widgetConfig = widgetConfigStr ? JSON.parse(widgetConfigStr) : {};
            } catch (e) {
              console.warn(`위젯 ${widgetId}의 config 파싱 실패:`, e);
            }

            const { type } = option;
            const { title, componentType, props: defaultProps } = generateWidgetContent(type);
            
            // 장부 관련 위젯의 경우 제목 업데이트
            let widgetTitle = title;
            if (widgetConfig.ledgerName) {
              if (type === 'tuition') {
                widgetTitle = `<i class="fas fa-money-bill-wave"></i> ${widgetConfig.ledgerName}`;
              } else if (type === 'budget-plan') {
                widgetTitle = `<i class="fas fa-money-bill-alt"></i> 예산 계획 (${widgetConfig.ledgerName})`;
              } else if (type === 'budget-execution') {
                widgetTitle = `<i class="fas fa-chart-pie"></i> 예산 집행 현황 (${widgetConfig.ledgerName})`;
              } else if (type === 'accounting-stats') {
                widgetTitle = `<i class="fas fa-chart-bar"></i> 회계 통계 (${widgetConfig.ledgerName})`;
              }
            }
            
            // 장부 관련 위젯의 경우 데이터 자동 로드
            let finalProps = {
              ...defaultProps,
              ...widgetConfig
            };
            
            // tuition 위젯은 장부 선택 없이 모든 장부 표시
            if (type === 'tuition') {
              finalProps.items = []; // 로딩 중 표시 (모든 장부 잔액 로드)
            } else if ((type === 'budget-plan' || type === 'budget-execution' || type === 'accounting-stats') 
                && widgetConfig.spreadsheetId) {
              // 데이터는 나중에 useEffect에서 로드하도록 플래그만 설정
              // 여기서는 빈 배열로 설정하여 로딩 상태 표시
              if (type === 'budget-plan') {
                finalProps.data = []; // 로딩 중 표시
              }
            }
            
            // widgetOrder가 0이거나 없으면 배열 인덱스로 설정
            const finalOrder = widgetOrder > 0 ? widgetOrder : loadedWidgets.length + 1;
            
            loadedWidgets.push({
              id: widgetId,
              type,
              title: widgetTitle,
              componentType,
              props: finalProps,
              order: finalOrder
            });
          }
          
          // order 기준으로 정렬
          // order가 없거나 0인 경우를 위해 원본 인덱스도 함께 저장
          const widgetsWithIndex = loadedWidgets.map((widget, index) => ({
            widget,
            originalIndex: index,
            order: widget.order || 0
          }));
          
          widgetsWithIndex.sort((a, b) => {
            // order가 같으면 원본 인덱스로 정렬
            if (a.order === b.order) {
              return a.originalIndex - b.originalIndex;
            }
            // order가 0이면 뒤로
            if (a.order === 0) return 1;
            if (b.order === 0) return -1;
            return a.order - b.order;
          });
          
          // 정렬된 위젯으로 교체하고 order 재설정 (1부터 시작)
          loadedWidgets.length = 0;
          widgetsWithIndex.forEach((item, index) => {
            item.widget.order = index + 1;
            loadedWidgets.push(item.widget);
          });
          
          console.log(`✅ 최종 로드된 위젯 개수: ${loadedWidgets.length}`);
          console.log('📋 로드된 위젯 목록:', loadedWidgets.map(w => ({ id: w.id, type: w.type, order: w.order })));
          
          // 초기 로드된 위젯 설정을 prevWidgetConfigRef에 저장 (초기 로드 시 저장 방지)
          const initialConfig = loadedWidgets.map((widget, index) => {
            const config: Record<string, any> = {};
            if (widget.props.ledgerId) config.ledgerId = widget.props.ledgerId;
            if (widget.props.ledgerName) config.ledgerName = widget.props.ledgerName;
            if (widget.props.spreadsheetId) config.spreadsheetId = widget.props.spreadsheetId;
            return [widget.id, widget.type, index, JSON.stringify(config)];
          });
          prevWidgetConfigRef.current = JSON.stringify(initialConfig);
          
          setWidgets(loadedWidgets);
          console.log('✅ 위젯 상태 업데이트 완료');
        } catch (parseError) {
          console.error("위젯 데이터 파싱 오류:", parseError);
          setWidgets([]);
        }
      } else {
        setWidgets([]);
      }
      
    } catch (error: any) {
      console.error("Google Sheets 동기화 실패:", error);
      const errorMessage = error?.message || error?.error?.message || "알 수 없는 오류";
      const errorCode = error?.error?.code || error?.status;
      console.error("Error details:", {
        message: errorMessage,
        code: errorCode,
        error: error
      });
      
      // 에러가 발생해도 빈 배열로 설정하여 계속 진행
      setWidgets([]);
    } finally {
      setInitialLoadComplete(true);
    }
  };

  // 장부 접근 권한 확인 (집행부, 교수, 조교만)
  useEffect(() => {
    const checkAccountingAccess = async () => {
      // 역할이 집행부, 교수, 조교인 경우에만 확인
      if (userType !== 'std_council' && userType !== 'professor' && userType !== 'supp') {
        setHasAccountingAccess(false);
        return;
      }

      try {
        const response = await apiClient.getLedgerList();
        if (response.success && response.data && Array.isArray(response.data)) {
          // 접근 가능한 장부가 하나라도 있으면 true
          setHasAccountingAccess(response.data.length > 0);
        } else {
          setHasAccountingAccess(false);
        }
      } catch (error) {
        console.error('❌ 장부 접근 권한 확인 오류:', error);
        setHasAccountingAccess(false);
      }
    };

    if (user) {
      checkAccountingAccess();
    } else {
      setHasAccountingAccess(false);
    }
  }, [user, userType]);

  useEffect(() => {
    console.log('🔄 useEffect 트리거: hotPotatoDBSpreadsheetId =', hotPotatoDBSpreadsheetId);
    if (hotPotatoDBSpreadsheetId) {
      console.log('📞 syncWidgetsWithGoogleSheets 호출');
      syncWidgetsWithGoogleSheets();
    } else {
      console.warn('⚠️ hotPotatoDBSpreadsheetId가 없어서 위젯 동기화를 건너뜁니다.');
    }
  }, [hotPotatoDBSpreadsheetId]);

  useEffect(() => {
    // 초기 로드가 완료되지 않았거나 위젯이 없으면 저장하지 않음
    if (!initialLoadComplete) {
      console.log('⏳ 초기 로드 미완료, 저장 스킵');
      return;
    }
    
    // 위젯이 없고 prevWidgetConfigRef도 비어있으면 저장하지 않음 (초기 상태)
    if (widgets.length === 0 && prevWidgetConfigRef.current === '') {
      console.log('⏳ 위젯이 없고 초기 상태, 저장 스킵');
      return;
    }

    const saveWidgetsToGoogleSheets = async () => {
      if (!hotPotatoDBSpreadsheetId) return;
      
      try {
        const gapi = window.gapi;
        if (!gapi || !gapi.client || !gapi.client.sheets) {
          console.warn("Google Sheets API가 초기화되지 않았습니다.");
          return;
        }

        // 토큰 확인 및 재설정
        const token = localStorage.getItem('googleAccessToken');
        if (token) {
          try {
            // tokenManager를 사용하여 토큰 가져오기 (만료 체크 포함)
            const { tokenManager } = await import('../../../utils/auth/tokenManager');
            const validToken = tokenManager.get();
            if (validToken) {
              gapi.client.setToken({ access_token: validToken });
            } else {
              console.warn("토큰이 만료되었습니다. 재로그인이 필요할 수 있습니다.");
              // 만료된 토큰이어도 시도 (일부 경우 작동할 수 있음)
              try {
                const tokenData = JSON.parse(token);
                if (tokenData.accessToken) {
                  gapi.client.setToken({ access_token: tokenData.accessToken });
                }
              } catch (e) {
                // 토큰이 문자열인 경우
                gapi.client.setToken({ access_token: token });
              }
            }
          } catch (tokenError) {
            console.warn("토큰 설정 실패:", tokenError);
          }
        }

        // 시트 존재 여부 확인
        try {
          const spreadsheet = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: hotPotatoDBSpreadsheetId
          });
          
          const sheetExists = spreadsheet.result.sheets?.some(
            (sheet: any) => sheet.properties.title === SHEET_NAME
          );
          
          if (!sheetExists) {
            console.warn(`시트 "${SHEET_NAME}"가 존재하지 않습니다. 시트를 생성합니다.`);
            // 시트 생성
            await gapi.client.sheets.spreadsheets.batchUpdate({
              spreadsheetId: hotPotatoDBSpreadsheetId,
              resource: {
                requests: [{
                  addSheet: {
                    properties: {
                      title: SHEET_NAME,
                      gridProperties: {
                        rowCount: 1000,
                        columnCount: 4
                      }
                    }
                  }
                }]
              }
            });
            
            // 헤더 설정
          await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
              range: `${SHEET_NAME}!A1:D1`,
            valueInputOption: 'RAW',
            resource: {
                values: [['widget_id', 'widget_type', 'widget_order', 'widget_config']]
              }
            });
          }
        } catch (checkError: any) {
          // 401 오류인 경우 특별 처리
          if (checkError?.status === 401 || checkError?.result?.error?.code === 401) {
            console.warn("인증 오류가 발생했습니다. 토큰이 만료되었을 수 있습니다.");
            // 401 오류는 무시하고 계속 진행 (사용자가 재로그인할 수 있음)
          } else {
            console.error("시트 확인 중 오류:", checkError);
          }
          // 시트 확인 실패해도 계속 진행 (시트가 존재할 수 있음)
        }
        
        // 새로운 데이터 저장 (설정만 저장, 데이터 props는 제외)
        // 위젯을 order 기준으로 정렬하여 저장
        const sortedWidgets = [...widgets].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const rowsToSave = sortedWidgets.map((widget, index) => {
          // 설정 관련 props만 저장 (데이터 props는 제외)
          const config: Record<string, any> = {};
          
          // 장부 관련 설정만 저장
          if (widget.props.ledgerId) config.ledgerId = widget.props.ledgerId;
          if (widget.props.ledgerName) config.ledgerName = widget.props.ledgerName;
          if (widget.props.spreadsheetId) config.spreadsheetId = widget.props.spreadsheetId;
          
          // 데이터 props는 저장하지 않음 (items, data, rawData 등)
          
          return [
            widget.id,
            widget.type,
            index + 1, // widget_order (1부터 시작)
            JSON.stringify(config)
          ];
        });
        
        // 현재 설정을 문자열로 변환하여 이전 설정과 비교
        const currentConfig = JSON.stringify(rowsToSave);
        
        // 설정이 변경되지 않았으면 저장하지 않음
        if (currentConfig === prevWidgetConfigRef.current) {
          console.log('📝 위젯 설정 변경 없음, 저장 스킵');
          return;
        }
        
        // 설정이 변경되었으면 저장
        console.log('💾 위젯 설정 변경 감지, 저장 시작');
        
        // 저장 실행
        if (rowsToSave.length > 0) {
          // 1. 먼저 기존 데이터 범위 확인
          let existingRowCount = 0;
          try {
            const existingData = await gapi.client.sheets.spreadsheets.values.get({
              spreadsheetId: hotPotatoDBSpreadsheetId,
              range: `${SHEET_NAME}!A2:D1000` // 충분히 큰 범위
            });
            
            if (existingData.result.values) {
              // 빈 행 제외하고 실제 데이터 행 수 계산
              existingRowCount = existingData.result.values.filter((row: any[]) => 
                row && row.length > 0 && row[0] && row[0].toString().trim() !== ''
              ).length;
            }
          } catch (getError) {
            console.warn("기존 데이터 확인 중 오류 (무시됨):", getError);
          }
          
          // 2. 새로운 데이터 저장
          // A2부터 시작하므로, rowsToSave.length가 7이면 A2~A8까지 (7개 행)
          // 범위는 A2:D8이 되어야 함 (A2 + rowsToSave.length - 1 = A8)
          const startRow = 2; // A2부터 시작
          const endRow = startRow + rowsToSave.length - 1; // 마지막 행 번호
          const saveRange = `${SHEET_NAME}!A${startRow}:D${endRow}`;
          
          console.log(`💾 저장 범위: ${saveRange}, 저장할 행 수: ${rowsToSave.length}, 기존 행 수: ${existingRowCount}`);
          
          await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: saveRange,
            valueInputOption: 'RAW',
            resource: {
              values: rowsToSave
            },
          });
          
          // 3. 저장한 행보다 많은 기존 행이 있으면 삭제
          // endRow 다음 행부터 삭제 시작 (endRow + 1)
          if (existingRowCount > rowsToSave.length) {
            const clearStartRow = endRow + 1; // 저장한 마지막 행 다음 행
            const clearEndRow = startRow + existingRowCount - 1; // 기존 데이터의 마지막 행
            const clearRange = `${SHEET_NAME}!A${clearStartRow}:D${clearEndRow}`;
            try {
              await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: hotPotatoDBSpreadsheetId,
                range: clearRange
              });
              console.log(`🗑️ 남은 행 삭제 완료: ${clearRange} (${existingRowCount - rowsToSave.length}개 행)`);
            } catch (clearError) {
              console.warn("남은 행 삭제 중 오류 (무시됨):", clearError);
            }
          }
          
          console.log('✅ 위젯 설정 저장 완료:', rowsToSave.length, '개');
        } else {
          // 위젯이 없으면 A2부터 D2까지만 비우기
          await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: hotPotatoDBSpreadsheetId,
            range: `${SHEET_NAME}!A2:D2`
          });
          console.log('✅ 위젯 설정 삭제 완료 (빈 배열)');
        }
        
        // 저장 성공 후에만 prevWidgetConfigRef 업데이트
        prevWidgetConfigRef.current = currentConfig;
      } catch (error: any) {
        console.error("Error saving widget data to Google Sheets:", error);
        const errorMessage = error?.message || error?.error?.message || "알 수 없는 오류";
        const errorCode = error?.error?.code || error?.status;
        const errorStatus = error?.result?.error?.status || error?.error?.status;
        
        console.error("Error details:", {
          message: errorMessage,
          code: errorCode,
          status: errorStatus,
          error: error
        });
        
        // 401 오류인 경우 사용자에게 알림 (하지만 앱은 계속 실행)
        if (errorCode === 401 || errorStatus === 401 || errorStatus === 'UNAUTHENTICATED') {
          console.warn("⚠️ 인증 오류: 토큰이 만료되었거나 권한이 부족합니다. 위젯 저장이 실패했지만 앱은 계속 실행됩니다.");
          // 사용자에게 알림을 표시하지 않고 조용히 실패 (위젯은 메모리에 유지됨)
        }
      }
    };

    saveWidgetsToGoogleSheets();
  }, [widgets, hotPotatoDBSpreadsheetId, initialLoadComplete]);

  useEffect(() => {
    // 위젯이 변경되지 않았으면 데이터 로딩 스킵 (초기 로드 완료 후)
    if (!initialLoadComplete) {
      // 초기 로드 중에는 계속 진행
    }
    
    const noticeWidget = widgets.find(w => w.type === 'notice');
    const calendarWidget = widgets.find(w => w.type === 'calendar');
    const workflowWidget = widgets.find(w => w.type === 'workflow-status');
    const studentSummaryWidget = widgets.find(w => w.type === 'student-summary');
    const staffSummaryWidget = widgets.find(w => w.type === 'staff-summary');
    const userApprovalWidget = widgets.find(w => w.type === 'user-approval');
    const systemStatsWidget = widgets.find(w => w.type === 'system-stats');
    const documentManagementWidget = widgets.find(w => w.type === 'document-management');
    const budgetExecutionWidget = widgets.find(w => w.type === 'budget-execution');
    const accountingStatsWidget = widgets.find(w => w.type === 'accounting-stats');
    const accountingStatsWidgetWithLedger = widgets.find(w => w.type === 'accounting-stats' && w.props.spreadsheetId);
    const tuitionWidget = widgets.find(w => w.type === 'tuition'); // 장부 선택 없이 모든 장부 표시
    const budgetPlanWidget = widgets.find(w => w.type === 'budget-plan' && w.props.spreadsheetId);

    // 에러 발생 후 일정 시간(5분)이 지나지 않았으면 재시도하지 않음
    const canRetry = (widgetType: string) => {
      const errorTime = errorWidgetsRef.current[widgetType];
      if (errorTime) {
        const timeSinceError = Date.now() - errorTime;
        if (timeSinceError < 5 * 60 * 1000) { // 5분
          return false;
        }
        // 5분이 지났으면 에러 기록 제거
        delete errorWidgetsRef.current[widgetType];
      }
      return true;
    };

    // 위젯이 있고 데이터가 없고, 로딩 중이 아니고, 에러 재시도 가능한 경우에만 로드
    // 조교(supp)는 studentId가 없을 수 있으므로 userType만 체크
    const shouldLoadNotice = noticeWidget && user && user.userType && 
      !loadingWidgetsRef.current.has('notice') && 
      canRetry('notice') &&
      (!noticeWidget.props.items || noticeWidget.props.items.length === 0);
    const shouldLoadCalendar = calendarWidget && user && 
      !loadingWidgetsRef.current.has('calendar') && 
      canRetry('calendar') &&
      (!calendarWidget.props.items || calendarWidget.props.items.length === 0);
    const shouldLoadWorkflow = workflowWidget && user && 
      !loadingWidgetsRef.current.has('workflow-status') && 
      canRetry('workflow-status') &&
      (!workflowWidget.props.items || workflowWidget.props.items.length === 0);
    const shouldLoadStudentSummary = studentSummaryWidget && user && 
      !loadingWidgetsRef.current.has('student-summary') && 
      canRetry('student-summary') &&
      (!studentSummaryWidget.props.items || studentSummaryWidget.props.items.length === 0);
    const shouldLoadStaffSummary = staffSummaryWidget && user && 
      !loadingWidgetsRef.current.has('staff-summary') && 
      canRetry('staff-summary') &&
      (!staffSummaryWidget.props.items || staffSummaryWidget.props.items.length === 0);
    const shouldLoadUserApproval = userApprovalWidget && user && 
      !loadingWidgetsRef.current.has('user-approval') && 
      canRetry('user-approval') &&
      (!userApprovalWidget.props.items || userApprovalWidget.props.items.length === 0);
    const shouldLoadSystemStats = systemStatsWidget && user && 
      !loadingWidgetsRef.current.has('system-stats') && 
      canRetry('system-stats') &&
      (!systemStatsWidget.props.items || systemStatsWidget.props.items.length === 0);
    const shouldLoadDocumentManagement = documentManagementWidget && user && 
      !loadingWidgetsRef.current.has('document-management') && 
      canRetry('document-management') &&
      (!documentManagementWidget.props.items || documentManagementWidget.props.items.length === 0);
    // 장부가 선택된 accounting-stats 위젯도 데이터 로드 (새로고침 없이 즉시 표시)
    const shouldLoadAccountingStats = accountingStatsWidget && user && 
      !loadingWidgetsRef.current.has('accounting-stats') && 
      canRetry('accounting-stats') &&
      (!loadedData['accounting-stats'] || 
       (accountingStatsWidget.props.spreadsheetId && (!accountingStatsWidget.props.items || accountingStatsWidget.props.items.length === 0)));
    // 회계 장부 위젯: 권한이 있는 모든 장부의 잔액 표시 (장부 선택 불필요)
    const shouldLoadTuition = tuitionWidget && user && 
      !loadingWidgetsRef.current.has('tuition') && 
      canRetry('tuition') &&
      (!tuitionWidget.props.items || tuitionWidget.props.items.length === 0);
    // 장부가 선택된 budget-plan 위젯도 데이터 로드 (새로고침 없이 즉시 표시)
    // spreadsheetId가 있고, loadedData 플래그가 없고, items가 없는 경우에만 로드
    // spreadsheetId를 키로 사용하여 각 장부별로 로드 상태 관리
    const budgetPlanKey = budgetPlanWidget?.props.spreadsheetId ? `budget-plan-${budgetPlanWidget.props.spreadsheetId}` : 'budget-plan';
    const shouldLoadBudgetPlan = budgetPlanWidget && user && 
      budgetPlanWidget.props.spreadsheetId && // spreadsheetId가 있어야 함
      !loadingWidgetsRef.current.has('budget-plan') && 
      canRetry('budget-plan') &&
      !loadedData[budgetPlanKey] && // 해당 spreadsheetId에 대해 이미 로드된 경우 재조회하지 않음
      (!budgetPlanWidget.props.items || budgetPlanWidget.props.items.length === 0); // items가 없거나 비어있을 때만
    // 장부가 선택된 budget-execution 위젯도 데이터 로드
    const shouldLoadBudgetExecution = budgetExecutionWidget && user && 
      !loadingWidgetsRef.current.has('budget-execution') && 
      canRetry('budget-execution') &&
      (!loadedData['budget-execution'] || 
       (budgetExecutionWidget.props.spreadsheetId && (!budgetExecutionWidget.props.items || budgetExecutionWidget.props.items.length === 0)));

    if (!shouldLoadNotice && !shouldLoadCalendar && !shouldLoadWorkflow && 
        !shouldLoadStudentSummary && !shouldLoadStaffSummary && !shouldLoadUserApproval && 
        !shouldLoadSystemStats && !shouldLoadDocumentManagement && !shouldLoadBudgetExecution && !shouldLoadAccountingStats &&
        !shouldLoadTuition && !shouldLoadBudgetPlan) {
      return;
    }

    const loadAllWidgetData = async () => {
      let noticeItems: string[] | null = null;
      let calendarItems: { date: string, event: string }[] | null = null;
      let workflowItems: { title: string; status: string; date: string }[] | null = null;
      let studentSummaryItems: { label: string; value: string }[] | null = null;
      let staffSummaryItems: { label: string; value: string }[] | null = null;
      let userApprovalItems: { name: string; email: string; userType: string }[] | null = null;
      let systemStatsItems: { label: string; value: string }[] | null = null;
      let documentManagementItems: { title: string; date: string; type: string }[] | null = null;
      let budgetExecutionItems: { label: string; reviewerCount: string; reviewProgress: number; approvalProgress: number; executionProgress: number }[] | null = null;
      let accountingStatsItems: { label: string; income: string; expense: string; balance: string; balanceValue?: number }[] | null = null;
      let accountingStatsRawData: { category: string; income: number; expense: number }[] | null = null;
      let tuitionItems: string[] | null = null;

      // 독립적인 위젯들을 병렬로 로드
      const loadPromises: Promise<void>[] = [];

      // 공지사항 로드
      // 조교(supp)는 studentId가 없을 수 있으므로 email이나 다른 식별자 사용
      if (shouldLoadNotice && user?.userType) {
        const userId = user.studentId || user.email || user.id || '';
        if (userId) {
          loadingWidgetsRef.current.add('notice');
          loadPromises.push(
            (async () => {
              try {
                const announcements = await fetchAnnouncements(userId, user.userType!);
                noticeItems = announcements.slice(0, 4).map(a => a.title);
                delete errorWidgetsRef.current['notice'];
              } catch (error: any) {
                console.error("Error loading notice data:", error);
                if (error?.code === 429 || error?.status === 429) {
                  errorWidgetsRef.current['notice'] = Date.now();
                }
              } finally {
                loadingWidgetsRef.current.delete('notice');
              }
            })()
          );
        }
      }

      // 캘린더 로드
      if (shouldLoadCalendar) {
        loadingWidgetsRef.current.add('calendar');
        loadPromises.push(
          (async () => {
        try {
          const events = await fetchCalendarEvents();
          calendarItems = events.slice(0, 4).map(e => ({ date: e.startDate, event: e.title }));
              delete errorWidgetsRef.current['calendar'];
            } catch (error: any) {
          console.error("Error loading calendar data:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['calendar'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('calendar');
            }
          })()
        );
      }

      // 워크플로우 로드
      if (shouldLoadWorkflow && user?.email) {
        loadingWidgetsRef.current.add('workflow-status');
        loadPromises.push(
          (async () => {
            try {
              const response = await apiClient.getMyPendingWorkflows({ userEmail: user.email! });
              if (response.success && response.data) {
                workflowItems = response.data.slice(0, 5).map((w: any) => ({
                  title: w.documentTitle || w.title || '제목 없음',
                  status: w.status || '대기',
                  date: w.requestedDate || w.createdDate || ''
                }));
              }
              delete errorWidgetsRef.current['workflow-status'];
            } catch (error: any) {
              console.error("Error loading workflow data:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['workflow-status'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('workflow-status');
            }
          })()
        );
      }

      // 학생 관리 로드
      if (shouldLoadStudentSummary) {
        loadingWidgetsRef.current.add('student-summary');
        loadPromises.push(
          (async () => {
            try {
              const { initializeSpreadsheetIds } = await import("../../../utils/database/papyrusManager");
              const ids = await initializeSpreadsheetIds();
              if (ids.studentSpreadsheetId) {
                const students = await fetchStudents(ids.studentSpreadsheetId);
                
                // 상태별, 학년별로 그룹화
                // 유급은 flunk 필드로 확인 (flunk가 'O'이면 유급, 빈칸이면 유급 아님)
                const statusGradeMap: Record<string, Record<string, number>> = {};
                students.forEach(s => {
                  const grade = s.grade || '1';
                  
                  // 유급 여부 확인 (flunk 필드가 'O'이면 유급)
                  const isFlunk = s.flunk && s.flunk.toString().trim().toUpperCase() === 'O';
                  
                  // 상태 결정: 유급이면 '유급', 아니면 state 필드 값 사용 (기본값: '재학')
                  let status = s.state || '재학';
                  if (isFlunk) {
                    status = '유급';
                  } else if (!s.state || s.state.trim() === '') {
                    status = '재학';
                  }
                  
                  if (!statusGradeMap[status]) {
                    statusGradeMap[status] = {};
                  }
                  statusGradeMap[status][grade] = (statusGradeMap[status][grade] || 0) + 1;
                });
                
                // rawData 생성 (상태별, 학년별 학생 수)
                const studentSummaryRawData: { status: string; grade: string; count: number }[] = [];
                Object.keys(statusGradeMap).forEach(status => {
                  Object.keys(statusGradeMap[status]).forEach(grade => {
                    studentSummaryRawData.push({
                      status,
                      grade,
                      count: statusGradeMap[status][grade]
                    });
                  });
                });
                
                // 기본 표시용 (재학생 기준)
                const enrolledByGrade = statusGradeMap['재학'] || {};
                studentSummaryItems = [
                  { label: '1학년', value: `${enrolledByGrade['1'] || 0}명` },
                  { label: '2학년', value: `${enrolledByGrade['2'] || 0}명` },
                  { label: '3학년', value: `${enrolledByGrade['3'] || 0}명` },
                  { label: '4학년', value: `${enrolledByGrade['4'] || 0}명` },
                ];
                
                // rawData를 위젯에 저장하기 위해 별도로 처리
                if (studentSummaryWidget) {
                  setWidgets(prevWidgets => prevWidgets.map(w => 
                    w.id === studentSummaryWidget.id 
                      ? { ...w, props: { ...w.props, items: studentSummaryItems, rawData: studentSummaryRawData, selectedStatus: w.props.selectedStatus || '재학' } }
                      : w
                  ));
                  // studentSummaryItems는 null로 설정하여 중복 업데이트 방지
                  studentSummaryItems = null;
                }
              }
              delete errorWidgetsRef.current['student-summary'];
            } catch (error: any) {
              console.error("Error loading student summary:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['student-summary'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('student-summary');
            }
          })()
        );
      }

      // 교직원 관리 로드
      if (shouldLoadStaffSummary) {
        loadingWidgetsRef.current.add('staff-summary');
        loadPromises.push(
          (async () => {
            try {
              const { initializeSpreadsheetIds } = await import("../../../utils/database/papyrusManager");
              const ids = await initializeSpreadsheetIds();
              if (ids.staffSpreadsheetId) {
                const staff = await fetchStaffFromPapyrus(ids.staffSpreadsheetId);
                const totalStaff = staff.length;
                staffSummaryItems = [
                  { label: '전체 교직원', value: `${totalStaff}명` },
                ];
              }
              delete errorWidgetsRef.current['staff-summary'];
            } catch (error: any) {
              console.error("Error loading staff summary:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['staff-summary'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('staff-summary');
            }
          })()
        );
      }

      // 사용자 승인 대기 로드
      if (shouldLoadUserApproval) {
        loadingWidgetsRef.current.add('user-approval');
        loadPromises.push(
          (async () => {
            try {
              const response = await apiClient.getPendingUsers();
              if (response.success && response.users) {
                userApprovalItems = response.users.slice(0, 5).map((u: any) => ({
                  name: u.name_member || u.name || '이름 없음',
                  email: u.google_member || u.email || '',
                  userType: u.user_type || u.userType || 'student'
                }));
              }
              delete errorWidgetsRef.current['user-approval'];
            } catch (error: any) {
              console.error("Error loading user approval data:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['user-approval'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('user-approval');
            }
          })()
        );
      }

      // 시스템 통계 로드
      if (shouldLoadSystemStats) {
        loadingWidgetsRef.current.add('system-stats');
        loadPromises.push(
          (async () => {
            try {
              const [allUsersResponse, pendingUsersResponse] = await Promise.all([
                apiClient.getAllUsers(),
                apiClient.getPendingUsers()
              ]);
              
              const totalUsers = allUsersResponse.success && allUsersResponse.users ? allUsersResponse.users.length : 0;
              const pendingUsers = pendingUsersResponse.success && pendingUsersResponse.users ? pendingUsersResponse.users.length : 0;
              const approvedUsers = totalUsers - pendingUsers;

              systemStatsItems = [
                { label: '전체 사용자', value: `${totalUsers}명` },
                { label: '승인된 사용자', value: `${approvedUsers}명` },
                { label: '승인 대기', value: `${pendingUsers}명` },
              ];
              delete errorWidgetsRef.current['system-stats'];
            } catch (error: any) {
              console.error("Error loading system stats:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['system-stats'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('system-stats');
            }
          })()
        );
      }

      // 문서 관리 로드
      if (shouldLoadDocumentManagement) {
        loadingWidgetsRef.current.add('document-management');
        loadPromises.push(
          (async () => {
            try {
              const { getRecentDocuments } = await import("../../../utils/helpers/localStorageUtils");
              const recentDocs = getRecentDocuments();
              documentManagementItems = recentDocs.slice(0, 5).map((doc: any) => ({
                title: doc.title || doc.name || '제목 없음',
                date: doc.lastModified || doc.date || '',
                type: doc.documentType || (doc.isPersonal ? 'personal' : 'shared'),
                url: doc.url || undefined
              }));
              delete errorWidgetsRef.current['document-management'];
            } catch (error: any) {
              console.error("Error loading document management data:", error);
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['document-management'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('document-management');
            }
          })()
        );
      }

      // 예산 집행 현황 (동기 처리 - 간단한 메시지만)
      // 예산 집행 현황 데이터 로드
      if (shouldLoadBudgetExecution && budgetExecutionWidget?.props.spreadsheetId) {
        loadingWidgetsRef.current.add('budget-execution');
        loadPromises.push(
          (async () => {
            try {
              const spreadsheetId = budgetExecutionWidget.props.spreadsheetId as string;
              const { getBudgetPlans } = await import("../../../utils/database/accountingBudgetManager");
              const { getLedgerEntries } = await import("../../../utils/database/accountingManager");
              
              // 모든 예산 계획 가져오기 (대기, 검토, 승인, 집행 모두 포함)
              const budgetPlans = await getBudgetPlans(spreadsheetId);
              // 모든 상태의 예산안 포함 (pending, reviewed, approved, executed)
              const allPlans = budgetPlans.filter(plan => 
                plan.status === 'pending' || 
                plan.status === 'reviewed' || 
                plan.status === 'approved' || 
                plan.status === 'executed'
              );
              
              if (allPlans.length === 0) {
                budgetExecutionItems = [
                  { label: '예산 계획이 없습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
                ];
                delete errorWidgetsRef.current['budget-execution'];
                return;
              }
              
              // 통장 정보 가져오기 (검토자 수 계산용)
              const { getAccounts } = await import("../../../utils/database/accountingManager");
              const accounts = await getAccounts(spreadsheetId);
              
              // 각 예산안의 집행 현황 계산
              const executionData: { label: string; reviewerCount: string; reviewProgress: number; approvalProgress: number; executionProgress: number }[] = [];
              
              for (const plan of allPlans.slice(0, 5)) { // 최대 5개만 표시
                // 통장 정보 가져오기
                const account = accounts.find(acc => acc.accountId === plan.accountId);
                const totalReviewers = account?.subManagerIds?.length || 0;
                const reviewedCount = plan.subManagerReviews?.length || 0;
                
                // 집행 완료된 예산안인지 확인
                const isExecuted = plan.status === 'executed' || (plan.executedDate && plan.executedDate.trim() !== '');
                
                // 집행 완료된 경우: 검토, 승인, 집행 모두 완료로 표시
                if (isExecuted) {
                  executionData.push({
                    label: plan.title.length > 20 ? plan.title.substring(0, 20) + '...' : plan.title,
                    reviewerCount: totalReviewers > 0 ? `${totalReviewers}/${totalReviewers}` : '0/0',
                    reviewProgress: 1, // 집행 완료 = 검토 완료
                    approvalProgress: 1, // 집행 완료 = 승인 완료
                    executionProgress: 1 // 집행 완료
                  });
                  continue;
                }
                
                // 집행 미완료인 경우: 실제 상태 반영
                // 검토자 수 표시
                const reviewerCount = totalReviewers > 0 ? `${reviewedCount}/${totalReviewers}` : '0/0';
                
                // 검토 진척도 (검토 완료 수 / 전체 검토자 수)
                const reviewProgress = (totalReviewers > 0 && !isNaN(reviewedCount) && !isNaN(totalReviewers)) 
                  ? Math.min(reviewedCount / totalReviewers, 1) 
                  : 0;
                
                // 승인 진척도 (승인 완료 = 1, 미승인 = 0)
                const approvalProgress = plan.mainManagerApproved ? 1 : 0;
                
                // 집행 진척도 (집행 완료 = 1, 미집행 = 0)
                const executionProgress = 0;
                
                executionData.push({
                  label: plan.title.length > 20 ? plan.title.substring(0, 20) + '...' : plan.title,
                  reviewerCount,
                  reviewProgress: isNaN(reviewProgress) ? 0 : Math.min(reviewProgress, 1),
                  approvalProgress: isNaN(approvalProgress) ? 0 : approvalProgress,
                  executionProgress: isNaN(executionProgress) ? 0 : executionProgress
                });
              }
              
              budgetExecutionItems = executionData.length > 0 ? executionData : [
                { label: '예산 계획이 없습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
              ];
              
              delete errorWidgetsRef.current['budget-execution'];
            } catch (error: any) {
              console.error("Error loading budget execution data:", error);
              budgetExecutionItems = [
                { label: '데이터를 불러오는 중 오류가 발생했습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
              ];
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['budget-execution'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('budget-execution');
            }
          })()
        );
      } else if (shouldLoadBudgetExecution) {
        // 장부가 선택되지 않은 경우
        budgetExecutionItems = [
          { label: '장부를 선택해주세요', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
        ];
      }

      // 회계 통계 기본 메시지 (동기 처리)
      if (shouldLoadAccountingStats) {
        try {
          accountingStatsItems = [
            { label: '장부를 선택해주세요', income: '-', expense: '-', balance: '-' }
          ];
        } catch (error) {
          console.error("Error loading accounting stats data:", error);
        }
      }

      // 장부가 선택된 회계 통계 위젯 데이터 로드 (카테고리별 수입/지출 집계)
      // items가 없거나, rawData가 없는 경우 로드
      const needsAccountingStatsData = accountingStatsWidgetWithLedger && user && 
        !loadingWidgetsRef.current.has('accounting-stats') && 
        canRetry('accounting-stats') && 
        (!accountingStatsWidgetWithLedger.props.items || 
         accountingStatsWidgetWithLedger.props.items.length === 0 || 
         (accountingStatsWidgetWithLedger.props.items.length === 1 && accountingStatsWidgetWithLedger.props.items[0].label === '장부를 선택해주세요') ||
         !accountingStatsWidgetWithLedger.props.rawData); // rawData가 없으면 다시 로드
      
      if (needsAccountingStatsData) {
        loadingWidgetsRef.current.add('accounting-stats');
        loadPromises.push(
          (async () => {
            try {
              const { getAccountingCategorySummary } = await import("../../../utils/google/googleSheetUtils");
              const summary = await getAccountingCategorySummary(accountingStatsWidgetWithLedger.props.spreadsheetId);
              if (summary && summary.length > 0) {
                // 원본 데이터 저장 (통합 보기용)
                accountingStatsRawData = summary;
                // 카테고리별 잔액만 표시 (수입 - 지출)
                accountingStatsItems = summary.map((item) => {
                  const balance = item.income - item.expense;
                  const balanceStr = balance >= 0 
                    ? `+${balance.toLocaleString()}원` 
                    : `${balance.toLocaleString()}원`;
                  return {
                    label: item.category,
                    income: '', // 사용하지 않음
                    expense: '', // 사용하지 않음
                    balance: balanceStr,
                    balanceValue: balance // 색상 구분용
                  };
                });
              } else {
                accountingStatsRawData = [];
                accountingStatsItems = [];
              }
              setLoadedData(prev => ({ ...prev, 'accounting-stats': true }));
              delete errorWidgetsRef.current['accounting-stats'];
            } catch (error: any) {
              console.error("Error loading accounting stats data:", error);
              if (error?.code === 429 || error?.status === 429 || (error?.message && error.message.includes('Quota exceeded'))) {
                errorWidgetsRef.current['accounting-stats'] = Date.now();
                console.warn('⚠️ 회계 통계 데이터 로드 실패 (할당량 초과). 5분 후 재시도됩니다.');
              }
              setLoadedData(prev => ({ ...prev, 'accounting-stats': true }));
            } finally {
              loadingWidgetsRef.current.delete('accounting-stats');
            }
          })()
        );
      }

      // 회계 장부 위젯 데이터 로드 (권한이 있는 모든 장부의 잔액 표시)
      if (shouldLoadTuition && tuitionWidget) {
        loadingWidgetsRef.current.add('tuition');
        loadPromises.push(
          (async () => {
            try {
              // 권한이 있는 모든 장부 목록 가져오기
              const ledgersResponse = await apiClient.getLedgerList();
              if (ledgersResponse.success && ledgersResponse.data && ledgersResponse.data.length > 0) {
                const { getLedgerBalance } = await import("../../../utils/google/googleSheetUtils");
                
                // 각 장부의 잔액 계산
                const ledgerBalances = await Promise.all(
                  ledgersResponse.data.map(async (ledger: any) => {
                    try {
                      const balance = await getLedgerBalance(ledger.spreadsheetId);
                      return {
                        name: ledger.folderName || ledger.name || '알 수 없음',
                        balance: balance
                      };
                    } catch (error) {
                      console.error(`장부 ${ledger.folderName} 잔액 계산 오류:`, error);
                      return {
                        name: ledger.folderName || ledger.name || '알 수 없음',
                        balance: 0
                      };
                    }
                  })
                );
                
                // 장부명: 잔액 형태로 변환
                tuitionItems = ledgerBalances.map((item) => 
                  `${item.name}: ${item.balance.toLocaleString()}원`
                );
              } else {
                tuitionItems = ['권한이 있는 장부가 없습니다.'];
              }
              delete errorWidgetsRef.current['tuition'];
            } catch (error: any) {
              console.error("Error loading tuition data:", error);
              tuitionItems = ['데이터를 불러오는 중 오류가 발생했습니다.'];
              if (error?.code === 429 || error?.status === 429) {
                errorWidgetsRef.current['tuition'] = Date.now();
              }
            } finally {
              loadingWidgetsRef.current.delete('tuition');
            }
          })()
        );
      }

      // 장부가 선택된 예산계획 위젯 데이터 로드 (검토/승인/집행 대기 항목)
      let budgetPlanItems: { budget_id: string; title: string; total_amount: number; status: string; action_required: string }[] | null = null;
      if (shouldLoadBudgetPlan && budgetPlanWidget?.props.spreadsheetId && user?.email) {
        loadingWidgetsRef.current.add('budget-plan');
        loadPromises.push(
          (async () => {
            try {
              const { getPendingBudgetPlans } = await import("../../../utils/google/googleSheetUtils");
              const pendingItems = await getPendingBudgetPlans(budgetPlanWidget.props.spreadsheetId, user.email);
              if (pendingItems && pendingItems.length > 0) {
                budgetPlanItems = pendingItems;
              } else {
                budgetPlanItems = [];
              }
              // 성공 시 loadedData 플래그 설정 (spreadsheetId를 키로 사용)
              const budgetPlanKey = budgetPlanWidget.props.spreadsheetId ? `budget-plan-${budgetPlanWidget.props.spreadsheetId}` : 'budget-plan';
              setLoadedData(prev => ({ ...prev, [budgetPlanKey]: true }));
              // 에러 기록 제거
              delete errorWidgetsRef.current['budget-plan'];
            } catch (error: any) {
              console.error("Error loading budget plan data:", error);
              // 429 에러 등 API 할당량 초과 시 재시도 방지
              if (error?.code === 429 || error?.status === 429 || (error?.message && error.message.includes('Quota exceeded'))) {
                errorWidgetsRef.current['budget-plan'] = Date.now();
                console.warn('⚠️ 예산 계획 데이터 로드 실패 (할당량 초과). 5분 후 재시도됩니다.');
              }
              // 에러 발생 시에도 loadedData 플래그 설정하여 무한 재시도 방지
              const budgetPlanKey = budgetPlanWidget.props.spreadsheetId ? `budget-plan-${budgetPlanWidget.props.spreadsheetId}` : 'budget-plan';
              setLoadedData(prev => ({ ...prev, [budgetPlanKey]: true }));
            } finally {
              loadingWidgetsRef.current.delete('budget-plan');
            }
          })()
        );
      }

      // 모든 독립적인 위젯들을 병렬로 로드
      await Promise.all(loadPromises);

      // Perform a single state update for widgets
      // 데이터 로딩 시에는 설정이 변경되지 않으므로 prevWidgetConfigRef 업데이트 불필요
      if (noticeItems || calendarItems || workflowItems || studentSummaryItems || 
          staffSummaryItems || userApprovalItems || systemStatsItems || 
          documentManagementItems || budgetExecutionItems || accountingStatsItems ||
          tuitionItems || budgetPlanItems) {
        setWidgets(prevWidgets => {
          // 데이터 로딩 전 설정 저장 (비교용)
          const beforeConfig = prevWidgets.map((widget, index) => {
            const config: Record<string, any> = {};
            if (widget.props.ledgerId) config.ledgerId = widget.props.ledgerId;
            if (widget.props.ledgerName) config.ledgerName = widget.props.ledgerName;
            if (widget.props.spreadsheetId) config.spreadsheetId = widget.props.spreadsheetId;
            return [widget.id, widget.type, index, JSON.stringify(config)];
          });
          
          const updatedWidgets = prevWidgets.map(widget => {
            if (widget.type === 'notice' && noticeItems) {
              return { ...widget, props: { ...widget.props, items: noticeItems } };
            }
            if (widget.type === 'calendar' && calendarItems) {
              return { ...widget, props: { ...widget.props, items: calendarItems } };
            }
            if (widget.type === 'workflow-status' && workflowItems) {
              return { ...widget, props: { ...widget.props, items: workflowItems } };
            }
            if (widget.type === 'student-summary' && studentSummaryItems) {
              return { ...widget, props: { ...widget.props, items: studentSummaryItems } };
            }
            if (widget.type === 'staff-summary' && staffSummaryItems) {
              return { ...widget, props: { ...widget.props, items: staffSummaryItems } };
            }
            if (widget.type === 'user-approval' && userApprovalItems) {
              return { ...widget, props: { ...widget.props, items: userApprovalItems } };
            }
            if (widget.type === 'system-stats' && systemStatsItems) {
              return { ...widget, props: { ...widget.props, items: systemStatsItems } };
            }
            if (widget.type === 'document-management' && documentManagementItems) {
              return { ...widget, props: { ...widget.props, items: documentManagementItems } };
            }
            if (widget.type === 'budget-execution' && budgetExecutionItems) {
              // 장부가 선택된 위젯인지 확인
              if (widget.props.spreadsheetId && budgetExecutionItems.length > 0 && budgetExecutionItems[0].label !== '장부를 선택해주세요') {
                return { ...widget, props: { ...widget.props, items: budgetExecutionItems } };
              } else if (!widget.props.spreadsheetId) {
                // 장부가 선택되지 않은 경우에만 초기 메시지 설정
                return { ...widget, props: { ...widget.props, items: budgetExecutionItems } };
              }
            }
            if (widget.type === 'accounting-stats' && accountingStatsItems) {
              // 장부가 선택된 위젯인지 확인
              if (widget.props.spreadsheetId && accountingStatsItems.length > 0 && accountingStatsItems[0].label !== '장부를 선택해주세요') {
                // rawData가 있으면 전달, 없으면 기존 rawData 유지 (이미 저장된 경우)
                const updatedProps: any = { ...widget.props, items: accountingStatsItems };
                if (accountingStatsRawData !== null && accountingStatsRawData !== undefined) {
                  updatedProps.rawData = accountingStatsRawData;
                } else if (!widget.props.rawData && widget.props.spreadsheetId) {
                  // rawData가 없고 spreadsheetId가 있으면 다시 로드 시도
                  console.warn('⚠️ accounting-stats 위젯에 rawData가 없습니다. spreadsheetId:', widget.props.spreadsheetId);
                }
                return { ...widget, props: updatedProps };
              } else if (!widget.props.spreadsheetId) {
                // 장부가 선택되지 않은 경우에만 초기 메시지 설정
                return { ...widget, props: { ...widget.props, items: accountingStatsItems } };
              }
            }
            if (widget.type === 'tuition' && tuitionItems) {
              return { ...widget, props: { ...widget.props, items: tuitionItems } };
            }
            if (widget.type === 'budget-plan' && budgetPlanItems !== null && widget.id === budgetPlanWidget?.id) {
              return { ...widget, props: { ...widget.props, items: budgetPlanItems } };
            }
            return widget;
          });
          
          // 데이터 로딩 후 설정 확인 (설정이 변경되지 않았으면 prevWidgetConfigRef 유지)
          const afterConfig = updatedWidgets.map((widget, index) => {
            const config: Record<string, any> = {};
            if (widget.props.ledgerId) config.ledgerId = widget.props.ledgerId;
            if (widget.props.ledgerName) config.ledgerName = widget.props.ledgerName;
            if (widget.props.spreadsheetId) config.spreadsheetId = widget.props.spreadsheetId;
            return [widget.id, widget.type, index, JSON.stringify(config)];
          });
          
          // 설정이 변경되지 않았으면 prevWidgetConfigRef 유지 (데이터 로딩만 있었음)
          if (JSON.stringify(beforeConfig) === JSON.stringify(afterConfig)) {
            // 설정 변경 없음, prevWidgetConfigRef는 그대로 유지
          } else {
            // 설정이 변경되었으면 업데이트 (장부 선택 등)
            prevWidgetConfigRef.current = JSON.stringify(afterConfig);
          }
          
          return updatedWidgets;
        });
      }

      // Update the loaded data flags
      setLoadedData(prev => ({
        ...prev,
        ...(shouldLoadNotice && { notice: true }),
        ...(shouldLoadCalendar && { calendar: true }),
        ...(shouldLoadWorkflow && { 'workflow-status': true }),
        ...(shouldLoadStudentSummary && { 'student-summary': true }),
        ...(shouldLoadStaffSummary && { 'staff-summary': true }),
        ...(shouldLoadUserApproval && { 'user-approval': true }),
        ...(shouldLoadSystemStats && { 'system-stats': true }),
        ...(shouldLoadDocumentManagement && { 'document-management': true }),
        ...(shouldLoadBudgetExecution && { 'budget-execution': true }),
        ...(shouldLoadAccountingStats && { 'accounting-stats': true }),
        ...(shouldLoadTuition && { tuition: true }),
        ...(shouldLoadBudgetPlan && { 'budget-plan': true }),
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

    // 세부 선택이 있는 위젯(budget-plan, budget-execution, accounting-stats)은 여러 개 추가 가능
    const widgetsWithSelection = ['budget-plan', 'budget-execution', 'accounting-stats'];
    const canHaveMultiple = widgetsWithSelection.includes(type);

    if (!canHaveMultiple && widgets.some(w => w.id === option.id)) {
      alert("이미 추가된 위젯입니다.");
      return;
    }

    // 세부 선택이 있는 위젯의 경우 고유한 ID 생성
    let widgetId = option.id;
    if (canHaveMultiple) {
      const existingCount = widgets.filter(w => w.type === type).length;
      widgetId = `${option.id}-${existingCount + 1}`;
    }

    const newWidgetData = generateWidgetContent(type);
    const newWidget: WidgetData = {
      id: widgetId,
      type,
      ...newWidgetData,
      order: widgets.length + 1, // 새 위젯은 마지막 순서
    };
    setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
    // 새로 추가된 위젯의 loadedData 플래그 리셋하여 즉시 데이터 로드
    setLoadedData(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
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
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    const newWidgets = [...widgets];
    const draggedWidget = newWidgets.splice(dragItem.current, 1)[0];
    newWidgets.splice(dragOverItem.current, 0, draggedWidget);
    
    // 순서 변경 후 order 속성 업데이트 (1부터 시작)
    const widgetsWithOrder = newWidgets.map((widget, index) => ({
      ...widget,
      order: index + 1
    }));
    
    dragItem.current = null;
    dragOverItem.current = null;
    setWidgets(widgetsWithOrder);
  };

  const openSheetSelectionModal = async (widgetId: string) => {
    try {
      setSelectedWidgetId(widgetId);
      
      // 회계 폴더 ID 가져오기
      const { apiClient } = await import("../../../utils/api/apiClient");
      const response = await apiClient.request('getAccountingFolderId', {});
      
      if (!response.success || !response.data?.accountingFolderId) {
        alert("회계 폴더를 찾을 수 없습니다.");
        return;
      }

      const accountingFolderId = response.data.accountingFolderId;

      // 회계 폴더 내 모든 장부 폴더 가져오기
      const gapi = window.gapi;
      if (!gapi || !gapi.client || !gapi.client.drive) {
        alert("Google Drive API가 초기화되지 않았습니다.");
        return;
      }

      const driveResponse = await gapi.client.drive.files.list({
        q: `'${accountingFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'name'
      });

      if (!driveResponse.result.files || driveResponse.result.files.length === 0) {
        alert("장부 폴더를 찾을 수 없습니다.");
        return;
      }

      // 각 장부 폴더 내 시트 목록 가져오기
      const allSheets: { id: string; name: string; ledgerName: string }[] = [];
      
      for (const folder of driveResponse.result.files) {
        const sheets = await getSheetsInFolder(folder.id!);
      if (sheets && sheets.length > 0) {
          sheets.forEach(sheet => {
            allSheets.push({
              id: sheet.id, // 스프레드시트 파일 ID (폴더 ID가 아님)
              name: sheet.name,
              ledgerName: folder.name!
            });
          });
        } else {
          // 시트를 찾을 수 없는 경우, 폴더 ID를 직접 사용하지 않고 경고만 표시
          console.warn(`⚠️ 장부 폴더 "${folder.name}" 내에 스프레드시트 파일을 찾을 수 없습니다.`);
        }
      }

      if (allSheets.length > 0) {
        setAccountingSheets(allSheets);
        setIsSheetModalOpen(true);
      } else {
        alert("장부 폴더에 시트 파일이 없습니다.");
      }
    } catch (error) {
      console.error("Error opening sheet selection modal:", error);
      alert("오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  const handleSheetSelect = async (sheet: { id: string; name: string; ledgerName?: string }) => {
    if (!selectedWidgetId) {
      console.error("No widget ID selected");
      alert("위젯 ID가 선택되지 않았습니다.");
      return;
    }

    try {
      console.log(`📊 장부 데이터 가져오기 시작: ${sheet.name} (ID: ${sheet.id})`);
      
      // 선택된 ID가 실제로 스프레드시트 ID인지 확인
      // 만약 폴더 ID라면 폴더 내에서 스프레드시트를 찾아야 함
      let spreadsheetId = sheet.id;
      
      // Google API 초기화 확인
      const gapi = window.gapi;
      if (!gapi || !gapi.client) {
        console.error("Google API가 초기화되지 않았습니다.");
        alert("Google API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.");
        setIsSheetModalOpen(false);
        setSelectedWidgetId(null);
        return;
      }

      // 토큰 확인 및 설정 (tokenManager 사용)
      try {
        const { tokenManager } = await import('../../../utils/auth/tokenManager');
        const validToken = tokenManager.get();
        if (!validToken) {
          console.error("Google Access Token이 없거나 만료되었습니다.");
          alert("Google 인증이 필요합니다. 다시 로그인해주세요.");
          setIsSheetModalOpen(false);
          setSelectedWidgetId(null);
          return;
        }
        gapi.client.setToken({ access_token: validToken });
      } catch (tokenError) {
        console.error("토큰 설정 실패:", tokenError);
        alert("인증 토큰 설정에 실패했습니다. 다시 로그인해주세요.");
        setIsSheetModalOpen(false);
        setSelectedWidgetId(null);
        return;
      }

      // 선택된 ID가 스프레드시트인지 확인 (폴더 ID가 아닌지)
      try {
        // 먼저 선택된 ID로 스프레드시트 메타데이터를 가져와서 확인
        const testResponse = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
        });
        console.log(`✅ 선택된 ID는 스프레드시트입니다: ${testResponse.result.properties?.title || '제목 없음'}`);
      } catch (testError: any) {
        // 스프레드시트가 아니면 폴더일 수 있음
        if (testError.status === 404 || testError.code === 404 || testError.result?.error?.code === 404) {
          console.log(`⚠️ 선택된 ID가 스프레드시트가 아닙니다. 폴더 내에서 스프레드시트를 찾습니다...`);
          const { getSheetsInFolder } = await import("../../../utils/google/driveUtils");
          const sheets = await getSheetsInFolder(spreadsheetId);
          if (sheets && sheets.length > 0) {
            spreadsheetId = sheets[0].id;
            console.log(`✅ 폴더 내 스프레드시트 찾음: ${sheets[0].name} (${spreadsheetId})`);
          } else {
            throw new Error("폴더 내에 스프레드시트 파일을 찾을 수 없습니다.");
          }
        } else {
          // 다른 오류는 그대로 전달
          throw testError;
        }
      }

      const data = await getAccountingData(spreadsheetId);
      console.log("Fetched accounting data (categories):", data);

      if (data === null) {
        alert("장부 데이터를 가져올 수 없습니다. 시트에 접근 권한이 있는지 확인해주세요.");
        setIsSheetModalOpen(false);
        setSelectedWidgetId(null);
        return;
      }

      // 장부 선택 후 위젯별 데이터 즉시 로드
      let accountingStatsItems: { label: string; income: string; expense: string; balance: string; balanceValue?: number }[] | null = null;
      let accountingStatsRawData: { category: string; income: number; expense: number }[] | null = null;
      let budgetExecutionItems: { label: string; reviewerCount: string; reviewProgress: number; approvalProgress: number; executionProgress: number }[] | null = null;
      
      const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
      
      // 회계 통계 위젯 데이터 로드
      if (selectedWidget?.type === 'accounting-stats' && user) {
        try {
          const { getAccountingCategorySummary } = await import("../../../utils/google/googleSheetUtils");
          const summary = await getAccountingCategorySummary(spreadsheetId);
          if (summary && summary.length > 0) {
            accountingStatsRawData = summary;
            accountingStatsItems = summary.map((item) => {
              const balance = item.income - item.expense;
              const balanceStr = balance >= 0 
                ? `+${balance.toLocaleString()}원` 
                : `${balance.toLocaleString()}원`;
              return {
                label: item.category,
                income: '',
                expense: '',
                balance: balanceStr,
                balanceValue: balance
              };
            });
          } else {
            accountingStatsItems = [];
            accountingStatsRawData = [];
          }
        } catch (error) {
          console.error("Error loading accounting stats data immediately:", error);
        }
      }
      
      // 예산 계획 위젯 데이터 로드
      let budgetPlanItems: { budget_id: string; title: string; total_amount: number; status: string; action_required: string }[] | null = null;
      if (selectedWidget?.type === 'budget-plan' && user) {
        try {
          const { getPendingBudgetPlans } = await import("../../../utils/google/googleSheetUtils");
          const pendingItems = await getPendingBudgetPlans(spreadsheetId, user.email);
          if (pendingItems && pendingItems.length > 0) {
            budgetPlanItems = pendingItems;
          } else {
            budgetPlanItems = [];
          }
        } catch (error) {
          console.error("Error loading budget plan data immediately:", error);
        }
      }
      
      // 예산 집행 현황 위젯 데이터 로드
      if (selectedWidget?.type === 'budget-execution' && user && spreadsheetId) {
        try {
          const { getBudgetPlans } = await import("../../../utils/database/accountingBudgetManager");
          const { getLedgerEntries } = await import("../../../utils/database/accountingManager");
          
          // 모든 예산 계획 가져오기 (대기, 검토, 승인, 집행 모두 포함)
          const budgetPlans = await getBudgetPlans(spreadsheetId);
          // 모든 상태의 예산안 포함 (pending, reviewed, approved, executed)
          const allPlans = budgetPlans.filter(plan => 
            plan.status === 'pending' || 
            plan.status === 'reviewed' || 
            plan.status === 'approved' || 
            plan.status === 'executed'
          );
          
          if (allPlans.length === 0) {
            budgetExecutionItems = [
              { label: '예산 계획이 없습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
            ];
          } else {
            // 통장 정보 가져오기 (검토자 수 계산용)
            const { getAccounts } = await import("../../../utils/database/accountingManager");
            const accounts = await getAccounts(spreadsheetId);
            
            // 각 예산안의 집행 현황 계산
            const executionData: { label: string; reviewerCount: string; reviewProgress: number; approvalProgress: number; executionProgress: number }[] = [];
            
            for (const plan of allPlans.slice(0, 5)) { // 최대 5개만 표시
              // 통장 정보 가져오기
              const account = accounts.find(acc => acc.accountId === plan.accountId);
              const totalReviewers = account?.subManagerIds?.length || 0;
              const reviewedCount = plan.subManagerReviews?.length || 0;
              
              // 집행 완료된 예산안인지 확인
              const isExecuted = plan.status === 'executed' || (plan.executedDate && plan.executedDate.trim() !== '');
              
              // 집행 완료된 경우: 검토, 승인, 집행 모두 완료로 표시
              if (isExecuted) {
                executionData.push({
                  label: plan.title.length > 20 ? plan.title.substring(0, 20) + '...' : plan.title,
                  reviewerCount: totalReviewers > 0 ? `${totalReviewers}/${totalReviewers}` : '0/0',
                  reviewProgress: 1, // 집행 완료 = 검토 완료
                  approvalProgress: 1, // 집행 완료 = 승인 완료
                  executionProgress: 1 // 집행 완료
                });
                continue;
              }
              
              // 집행 미완료인 경우: 실제 상태 반영
              // 검토자 수 표시
              const reviewerCount = totalReviewers > 0 ? `${reviewedCount}/${totalReviewers}` : '0/0';
              
              // 검토 진척도 (검토 완료 수 / 전체 검토자 수)
              const reviewProgress = (totalReviewers > 0 && !isNaN(reviewedCount) && !isNaN(totalReviewers)) 
                ? Math.min(reviewedCount / totalReviewers, 1) 
                : 0;
              
              // 승인 진척도 (승인 완료 = 1, 미승인 = 0)
              const approvalProgress = plan.mainManagerApproved ? 1 : 0;
              
              // 집행 진척도 (집행 완료 = 1, 미집행 = 0)
              const executionProgress = 0;
              
              executionData.push({
                label: plan.title.length > 20 ? plan.title.substring(0, 20) + '...' : plan.title,
                reviewerCount,
                reviewProgress: isNaN(reviewProgress) ? 0 : Math.min(reviewProgress, 1),
                approvalProgress: isNaN(approvalProgress) ? 0 : approvalProgress,
                executionProgress: isNaN(executionProgress) ? 0 : executionProgress
              });
            }
            
            budgetExecutionItems = executionData.length > 0 ? executionData : [
              { label: '예산 계획이 없습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
            ];
          }
        } catch (error) {
          console.error("Error loading budget execution data immediately:", error);
          budgetExecutionItems = [
            { label: '데이터를 불러오는 중 오류가 발생했습니다', reviewerCount: '-', reviewProgress: 0, approvalProgress: 0, executionProgress: 0 }
          ];
        }
      }
      
      // loadedData 플래그는 설정하지 않음 (useEffect에서 다시 로드하도록)
      // 장부 선택 후 즉시 데이터를 로드했지만, useEffect에서도 다시 확인하도록 함

      // 데이터가 빈 배열이어도 위젯 업데이트 (빈 장부일 수 있음)
        setWidgets(prevWidgets => {
          const newWidgets = prevWidgets.map(widget => {
          if (widget.id === selectedWidgetId) {
            if (widget.type === 'tuition') {
              return {
                ...widget,
                title: `<i class="fas fa-money-bill-wave"></i> ${sheet.ledgerName || sheet.name}`,
                componentType: 'ListComponent',
                props: {
                  ...widget.props,
                  items: data && data.length > 0 ? data : ['데이터가 없습니다'],
                  ledgerId: spreadsheetId,
                  ledgerName: sheet.ledgerName || sheet.name,
                  spreadsheetId: spreadsheetId,
                },
              };
            } else if (widget.type === 'budget-plan') {
              return {
                ...widget,
                title: `<i class="fas fa-money-bill-alt"></i> 예산 계획 (${sheet.ledgerName || sheet.name})`,
                componentType: 'BudgetPlanComponent',
                props: {
                  ...widget.props,
                  items: budgetPlanItems !== null ? budgetPlanItems : [],
                  ledgerId: spreadsheetId,
                  ledgerName: sheet.ledgerName || sheet.name,
                  spreadsheetId: spreadsheetId,
                },
              };
            } else if (widget.type === 'budget-execution' || widget.type === 'accounting-stats') {
              return {
                ...widget,
                title: widget.type === 'budget-execution' 
                  ? `<i class="fas fa-chart-pie"></i> 예산 집행 현황 (${sheet.ledgerName || sheet.name})`
                  : `<i class="fas fa-chart-bar"></i> 회계 통계 (${sheet.ledgerName || sheet.name})`,
                props: {
                  ...widget.props,
                  ledgerId: spreadsheetId,
                  ledgerName: sheet.ledgerName || sheet.name,
                  spreadsheetId: spreadsheetId,
                  // 회계 통계 위젯인 경우 로드한 데이터 사용
                  ...(widget.type === 'accounting-stats' && accountingStatsItems !== null && { 
                    items: accountingStatsItems,
                    ...(accountingStatsRawData !== null && { rawData: accountingStatsRawData })
                  }),
                  // 예산 집행 위젯인 경우 로드한 데이터 사용
                  ...(widget.type === 'budget-execution' && budgetExecutionItems !== null && { 
                    items: budgetExecutionItems
                  }),
                },
              };
            }
            }
            return widget;
          });
          console.log("New widgets state after update:", newWidgets);
          return newWidgets;
        });
      
      setIsSheetModalOpen(false);
      setSelectedWidgetId(null);
    } catch (error: any) {
      console.error("Error selecting sheet:", error);
      const errorMessage = error?.message || error?.error?.message || "알 수 없는 오류가 발생했습니다.";
      console.error("Error details:", {
        message: errorMessage,
        error: error,
        stack: error?.stack
      });
      alert(`시트 선택 중 오류가 발생했습니다: ${errorMessage}`);
      setIsSheetModalOpen(false);
      setSelectedWidgetId(null);
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
    handleStudentStatusChange: (widgetId: string, status: string) => {
      setWidgets(prevWidgets => prevWidgets.map(w => 
        w.id === widgetId 
          ? { ...w, props: { ...w.props, selectedStatus: status } }
          : w
      ));
    },
  };
};
