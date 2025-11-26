export interface Student {
  id: number;
  name: string;
  gender: 'male' | 'female'; // inferred from title (ด.ช./ด.ญ.)
}

export interface Teacher {
  id: string;
  name: string;
  username: string;
  grade: string; // e.g., "ประถมศึกษาปีที่ 1"
  room: string; // e.g., "A"
  students: Student[];
}

export interface AssessmentItem {
  id: number;
  text: string;
  indicatorId: number;
}

export interface AssessmentIndicator {
  id: number;
  title: string;
}

export interface StudentScore {
  studentId: number;
  scores: Record<number, number>; // questionId -> 1 (pass) or 0 (fail)
  teacherComment?: string;
  strengths?: string;
  improvements?: string;
  dateUpdated: string;
}

export interface ClassData {
  teacherId: string;
  scores: Record<number, StudentScore>; // studentId -> Score
}