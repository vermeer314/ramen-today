import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shop {
  name: string;
  profile_img_url: string | null;
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
    {/* 🥣 라멘 그릇 (반원) */}
    <path d="M4 12a8 8 0 0 0 16 0Z" />

    {/* 🥢 대각선 젓가락 한 쌍 (자연스럽게 기울어진 각도!) */}
    <line x1="2" y1="7" x2="21" y2="3" fill="none" />
    <line x1="3" y1="9" x2="22" y2="5" fill="none" />

    {/* 🍜 꼬불꼬불한 라멘 면발 (대각선 젓가락 높이에 맞춰서 각각 다르게 매달린 디테일) */}
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

  // 좋아요 상태 관리
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(item.like_count || 0);

  // 모달이 열리거나 스토리가 바뀔 때 로컬 스토리지 확인
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

  // ✨ 좋아요 토글(켜기/끄기) 함수
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newIsLiked = !isLiked;
    // 누르면 +1, 취소하면 -1 (0 밑으로는 안 내려가게 방어)
    const newCount = Math.max(0, localLikeCount + (newIsLiked ? 1 : -1));

    // 1. UI 즉시 업데이트 (버벅임 방지)
    setIsLiked(newIsLiked);
    setLocalLikeCount(newCount);

    // 2. 로컬 스토리지에 기록 추가 또는 삭제
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

    // 3. DB에 진짜로 반영하기
    try {
      const { error } = await supabase
        .from('ramen_events')
        .update({ like_count: newCount })
        .eq('id', item.id);

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
        {/* 헤더 영역 (기존 유지) */}
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
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 사진 영역 (기존 유지) */}
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

        {/* ✨ 하단 정보 영역: 구역 분리 (고정부 & 스크롤부) */}
        <div className="h-[140px] md:h-[150px] flex flex-col shrink-0 bg-white pb-safe rounded-b-[24px]">
          {/* [상단 고정 구역]: 뱃지 + 좋아요 */}
          <div className="flex justify-between items-start px-5 pt-4 shrink-0 gap-4">
            {/* 왼쪽 뱃지 영역 */}
            <div className="flex flex-wrap gap-2 flex-1 pt-1">
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

            {/* 오른쪽 좋아요 버튼 영역 */}
            <button
              onClick={handleLikeToggle}
              className="flex flex-col items-center gap-1 shrink-0 px-2 active:scale-95 transition-transform"
            >
              <RamenIcon isLiked={isLiked} />
              <span
                className={`text-[10px] font-black tracking-tight ${isLiked ? 'text-orange-600' : 'text-gray-400'}`}
              >
                {localLikeCount}
              </span>
            </button>
          </div>

          {/* [하단 스크롤 구역]: 상세 설명 텍스트 */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 mt-2">
            <div className="flex items-start gap-2.5">
              <Info
                size={16}
                strokeWidth={2.5}
                className="text-gray-400 shrink-0 mt-[3px]"
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
