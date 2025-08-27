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

/**
 * `AllWidgetTemplates`에서 가져온 모든 위젯 컴포넌트들을 포함하는 객체입니다.
 * 런타임에 위젯의 `componentType` 문자열을 사용하여 해당 컴포넌트를 동적으로 찾아 렌더링하는 데 사용됩니다.
 */
const WidgetComponents: { [key: string]: React.FC<any> } = WidgetTemplates as any;

/**
 * 개별 위젯의 데이터 구조를 정의하는 인터페이스입니다.
 * @property {string} id - 위젯의 고유 식별자.
 * @property {string} type - 위젯의 타입 (예: 'welcome', 'notice').
 * @property {string} title - 위젯 헤더에 표시될 제목.
 * @property {string} componentType - 렌더링할 위젯 컴포넌트의 이름 (AllWidgetTemplates.tsx에 정의된 이름).
 * @property {any} props - 위젯 컴포넌트에 전달될 데이터.
 */
interface WidgetData {
  id: string;
  type: string;
  title: string;
  componentType: string;
  props: any;
}

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
}) => {
  return (
    <div className="widget-grid">
      {widgets.map((widget, index) => {
        // 위젯의 componentType에 해당하는 컴포넌트를 동적으로 찾아오거나, 없을 경우 DefaultMessage 컴포넌트를 사용합니다.
        const WidgetContentComponent = WidgetComponents[widget.componentType] || DefaultMessage;
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
                  className="widget-btn"
                  onClick={() => handleRemoveWidget(widget.id)} // widget.type 대신 widget.id를 전달
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            {/* 동적으로 로드된 위젯 컴포넌트에 해당 props를 전달하여 렌더링합니다. */}
            <WidgetContentComponent {...widget.props} />
          </div>
        );
      })}
    </div>
  );
};

export default WidgetGrid;