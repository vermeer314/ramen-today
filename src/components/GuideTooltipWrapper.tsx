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
    <div className="relative flex items-center justify-center">
      {isRendered && (
        <div
          className={`absolute z-50 flex flex-col items-center pointer-events-none transition-opacity duration-300 ease-in-out drop-shadow-md ${
            isVisible ? 'opacity-100' : 'opacity-0'
          } ${isTop ? 'bottom-full mb-3' : 'top-full mt-3'}`}
        >
          {!isTop && (
            <div className="w-3 h-3 bg-orange-500 rotate-45 -mb-1.5" />
          )}

          <div className="bg-orange-500 text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap">
            {message}
          </div>

          {isTop && <div className="w-3 h-3 bg-orange-500 rotate-45 -mt-1.5" />}
        </div>
      )}

      {children}
    </div>
  );
}
