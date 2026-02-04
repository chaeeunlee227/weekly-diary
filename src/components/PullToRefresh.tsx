import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_PULL_DISTANCE = 80;
  const REFRESH_THRESHOLD = 60;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null || !isPulling) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const pullDist = Math.min(distance * 0.5, MAX_PULL_DISTANCE);
        setPullDistance(pullDist);
      } else {
        setPullDistance(0);
        setIsPulling(false);
        startY.current = null;
      }
    };

    const handleTouchEnd = async () => {
      if (startY.current === null) return;

      if (pullDistance >= REFRESH_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }

      setIsPulling(false);
      startY.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isPulling, isRefreshing, onRefresh, disabled]);

  const rotation = Math.min((pullDistance / REFRESH_THRESHOLD) * 360, 360);
  const opacity = Math.min(pullDistance / REFRESH_THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
          style={{
            transform: `translateY(${Math.min(pullDistance - 20, 0)}px)`,
            opacity: opacity
          }}
        >
          <div className="flex flex-col items-center gap-2 py-2">
            <RefreshCw
              className="w-6 h-6 text-blue-500 transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                opacity: isRefreshing ? 1 : opacity
              }}
            />
            {pullDistance >= REFRESH_THRESHOLD && !isRefreshing && (
              <span className="text-xs text-gray-600">Release to refresh</span>
            )}
            {isRefreshing && (
              <span className="text-xs text-gray-600">Refreshing...</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ paddingTop: pullDistance > 0 ? `${pullDistance}px` : '0' }}>
        {children}
      </div>
    </div>
  );
}
