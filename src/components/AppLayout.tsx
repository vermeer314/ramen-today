import React, { useState } from 'react';
import { Home, Calendar, Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useReportStore } from '../store/useReportStore';
import { sendDiscordNotification } from '../lib/discord';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isOpen, openModal, closeModal } = useReportStore();
  const [reportForm, setReportForm] = useState({
    type: 'event',
    shop_name: '',
    source_url: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmitReport = async () => {
    if (!reportForm.shop_name || !reportForm.source_url) {
      toast.error('가게 이름과 링크를 모두 입력해주세요!');
      return;
    }

    const lastReportTime = localStorage.getItem('last_report_time');
    if (lastReportTime) {
      const timeDiff = Date.now() - parseInt(lastReportTime, 10);
      const cooldown = 60 * 1000;

      if (timeDiff < cooldown) {
        const remainSeconds = Math.ceil((cooldown - timeDiff) / 1000);
        toast.error(`잠시 후 다시 시도해주세요. (${remainSeconds}초 후 가능)`);
        return;
      }
    }

    const url = reportForm.source_url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error(
        '링크는 http:// 또는 https:// 로 시작해야 합니다! (복사해서 붙여넣어 주세요)',
      );
      return;
    }

    const targetTable =
      reportForm.type === 'event' ? 'event_reports' : 'closing_reports';

    const toastId = toast.loading('제보를 전송하는 중입니다...');

    try {
      const { error } = await supabase.from(targetTable).insert({
        shop_name: reportForm.shop_name,
        source_url: url,
        status: 'pending',
      });
      if (error) throw new Error(error.message);

      await sendDiscordNotification(reportForm.type, reportForm.shop_name, url);

      localStorage.setItem('last_report_time', Date.now().toString());
      toast.success('성공적으로 제보되었습니다! 🍜', { id: toastId });
      closeModal();
      setReportForm({ type: 'event', shop_name: '', source_url: '' });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`제보 실패: ${err.message}`, { id: toastId });
      } else {
        toast.error('알 수 없는 오류가 발생했습니다.', { id: toastId });
        console.error('Unexpected error:', err);
      }
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-white md:bg-slate-100 relative flex items-center justify-center md:py-4 md:px-8 lg:py-6 lg:px-12 overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl h-full md:min-h-[700px] flex flex-col bg-slate-50 md:bg-white md:rounded-[32px] md:shadow-2xl md:border border-gray-200/60 overflow-hidden relative">
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
          <div className="py-6 md:py-8 flex justify-center items-center">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm text-xl">
                🍜
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 uppercase">
                Ramen <span className="text-orange-500">Today</span>
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </div>

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
            onClick={openModal}
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

      {isOpen && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">새로운 소식 제보하기</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() =>
                    setReportForm((p) => ({ ...p, type: 'event' }))
                  }
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                    reportForm.type === 'event'
                      ? 'bg-white shadow text-black'
                      : 'text-gray-400'
                  }`}
                >
                  🍜 이벤트
                </button>
                <button
                  onClick={() =>
                    setReportForm((p) => ({ ...p, type: 'closing' }))
                  }
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                    reportForm.type === 'closing'
                      ? 'bg-white shadow text-black'
                      : 'text-gray-400'
                  }`}
                >
                  📢 영업변동
                </button>
              </div>
              <input
                type="text"
                placeholder="가게 이름"
                className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-orange-500 transition-all shadow-sm"
                value={reportForm.shop_name}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, shop_name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="인스타나 네이버 공지 링크"
                className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-orange-500 transition-all shadow-sm"
                value={reportForm.source_url}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, source_url: e.target.value }))
                }
              />
              <button
                onClick={handleSubmitReport}
                className="w-full py-4 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
              >
                제보 제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
