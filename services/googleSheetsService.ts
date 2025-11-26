import { StudentScore } from '../types';

// Web App URL for Google Apps Script Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbxPdopBI623de9PMdXIvn60cxmixOAv1eL8i5fBSV4XtBFG0768kjGaXoeVx2CT0Zw/exec';

// Service นี้จำลองการทำงานแบบ Asynchronous
export const getStoredScores = async (teacherId: string, grade: string, room: string): Promise<Record<number, StudentScore>> => {
  try {
    if (API_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.warn('Google Sheets API URL not configured. Falling back to localStorage.');
      const localData = localStorage.getItem(`satit_assessment_${teacherId}`);
      return localData ? JSON.parse(localData) : {};
    }

    const url = `${API_URL}?action=load&grade=${encodeURIComponent(grade)}&room=${encodeURIComponent(room)}`;
    
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.status === 'success') {
      return json.data;
    } else {
      console.error('API Error:', json.message);
      return {};
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    return {};
  }
};

export const saveScore = async (
  teacherId: string, 
  grade: string,
  room: string,
  studentId: number, 
  studentName: string,
  scoreData: StudentScore
) => {
  try {
    if (API_URL.includes('YOUR_DEPLOYMENT_ID')) {
        // Fallback to localStorage
        const key = `satit_assessment_${teacherId}`;
        const currentStr = localStorage.getItem(key);
        const current = currentStr ? JSON.parse(currentStr) : {};
        current[studentId] = scoreData;
        localStorage.setItem(key, JSON.stringify(current));
        return;
    }

    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        grade,
        room,
        studentId,
        studentName,
        scoreData
      })
    });

  } catch (error) {
    console.error('Save Error:', error);
    // Fallback save to local storage in case of offline
    const key = `satit_assessment_${teacherId}_offline_backup`;
    const currentStr = localStorage.getItem(key);
    const current = currentStr ? JSON.parse(currentStr) : {};
    current[studentId] = scoreData;
    localStorage.setItem(key, JSON.stringify(current));
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ บันทึกข้อมูลลงในเครื่องแทนชั่วคราว');
  }
};