import type { CareerItem } from '../staff';

export interface Student {
  no_student: string;
  name: string;
  address: string;
  phone_num: string;
  grade: string;
  state: string;
  council: string;
  flunk?: string; // 유급 필드
}

export interface CouncilPosition {
  year: string;
  position: string;
}

export interface StudentWithCouncil extends Student {
  parsedCouncil: CouncilPosition[];
  career?: CareerItem[];
}
