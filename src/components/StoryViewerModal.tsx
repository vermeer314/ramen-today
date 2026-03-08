import React, { useState, useEffect } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shop {
  name: string;
  profile_img_url: string | null;
  map_url?: string;
}

export interface RamenEvent {
  id: string;
  shop_id: string;
  menu_name: string | null;
  proof_image_url: string;
  source_url: string | null;
  starts_at: string;
  ends_at: string;
  status_type: 'normal' | 'closed_lunch' | 'closed_dinner' | 'closed_all';
  description: string | null;
  like_count?: number;
  shops: Shop;
}

interface StoryViewerModalProps {
  list: RamenEvent[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const NoticeIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9ca3af"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all hover:scale-110"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9ca3af"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all hover:scale-110"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const RamenIcon = ({ isLiked }: { isLiked: boolean }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill={isLiked ? '#ea580c' : 'none'}
    stroke={isLiked ? '#ea580c' : '#9ca3af'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-300 ${isLiked ? 'scale-110 drop-shadow-md' : 'scale-100 hover:scale-110'}`}
  >
    <path d="M4 12a8 8 0 0 0 16 0Z" />
    <line x1="2" y1="7" x2="21" y2="3" fill="none" />
    <line x1="3" y1="9" x2="22" y2="5" fill="none" />
    <path d="M6 8.5 C 8 10, 4 11, 6 12" fill="none" />
    <path d="M9 7.5 C 11 9, 7 10.5, 9 12" fill="none" />
    <path d="M12 6.5 C 14 8, 10 10.5, 12 12" fill="none" />
  </svg>
);

export const StoryViewerModal = ({
  list,
  currentIndex,
  onClose,
  onIndexChange,
}: StoryViewerModalProps) => {
  const item = list[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < list.length - 1;

  const [isLiked, setIsLiked] = useState(() => {
    const likedEvents = JSON.parse(
      localStorage.getItem('liked_ramen_events') || '[]',
    );
    return likedEvents.includes(item.id);
  });
  const [localLikeCount, setLocalLikeCount] = useState(item.like_count || 0);

  useEffect(() => {
    const likedEvents = JSON.parse(
      localStorage.getItem('liked_ramen_events') || '[]',
    );
    setIsLiked(likedEvents.includes(item.id));
    setLocalLikeCount(item.like_count || 0);
  }, [item.id, item.like_count]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) onIndexChange(currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) onIndexChange(currentIndex + 1);
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsLiked = !isLiked;
    const newCount = Math.max(0, localLikeCount + (newIsLiked ? 1 : -1));

    setIsLiked(newIsLiked);
    setLocalLikeCount(newCount);

    const likedEvents: string[] = JSON.parse(
      localStorage.getItem('liked_ramen_events') || '[]',
    );
    let updatedLikes;
    if (newIsLiked) {
      updatedLikes = [...likedEvents, item.id];
    } else {
      updatedLikes = likedEvents.filter((id) => id !== item.id);
    }
    localStorage.setItem('liked_ramen_events', JSON.stringify(updatedLikes));

    try {
      const incrementAmount = newIsLiked ? 1 : -1;

      const { error } = await supabase.rpc('increment_like', {
        row_id: item.id,
        amount: incrementAmount,
      });

      if (error) throw error;
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
    }
  };

  const dateDisplay =
    item.starts_at === item.ends_at
      ? item.starts_at
      : `${item.starts_at} ~ ${item.ends_at}`;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-[90dvh] md:h-[92dvh] bg-white rounded-[24px] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 영역 */}
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
                <Calendar size={12} strokeWidth={2.5} className="shrink-0" />
                <span className="truncate">{dateDisplay}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 사진 영역 */}
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

        {/* 하단 정보 영역 */}
        <div className="h-[140px] md:h-[150px] flex flex-col shrink-0 bg-white pb-safe rounded-b-[24px]">
          <div className="flex justify-between items-center px-5 pt-2 md:pt-4 shrink-0 gap-3 w-full">
            {/* 왼쪽 뱃지 영역 */}
            <div className="flex-1 min-w-0 pr-1">
              {item.status_type === 'normal' && item.menu_name && (
                <span className="inline-block max-w-full px-3 py-1 bg-orange-100 text-orange-700 text-[11px] md:text-xs font-black rounded-md tracking-tight border border-orange-200/50 shadow-sm truncate align-middle">
                  {item.menu_name}
                </span>
              )}
              {item.status_type !== 'normal' && (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-[11px] md:text-xs font-black rounded-md tracking-tight border border-red-200/50 shadow-sm whitespace-nowrap align-top">
                  {item.status_type === 'closed_lunch'
                    ? '점심 마감'
                    : item.status_type === 'closed_dinner'
                      ? '저녁 마감'
                      : '전체 휴무'}
                </span>
              )}
            </div>

            {/* 오른쪽 액션 버튼 영역 */}
            <div className="flex items-end gap-2.5 shrink-0 pt-0.5">
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="active:scale-95"
                >
                  <NoticeIcon />
                </a>
              )}

              {item.shops.map_url && (
                <a
                  href={item.shops.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="active:scale-95"
                >
                  <MapPinIcon />
                </a>
              )}

              <button
                onClick={handleLikeToggle}
                className="relative flex items-end shrink-0 active:scale-95 transition-transform"
              >
                <RamenIcon isLiked={isLiked} />

                {localLikeCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[10px] font-black tracking-tight ${isLiked ? 'text-orange-600' : 'text-gray-400'} leading-none bg-white px-0.5`}
                  >
                    {localLikeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 상세 설명 텍스트 */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 mt-1.5 md:mt-2">
            <div className="flex items-start gap-2.5">
              <Info
                size={16}
                strokeWidth={2.5}
                className="text-gray-400 shrink-0 mt-[2px]"
              />
              <p className="text-gray-700 text-[13px] md:text-[14px] font-medium leading-relaxed whitespace-pre-wrap">
                {item.description || '상세 내용이 없습니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
