/**
 * @file 위젯 콘텐츠를 동적으로 생성하는 유틸리티 함수를 제공합니다.
 * 이 파일은 `widgetData`에서 위젯 정의를 가져와, 주어진 타입에 따라
 * 위젯의 제목, 컴포넌트 타입 및 props를 반환합니다.
 */

import { widgetData } from '../../components/features/dashboard/Dashboard/widgetData';

/**
 * 주어진 위젯 타입에 해당하는 콘텐츠 데이터를 생성하여 반환합니다.
 * `widgetData`에 정의된 위젯 정보를 기반으로 하며, 해당 타입이 없을 경우 기본 위젯 데이터를 반환합니다.
 *
 * @param {string} type - 생성할 위젯의 타입 (예: 'assignmentList', 'busList').
 * @returns {{ title: string; componentType: string; props: any }} 위젯의 제목, 컴포넌트 타입, props를 포함하는 객체.
 */
export const generateWidgetContent = (type: string) => {
    // widgetData에서 주어진 타입에 해당하는 데이터를 찾거나, 없을 경우 기본(default) 데이터를 사용합니다.
    const data = widgetData[type as keyof typeof widgetData] || widgetData.default;
    return {
        title: data.title,
        componentType: data.component,
        props: data.props
    };
};