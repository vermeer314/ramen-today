import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plus, X } from 'lucide-react';
import { StoryViewerModal } from '../components/StoryViewerModal';
import type { RamenEvent } from '../components/StoryViewerModal';

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
        .select(`*, shops ( name, profile_img_url, map_url )`)
        .gte('ends_at', todayStr)
        .order('created_at', { ascending: false });
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
    <>
      {/* 메인 콘텐츠 */}
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
                예정된 이벤트 소식이 없어요. <br className="hidden md:block" />
                새로운 이벤트 일정을 기대해 주세요! 🍜
              </div>
            )}
          </div>
        </section>
      </main>

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

      {/* 스토리 뷰어 모달 */}
      {storyContext && (
        <StoryViewerModal
          list={storyContext.list}
          currentIndex={storyContext.currentIndex}
          onClose={() => setStoryContext(null)}
          onIndexChange={(newIndex) =>
            setStoryContext((prev) =>
              prev ? { ...prev, currentIndex: newIndex } : null,
            )
          }
        />
      )}
    </>
  );
};
