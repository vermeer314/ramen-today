import { useState, useEffect, type ReactNode } from 'react';

interface GuideTooltipWrapperProps {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  children: ReactNode;
}

export default function GuideTooltipWrapper({
  message,
  duration = 4000,
  position = 'top',
  children,
}: GuideTooltipWrapperProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), duration);
    const removeTimer = setTimeout(() => setIsRendered(false), duration + 300);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  const isTop = position === 'top';

  return (
    <div className="relative flex flex-col items-center justify-center">
      {isRendered && (
        <div
          className={`absolute z-50 flex flex-col items-center pointer-events-none transition-opacity duration-300 ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          } ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {!isTop && (
            <div className="w-3 h-3 bg-orange-500 rotate-45 -mb-1.5" />
          )}

          <div className="bg-orange-500 text-white text-xs sm:text-sm font-medium py-2 px-3 rounded-lg shadow-md whitespace-nowrap">
            {message}
          </div>

          {isTop && <div className="w-3 h-3 bg-orange-500 rotate-45 -mt-1.5" />}
        </div>
      )}

      {children}
    </div>
  );
}
