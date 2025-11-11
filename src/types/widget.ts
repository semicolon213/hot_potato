/**
 * @file widget.ts
 * @brief 위젯 관련 타입 정의
 * @details 대시보드 위젯의 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

import type React from 'react';

/**
 * @brief 위젯 Props 기본 타입
 */
export type WidgetProps = Record<string, unknown>;

/**
 * @brief 위젯 컴포넌트 타입
 */
export type WidgetComponent = React.FC<WidgetProps>;

/**
 * @brief 위젯 데이터 타입
 */
export interface WidgetData {
  id: string;
  type: string;
  title: string;
  componentType: string;
  props: WidgetProps;
}

/**
 * @brief 위젯 컴포넌트 맵 타입
 */
export type WidgetComponentsMap = Record<string, WidgetComponent>;

