/**
 * @file app.ts
 * @brief 애플리케이션 공통 타입 정의
 * @details 애플리케이션 전반에서 사용되는 공통 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 이벤트 데이터 타입 정의
 * @details 캘린더 이벤트의 정보를 담는 인터페이스입니다.
 */
export interface Event {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
    colorId?: string;
    startDateTime?: string;
    endDateTime?: string;
    type?: string;
    color?: string;
    rrule?: string; // For recurrence rule
    attendees?: string; // For attendees
}

/**
 * @brief 게시글 데이터 타입 정의
 * @details 게시판과 공지사항에서 사용되는 게시글 정보를 담는 인터페이스입니다.
 */
export interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  content: string;
  writer_id: string;
  file_notice?: string;
}

export interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  role: string;
  userType?: string;
  accessToken?: string;
}

export type PageType = 
  | 'dashboard' 
  | 'admin' 
  | 'board' 
  | 'documents' 
  | 'calendar' 
  | 'users' 
  | 'settings' 
  | 'new-board-post' 
  | 'announcements' 
  | 'new-announcement-post'
  | 'accounting'
  | 'document_management' 
  | 'docbox' 
  | 'new_document' 
  | 'preferences' 
  | 'mypage' 
  | 'empty_document' 
  | 'proceedings' 
  | 'students' 
  | 'staff' 
  | 'workflow_management'
  | 'google_appscript'
  | 'google_sheets' 
  | 'google_docs' 
  | 'google_gemini' 
  | 'google_groups' 
  | 'google_calendar';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface CustomPeriod {
  id: string;
  name: string;
  period: DateRange;
}

export interface Student {
  no_student: string;
  name: string;
  address: string;
  phone_num: string;
  grade: string;
  state: string;
  council: string;
}

export interface Staff {
  no: string;
  pos: string;
  name: string;
  tel: string;
  phone: string;
  email: string;
  date: string;
  note: string;
}
