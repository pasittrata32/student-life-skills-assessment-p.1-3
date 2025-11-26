import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Teacher, StudentScore } from '../types';
import { INDICATORS, ASSESSMENT_ITEMS } from '../constants';
import { getStoredScores, saveScore } from '../services/googleSheetsService';
import { ChevronLeft, Save, Printer } from 'lucide-react';

// Declaration for SweetAlert2
declare const Swal: any;

interface Props {
  user: Teacher;
}

const AssessmentForm: React.FC<Props> = ({ user }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = user.students.find(s => s.id === Number(studentId));

  const [scores, setScores] = useState<Record<number, number>>({});
  const [teacherComment, setTeacherComment] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    const fetchData = async () => {
      setIsLoading(true);
      const allScores = await getStoredScores(user.id, user.grade, user.room);
      const currentStudentScore = allScores[student.id];
      if (currentStudentScore) {
        setScores(currentStudentScore.scores);
        setTeacherComment(currentStudentScore.teacherComment || '');
        setStrengths(currentStudentScore.strengths || '');
        setImprovements(currentStudentScore.improvements || '');
      }
      setIsLoading(false);
    };
    fetchData();
  }, [student, user.id, user.grade, user.room]);

  const handleScoreChange = (itemId: number, value: number) => {
    setScores(prev => ({ ...prev, [itemId]: value }));
  };

  // Cast to number[] to satisfy TypeScript strict checks
  // Max score is now 30 items * 2 = 60
  const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const percentage = (totalScore / 60) * 100;

  const handleSave = async () => {
    if (!student) return;
    setIsSaving(true);
    
    const data: StudentScore = {
      studentId: student.id,
      scores,
      teacherComment,
      strengths,
      improvements,
      dateUpdated: new Date().toISOString(),
    };

    await saveScore(user.id, user.grade, user.room, student.id, student.name, data);

    setIsSaving(false);
    
    Swal.fire({
      title: 'บันทึกข้อมูลสำเร็จ',
      text: `บันทึกผลการประเมินของ ${student.name} เรียบร้อยแล้ว`,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#1e3a8a', // Indigo-900
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl shadow-xl',
        title: 'font-bold text-xl',
        confirmButton: 'rounded-lg px-6 py-2'
      }
    }).then(() => {
      navigate('/');
    });
  };

  if (!student) return <div className="p-8 text-center">ไม่พบข้อมูลนักเรียน</div>;

  const RadioButton = ({ checked }: { checked: boolean }) => (
    <div className={`w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center ${checked ? 'bg-blue-900 border-blue-900' : 'bg-white'}`}>
      {checked && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
  );

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="bg-slate-200 min-h-screen font-sarabun pb-20 pt-6 print:bg-white print:pt-0 print:pb-0">
      {/* Floating Action Bar for Web View */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 print:hidden z-40">
        <button 
          onClick={() => window.print()}
          className="bg-slate-600 text-white p-4 rounded-full shadow-lg hover:bg-slate-700 transition-all"
          title="พิมพ์เอกสาร"
        >
          <Printer className="w-6 h-6" />
        </button>
      </div>

      <div className="fixed top-6 left-6 print:hidden z-40">
         <button 
            onClick={() => navigate('/')} 
            className="bg-white text-slate-700 px-4 py-2 rounded-lg shadow-md hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
         >
            <ChevronLeft className="w-5 h-5" /> กลับหน้าหลัก
         </button>
      </div>

      {/* Paper Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] p-[15mm] text-slate-900 print:shadow-none print:p-0 print:max-w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-blue-900 print:text-black">แบบประเมินความสามารถในการใช้ทักษะชีวิต</h1>
          <h2 className="text-xl font-bold text-blue-900 print:text-black mt-1">ชั้นประถมศึกษาปีที่ 1-3</h2>
          <p className="text-sm mt-2">โรงเรียนสาธิตอุดมศึกษา อ.บางละมุง จ.ชลบุรี</p>
        </div>

        {/* Part 1: Student Info */}
        <div className="mb-6 border border-gray-300 rounded-lg p-4 print:border-black">
           <h3 className="font-bold text-lg mb-4"><span className="underline">ตอนที่ 1</span> ข้อมูลทั่วไปของนักเรียน</h3>
           <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-base">
             <div className="flex items-baseline">
                 <span className="mr-2 whitespace-nowrap">ชื่อ-สกุล:</span>
                 <span className="flex-grow border-b border-dotted border-slate-400 text-blue-900 print:text-black font-semibold px-2 text-center">{student.name}</span>
             </div>
             <div className="flex items-baseline">
                 <span className="mr-2 whitespace-nowrap">โรงเรียน:</span>
                 <span className="flex-grow border-b border-dotted border-slate-400 text-blue-900 print:text-black font-semibold px-2 text-center">โรงเรียนสาธิตอุดมศึกษา</span>
             </div>
             <div className="flex items-baseline col-span-2">
                 <span className="mr-2 whitespace-nowrap">ระดับชั้น:</span>
                 <span className="w-32 border-b border-dotted border-slate-400 text-blue-900 print:text-black font-semibold px-2 text-center mr-4">{user.grade.replace('ชั้นประถมศึกษาปีที่', 'ป.')}/{user.room}</span>
                 
                 <span className="mr-2 whitespace-nowrap">ห้อง:</span>
                 <span className="w-20 border-b border-dotted border-slate-400 text-blue-900 print:text-black font-semibold px-2 text-center mr-4">{user.room}</span>
                 
                 <span className="mr-2 whitespace-nowrap">เลขที่:</span>
                 <span className="w-20 border-b border-dotted border-slate-400 text-blue-900 print:text-black font-semibold px-2 text-center">{student.id}</span>
             </div>
           </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 text-sm leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-transparent print:border-none print:p-0">
           <p className="font-bold mb-2">คำชี้แจง</p>
           <p>ให้ครูทำเครื่องหมาย <span className="font-sans">✓</span> ลงในช่องที่ตรงกับพฤติกรรมของนักเรียน ตามเกณฑ์พิจารณาดังนี้</p>
           <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><span className="font-bold">ระดับ 2</span> หมายถึง นักเรียนปฏิบัติ/แสดงพฤติกรรมดังกล่าว <span className="text-green-700 font-semibold print:text-black">เป็นประจำ</span></li>
              <li><span className="font-bold">ระดับ 1</span> หมายถึง นักเรียนปฏิบัติ/แสดงพฤติกรรมดังกล่าว <span className="text-orange-600 font-semibold print:text-black">บางครั้ง</span></li>
              <li><span className="font-bold">ระดับ 0</span> หมายถึง นักเรียน<span className="text-red-600 font-semibold print:text-black">ไม่เคย</span>ปฏิบัติหรือไม่เคยแสดงพฤติกรรม</li>
           </ul>
        </div>

        {/* Part 2: Assessment Table */}
        <div className="mb-8">
           <h3 className="font-bold text-lg mb-2"><span className="underline">ตอนที่ 2</span> รายการประเมินความสามารถในการใช้ทักษะชีวิต</h3>
           
           <table className="w-full border-collapse border border-slate-300 text-sm">
             <thead>
               <tr className="bg-slate-100 print:bg-gray-200">
                 <th className="border border-slate-300 p-3 w-12 align-middle" rowSpan={2}>ข้อที่</th>
                 <th className="border border-slate-300 p-3 align-middle text-left" rowSpan={2}>รายการประเมิน</th>
                 <th className="border border-slate-300 p-2 w-64 text-center" colSpan={3}>การปฏิบัติ/การแสดงพฤติกรรม</th>
               </tr>
               <tr className="bg-slate-50 print:bg-gray-100">
                 <th className="border border-slate-300 p-2 w-24 text-center text-xs font-semibold text-green-800 print:text-black">เป็นประจำ (2)</th>
                 <th className="border border-slate-300 p-2 w-24 text-center text-xs font-semibold text-orange-700 print:text-black">เป็นบางครั้ง (1)</th>
                 <th className="border border-slate-300 p-2 w-24 text-center text-xs font-semibold text-red-700 print:text-black">ไม่เคย (0)</th>
               </tr>
             </thead>
             <tbody>
                {INDICATORS.map(indicator => {
                  const indicatorItems = ASSESSMENT_ITEMS.filter(item => item.indicatorId === indicator.id);
                  return (
                    <React.Fragment key={indicator.id}>
                      <tr className="bg-slate-50 print:bg-gray-50">
                        <td colSpan={5} className="border border-slate-300 px-3 py-2 font-bold text-slate-800">
                          {indicator.title}
                        </td>
                      </tr>
                      {indicatorItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-3 text-center align-middle">{item.id}</td>
                          <td className="border border-slate-300 px-3 py-3 align-middle">{item.text}</td>
                          
                          {/* Score 2 */}
                          <td 
                            className="border border-slate-300 text-center align-middle cursor-pointer hover:bg-green-50 transition-colors" 
                            onClick={() => handleScoreChange(item.id, 2)}
                          >
                            <div className="flex justify-center">
                              <RadioButton checked={scores[item.id] === 2} />
                            </div>
                          </td>

                          {/* Score 1 */}
                          <td 
                            className="border border-slate-300 text-center align-middle cursor-pointer hover:bg-orange-50 transition-colors" 
                            onClick={() => handleScoreChange(item.id, 1)}
                          >
                             <div className="flex justify-center">
                              <RadioButton checked={scores[item.id] === 1} />
                            </div>
                          </td>

                          {/* Score 0 */}
                          <td 
                            className="border border-slate-300 text-center align-middle cursor-pointer hover:bg-red-50 transition-colors" 
                            onClick={() => handleScoreChange(item.id, 0)}
                          >
                             <div className="flex justify-center">
                              <RadioButton checked={scores[item.id] === 0} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
             </tbody>
           </table>
        </div>
        
        {/* Summary Section */}
        <div className="border border-slate-300 rounded-lg p-6 mb-6 print:border-black">
           <h3 className="font-bold text-lg text-black mb-4">สรุปผลการประเมินความสามารถในการใช้ทักษะชีวิต</h3>
           <div className="flex flex-wrap items-center gap-6 mb-6 text-sm font-medium">
              <span className="mr-1">นักเรียนอยู่ในระดับ:</span>
              
              <div className="flex items-center">
                  <div className={`w-5 h-5 border border-slate-400 rounded bg-white mr-2 flex items-center justify-center ${percentage >= 75 ? 'bg-blue-900 border-blue-900 text-white print:bg-black print:text-white' : ''}`}>
                      {percentage >= 75 && <span className="text-xs">✓</span>}
                  </div>
                  <span>ดีเยี่ยม (75% ขึ้นไป)</span>
              </div>
              
              <div className="flex items-center">
                  <div className={`w-5 h-5 border border-slate-400 rounded bg-white mr-2 flex items-center justify-center ${percentage >= 50 && percentage < 75 ? 'bg-blue-900 border-blue-900 text-white print:bg-black print:text-white' : ''}`}>
                      {percentage >= 50 && percentage < 75 && <span className="text-xs">✓</span>}
                  </div>
                  <span>ดี (50-74%)</span>
              </div>

              <div className="flex items-center">
                  <div className={`w-5 h-5 border border-slate-400 rounded bg-white mr-2 flex items-center justify-center ${percentage >= 25 && percentage < 50 ? 'bg-blue-900 border-blue-900 text-white print:bg-black print:text-white' : ''}`}>
                      {percentage >= 25 && percentage < 50 && <span className="text-xs">✓</span>}
                  </div>
                  <span>พอใช้ (25-49%)</span>
              </div>

              <div className="flex items-center">
                  <div className={`w-5 h-5 border border-slate-400 rounded bg-white mr-2 flex items-center justify-center ${percentage < 25 ? 'bg-blue-900 border-blue-900 text-white print:bg-black print:text-white' : ''}`}>
                       {percentage < 25 && <span className="text-xs">✓</span>}
                  </div>
                  <span>ปรับปรุง (ต่ำกว่า 25%)</span>
              </div>
           </div>

           <h4 className="font-bold mb-4">บันทึกเพิ่มเติม (สำหรับครูผู้สอน)</h4>
           
           <div className="space-y-6">
             <div>
                 <p className="mb-2 text-sm font-medium">จุดเด่นของนักเรียนคือ</p>
                 <textarea 
                   value={strengths}
                   onChange={(e) => setStrengths(e.target.value)}
                   className="w-full p-3 border border-slate-200 rounded-md text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all print:bg-white print:border-slate-300"
                   rows={3}
                   placeholder="ระบุจุดเด่น..."
                 />
             </div>

             <div>
                 <p className="mb-2 text-sm font-medium">จุดที่ควรพัฒนาของนักเรียนคือ</p>
                 <textarea 
                   value={improvements}
                   onChange={(e) => setImprovements(e.target.value)}
                   className="w-full p-3 border border-slate-200 rounded-md text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all print:bg-white print:border-slate-300"
                   rows={3}
                   placeholder="ระบุสิ่งที่ควรพัฒนา..."
                 />
             </div>

             <div className="flex justify-end pt-4">
                <div className="flex items-end gap-3">
                   <span className="font-medium pb-1">ลงชื่อ:</span>
                   <div className="flex flex-col items-center">
                       <span className="border-b border-dotted border-slate-400 px-4 min-w-[200px] text-center text-blue-900 print:text-black pb-1 font-medium">
                           {user.name}
                       </span>
                   </div>
                   <span className="font-medium pb-1">ครูผู้สอน</span>
                </div>
            </div>
           </div>
        </div>

        {/* Save Button Section */}
        <div className="mt-8 flex justify-center print:hidden">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-900 text-white px-12 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all disabled:opacity-50 flex items-center gap-2 font-bold text-lg hover:-translate-y-1"
            >
              <Save className="w-6 h-6" />
              บันทึกข้อมูล
            </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;