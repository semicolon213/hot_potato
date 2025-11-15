/**
 * @file 위젯을 대시보드에 렌더링하고 관리하는 컴포넌트입니다.
 * 이 컴포넌트는 `widgetData.ts`에서 정의된 위젯 정보를 바탕으로
 * `AllWidgetTemplates.tsx`에 정의된 실제 위젯 컴포넌트들을 동적으로 로드하여 표시합니다.
 * 드래그 앤 드롭을 통한 위젯 위치 변경 및 위젯 제거 기능을 포함합니다.
 */

import React from "react";
import "./WidgetGrid.css";
import * as WidgetTemplates from "./AllWidgetTemplates";
import { DefaultMessage } from "./AllWidgetTemplates";
import type { WidgetData, WidgetComponentsMap } from "../../../types/widget";

/**
 * `AllWidgetTemplates`에서 가져온 모든 위젯 컴포넌트들을 포함하는 객체입니다.
 * 런타임에 위젯의 `componentType` 문자열을 사용하여 해당 컴포넌트를 동적으로 찾아 렌더링하는 데 사용됩니다.
 */
const WidgetComponents: WidgetComponentsMap = WidgetTemplates as WidgetComponentsMap;

/**
 * `WidgetGrid` 컴포넌트의 props를 정의하는 인터페이스입니다.
 * @property {WidgetData[]} widgets - 렌더링할 위젯 데이터 배열.
 * @property {(index: number) => void} handleDragStart - 드래그 시작 시 호출될 함수.
 * @property {(index: number) => void} handleDragEnter - 드래그 요소가 다른 위젯 위로 진입 시 호출될 함수.
 * @property {() => void} handleDrop - 드롭 시 호출될 함수.
 * @property {(id: string) => void} handleRemoveWidget - 위젯 제거 시 호출될 함수.
 */
interface WidgetGridProps {
  widgets: WidgetData[];
  handleDragStart: (index: number) => void;
  handleDragEnter: (index: number) => void;
  handleDrop: () => void;
  handleRemoveWidget: (id: string) => void;
  onWidgetButtonClick?: (widgetId: string) => void;
  onStudentStatusChange?: (widgetId: string, status: string) => void;
  onPageChange?: (pageName: string, params?: Record<string, string>) => void;
  onSelectAnnouncement?: (post: { id: string; title: string }) => void;
  announcements?: Array<{ id: string; title: string }>;
}

/**
 * 대시보드에 위젯들을 그리드 형태로 표시하고 관리하는 React 함수형 컴포넌트입니다.
 * 각 위젯은 드래그 가능하며, 동적으로 내용을 로드하여 표시합니다.
 * @param {WidgetGridProps} props - `WidgetGrid` 컴포넌트에 전달되는 props.
 */
const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  handleDragStart,
  handleDragEnter,
  handleDrop,
  handleRemoveWidget,
  onWidgetButtonClick,
  onStudentStatusChange,
  onPageChange,
  onSelectAnnouncement,
  announcements,
}) => {
  return (
    <div className="widget-grid">
      {widgets.map((widget, index) => {
        // 위젯의 componentType에 해당하는 컴포넌트를 동적으로 찾아오거나, 없을 경우 DefaultMessage 컴포넌트를 사용합니다.
        const WidgetContentComponent = WidgetComponents[widget.componentType] || DefaultMessage;
        
        // 회계 장부(tuition)는 장부 선택 불필요, 나머지는 장부 선택 필요
        const buttonProps = (widget.type === 'budget-plan' || widget.type === 'budget-execution' || widget.type === 'accounting-stats')
          ? { onButtonClick: () => onWidgetButtonClick?.(widget.id) }
          : {};
        
        // spreadsheetId와 widgetType을 props에 추가 (ListComponent, AccountingStatsComponent에서 버튼 표시 여부 판단용)
        const widgetProps = {
          ...widget.props,
          ...buttonProps,
          spreadsheetId: widget.props.spreadsheetId || undefined, // 항상 전달 (없으면 undefined)
          widgetType: widget.type, // 위젯 타입 전달
          // 회계 통계 위젯의 경우 rawData 전달 (통합 보기용)
          ...(widget.type === 'accounting-stats' && { rawData: widget.props.rawData || undefined }),
          // 학생 관리 위젯의 경우 rawData와 selectedStatus 전달
          ...(widget.type === 'student-summary' && { 
            rawData: widget.props.rawData || undefined,
            selectedStatus: widget.props.selectedStatus || '재학',
            onStatusChange: (status: string) => {
              onStudentStatusChange?.(widget.id, status);
            },
            onGradeClick: (status: string, grade: string) => {
              // 학생 관리 페이지로 이동하면서 필터 적용
              onPageChange?.('students', { 
                state: status, 
                grade: grade 
              });
            }
          }),
          // 위젯 항목 클릭 핸들러 전달
          ...(widget.type === 'notice' && { 
            onItemClick: (item: string) => {
              // 공지사항 제목으로 공지사항 찾기
              const announcement = announcements?.find(a => a.title === item);
              if (announcement && onSelectAnnouncement) {
                onSelectAnnouncement(announcement);
                onPageChange?.('announcement-view', { announcementId: String(announcement.id) });
              } else {
                // 제목으로 찾지 못하면 공지사항 페이지로 이동
                onPageChange?.('announcements');
              }
            }
          }),
          ...(widget.type === 'calendar' && {
            onItemClick: () => {
              onPageChange?.('calendar');
            }
          }),
          ...(widget.type === 'workflow-status' && {
            onItemClick: () => {
              onPageChange?.('workflow_management');
            }
          }),
          ...(widget.type === 'document-management' && {
            onItemClick: (item: { title: string; url?: string }) => {
              if (item.url) {
                window.open(item.url, '_blank');
              } else {
                // URL이 없으면 문서 관리 페이지로 이동
                onPageChange?.('document_management');
              }
            }
          }),
          ...(widget.type === 'user-approval' && {
            onItemClick: () => {
              onPageChange?.('admin');
            }
          })
        };

        return (
          <div
            key={widget.id} // Key를 고유한 ID로 변경
            className="widget"
            data-widget-type={widget.type}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="widget-header">
              <h3 dangerouslySetInnerHTML={{ __html: widget.title }}></h3>
              <div className="widget-actions">
                <button
                  className="widget-btn widget-delete-btn"
                  onClick={() => handleRemoveWidget(widget.id)}
                  title="위젯 삭제"
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 14 14" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="delete-icon"
                  >
                    <path 
                      d="M11 3.5L10.5 11.5C10.5 12.05 10.05 12.5 9.5 12.5H4.5C3.95 12.5 3.5 12.05 3.5 11.5L3 3.5M5.5 3.5V2.5C5.5 1.95 5.95 1.5 6.5 1.5H7.5C8.05 1.5 8.5 1.95 8.5 2.5V3.5M1.5 3.5H12.5" 
                      stroke="currentColor" 
                      strokeWidth="1.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* 동적으로 로드된 위젯 컴포넌트에 해당 props를 전달하여 렌더링합니다. */}
            <WidgetContentComponent {...widgetProps} />
          </div>
        );
      })}
    </div>
  );
};

export default WidgetGrid;