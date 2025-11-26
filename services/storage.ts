import { StudentScore } from '../types';

const STORAGE_PREFIX = 'satit_assessment_';

export const getStoredScores = (teacherId: string): Record<number, StudentScore> => {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${teacherId}`);
  return data ? JSON.parse(data) : {};
};

export const saveScore = (teacherId: string, studentId: number, scoreData: StudentScore) => {
  const currentScores = getStoredScores(teacherId);
  currentScores[studentId] = scoreData;
  localStorage.setItem(`${STORAGE_PREFIX}${teacherId}`, JSON.stringify(currentScores));
};
