import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  Home,
  Calendar,
  Bell,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';

// --- 타입 정의 ---
interface Shop {
  name: string;
  profile_img_url: string | null;
}

interface RamenEvent {
  id: string;
  shop_id: string;
  menu_name: string | null;
  proof_image_url: string;
  source_url: string | null;
  starts_at: string;
  ends_at: string;
  status_type: 'normal' | 'closed_lunch' | 'closed_dinner' | 'closed_all';
  description: string | null;
  shops: Shop;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const MainPage = () => {
  const [storyContext, setStoryContext] = useState<{
    list: RamenEvent[];
    currentIndex: number;
  } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: 'event',
    shop_name: '',
    source_url: '',
  });
  const [isTextVisible, setIsTextVisible] = useState(true);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDragged = useRef(false);

  const todayStr = getTodayString();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['ramen_events_with_shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ramen_events')
        .select(`*, shops ( name, profile_img_url )`)
        .gte('ends_at', todayStr);
      if (error) throw new Error(error.message);
      return data as RamenEvent[];
    },
  });

  const todayEvents =
    eventsData?.filter(
      (e) => e.status_type === 'normal' && e.starts_at <= todayStr,
    ) || [];
  const closings =
    eventsData?.filter(
      (e) => e.status_type !== 'normal' && e.starts_at <= todayStr,
    ) || [];
  const upcomingEvents =
    eventsData?.filter(
      (e) => e.status_type === 'normal' && e.ends_at > todayStr,
    ) || [];

  const handleSubmitReport = async () => {
    if (!reportForm.shop_name || !reportForm.source_url) {
      alert('가게 이름과 링크를 모두 입력해주세요!');
      return;
    }
    const targetTable =
      reportForm.type === 'event' ? 'event_reports' : 'closing_reports';
    try {
      const { error } = await supabase.from(targetTable).insert({
        shop_name: reportForm.shop_name,
        source_url: reportForm.source_url,
        status: 'pending',
      });
      if (error) throw new Error(error.message);
      alert('성공적으로 제보되었습니다! 🍜');
      setIsReportModalOpen(false);
      setReportForm({ type: 'event', shop_name: '', source_url: '' });
    } catch (err) {
      if (err instanceof Error) {
        alert(`제보 실패: ${err.message}`);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
        console.error('Unexpected error:', err);
      }
    }
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDown.current = true;
    isDragged.current = false;
    startX.current = e.pageX - e.currentTarget.offsetLeft;
    scrollLeft.current = e.currentTarget.scrollLeft;
  };
  const onMouseLeave = () => {
    isDown.current = false;
  };
  const onMouseUp = () => {
    isDown.current = false;
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 10) isDragged.current = true;
    e.currentTarget.scrollLeft = scrollLeft.current - walk;
  };
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragged.current) e.stopPropagation();
  };

  const openStory = (list: RamenEvent[], index: number) => {
    setStoryContext({ list, currentIndex: index });
    setIsTextVisible(true);
  };

  const StoryBadge = ({
    item,
    list,
    index,
    isEvent,
  }: {
    item: RamenEvent;
    list: RamenEvent[];
    index: number;
    isEvent: boolean;
  }) => (
    <div
      onClick={() => openStory(list, index)}
      className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] ${isEvent ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600' : 'bg-orange-500'}`}
      >
        <img
          src={item.shops.profile_img_url || 'https://placehold.co/100'}
          alt="shop"
          className="w-full h-full rounded-full border-2 border-white object-cover pointer-events-none"
        />
      </div>
      <span className="text-xs md:text-sm font-bold truncate w-20 md:w-24 text-center text-gray-800">
        {item.shops.name}
      </span>
    </div>
  );

  const UpcomingCard = ({
    item,
    list,
    index,
  }: {
    item: RamenEvent;
    list: RamenEvent[];
    index: number;
  }) => {
    const colors = ['#BE123C', '#0369A1', '#15803D', '#B45309', '#6D28D9'];
    const themeColor = colors[index % colors.length];
    return (
      <div
        onClick={() => openStory(list, index)}
        className="flex flex-col p-4 md:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-pointer shrink-0 w-72 lg:w-80 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 mb-3 pointer-events-none">
          <div
            className="w-12 h-12 rounded-full p-[2px]"
            style={{ backgroundColor: themeColor }}
          >
            <img
              src={item.shops.profile_img_url || 'https://placehold.co/100'}
              className="w-full h-full rounded-full object-cover border-2 border-white"
              alt="shop"
            />
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900 block leading-tight">
              {item.shops.name}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {item.starts_at} ~ {item.ends_at}
            </span>
          </div>
        </div>
        {item.menu_name && (
          <span
            className="inline-block w-max px-2.5 py-1 text-[11px] font-black rounded-md mb-2 pointer-events-none"
            style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
          >
            {item.menu_name}
          </span>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pointer-events-none">
          {item.description || '상세 내용이 없습니다.'}
        </p>
      </div>
    );
  };

  const scrollContainerClass =
    'flex gap-3 md:gap-3 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]';

  return (
    <div className="w-full h-[100dvh] bg-white md:bg-slate-100 relative flex items-center justify-center md:py-4 md:px-8 lg:py-6 lg:px-12 overflow-hidden">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl h-full md:min-h-[700px] flex flex-col bg-slate-50 md:bg-white md:rounded-[32px] md:shadow-2xl md:border border-gray-200/60 overflow-hidden relative">
        {/* 헤더 (높이 고정) */}
        <header className="bg-white border-b border-gray-100 shrink-0 z-10 relative">
          <div className="hidden md:flex absolute top-4 right-8 items-center gap-6 z-20">
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 transition-colors">
              <Home size={14} strokeWidth={2.5} /> 홈
            </button>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 hover:text-gray-900 transition-colors">
              <Calendar size={14} strokeWidth={2.5} /> 캘린더
            </button>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 hover:text-gray-900 transition-colors">
              <Bell size={14} strokeWidth={2.5} /> 공지사항
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

        {/* 메인 콘텐츠: md:justify-between을 다시 살려 1프레임 배치를 유도 */}
        <main className="flex-1 min-h-0 flex flex-col justify-start md:justify-between px-4 md:px-8 pt-4 md:pt-[4vh] gap-y-7 md:gap-y-0 pb-6 md:pb-12 relative overflow-y-auto md:overflow-hidden">
          <div className="hidden md:block absolute top-[1vh] right-8 z-20">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-6 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-orange-500 text-orange-600 text-sm font-black rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} strokeWidth={3} /> 새로운 소식 제보하기
            </button>
          </div>

          <section className="shrink-0">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              <span>🎉</span> 오늘의 이벤트
            </h2>
            <div
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              onClickCapture={onClickCapture}
              className={scrollContainerClass}
            >
              {todayEvents.length > 0 ? (
                todayEvents.map((item, index) => (
                  <StoryBadge
                    key={item.id}
                    item={item}
                    list={todayEvents}
                    index={index}
                    isEvent={true}
                  />
                ))
              ) : (
                <div className="w-full min-w-[280px] h-[104px] md:h-[120px] flex items-center justify-center p-5 bg-white rounded-2xl text-[12px] md:text-[13px] font-medium text-gray-500 text-center border border-gray-100 shadow-sm">
                  아직 들려온 이벤트 소식이 없어요.{' '}
                  <br className="hidden md:block" />
                  혹시 알고 계신 게 있나요? 👀
                </div>
              )}
            </div>
          </section>

          <section className="shrink-0">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              <span>📢</span> 영업 변동
            </h2>
            <div
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              onClickCapture={onClickCapture}
              className={scrollContainerClass}
            >
              {closings.length > 0 ? (
                closings.map((item, index) => (
                  <StoryBadge
                    key={item.id}
                    item={item}
                    list={closings}
                    index={index}
                    isEvent={false}
                  />
                ))
              ) : (
                <div className="w-full min-w-[280px] h-[104px] md:h-[120px] flex items-center justify-center p-5 bg-white rounded-2xl text-[12px] md:text-[13px] font-medium text-gray-500 text-center border border-gray-100 shadow-sm">
                  다행히 갑작스러운 휴무 소식은 없어요!
                  <br className="hidden md:block" />
                  평화로운 라멘 투데이 ✌️
                </div>
              )}
            </div>
          </section>

          <section className="shrink-0">
            <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              <span>📅</span> 오픈 예정
            </h2>
            <div
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              onClickCapture={onClickCapture}
              className={scrollContainerClass}
            >
              {upcomingEvents.length > 0 ? (
                <>
                  <div className="md:hidden flex gap-3">
                    {upcomingEvents.map((item, index) => (
                      <StoryBadge
                        key={item.id}
                        item={item}
                        list={upcomingEvents}
                        index={index}
                        isEvent={true}
                      />
                    ))}
                  </div>
                  <div className="hidden md:flex gap-4">
                    {upcomingEvents.map((item, index) => (
                      <UpcomingCard
                        key={item.id}
                        item={item}
                        list={upcomingEvents}
                        index={index}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full min-w-[280px] h-[104px] md:h-[120px] flex items-center justify-center p-5 bg-white rounded-2xl text-[12px] md:text-[13px] font-medium text-gray-500 text-center border border-gray-100 shadow-sm">
                  예정된 이벤트 소식이 없어요.{' '}
                  <br className="hidden md:block" />
                  새로운 이벤트 일정을 기대해 주세요! 🍜
                </div>
              )}
            </div>
          </section>
        </main>

        {/* 모바일 하단바 */}
        <nav className="md:hidden h-16 shrink-0 bg-white border-t border-gray-100 flex items-center justify-around px-10 pb-safe z-40">
          <button className="flex flex-col items-center gap-1 text-orange-600">
            <Home size={18} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-wider">
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
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Calendar size={18} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              캘린더
            </span>
          </button>
        </nav>
      </div>

      {/* 제보하기 모달 */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">새로운 소식 제보하기</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
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
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${reportForm.type === 'event' ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                >
                  🍜 이벤트
                </button>
                <button
                  onClick={() =>
                    setReportForm((p) => ({ ...p, type: 'closing' }))
                  }
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${reportForm.type === 'closing' ? 'bg-white shadow text-black' : 'text-gray-400'}`}
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
                placeholder="증거 링크"
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

      {/* 스토리 뷰어 */}
      {storyContext &&
        (() => {
          const item = storyContext.list[storyContext.currentIndex];
          const hasPrev = storyContext.currentIndex > 0;
          const hasNext =
            storyContext.currentIndex < storyContext.list.length - 1;
          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasPrev)
              setStoryContext((p) =>
                p ? { ...p, currentIndex: p.currentIndex - 1 } : null,
              );
          };
          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasNext)
              setStoryContext((p) =>
                p ? { ...p, currentIndex: p.currentIndex + 1 } : null,
              );
          };

          const dateDisplay =
            item.starts_at === item.ends_at
              ? item.starts_at
              : `${item.starts_at} ~ ${item.ends_at}`;

          return (
            <div
              className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-0"
              onClick={() => setStoryContext(null)}
            >
              <div
                className="w-full max-w-md h-[90dvh] md:h-[92dvh] bg-white rounded-[24px] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 스토리 뷰어 헤더 영역 */}
                <div className="h-[72px] p-4 px-5 flex justify-between items-center border-b border-gray-100 bg-slate-50 shrink-0 z-10 shadow-sm gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={item.shops.profile_img_url || ''}
                      className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm shrink-0"
                      alt="logo"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-gray-900 leading-tight truncate">
                        {item.shops.name}
                      </h3>
                      <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 rounded text-[10px] md:text-[11px] font-black tracking-tight whitespace-nowrap max-w-full">
                        <Calendar
                          size={12}
                          strokeWidth={2.5}
                          className="shrink-0"
                        />
                        <span className="truncate">{dateDisplay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:text-orange-500 hover:border-orange-500 transition-colors shadow-sm"
                      >
                        <ExternalLink size={14} strokeWidth={2.5} />
                      </a>
                    )}
                    <button
                      onClick={() => setStoryContext(null)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* ✨ 스토리 뷰어 사진 영역 */}
                <div className="relative w-full flex-1 bg-gray-900 overflow-hidden border-b border-gray-100 min-h-0">
                  <img
                    src={item.proof_image_url}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110"
                    alt="blur bg"
                  />
                  <img
                    src={item.proof_image_url}
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-xl"
                    alt="proof"
                  />

                  <div className="absolute inset-0 flex">
                    <div
                      className="w-1/3 h-full cursor-pointer z-20"
                      onClick={handlePrev}
                    />
                    <div
                      className="w-2/3 h-full cursor-pointer z-20"
                      onClick={handleNext}
                    />
                  </div>

                  {hasPrev && (
                    <button
                      onClick={handlePrev}
                      className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-gray-900 rounded-full items-center justify-center shadow-md z-30 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={handleNext}
                      className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-gray-900 rounded-full items-center justify-center shadow-md z-30 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                {/* 스토리 뷰어 하단 정보 영역 */}
                <div className="h-[96px] md:h-[100px] shrink-0 overflow-y-auto pt-3 pb-4 px-5 bg-white pb-safe">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 text-gray-400 shrink-0">
                      <Info size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        {item.status_type === 'normal' && item.menu_name && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[11px] md:text-xs font-black rounded-md tracking-tight border border-orange-200/50 shadow-sm">
                            {item.menu_name}
                          </span>
                        )}
                        {item.status_type !== 'normal' && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-[11px] md:text-xs font-black rounded-md tracking-tight border border-red-200/50 shadow-sm">
                            {item.status_type === 'closed_lunch'
                              ? '점심 마감'
                              : item.status_type === 'closed_dinner'
                                ? '저녁 마감'
                                : '전체 휴무'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-[13px] md:text-[14px] font-medium leading-relaxed whitespace-pre-wrap">
                        {item.description || '상세 내용이 없습니다.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
