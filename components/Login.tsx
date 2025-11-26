import React, { useState } from 'react';
import { TEACHERS } from '../data';
import { Teacher } from '../types';
import { School, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (user: Teacher) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check (username == password based on prompt)
    const user = TEACHERS.find(t => t.username === username);
    
    if (user && password === user.username) { // Using username as password per prompt logic instructions
       onLogin(user);
    } else {
       setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             <School className="w-10 h-10 text-indigo-900" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-950">ระบบประเมินความสามารถการใช้ทักษะชีวิต</h1>
          <p className="text-slate-500 mt-1">โรงเรียนสาธิตอุดมศึกษา</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 transition-colors"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-900 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <div className="mt-6 text-center">
             <p className="text-xs text-slate-400">พัฒนาโดย ฝ่ายประกันคุณภาพสถานศึกษา โรงเรียนสาธิตอุดมศึกษา</p>
        </div>
      </div>
    </div>
  );
};

export default Login;