import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { X, ChevronRight } from 'lucide-react';
import { StoryViewerModal } from '../components/StoryViewerModal';
import type { RamenEvent } from '../components/StoryViewerModal';

export const CalendarPage = () => {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [storyContext, setStoryContext] = useState<{
    list: RamenEvent[];
    currentIndex: number;
  } | null>(null);

  const { data: eventsData } = useQuery({
    queryKey: ['ramen_events_calendar_only_normal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ramen_events')
        .select(`*, shops ( name, profile_img_url )`)
        .eq('status_type', 'normal')
        .order('starts_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as RamenEvent[];
    },
  });

  const formatDateToYMD = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const getEventsForDate = (dateStr: string) => {
    if (!eventsData) return [];
    return eventsData.filter((event) => {
      return event.starts_at <= dateStr && event.ends_at >= dateStr;
    });
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = formatDateToYMD(date);
      const dayEvents = getEventsForDate(dateStr);

      if (dayEvents.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <span className="text-[10px] bg-orange-100 text-orange-600 font-black px-1.5 py-0.5 rounded-full border border-orange-200 shadow-sm leading-none">
              {dayEvents.length}건
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const handleDayClick = (date: Date) => {
    const dateStr = formatDateToYMD(date);
    const dayEvents = getEventsForDate(dateStr);
    if (dayEvents.length > 0) {
      setSelectedDateStr(dateStr);
    }
  };

  const selectedDailyEvents = selectedDateStr
    ? getEventsForDate(selectedDateStr)
    : [];

  const today = new Date();
  const minDate = new Date(2026, 2, 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // 다음 달의 마지막 날

  // ... (상단 로직 유지) ...

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full flex flex-col">
      {/* ✨ 1. 타이틀을 달력 박스 밖으로 분리 (max-w-2xl로 달력 박스와 가로 넓이를 딱 맞춤) */}
      <div className="w-full max-w-2xl mx-auto mb-3 md:mb-5 flex items-center justify-between shrink-0 pl-1">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
          📅 이벤트 캘린더
        </h2>
      </div>

      {/* ✨ 2. 달력만 감싸는 둥근 하얀색 박스 */}
      <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm p-4 md:p-7 h-fit flex flex-col">
        <style>{`
          .react-calendar {
            width: 100%;
            border: none;
            font-family: inherit;
            background: transparent;
          }
          .react-calendar__navigation {
            margin-bottom: 1.5rem;
          }
          /* 중앙 월/년도 텍스트 클릭 시 호버 효과 아예 없애기 (클릭 불가를 시각적으로 표현) */
          .react-calendar__navigation button {
            font-weight: 900;
            font-size: 1.1rem;
            color: #111827;
            border-radius: 0.75rem;
          }
          .react-calendar__navigation button:enabled:hover,
          .react-calendar__navigation button:enabled:focus {
            background-color: #f3f4f6;
          }
          .react-calendar__navigation__label {
            pointer-events: none; /* ✨ 커서 반응 자체를 없애서 텍스트처럼 보이게 만듦 */
          }
          .react-calendar__month-view__weekdays {
            text-transform: uppercase;
            font-weight: 800;
            font-size: 0.75rem;
            color: #9ca3af;
            text-decoration: none;
          }
          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none;
          }
          .react-calendar__tile {
            padding: 0.75rem 0.5rem;
            height: 64px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            border-radius: 1rem;
            font-weight: 700;
            color: #374151;
          }
          .react-calendar__tile:enabled:hover,
          .react-calendar__tile:enabled:focus {
            background-color: #f9fafb;
          }
          .react-calendar__tile--now {
            background: #fff7ed !important;
            color: #ea580c !important;
          }
          .react-calendar__tile--active {
            background: #ea580c !important;
            color: white !important;
          }
          .react-calendar__tile--active abbr {
             color: white !important;
          }
          .react-calendar__tile--active div span {
            background-color: white !important; /* 뱃지 배경을 하얗게 */
             color: #ea580c !important; /* 글씨를 찐한 주황색으로 */
             border-color: white !important;
          }
          .react-calendar__month-view__days__day--neighboringMonth {
            color: #d1d5db !important; 
          }
          .react-calendar__month-view__days__day--neighboringMonth span {
            color: #d1d5db !important;
          }
          .react-calendar__navigation__arrow:disabled {
            color: #e5e7eb !important; 
            background-color: transparent !important; 
            cursor: default !important; 
          }
          .react-calendar__navigation__label {
            pointer-events: none !important; 
            background-color: transparent !important; 
            color: #111827 !important; 
            cursor: default !important;
          }
          .react-calendar__navigation button:enabled:hover,
          .react-calendar__navigation button:enabled:focus {
            background-color: #f3f4f6;
          }
        `}</style>

        <Calendar
          calendarType="gregory"
          formatDay={(_locale, date) => date.getDate().toString()}
          tileContent={tileContent}
          onClickDay={handleDayClick}
          next2Label={null}
          prev2Label={null}
          minDate={minDate}
          maxDate={maxDate}
          minDetail="month"
        />
      </div>

      {/* 1차 모달: 일간 리스트 모달 */}
      {selectedDateStr && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedDateStr(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-gray-900">
                {selectedDateStr.split('-')[1]}월{' '}
                {selectedDateStr.split('-')[2]}일 라멘 소식
              </h3>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {selectedDailyEvents.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedDateStr(null);
                    setTimeout(
                      () =>
                        setStoryContext({
                          list: selectedDailyEvents,
                          currentIndex: index,
                        }),
                      50,
                    );
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                >
                  <img
                    src={event.shops.profile_img_url || ''}
                    alt="logo"
                    className="w-12 h-12 rounded-full border border-gray-200 object-cover shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">
                      {event.shops.name}
                    </h4>
                    {event.menu_name && (
                      <div className="mt-0.5">
                        <span className="inline-block px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded border border-orange-100 truncate max-w-[150px]">
                          {event.menu_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2차 모달: 스토리 뷰어 */}
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
    </main>
  );
};
