import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Teacher, StudentScore } from '../types';
import { getStoredScores } from '../services/googleSheetsService';
import { LogOut, UserCheck, UserX, FileDown, Search } from 'lucide-react';

interface DashboardProps {
  user: Teacher;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [scores, setScores] = useState<Record<number, StudentScore>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getStoredScores(user.id, user.grade, user.room);
      setScores(data);
      setIsLoading(false);
    };
    fetchData();
  }, [user.id, user.grade, user.room]);

  const totalStudents = user.students.length;
  const assessedCount = user.students.filter(s => scores[s.id]).length;
  const progress = totalStudents === 0 ? 0 : Math.round((assessedCount / totalStudents) * 100);

  const exportCSV = () => {
    const headers = ["เลขที่", "ชื่อ-สกุล", "คะแนนรวม (เต็ม 60)", "ผลการประเมิน", "วันที่ประเมิน"];
    const rows = user.students.map(s => {
      const scoreData = scores[s.id];
      let total = 0;
      let evaluation = "ยังไม่ประเมิน";
      let date = "-";
      
      if (scoreData) {
        // Cast to number[] to satisfy TypeScript strict checks
        total = (Object.values(scoreData.scores) as number[]).reduce((a, b) => a + b, 0);
        date = new Date(scoreData.dateUpdated).toLocaleDateString('th-TH');
        // Max score is now 60 (30 items * 2 points)
        const percent = (total / 60) * 100;
        if (percent >= 75) evaluation = "ดีเยี่ยม";
        else if (percent >= 50) evaluation = "ดี";
        else if (percent >= 25) evaluation = "พอใช้";
        else evaluation = "ปรับปรุง";
      }

      return [s.id, s.name, total, evaluation, date].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${user.grade}_${user.room}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = user.students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toString().includes(searchTerm);
    const isAssessed = !!scores[student.id];
    
    if (filterStatus === 'done') return matchesSearch && isAssessed;
    if (filterStatus === 'pending') return matchesSearch && !isAssessed;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sarabun">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex flex-col">
               <h1 className="text-lg font-bold">ระบบประเมินความสามารถการใช้ทักษะชีวิต</h1>
               <span className="text-xs text-blue-200 font-light">โรงเรียนสาธิตอุดมศึกษา</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-medium">{user.name}</p>
                 <p className="text-xs text-blue-300">{user.grade} ห้อง {user.room}</p>
               </div>
               <button 
                onClick={onLogout}
                className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition-colors"
                title="ออกจากระบบ"
               >
                 <LogOut size={18} />
               </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-900">
                <h3 className="text-slate-500 text-sm font-medium">นักเรียนทั้งหมด</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">{totalStudents} <span className="text-sm text-slate-400 font-normal">คน</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
                <h3 className="text-slate-500 text-sm font-medium">ประเมินแล้ว</h3>
                <p className="text-3xl font-bold text-green-700 mt-2">{assessedCount} <span className="text-sm text-slate-400 font-normal">คน</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                <h3 className="text-slate-500 text-sm font-medium">ความคืบหน้า</h3>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-right text-xs text-slate-500 mt-1">{progress}%</p>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
             <div className="flex items-center bg-white rounded-lg shadow-sm px-3 py-2 w-full md:w-96 border border-slate-200">
                 <Search className="text-slate-400 w-5 h-5 mr-2" />
                 <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ หรือ เลขที่..." 
                    className="bg-transparent border-none outline-none w-full text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
                 <div className="flex bg-white rounded-lg shadow-sm p-1 border border-slate-200">
                     <button 
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'all' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        ทั้งหมด
                     </button>
                     <button 
                        onClick={() => setFilterStatus('done')}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'done' ? 'bg-green-100 text-green-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        เสร็จแล้ว
                     </button>
                     <button 
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-orange-100 text-orange-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        ค้างอยู่
                     </button>
                 </div>
                 <button 
                    onClick={exportCSV}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-sm font-medium"
                 >
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                 </button>
             </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           {isLoading ? (
             <div className="p-10 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
           ) : (
           <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">เลขที่</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-32">สถานะ</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-32">คะแนน (60)</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-32">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                        const isDone = !!scores[student.id];
                        const score = scores[student.id] ? (Object.values(scores[student.id].scores) as number[]).reduce((a, b) => a + b, 0) : 0;
                        
                        return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-center">{student.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {isDone ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <UserCheck className="w-3 h-3 mr-1" />
                                            ประเมินแล้ว
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            <UserX className="w-3 h-3 mr-1" />
                                            รอการประเมิน
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                                    {isDone ? (
                                        <span className="font-semibold text-slate-700">
                                          {score}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <Link 
                                        to={`/assess/${student.id}`}
                                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white transition-colors ${isDone ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {isDone ? 'แก้ไข' : 'ประเมิน'}
                                    </Link>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                ไม่พบข้อมูลนักเรียนที่ค้นหา
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
           </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;