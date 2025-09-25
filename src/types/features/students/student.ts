export interface Student {
  no_student: string;
  name: string;
  address: string;
  grade: string;
  state: string;
  council: string;
}

export interface CouncilPosition {
  year: string;
  position: string;
}

export interface StudentWithCouncil extends Student {
  parsedCouncil: CouncilPosition[];
}
