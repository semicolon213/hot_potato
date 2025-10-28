/**
 * @file documents.ts
 * @brief 문서 관련 타입 정의
 * @details 문서 관리에서 사용하는 타입들을 정의합니다.
 */

import type { DragEndEvent } from '@dnd-kit/core';

/**
 * 문서 생성 시 사용하는 템플릿 데이터
 */
export interface TemplateData {
  title: string;
  description: string;
  tag: string;
}

/**
 * 드래그 앤 드롭 이벤트 핸들러 타입
 */
export interface DragEndEventHandler {
  (event: DragEndEvent): void;
}

/**
 * Google Drive API에서 반환되는 파일 정보
 */
export interface GoogleFile {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

/**
 * 문서 정보 타입 (새로운 필드 구조)
 */
export interface DocumentInfo {
  id: string;
  documentNumber: string; // 문서고유번호 (생성날짜+파일타입+유형 조합)
  title: string; // 문서이름
  creator: string; // 생성자
  lastModified: string; // 수정시간
  url: string;
  documentType: 'shared' | 'personal'; // 공유문서/개인문서 구분
  mimeType?: string; // 파일 타입
  tag?: string; // 문서 태그
  originalIndex: number;
}

/**
 * 문서 맵 타입 (동적 속성)
 */
export interface DocumentMap {
  [key: string]: string;
}

/**
 * InfoCard에서 사용하는 Item 타입
 */
export interface InfoCardItem {
  name: string;
  time?: string;
  url?: string;
  tag?: string;
  typeLabel?: string;
  isPersonal?: boolean;
  originalName?: string;
  type?: string;
  [key: string]: string | boolean | undefined;
}
