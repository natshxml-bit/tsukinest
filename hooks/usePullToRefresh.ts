"use client";

import { useState, useRef, useCallback } from "react";

interface PullToRefreshResult {
  pulling: boolean;
  pullDistance: number;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => Promise<void>;
}

export function usePullToRefresh(onRefresh: () => Promise<void>): PullToRefreshResult {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isRefreshing = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing.current) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(diff * 0.4, 80));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing.current) {
      isRefreshing.current = true;
      setPullDistance(0);
      setPulling(false);
      await onRefresh();
      isRefreshing.current = false;
    } else {
      setPullDistance(0);
      setPulling(false);
    }
    startY.current = 0;
  }, [pullDistance, onRefresh]);

  return { pulling, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
}
