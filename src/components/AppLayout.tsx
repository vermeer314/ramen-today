import React, { useState } from 'react';
import { Home, Calendar, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-full h-[100dvh] bg-white md:bg-slate-100 relative flex items-center justify-center md:py-4 md:px-8 lg:py-6 lg:px-12 overflow-hidden">
      {/* 컨테이너 */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl h-full md:min-h-[700px] flex flex-col bg-slate-50 md:bg-white md:rounded-[32px] md:shadow-2xl md:border border-gray-200/60 overflow-hidden relative">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 shrink-0 z-10 relative">
          <div className="hidden md:flex absolute top-4 right-8 items-center gap-6 z-20">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                location.pathname === '/'
                  ? 'text-gray-900 font-black'
                  : 'text-gray-400 font-bold hover:text-gray-900'
              }`}
            >
              <Home
                size={14}
                strokeWidth={location.pathname === '/' ? 3 : 2.5}
              />
              홈
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                location.pathname === '/calendar'
                  ? 'text-gray-900 font-black'
                  : 'text-gray-400 font-bold hover:text-gray-900'
              }`}
            >
              <Calendar
                size={14}
                strokeWidth={location.pathname === '/calendar' ? 3 : 2.5}
              />
              캘린더
            </button>
          </div>
          <div className="py-6 md:py-8 flex justify-center items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm text-xl">
              🍜
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 uppercase">
              Ramen <span className="text-orange-500">Today</span>
            </h1>
          </div>
        </header>

        {/* 메인 */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </div>

        {/* 모바일 하단바 */}
        <nav className="md:hidden h-16 shrink-0 bg-white border-t border-gray-100 flex items-center justify-around px-10 pb-safe z-40">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Home size={18} strokeWidth={location.pathname === '/' ? 3 : 2.5} />
            <span
              className={`text-[10px] uppercase tracking-wider ${
                location.pathname === '/' ? 'font-black' : 'font-bold'
              }`}
            >
              홈
            </span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex flex-col items-center -translate-y-3"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md shadow-orange-500/20 border-[4px] border-slate-50">
              <Plus size={22} color="white" strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black text-orange-600 mt-1">
              제보하기
            </span>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/calendar'
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}
          >
            <Calendar
              size={18}
              strokeWidth={location.pathname === '/calendar' ? 3 : 2.5}
            />
            <span
              className={`text-[10px] uppercase tracking-wider ${
                location.pathname === '/calendar' ? 'font-black' : 'font-bold'
              }`}
            >
              캘린더
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
