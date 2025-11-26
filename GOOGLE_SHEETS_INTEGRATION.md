# คู่มือการเชื่อมต่อระบบประเมินกับ Google Sheets

เอกสารนี้อธิบายขั้นตอนการสร้างฐานข้อมูล Google Sheets และการเขียน Google Apps Script (GAS) เพื่อให้ระบบประเมินนักเรียนสามารถบันทึกข้อมูลลงชีตออนไลน์ได้ โดยแยกชีตตามห้องเรียนอัตโนมัติ

---

## ส่วนที่ 1: การเตรียม Google Sheets และ Apps Script

### 1. สร้าง Google Sheet
1. ไปที่ [Google Sheets](https://sheets.google.com) สร้างสเปรดชีตใหม่
2. ตั้งชื่อไฟล์ เช่น **"Database_Student_Assessment"**

### 2. เปิดโปรแกรมแก้ไขสคริปต์ (Script Editor)
1. ในหน้า Google Sheet ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
2. จะปรากฏหน้าต่างเขียนโค้ด ให้ลบโค้ดเดิม (`function myFunction() {...}`) ออกให้หมด

### 3. วางโค้ด Google Apps Script
คัดลอกโค้ดด้านล่างนี้ไปวางในหน้าต่าง Editor:

```javascript
/**
 * Google Apps Script สำหรับระบบประเมินทักษะชีวิต
 * รองรับการสร้างชีตอัตโนมัติแยกตามห้อง และจัดการข้อมูล
 */

// ตั้งค่าส่วนหัวตาราง (Header)
const HEADERS = [
  "เลขที่", 
  "ชื่อ-นามสกุล", 
  "คะแนนรวม (60)", 
  "ผลการประเมิน", 
  "วันที่บันทึก", 
  "บันทึกเพิ่มเติม (ครู)", 
  "จุดเด่น", 
  "จุดที่ควรพัฒนา", 
  "RAW_DATA_JSON" // คอลัมน์สำหรับเก็บข้อมูลดิบเพื่อนำกลับไปแสดงผลในแอป (ซ่อนได้)
];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // ป้องกันการเขียนทับพร้อมกัน

  try {
    // กรณีเป็น POST (บันทึกข้อมูล)
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      const result = processSave(data);
      return responseJSON({ status: 'success', message: 'Saved successfully', data: result });
    }
    
    // กรณีเป็น GET (อ่านข้อมูล)
    const params = e.parameter;
    if (params.action === 'load') {
      const result = processLoad(params.grade, params.room);
      return responseJSON({ status: 'success', data: result });
    }

    return responseJSON({ status: 'error', message: 'Invalid action' });

  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ฟังก์ชันบันทึกข้อมูล
function processSave(payload) {
  const { grade, room, studentId, studentName, scoreData } = payload;
  const sheet = getOrCreateSheet(grade, room);
  
  // คำนวณคะแนนและผลประเมิน
  const scores = scoreData.scores;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage = (totalScore / 60) * 100;
  let evaluation = "ปรับปรุง";
  if (percentage >= 75) evaluation = "ดีเยี่ยม";
  else if (percentage >= 50) evaluation = "ดี";
  else if (percentage >= 25) evaluation = "พอใช้";

  // เตรียมข้อมูลลงแถว
  const rowData = [
    studentId,
    studentName,
    totalScore,
    evaluation,
    "'" + new Date().toLocaleString('th-TH'), // บังคับเป็น text เพื่อกัน format เพี้ยน
    scoreData.teacherComment || "",
    scoreData.strengths || "",
    scoreData.improvements || "",
    JSON.stringify(scoreData) // เก็บข้อมูลดิบทั้งหมด
  ];

  // ค้นหาว่ามีนักเรียนคนนี้หรือยัง (ดูจากเลขที่ คอลัมน์ 1)
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // เริ่มค้นหาจากแถวที่ 2 (ข้าม Header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == studentId) {
      rowIndex = i + 1; // +1 เพราะ index เริ่ม 0 แต่ row เริ่ม 1
      break;
    }
  }

  if (rowIndex > 0) {
    // อัปเดตแถวเดิม
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // เพิ่มแถวใหม่
    sheet.appendRow(rowData);
    // จัดเรียงตามเลขที่ (คอลัมน์ 1)
    if (sheet.getLastRow() > 2) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).sort({column: 1, ascending: true});
    }
  }
  
  return true;
}

// ฟังก์ชันอ่านข้อมูล
function processLoad(grade, room) {
  const sheetName = getSheetName(grade, room);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  const result = {};
  
  if (!sheet) return result; // ยังไม่มีข้อมูลห้องนี้

  const data = sheet.getDataRange().getValues();
  
  // อ่านข้อมูล (เริ่มแถว 2)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const studentId = row[0];
    const rawJson = row[8]; // ช่อง RAW_DATA_JSON
    
    if (studentId && rawJson) {
      try {
        result[studentId] = JSON.parse(rawJson);
      } catch (e) {
        // กรณี Parse Error ให้ข้าม
      }
    }
  }
  
  return result;
}

// ฟังก์ชันช่วยสร้างหรือดึง Sheet ตามห้อง
function getOrCreateSheet(grade, room) {
  const sheetName = getSheetName(grade, room);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // สร้าง Header
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // จัดรูปแบบ Header ให้สวยงาม
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#4a86e8") // สีน้ำเงิน
      .setFontColor("white")
      .setHorizontalAlignment("center");
      
    // Lock Header Row
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getSheetName(grade, room) {
  // แปลงชื่อให้ปลอดภัยสำหรับชื่อ Sheet (เช่น "ชั้นประถมศึกษาปีที่ 1" -> "P1")
  // ในที่นี้ใช้ชื่อเต็มตามที่ส่งมา หรือย่อก็ได้
  let shortGrade = grade.replace("ชั้นประถมศึกษาปีที่ ", "P");
  return `${shortGrade}_${room}`; // เช่น P1_A
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 4. การ Deploy (เผยแพร่)
1. คลิกปุ่ม **"ทำให้ใช้งานได้" (Deploy)** > **"การทำให้ใช้งานได้รายการใหม่" (New deployment)**
2. คลิกไอคอนฟันเฟือง เลือกชนิดเป็น **"เว็บแอป" (Web app)**
3. ตั้งค่าดังนี้:
   - **คำอธิบาย:** API ระบบประเมิน
   - **เรียกใช้ในฐานะ:** "ฉัน" (Me)
   - **ผู้ที่มีสิทธิ์เข้าถึง:** **"ทุกคน" (Anyone)** <--- *สำคัญมาก*
4. คลิก **"ทำให้ใช้งานได้" (Deploy)**
5. คัดลอก **Web App URL** เก็บไว้ (จะใช้ในขั้นตอนถัดไป)

---

## ส่วนที่ 2: การเชื่อมต่อในฝั่งโปรแกรม (Frontend)

ในไฟล์ `services/googleSheetsService.ts` (สร้างใหม่) ให้ท่านนำ Web App URL ที่ได้มาใส่ในตัวแปร `API_URL`

### การเปลี่ยนมาใช้ Service นี้ใน App
ให้แก้ไขไฟล์ `App.tsx`, `Dashboard.tsx`, และ `AssessmentForm.tsx` โดยเปลี่ยนการ Import:

**จากเดิม:**
`import { getStoredScores, saveScore } from './services/storage';`

**เปลี่ยนเป็น:**
`import { getStoredScores, saveScore } from './services/googleSheetsService';`

---

## การทดสอบระบบ
1. ลองล็อกอินเข้าสู่ระบบ และกดบันทึกข้อมูลนักเรียน 1 คน
2. กลับไปดูที่ Google Sheet จะพบว่า:
   - มี Tab ใหม่เกิดขึ้น เช่น "P1_A"
   - มีข้อมูลนักเรียนที่บันทึก พร้อมคะแนนและผลประเมิน
   - คอลัมน์สุดท้ายจะเก็บข้อมูล JSON สำหรับระบบดึงกลับไปแสดงผล
