import React from 'react';
import {
  Calendar,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export const StoryViewerModal = ({
  list,
  currentIndex,
  onClose,
  onIndexChange,
}: StoryViewerModalProps) => {
  const item = list[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < list.length - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) onIndexChange(currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) onIndexChange(currentIndex + 1);
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

        {/* 스토리 뷰어 사진 영역 */}
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
};

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
  shops: Shop;
}

interface StoryViewerModalProps {
  list: RamenEvent[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}
