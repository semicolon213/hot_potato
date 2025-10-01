// App.tsx에서 사용되는 공통 타입들

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

export interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  contentPreview: string;
}

export interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
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
  | 'document_management' 
  | 'docbox' 
  | 'new_document' 
  | 'preferences' 
  | 'mypage' 
  | 'empty_document' 
  | 'proceedings' 
  | 'students' 
  | 'staff' 
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
  no: string;
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
