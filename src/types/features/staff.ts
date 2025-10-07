/**
 * @file staff.ts
 * @brief 교직원 관리 관련 타입 정의
 * @details 교직원 정보와 학과 위원회 정보를 관리하는 타입들을 정의합니다.
 * @author Hot Potato Team
 * @date 2024
 */

/**
 * @brief 교직원 정보 타입 정의
 * @details 교직원의 기본 정보를 담는 인터페이스입니다.
 */
export interface StaffMember {
  no: string;           // 교번
  pos: string;          // 구분 (전임교수, 조교, 외부강사, 겸임교수 등)
  name: string;         // 이름
  tel: string;          // 내선번호
  phone: string;        // 연락처 (암호화됨)
  email: string;        // 이메일 (암호화됨)
  date: string;         // 임용일
  note: string;         // 비고
}

/**
 * @brief 학과 위원회 정보 타입 정의
 * @details 학과 위원회 구성원의 정보를 담는 인터페이스입니다.
 */
export interface Committee {
  sortation: string;        // 위원회 구분
  name: string;            // 이름
  tel: string;             // 연락처 (암호화됨)
  email: string;           // 이메일 (암호화됨)
  position: string;        // 직책
  career: CareerItem[];    // 경력 (JSON 배열)
  company_name: string;    // 업체명
  company_position: string; // 직위
  location: string;        // 소재지
  is_family: boolean;      // 가족회사여부
  representative: string;   // 대표자
  note: string;           // 비고
}

/**
 * @brief 경력 정보 타입 정의
 * @details 개인의 경력 정보를 담는 인터페이스입니다.
 */
export interface CareerItem {
  company: string;         // 회사명
  position: string;        // 직책
  period: string;          // 근무기간
  description?: string;    // 업무내용 (선택사항)
}

/**
 * @brief 교직원 관리 상태 타입 정의
 * @details 교직원 관리 페이지의 상태를 관리하는 인터페이스입니다.
 */
export interface StaffManagementState {
  staffList: StaffMember[];
  committeeList: Committee[];
  selectedStaff: StaffMember | null;
  selectedCommittee: Committee | null;
  isLoading: boolean;
  error: string | null;
  currentView: 'staff' | 'committee';
  searchQuery: string;
  filterPos: string;
  filterSortation: string;
}

/**
 * @brief 교직원 검색 필터 타입 정의
 * @details 교직원 검색 시 사용하는 필터 옵션들입니다.
 */
export interface StaffSearchFilter {
  query: string;
  position: string;
  sortation: string;
}

/**
 * @brief 교직원 모달 상태 타입 정의
 * @details 교직원 상세 정보 모달의 상태를 관리하는 인터페이스입니다.
 */
export interface StaffModalState {
  isOpen: boolean;
  staff: StaffMember | null;
  mode: 'view' | 'edit';
  isLoading: boolean;
}

/**
 * @brief 학과 위원회 모달 상태 타입 정의
 * @details 학과 위원회 상세 정보 모달의 상태를 관리하는 인터페이스입니다.
 */
export interface CommitteeModalState {
  isOpen: boolean;
  committee: Committee | null;
  mode: 'view' | 'edit';
  isLoading: boolean;
}

/**
 * @brief 교직원 통계 정보 타입 정의
 * @details 교직원 현황 통계를 담는 인터페이스입니다.
 */
export interface StaffStatistics {
  totalStaff: number;
  byPosition: Record<string, number>;
  byCommittee: Record<string, number>;
  recentHires: number;
}

/**
 * @brief 교직원 관리 액션 타입 정의
 * @details 교직원 관리에서 사용하는 액션들의 타입입니다.
 */
export type StaffAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STAFF_LIST'; payload: StaffMember[] }
  | { type: 'SET_COMMITTEE_LIST'; payload: Committee[] }
  | { type: 'SET_SELECTED_STAFF'; payload: StaffMember | null }
  | { type: 'SET_SELECTED_COMMITTEE'; payload: Committee | null }
  | { type: 'SET_CURRENT_VIEW'; payload: 'staff' | 'committee' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_POS'; payload: string }
  | { type: 'SET_FILTER_SORTATION'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_STAFF'; payload: StaffMember }
  | { type: 'UPDATE_COMMITTEE'; payload: Committee }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'DELETE_COMMITTEE'; payload: string };
